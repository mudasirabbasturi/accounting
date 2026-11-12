<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;
use App\Services\AccountingEngine;
use App\Services\InventoryEngine;
use App\Services\TaxEngine;

class SalesController extends Controller
{
    // =========================================================================
    // 1. Sales Quotes (with Itemized Lines)
    // =========================================================================

    public function quotes(Request $request): Response
    {
        $quotes = Database::fetchAll(
            "SELECT sq.*, c.name as customer_name, c.code as customer_code
             FROM sales_quotes sq
             JOIN customers c ON c.id = sq.customer_id
             ORDER BY sq.quote_date DESC, sq.id DESC"
        );
        return $this->success($quotes);
    }

    public function showQuote(Request $request, string $id): Response
    {
        $quote = Database::fetch(
            "SELECT sq.*, c.name as customer_name, c.code as customer_code, c.email as customer_email
             FROM sales_quotes sq
             JOIN customers c ON c.id = sq.customer_id
             WHERE sq.id = :id",
            ['id' => $id]
        );
        if (!$quote) return $this->notFound('Sales quote not found');

        $items = Database::fetchAll(
            "SELECT sqi.*, ii.item_code, ii.item_name, u.code as uom_code
             FROM sales_quote_items sqi
             LEFT JOIN inventory_items ii ON ii.id = sqi.inventory_item_id
             LEFT JOIN units_of_measure u ON u.id = sqi.uom_id
             WHERE sqi.sales_quote_id = :id
             ORDER BY sqi.line_number ASC",
            ['id' => $id]
        );

        $quote['items'] = $items;
        return $this->success($quote);
    }

    public function storeQuote(Request $request): Response
    {
        $errors = $this->validate($request, [
            'customer_id' => 'required|integer',
            'quote_date'  => 'required|date',
            'items'       => 'required|array',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $items = $request->input('items', []);
        if (empty($items)) return $this->error('At least one item line is required', 422);

        $quoteNum = $request->input('quote_number') ?: 'SQ-' . strtoupper(bin2hex(random_bytes(3)));
        $pricesIncludeTax = (bool)$request->input('prices_include_tax', false);

        $subtotal = 0.0;
        $discountTotal = 0.0;
        $taxTotal = 0.0;

        foreach ($items as $it) {
            $qty = (float)($it['quantity'] ?? 1);
            $price = (float)($it['unit_price'] ?? 0);
            $disc = (float)($it['discount_amount'] ?? 0);
            $taxRate = (float)($it['tax_rate'] ?? 0);

            $taxCalc = TaxEngine::computeLineTax($qty, $price, $disc, $taxRate, $pricesIncludeTax);
            $subtotal += ($qty * $price);
            $discountTotal += $disc;
            $taxTotal += $taxCalc['tax_amount'];
        }

        $totalAmount = $pricesIncludeTax ? ($subtotal - $discountTotal) : (($subtotal - $discountTotal) + $taxTotal);

        $quoteId = Database::transaction(function () use ($request, $quoteNum, $pricesIncludeTax, $subtotal, $discountTotal, $taxTotal, $totalAmount, $items) {
            $qId = Database::insert('sales_quotes', [
                'quote_number'       => $quoteNum,
                'quote_date'         => $request->input('quote_date'),
                'expiry_date'        => $request->input('expiry_date'),
                'customer_id'        => (int)$request->input('customer_id'),
                'division_id'        => $request->input('division_id') ?: null,
                'project_id'         => $request->input('project_id') ?: null,
                'currency'           => $request->input('currency', 'AED'),
                'exchange_rate'      => (float)$request->input('exchange_rate', 1.0),
                'prices_include_tax' => $pricesIncludeTax ? 1 : 0,
                'subtotal'           => $subtotal,
                'discount_amount'    => $discountTotal,
                'tax_total'          => $taxTotal,
                'total_amount'       => $totalAmount,
                'status'             => 'Draft',
                'terms_conditions'   => $request->input('terms_conditions'),
                'notes'              => $request->input('notes'),
                'created_by'         => $request->user['id'] ?? null,
                'created_at'         => date('Y-m-d H:i:s'),
            ]);

            $lineNo = 1;
            foreach ($items as $it) {
                $qty = (float)($it['quantity'] ?? 1);
                $price = (float)($it['unit_price'] ?? 0);
                $disc = (float)($it['discount_amount'] ?? 0);
                $taxRate = (float)($it['tax_rate'] ?? 0);

                $taxCalc = TaxEngine::computeLineTax($qty, $price, $disc, $taxRate, $pricesIncludeTax);

                Database::insert('sales_quote_items', [
                    'sales_quote_id'    => $qId,
                    'line_number'       => $lineNo++,
                    'inventory_item_id' => $it['inventory_item_id'] ?: null,
                    'account_id'        => $it['account_id'] ?: null,
                    'description'       => $it['description'] ?? 'Item',
                    'quantity'          => $qty,
                    'uom_id'            => $it['uom_id'] ?: null,
                    'unit_price'        => $price,
                    'discount_rate'     => (float)($it['discount_rate'] ?? 0),
                    'discount_amount'   => $disc,
                    'tax_code_id'       => $it['tax_code_id'] ?: null,
                    'tax_rate'          => $taxRate,
                    'tax_amount'        => $taxCalc['tax_amount'],
                    'line_total'        => $taxCalc['total_amount'],
                ]);
            }

            return $qId;
        });

        return $this->success(['id' => $quoteId, 'quote_number' => $quoteNum], 'Sales quote created successfully', 201);
    }

    // =========================================================================
    // 2. Sales Orders (with Itemized Lines & Tracking)
    // =========================================================================

    public function orders(Request $request): Response
    {
        $orders = Database::fetchAll(
            "SELECT so.*, c.name as customer_name, c.code as customer_code
             FROM sales_orders so
             JOIN customers c ON c.id = so.customer_id
             ORDER BY so.order_date DESC, so.id DESC"
        );
        return $this->success($orders);
    }

    public function showOrder(Request $request, string $id): Response
    {
        $order = Database::fetch(
            "SELECT so.*, c.name as customer_name, c.code as customer_code
             FROM sales_orders so
             JOIN customers c ON c.id = so.customer_id
             WHERE so.id = :id",
            ['id' => $id]
        );
        if (!$order) return $this->notFound('Sales order not found');

        $items = Database::fetchAll(
            "SELECT soi.*, ii.item_code, ii.item_name
             FROM sales_order_items soi
             LEFT JOIN inventory_items ii ON ii.id = soi.inventory_item_id
             WHERE soi.sales_order_id = :id
             ORDER BY soi.line_number ASC",
            ['id' => $id]
        );

        $order['items'] = $items;
        return $this->success($order);
    }

    public function storeOrder(Request $request): Response
    {
        $errors = $this->validate($request, [
            'customer_id' => 'required|integer',
            'order_date'  => 'required|date',
            'items'       => 'required|array',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $items = $request->input('items', []);
        $orderNum = $request->input('order_number') ?: 'SO-' . strtoupper(bin2hex(random_bytes(3)));
        $pricesIncludeTax = (bool)$request->input('prices_include_tax', false);

        $subtotal = 0.0;
        $discountTotal = 0.0;
        $taxTotal = 0.0;

        foreach ($items as $it) {
            $qty = (float)($it['quantity'] ?? 1);
            $price = (float)($it['unit_price'] ?? 0);
            $disc = (float)($it['discount_amount'] ?? 0);
            $taxRate = (float)($it['tax_rate'] ?? 0);

            $taxCalc = TaxEngine::computeLineTax($qty, $price, $disc, $taxRate, $pricesIncludeTax);
            $subtotal += ($qty * $price);
            $discountTotal += $disc;
            $taxTotal += $taxCalc['tax_amount'];
        }

        $totalAmount = $pricesIncludeTax ? ($subtotal - $discountTotal) : (($subtotal - $discountTotal) + $taxTotal);

        $orderId = Database::transaction(function () use ($request, $orderNum, $pricesIncludeTax, $subtotal, $discountTotal, $taxTotal, $totalAmount, $items) {
            $soId = Database::insert('sales_orders', [
                'order_number'       => $orderNum,
                'order_date'         => $request->input('order_date'),
                'delivery_date'      => $request->input('delivery_date'),
                'customer_id'        => (int)$request->input('customer_id'),
                'sales_quote_id'     => $request->input('sales_quote_id') ?: null,
                'division_id'        => $request->input('division_id') ?: null,
                'project_id'         => $request->input('project_id') ?: null,
                'currency'           => $request->input('currency', 'AED'),
                'exchange_rate'      => (float)$request->input('exchange_rate', 1.0),
                'prices_include_tax' => $pricesIncludeTax ? 1 : 0,
                'subtotal'           => $subtotal,
                'discount_amount'    => $discountTotal,
                'tax_total'          => $taxTotal,
                'total_amount'       => $totalAmount,
                'status'             => 'Pending',
                'notes'              => $request->input('notes'),
                'created_by'         => $request->user['id'] ?? null,
                'created_at'         => date('Y-m-d H:i:s'),
            ]);

            $lineNo = 1;
            foreach ($items as $it) {
                $qty = (float)($it['quantity'] ?? 1);
                $price = (float)($it['unit_price'] ?? 0);
                $disc = (float)($it['discount_amount'] ?? 0);
                $taxRate = (float)($it['tax_rate'] ?? 0);

                $taxCalc = TaxEngine::computeLineTax($qty, $price, $disc, $taxRate, $pricesIncludeTax);

                Database::insert('sales_order_items', [
                    'sales_order_id'      => $soId,
                    'line_number'         => $lineNo++,
                    'sales_quote_item_id' => $it['sales_quote_item_id'] ?: null,
                    'inventory_item_id'   => $it['inventory_item_id'] ?: null,
                    'account_id'          => $it['account_id'] ?: null,
                    'description'         => $it['description'] ?? 'Item',
                    'quantity'            => $qty,
                    'qty_delivered'       => 0,
                    'qty_invoiced'        => 0,
                    'uom_id'              => $it['uom_id'] ?: null,
                    'unit_price'          => $price,
                    'discount_rate'       => (float)($it['discount_rate'] ?? 0),
                    'discount_amount'     => $disc,
                    'tax_code_id'         => $it['tax_code_id'] ?: null,
                    'tax_rate'            => $taxRate,
                    'tax_amount'          => $taxCalc['tax_amount'],
                    'line_total'          => $taxCalc['total_amount'],
                ]);
            }

            return $soId;
        });

        return $this->success(['id' => $orderId, 'order_number' => $orderNum], 'Sales order confirmed', 201);
    }

    // =========================================================================
    // 3. Delivery Notes (Inventory Relieved with Batch/Serial Tracking)
    // =========================================================================

    public function deliveryNotes(Request $request): Response
    {
        $notes = Database::fetchAll(
            "SELECT dn.*, c.name as customer_name, il.name as location_name
             FROM delivery_notes dn
             JOIN customers c ON c.id = dn.customer_id
             JOIN inventory_locations il ON il.id = dn.inventory_location_id
             ORDER BY dn.delivery_date DESC, dn.id DESC"
        );
        return $this->success($notes);
    }

    public function storeDeliveryNote(Request $request): Response
    {
        $errors = $this->validate($request, [
            'customer_id'           => 'required|integer',
            'inventory_location_id' => 'required|integer',
            'items'                 => 'required|array',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $num = $request->input('delivery_number') ?: 'DN-' . strtoupper(bin2hex(random_bytes(3)));
        $locationId = (int)$request->input('inventory_location_id');
        $userId = $request->user['id'] ?? null;

        $noteId = Database::transaction(function () use ($request, $num, $locationId, $userId) {
            $dnId = Database::insert('delivery_notes', [
                'delivery_number'       => $num,
                'delivery_date'         => $request->input('delivery_date', date('Y-m-d')),
                'customer_id'           => (int)$request->input('customer_id'),
                'sales_order_id'        => $request->input('sales_order_id') ?: null,
                'inventory_location_id' => $locationId,
                'carrier'               => $request->input('carrier'),
                'tracking_number'       => $request->input('tracking_number'),
                'delivery_status'       => 'Delivered',
                'notes'                 => $request->input('notes'),
                'created_by'            => $userId,
                'created_at'            => date('Y-m-d H:i:s'),
            ]);

            foreach ($request->input('items', []) as $it) {
                $qty = (float)$it['quantity'];
                $itemId = (int)$it['inventory_item_id'];
                $batchId = !empty($it['batch_id']) ? (int)$it['batch_id'] : null;
                $serialNo = !empty($it['serial_number']) ? $it['serial_number'] : null;

                $cost = InventoryEngine::deductStock(
                    $itemId,
                    $locationId,
                    $qty,
                    'DELIVERY_NOTE',
                    'DELIVERY_NOTE',
                    $dnId,
                    "Delivery #{$num}",
                    $batchId,
                    $serialNo
                );

                Database::insert('delivery_note_items', [
                    'delivery_note_id'    => $dnId,
                    'sales_order_item_id' => $it['sales_order_item_id'] ?: null,
                    'inventory_item_id'   => $itemId,
                    'quantity'            => $qty,
                    'unit_cost'           => $cost,
                    'batch_id'            => $batchId,
                    'batch_number'        => $it['batch_number'] ?? null,
                    'serial_number'       => $serialNo,
                ]);

                // Update qty_delivered on sales order item if linked
                if (!empty($it['sales_order_item_id'])) {
                    Database::query(
                        "UPDATE sales_order_items SET qty_delivered = qty_delivered + :qty WHERE id = :id",
                        ['qty' => $qty, 'id' => $it['sales_order_item_id']]
                    );
                }
            }

            return $dnId;
        });

        return $this->success(['id' => $noteId, 'delivery_number' => $num], 'Delivery note recorded and stock relieved', 201);
    }

    // =========================================================================
    // 4. Sales Invoices (Full Parity with claude.sql + UAE/KSA VAT & ZATCA)
    // =========================================================================

    public function indexInvoices(Request $request): Response
    {
        $status = $request->query('status');
        $customerId = $request->query('customer_id');

        $where = ["1=1"];
        $params = [];

        if (!empty($status)) {
            $where[] = "si.status = :status";
            $params['status'] = $status;
        }

        if (!empty($customerId)) {
            $where[] = "si.customer_id = :cust_id";
            $params['cust_id'] = $customerId;
        }

        $whereClause = implode(" AND ", $where);
        $invoices = Database::fetchAll(
            "SELECT si.*, c.name as customer_name, c.code as customer_code, c.tax_number as customer_trn
             FROM sales_invoices si
             JOIN customers c ON c.id = si.customer_id
             WHERE {$whereClause}
             ORDER BY si.issue_date DESC, si.id DESC",
            $params
        );

        return $this->success($invoices);
    }

    public function showInvoice(Request $request, string $id): Response
    {
        $invoice = Database::fetch(
            "SELECT si.*, c.name as customer_name, c.code as customer_code, c.email as customer_email,
                    je.entry_number as journal_entry_number
             FROM sales_invoices si
             JOIN customers c ON c.id = si.customer_id
             LEFT JOIN journal_entries je ON je.id = si.journal_entry_id
             WHERE si.id = :id",
            ['id' => $id]
        );

        if (!$invoice) return $this->notFound('Sales invoice not found');

        $items = Database::fetchAll(
            "SELECT sii.*, ii.item_code, ii.item_name
             FROM sales_invoice_items sii
             LEFT JOIN inventory_items ii ON ii.id = sii.inventory_item_id
             WHERE sii.sales_invoice_id = :id
             ORDER BY sii.line_number ASC",
            ['id' => $id]
        );

        // Allocations & Payments
        $allocations = Database::fetchAll(
            "SELECT cca.*, cn.credit_number, cn.note_date
             FROM customer_credit_allocations cca
             JOIN credit_notes cn ON cn.id = cca.credit_note_id
             WHERE cca.sales_invoice_id = :id",
            ['id' => $id]
        );

        $invoice['items'] = $items;
        $invoice['credit_allocations'] = $allocations;

        return $this->success($invoice);
    }

    public function storeInvoice(Request $request): Response
    {
        $errors = $this->validate($request, [
            'customer_id' => 'required|integer',
            'issue_date'  => 'required|date',
            'due_date'    => 'required|date',
            'items'       => 'required|array',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $items = $request->input('items', []);
        if (empty($items)) return $this->error('Invoice must contain at least one line item', 422);

        $customer = Database::fetch("SELECT * FROM customers WHERE id = :id", ['id' => $request->input('customer_id')]);
        if (!$customer) return $this->error('Customer not found', 404);

        $company = Database::fetch("SELECT * FROM company_settings LIMIT 1");
        $companyName = $company['company_name'] ?? 'Orient Solutions';
        $companyTrn = $company['tax_registration_number'] ?? '100234567800003';

        $invoiceNumber = $request->input('invoice_number') ?: 'INV-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));
        $pricesIncludeTax = (bool)$request->input('prices_include_tax', false);
        $currency = $request->input('currency', $company['base_currency'] ?? 'AED');
        $exchangeRate = (float)$request->input('exchange_rate', 1.0);
        $userId = $request->user['id'] ?? null;

        // Totals calculation
        $subtotal = 0.0;
        $discountTotal = 0.0;
        $taxTotal = 0.0;

        foreach ($items as $it) {
            $qty = (float)($it['quantity'] ?? 1);
            $price = (float)($it['unit_price'] ?? 0);
            $disc = (float)($it['discount_amount'] ?? 0);
            $taxRate = (float)($it['tax_rate'] ?? 0);

            $taxCalc = TaxEngine::computeLineTax($qty, $price, $disc, $taxRate, $pricesIncludeTax);
            $subtotal += ($qty * $price);
            $discountTotal += $disc;
            $taxTotal += $taxCalc['tax_amount'];
        }

        $totalAmount = $pricesIncludeTax ? ($subtotal - $discountTotal) : (($subtotal - $discountTotal) + $taxTotal);
        $taxTotalAed = $taxTotal * $exchangeRate; // UAE FTA compliance field

        // Generate ZATCA compliant TLV QR Code (for KSA/UAE)
        $qrCodeData = TaxEngine::generateZatcaQrCode(
            $companyName,
            $companyTrn,
            date('Y-m-d\TH:i:s\Z', strtotime($request->input('issue_date'))),
            $totalAmount,
            $taxTotal
        );

        $invoiceId = Database::transaction(function () use (
            $request, $invoiceNumber, $customer, $currency, $exchangeRate,
            $pricesIncludeTax, $subtotal, $discountTotal, $taxTotal, $taxTotalAed,
            $totalAmount, $qrCodeData, $items, $userId
        ) {
            $invId = Database::insert('sales_invoices', [
                'invoice_number'        => $invoiceNumber,
                'invoice_type'          => $request->input('invoice_type', 'Tax Invoice'),
                'issue_date'            => $request->input('issue_date'),
                'supply_date'           => $request->input('supply_date') ?: $request->input('issue_date'),
                'due_date'              => $request->input('due_date'),
                'customer_id'           => (int)$customer['id'],
                'customer_trn'          => $customer['tax_number'],
                'sales_order_id'        => $request->input('sales_order_id') ?: null,
                'division_id'           => $request->input('division_id') ?: null,
                'project_id'            => $request->input('project_id') ?: null,
                'currency'              => $currency,
                'exchange_rate'         => $exchangeRate,
                'prices_include_tax'    => $pricesIncludeTax ? 1 : 0,
                'subtotal'              => $subtotal,
                'discount_amount'       => $discountTotal,
                'tax_total'             => $taxTotal,
                'tax_total_aed'         => $taxTotalAed,
                'total_amount'          => $totalAmount,
                'amount_paid'           => 0.0000,
                'balance_due'           => $totalAmount,
                'cost_of_sales'         => 0.0000,
                'status'                => 'Draft',
                'emirate'               => $request->input('emirate', $customer['emirate'] ?? 'Dubai'),
                'is_reverse_charge'     => $request->input('is_reverse_charge', 0) ? 1 : 0,
                'is_designated_zone'    => $request->input('is_designated_zone', 0) ? 1 : 0,
                'zatca_qr_code'         => $qrCodeData,
                'terms_conditions'      => $request->input('terms_conditions'),
                'notes'                 => $request->input('notes'),
                'created_by'            => $userId,
                'created_at'            => date('Y-m-d H:i:s'),
            ]);

            $lineNo = 1;
            foreach ($items as $it) {
                $qty = (float)($it['quantity'] ?? 1);
                $price = (float)($it['unit_price'] ?? 0);
                $disc = (float)($it['discount_amount'] ?? 0);
                $taxRate = (float)($it['tax_rate'] ?? 0);

                $taxCalc = TaxEngine::computeLineTax($qty, $price, $disc, $taxRate, $pricesIncludeTax);

                $unitCost = 0.0;
                if (!empty($it['inventory_item_id'])) {
                    $invItem = Database::fetch("SELECT average_cost FROM inventory_items WHERE id = :id", ['id' => $it['inventory_item_id']]);
                    $unitCost = (float)($invItem['average_cost'] ?? 0);

                    // Auto relieve stock if requested and no prior delivery note
                    if ($request->input('auto_deduct_inventory', false)) {
                        InventoryEngine::deductStock(
                            (int)$it['inventory_item_id'],
                            (int)$request->input('location_id', 1),
                            $qty,
                            'DELIVERY_NOTE',
                            'SALES_INVOICE',
                            $invId,
                            "Invoice #{$invoiceNumber}"
                        );
                    }
                }

                Database::insert('sales_invoice_items', [
                    'sales_invoice_id'      => $invId,
                    'line_number'           => $lineNo++,
                    'sales_order_item_id'   => $it['sales_order_item_id'] ?: null,
                    'delivery_note_item_id' => $it['delivery_note_item_id'] ?: null,
                    'inventory_item_id'     => $it['inventory_item_id'] ?: null,
                    'account_id'            => $it['account_id'] ?: null,
                    'description'           => $it['description'] ?? 'Item',
                    'quantity'              => $qty,
                    'uom_id'                => $it['uom_id'] ?: null,
                    'unit_price'            => $price,
                    'discount_rate'         => (float)($it['discount_rate'] ?? 0),
                    'discount_amount'       => $disc,
                    'tax_code_id'           => $it['tax_code_id'] ?: null,
                    'tax_rate'              => $taxRate,
                    'tax_amount'            => $taxCalc['tax_amount'],
                    'unit_cost'             => $unitCost,
                    'line_total'            => $taxCalc['total_amount'],
                ]);

                // Update qty_invoiced on sales order item if linked
                if (!empty($it['sales_order_item_id'])) {
                    Database::query(
                        "UPDATE sales_order_items SET qty_invoiced = qty_invoiced + :qty WHERE id = :id",
                        ['qty' => $qty, 'id' => $it['sales_order_item_id']]
                    );
                }
            }

            return $invId;
        });

        // Automatically Post to General Ledger
        $journalId = AccountingEngine::postSalesInvoice($invoiceId, $userId);

        return $this->success([
            'id'               => $invoiceId,
            'invoice_number'   => $invoiceNumber,
            'journal_entry_id' => $journalId,
            'total_amount'     => $totalAmount,
            'zatca_qr_code'    => $qrCodeData,
        ], 'Sales invoice created and posted to General Ledger', 201);
    }

    // =========================================================================
    // 5. Credit Notes & Credit Allocations
    // =========================================================================

    public function creditNotes(Request $request): Response
    {
        $credits = Database::fetchAll(
            "SELECT cn.*, c.name as customer_name, c.code as customer_code
             FROM credit_notes cn
             JOIN customers c ON c.id = cn.customer_id
             ORDER BY cn.note_date DESC, cn.id DESC"
        );
        return $this->success($credits);
    }

    public function storeCreditNote(Request $request): Response
    {
        $errors = $this->validate($request, [
            'customer_id' => 'required|integer',
            'note_date'   => 'required|date',
            'items'       => 'required|array',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $items = $request->input('items', []);
        $creditNum = $request->input('credit_number') ?: 'CN-' . strtoupper(bin2hex(random_bytes(3)));
        $userId = $request->user['id'] ?? null;

        $subtotal = 0.0;
        $taxTotal = 0.0;

        foreach ($items as $it) {
            $qty = (float)($it['quantity'] ?? 1);
            $price = (float)($it['unit_price'] ?? 0);
            $taxRate = (float)($it['tax_rate'] ?? 0);
            $lineNet = ($qty * $price);
            $lineTax = $lineNet * $taxRate;

            $subtotal += $lineNet;
            $taxTotal += $lineTax;
        }

        $totalAmount = $subtotal + $taxTotal;

        $creditId = Database::transaction(function () use ($request, $creditNum, $subtotal, $taxTotal, $totalAmount, $items, $userId) {
            $cnId = Database::insert('credit_notes', [
                'credit_number'         => $creditNum,
                'note_date'             => $request->input('note_date'),
                'customer_id'           => (int)$request->input('customer_id'),
                'sales_invoice_id'      => $request->input('sales_invoice_id') ?: null,
                'division_id'           => $request->input('division_id') ?: null,
                'project_id'            => $request->input('project_id') ?: null,
                'inventory_location_id' => $request->input('inventory_location_id') ?: 1,
                'currency'              => $request->input('currency', 'AED'),
                'subtotal'              => $subtotal,
                'tax_total'             => $taxTotal,
                'total_amount'          => $totalAmount,
                'amount_allocated'      => 0.0000,
                'status'                => 'Draft',
                'reason'                => $request->input('reason', 'Sales Return / Adjustment'),
                'notes'                 => $request->input('notes'),
                'created_by'            => $userId,
                'created_at'            => date('Y-m-d H:i:s'),
            ]);

            $lineNo = 1;
            foreach ($items as $it) {
                $qty = (float)($it['quantity'] ?? 1);
                $price = (float)($it['unit_price'] ?? 0);
                $taxRate = (float)($it['tax_rate'] ?? 0);
                $taxAmt = ($qty * $price) * $taxRate;
                $returnToStock = !empty($it['return_to_stock']) ? 1 : 0;

                $unitCost = 0.0;
                if (!empty($it['inventory_item_id'])) {
                    $invItem = Database::fetch("SELECT average_cost FROM inventory_items WHERE id = :id", ['id' => $it['inventory_item_id']]);
                    $unitCost = (float)($invItem['average_cost'] ?? 0);

                    // Re-enter stock if return to stock enabled
                    if ($returnToStock) {
                        InventoryEngine::addStock(
                            (int)$it['inventory_item_id'],
                            (int)$request->input('inventory_location_id', 1),
                            $qty,
                            $unitCost,
                            'SALES_RETURN',
                            'CREDIT_NOTE',
                            $cnId,
                            "Credit Note #{$creditNum}"
                        );
                    }
                }

                Database::insert('credit_note_items', [
                    'credit_note_id'        => $cnId,
                    'line_number'           => $lineNo++,
                    'sales_invoice_item_id' => $it['sales_invoice_item_id'] ?: null,
                    'inventory_item_id'     => $it['inventory_item_id'] ?: null,
                    'account_id'            => $it['account_id'] ?: null,
                    'description'           => $it['description'] ?? 'Credit item',
                    'quantity'              => $qty,
                    'unit_price'            => $price,
                    'tax_code_id'           => $it['tax_code_id'] ?: null,
                    'tax_rate'              => $taxRate,
                    'tax_amount'            => $taxAmt,
                    'unit_cost'             => $unitCost,
                    'return_to_stock'       => $returnToStock,
                    'line_total'            => ($qty * $price) + $taxAmt,
                ]);
            }

            return $cnId;
        });

        // Post Credit Note to General Ledger
        $journalId = AccountingEngine::postCreditNote($creditId, $userId);

        // Auto-allocate against linked sales invoice if provided
        if ($request->input('auto_allocate_invoice_id')) {
            AccountingEngine::allocateCustomerCredit($creditId, (int)$request->input('auto_allocate_invoice_id'), $totalAmount, $userId);
        }

        return $this->success([
            'id'               => $creditId,
            'credit_number'    => $creditNum,
            'journal_entry_id' => $journalId,
            'total_amount'     => $totalAmount,
        ], 'Credit note created and posted to General Ledger', 201);
    }

    public function allocateCredit(Request $request, string $id): Response
    {
        $errors = $this->validate($request, [
            'sales_invoice_id' => 'required|integer',
            'amount'           => 'required|numeric',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        try {
            $allocId = AccountingEngine::allocateCustomerCredit(
                (int)$id,
                (int)$request->input('sales_invoice_id'),
                (float)$request->input('amount'),
                $request->user['id'] ?? null
            );

            return $this->success(['allocation_id' => $allocId], 'Credit successfully allocated against invoice');
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 422);
        }
    }
}

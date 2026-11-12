<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;
use App\Services\AccountingEngine;
use App\Services\InventoryEngine;
use App\Services\TaxEngine;

class PurchaseController extends Controller
{
    // =========================================================================
    // 1. Purchase Quotes & Orders
    // =========================================================================

    public function quotes(Request $request): Response
    {
        $quotes = Database::fetchAll(
            "SELECT pq.*, s.name as supplier_name, s.code as supplier_code
             FROM purchase_quotes pq
             JOIN suppliers s ON s.id = pq.supplier_id
             ORDER BY pq.quote_date DESC, pq.id DESC"
        );
        return $this->success($quotes);
    }

    public function storeQuote(Request $request): Response
    {
        $errors = $this->validate($request, [
            'supplier_id' => 'required|integer',
            'quote_date'  => 'required|date',
            'items'       => 'required|array',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $items = $request->input('items', []);
        $quoteNum = $request->input('quote_number') ?: 'PQ-' . strtoupper(bin2hex(random_bytes(3)));

        $subtotal = 0.0;
        $taxTotal = 0.0;
        foreach ($items as $it) {
            $qty = (float)($it['quantity'] ?? 1);
            $cost = (float)($it['unit_cost'] ?? 0);
            $taxRate = (float)($it['tax_rate'] ?? 0);
            $subtotal += ($qty * $cost);
            $taxTotal += ($qty * $cost * $taxRate);
        }

        $id = Database::transaction(function () use ($request, $quoteNum, $subtotal, $taxTotal, $items) {
            $pqId = Database::insert('purchase_quotes', [
                'quote_number' => $quoteNum,
                'quote_date'   => $request->input('quote_date'),
                'supplier_id'  => (int)$request->input('supplier_id'),
                'currency'     => $request->input('currency', 'AED'),
                'subtotal'     => $subtotal,
                'tax_total'    => $taxTotal,
                'total_amount' => $subtotal + $taxTotal,
                'status'       => 'Draft',
                'notes'        => $request->input('notes'),
                'created_by'   => $request->user['id'] ?? null,
                'created_at'   => date('Y-m-d H:i:s'),
            ]);

            $lineNo = 1;
            foreach ($items as $it) {
                $qty = (float)($it['quantity'] ?? 1);
                $cost = (float)($it['unit_cost'] ?? 0);
                $taxRate = (float)($it['tax_rate'] ?? 0);
                $taxAmt = $qty * $cost * $taxRate;

                Database::insert('purchase_quote_items', [
                    'purchase_quote_id' => $pqId,
                    'line_number'       => $lineNo++,
                    'inventory_item_id' => $it['inventory_item_id'] ?: null,
                    'account_id'        => $it['account_id'] ?: null,
                    'description'       => $it['description'] ?? 'Item',
                    'quantity'          => $qty,
                    'uom_id'            => $it['uom_id'] ?: null,
                    'unit_cost'         => $cost,
                    'tax_code_id'       => $it['tax_code_id'] ?: null,
                    'tax_rate'          => $taxRate,
                    'tax_amount'        => $taxAmt,
                    'line_total'        => ($qty * $cost) + $taxAmt,
                ]);
            }

            return $pqId;
        });

        return $this->success(['id' => $id, 'quote_number' => $quoteNum], 'Purchase quote created', 201);
    }

    public function orders(Request $request): Response
    {
        $orders = Database::fetchAll(
            "SELECT po.*, s.name as supplier_name, s.code as supplier_code
             FROM purchase_orders po
             JOIN suppliers s ON s.id = po.supplier_id
             ORDER BY po.order_date DESC, po.id DESC"
        );
        return $this->success($orders);
    }

    public function storeOrder(Request $request): Response
    {
        $errors = $this->validate($request, [
            'supplier_id' => 'required|integer',
            'order_date'  => 'required|date',
            'items'       => 'required|array',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $items = $request->input('items', []);
        $orderNum = $request->input('order_number') ?: 'PO-' . strtoupper(bin2hex(random_bytes(3)));

        $subtotal = 0.0;
        $taxTotal = 0.0;
        foreach ($items as $it) {
            $qty = (float)($it['quantity'] ?? 1);
            $cost = (float)($it['unit_cost'] ?? 0);
            $taxRate = (float)($it['tax_rate'] ?? 0);
            $subtotal += ($qty * $cost);
            $taxTotal += ($qty * $cost * $taxRate);
        }

        $id = Database::transaction(function () use ($request, $orderNum, $subtotal, $taxTotal, $items) {
            $poId = Database::insert('purchase_orders', [
                'order_number'      => $orderNum,
                'order_date'        => $request->input('order_date'),
                'supplier_id'       => (int)$request->input('supplier_id'),
                'purchase_quote_id' => $request->input('purchase_quote_id') ?: null,
                'currency'          => $request->input('currency', 'AED'),
                'subtotal'          => $subtotal,
                'tax_total'         => $taxTotal,
                'total_amount'      => $subtotal + $taxTotal,
                'status'            => 'Draft',
                'notes'             => $request->input('notes'),
                'created_by'        => $request->user['id'] ?? null,
                'created_at'        => date('Y-m-d H:i:s'),
            ]);

            $lineNo = 1;
            foreach ($items as $it) {
                $qty = (float)($it['quantity'] ?? 1);
                $cost = (float)($it['unit_cost'] ?? 0);
                $taxRate = (float)($it['tax_rate'] ?? 0);
                $taxAmt = $qty * $cost * $taxRate;

                Database::insert('purchase_order_items', [
                    'purchase_order_id'      => $poId,
                    'line_number'            => $lineNo++,
                    'purchase_quote_item_id' => $it['purchase_quote_item_id'] ?: null,
                    'inventory_item_id'      => $it['inventory_item_id'] ?: null,
                    'account_id'             => $it['account_id'] ?: null,
                    'description'            => $it['description'] ?? 'Item',
                    'quantity'               => $qty,
                    'qty_received'           => 0,
                    'qty_invoiced'           => 0,
                    'uom_id'                 => $it['uom_id'] ?: null,
                    'unit_cost'              => $cost,
                    'tax_code_id'            => $it['tax_code_id'] ?: null,
                    'tax_rate'               => $taxRate,
                    'tax_amount'             => $taxAmt,
                    'line_total'             => ($qty * $cost) + $taxAmt,
                ]);
            }

            return $poId;
        });

        return $this->success(['id' => $id, 'order_number' => $orderNum], 'Purchase order created', 201);
    }

    // =========================================================================
    // 2. Goods Receipts (with Batch and Serial Tracking)
    // =========================================================================

    public function goodsReceipts(Request $request): Response
    {
        $receipts = Database::fetchAll(
            "SELECT gr.*, s.name as supplier_name, il.name as location_name
             FROM goods_receipts gr
             JOIN suppliers s ON s.id = gr.supplier_id
             JOIN inventory_locations il ON il.id = gr.inventory_location_id
             ORDER BY gr.receipt_date DESC, gr.id DESC"
        );
        return $this->success($receipts);
    }

    public function storeGoodsReceipt(Request $request): Response
    {
        $errors = $this->validate($request, [
            'supplier_id'           => 'required|integer',
            'inventory_location_id' => 'required|integer',
            'items'                 => 'required|array',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $num = $request->input('receipt_number') ?: 'GR-' . strtoupper(bin2hex(random_bytes(3)));
        $locationId = (int)$request->input('inventory_location_id');
        $userId = $request->user['id'] ?? null;

        $receiptId = Database::transaction(function () use ($request, $num, $locationId, $userId) {
            $grId = Database::insert('goods_receipts', [
                'receipt_number'        => $num,
                'receipt_date'          => $request->input('receipt_date', date('Y-m-d')),
                'supplier_id'           => (int)$request->input('supplier_id'),
                'purchase_order_id'     => $request->input('purchase_order_id') ?: null,
                'inventory_location_id' => $locationId,
                'receipt_status'        => 'Received',
                'notes'                 => $request->input('notes'),
                'created_by'            => $userId,
                'created_at'            => date('Y-m-d H:i:s'),
            ]);

            foreach ($request->input('items', []) as $it) {
                $qty = (float)$it['quantity'];
                $cost = (float)($it['unit_cost'] ?? 0);
                $itemId = (int)$it['inventory_item_id'];
                $batchNo = !empty($it['batch_number']) ? $it['batch_number'] : null;
                $serialNo = !empty($it['serial_number']) ? $it['serial_number'] : null;

                InventoryEngine::addStock(
                    $itemId,
                    $locationId,
                    $qty,
                    $cost,
                    'GOODS_RECEIPT',
                    'GOODS_RECEIPT',
                    $grId,
                    "Goods Receipt #{$num}",
                    null,
                    $batchNo,
                    $serialNo
                );

                Database::insert('goods_receipt_items', [
                    'goods_receipt_id'       => $grId,
                    'purchase_order_item_id' => $it['purchase_order_item_id'] ?: null,
                    'inventory_item_id'      => $itemId,
                    'quantity'               => $qty,
                    'unit_cost'              => $cost,
                    'batch_number'           => $batchNo,
                    'serial_number'          => $serialNo,
                ]);

                // Update qty_received on purchase order item if linked
                if (!empty($it['purchase_order_item_id'])) {
                    Database::query(
                        "UPDATE purchase_order_items SET qty_received = qty_received + :qty WHERE id = :id",
                        ['qty' => $qty, 'id' => $it['purchase_order_item_id']]
                    );
                }
            }

            return $grId;
        });

        return $this->success(['id' => $receiptId, 'receipt_number' => $num], 'Goods received and stock replenished', 201);
    }

    // =========================================================================
    // 3. Purchase Invoices (with RCM & Input Tax)
    // =========================================================================

    public function indexInvoices(Request $request): Response
    {
        $status = $request->query('status');
        $supplierId = $request->query('supplier_id');

        $where = ["1=1"];
        $params = [];

        if (!empty($status)) {
            $where[] = "pi.status = :status";
            $params['status'] = $status;
        }

        if (!empty($supplierId)) {
            $where[] = "pi.supplier_id = :supp_id";
            $params['supp_id'] = $supplierId;
        }

        $whereClause = implode(" AND ", $where);
        $invoices = Database::fetchAll(
            "SELECT pi.*, s.name as supplier_name, s.code as supplier_code, s.tax_number as supplier_trn
             FROM purchase_invoices pi
             JOIN suppliers s ON s.id = pi.supplier_id
             WHERE {$whereClause}
             ORDER BY pi.issue_date DESC, pi.id DESC",
            $params
        );

        return $this->success($invoices);
    }

    public function showInvoice(Request $request, string $id): Response
    {
        $invoice = Database::fetch(
            "SELECT pi.*, s.name as supplier_name, s.code as supplier_code, s.email as supplier_email,
                    je.entry_number as journal_entry_number
             FROM purchase_invoices pi
             JOIN suppliers s ON s.id = pi.supplier_id
             LEFT JOIN journal_entries je ON je.id = pi.journal_entry_id
             WHERE pi.id = :id",
            ['id' => $id]
        );

        if (!$invoice) return $this->notFound('Purchase invoice not found');

        $items = Database::fetchAll(
            "SELECT pii.*, ii.item_code, ii.item_name
             FROM purchase_invoice_items pii
             LEFT JOIN inventory_items ii ON ii.id = pii.inventory_item_id
             WHERE pii.purchase_invoice_id = :id
             ORDER BY pii.line_number ASC",
            ['id' => $id]
        );

        $allocations = Database::fetchAll(
            "SELECT sda.*, dn.debit_number, dn.note_date
             FROM supplier_debit_allocations sda
             JOIN debit_notes dn ON dn.id = sda.debit_note_id
             WHERE sda.purchase_invoice_id = :id",
            ['id' => $id]
        );

        $invoice['items'] = $items;
        $invoice['debit_allocations'] = $allocations;

        return $this->success($invoice);
    }

    public function storeInvoice(Request $request): Response
    {
        $errors = $this->validate($request, [
            'supplier_id' => 'required|integer',
            'issue_date'  => 'required|date',
            'due_date'    => 'required|date',
            'items'       => 'required|array',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $items = $request->input('items', []);
        $supplier = Database::fetch("SELECT * FROM suppliers WHERE id = :id", ['id' => $request->input('supplier_id')]);
        if (!$supplier) return $this->error('Supplier not found', 404);

        $invoiceNumber = $request->input('invoice_number') ?: 'PINV-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));
        $exchangeRate = (float)$request->input('exchange_rate', 1.0);
        $userId = $request->user['id'] ?? null;
        $locationId = (int)$request->input('location_id', 1);

        $subtotal = 0.0;
        $taxTotal = 0.0;

        foreach ($items as $it) {
            $qty = (float)($it['quantity'] ?? 1);
            $cost = (float)($it['unit_cost'] ?? 0);
            $taxRate = (float)($it['tax_rate'] ?? 0);
            $lineNet = ($qty * $cost);
            $lineTax = $lineNet * $taxRate;

            $subtotal += $lineNet;
            $taxTotal += $lineTax;
        }

        $totalAmount = $subtotal + $taxTotal;
        $taxTotalAed = $taxTotal * $exchangeRate;

        $invoiceId = Database::transaction(function () use (
            $request, $invoiceNumber, $supplier, $exchangeRate, $subtotal,
            $taxTotal, $taxTotalAed, $totalAmount, $locationId, $items, $userId
        ) {
            $invId = Database::insert('purchase_invoices', [
                'invoice_number'          => $invoiceNumber,
                'supplier_invoice_number' => $request->input('supplier_invoice_number'),
                'issue_date'              => $request->input('issue_date'),
                'supply_date'             => $request->input('supply_date') ?: $request->input('issue_date'),
                'due_date'                => $request->input('due_date'),
                'supplier_id'             => (int)$supplier['id'],
                'supplier_trn'            => $supplier['tax_number'],
                'purchase_order_id'       => $request->input('purchase_order_id') ?: null,
                'division_id'             => $request->input('division_id') ?: null,
                'project_id'              => $request->input('project_id') ?: null,
                'currency'                => $request->input('currency', 'AED'),
                'exchange_rate'           => $exchangeRate,
                'subtotal'                => $subtotal,
                'tax_total'               => $taxTotal,
                'tax_total_aed'           => $taxTotalAed,
                'total_amount'            => $totalAmount,
                'amount_paid'             => 0.0000,
                'balance_due'             => $totalAmount,
                'status'                  => 'Draft',
                'is_reverse_charge'       => $request->input('is_reverse_charge', 0) ? 1 : 0,
                'is_import'               => $request->input('is_import', 0) ? 1 : 0,
                'notes'                   => $request->input('notes'),
                'created_by'              => $userId,
                'created_at'              => date('Y-m-d H:i:s'),
            ]);

            $lineNo = 1;
            foreach ($items as $it) {
                $qty = (float)($it['quantity'] ?? 1);
                $cost = (float)($it['unit_cost'] ?? 0);
                $taxRate = (float)($it['tax_rate'] ?? 0);
                $taxAmt = ($qty * $cost) * $taxRate;

                // If adding inventory directly with invoice
                if (!empty($it['inventory_item_id']) && $request->input('auto_receive_inventory', false)) {
                    InventoryEngine::addStock(
                        (int)$it['inventory_item_id'],
                        $locationId,
                        $qty,
                        $cost,
                        'GOODS_RECEIPT',
                        'PURCHASE_INVOICE',
                        $invId,
                        "Invoice #{$invoiceNumber}",
                        null,
                        $it['batch_number'] ?? null,
                        $it['serial_number'] ?? null
                    );
                }

                Database::insert('purchase_invoice_items', [
                    'purchase_invoice_id'    => $invId,
                    'line_number'            => $lineNo++,
                    'purchase_order_item_id' => $it['purchase_order_item_id'] ?: null,
                    'goods_receipt_item_id'  => $it['goods_receipt_item_id'] ?: null,
                    'inventory_item_id'      => $it['inventory_item_id'] ?: null,
                    'account_id'             => $it['account_id'] ?: null,
                    'description'            => $it['description'] ?? 'Item',
                    'quantity'               => $qty,
                    'uom_id'                 => $it['uom_id'] ?: null,
                    'unit_cost'              => $cost,
                    'tax_code_id'            => $it['tax_code_id'] ?: null,
                    'tax_rate'               => $taxRate,
                    'tax_amount'             => $taxAmt,
                    'line_total'             => ($qty * $cost) + $taxAmt,
                ]);

                // Update qty_invoiced on purchase order item if linked
                if (!empty($it['purchase_order_item_id'])) {
                    Database::query(
                        "UPDATE purchase_order_items SET qty_invoiced = qty_invoiced + :qty WHERE id = :id",
                        ['qty' => $qty, 'id' => $it['purchase_order_item_id']]
                    );
                }
            }

            return $invId;
        });

        // Automatically Post to General Ledger
        $journalId = AccountingEngine::postPurchaseInvoice($invoiceId, $userId);

        return $this->success([
            'id'               => $invoiceId,
            'invoice_number'   => $invoiceNumber,
            'journal_entry_id' => $journalId,
            'total_amount'     => $totalAmount,
        ], 'Purchase invoice recorded and posted to General Ledger', 201);
    }
}

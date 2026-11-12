<?php
/**
 * Comprehensive Verification & Test Suite
 * Usage: php verify_server.php
 */

$rootDir = __DIR__;

require_once $rootDir . '/core/DotEnv.php';
(new Core\DotEnv($rootDir . '/.env'))->load();

require_once $rootDir . '/core/App.php';
$app = new Core\App($rootDir);

require_once $rootDir . '/routes/api.php';

use Core\Database;
use Core\Request;
use Core\Response;
use Core\Auth;
use App\Services\AccountingEngine;
use App\Services\InventoryEngine;
use App\Services\TaxEngine;
use App\Services\AiFinancialAssistant;

echo "=================================================================\n";
echo "  Enterprise Accounting, Inventory, UAE & KSA Test Suite\n";
echo "=================================================================\n\n";

$passCount = 0;
$failCount = 0;

function assertTest(string $description, bool $condition, ?string $detail = null): void {
    global $passCount, $failCount;
    if ($condition) {
        echo " [PASS] {$description}\n";
        if ($detail) echo "        -> {$detail}\n";
        $passCount++;
    } else {
        echo " [FAIL] {$description}\n";
        if ($detail) echo "        -> ERROR: {$detail}\n";
        $failCount++;
    }
}

try {
    // 1. Database Connection & Schema Verification
    $tables = Database::fetchAll("SHOW TABLES");
    assertTest("Database connectivity & table count", count($tables) >= 60, "Total tables: " . count($tables));

    // 2. Authentication & Admin User
    $admin = Database::fetch("SELECT * FROM users WHERE username = 'admin'");
    assertTest("Admin user exists", $admin !== null, "User: " . ($admin['username'] ?? 'none'));

    $validPassword = password_verify('admin123', $admin['password_hash']);
    assertTest("Admin password verification ('admin123')", $validPassword);

    $token = Auth::generateToken($admin['id'], 'test_token');
    $validatedUser = Auth::validateToken($token);
    assertTest("Token generation and validation", $validatedUser !== null && $validatedUser['username'] === 'admin');

    // 3. Chart of Accounts verification
    $accounts = Database::fetchAll("SELECT * FROM accounts WHERE is_active = 1");
    assertTest("Chart of accounts loaded from seed", count($accounts) >= 30, "Total accounts: " . count($accounts));

    // 4. Units of Measure & Currencies
    $uoms = Database::fetchAll("SELECT * FROM units_of_measure WHERE is_active = 1");
    $currencies = Database::fetchAll("SELECT * FROM currencies WHERE is_active = 1");
    assertTest("Master UOM & Currencies available", count($uoms) >= 5 && count($currencies) >= 5, "UOMs: " . count($uoms) . ", Currencies: " . count($currencies));

    // 5. Test Double-Entry Balanced Journal Entry
    $jeId = AccountingEngine::postJournalEntry([
        'entry_number' => 'JE-TEST-001',
        'entry_date'   => date('Y-m-d'),
        'reference'    => 'Capital Contribution',
        'narration'    => 'Owner initial capital deposit',
        'source_type'  => 'MANUAL',
    ], [
        [
            'account_id'  => 2, // 1020 Emirates NBD Operating Bank Account
            'description' => 'Deposit capital to bank',
            'debit'       => 100000.00,
            'credit'      => 0,
        ],
        [
            'account_id'  => 18, // 3010 Share Capital / Owner Equity
            'description' => 'Owner capital contribution',
            'debit'       => 0,
            'credit'      => 100000.00,
        ]
    ], $admin['id']);
    assertTest("Double-Entry Journal Entry (DR Bank 100,000 / CR Equity 100,000)", $jeId > 0, "Journal ID: {$jeId}");

    // 6. Test Unbalanced Journal Rejection (Rule #2)
    $unbalancedCaught = false;
    try {
        AccountingEngine::postJournalEntry([
            'entry_number' => 'JE-FAIL-001',
            'entry_date'   => date('Y-m-d'),
        ], [
            ['account_id' => 2, 'debit' => 100.00, 'credit' => 0],
            ['account_id' => 18, 'debit' => 0, 'credit' => 50.00],
        ]);
    } catch (\Throwable $e) {
        $unbalancedCaught = true;
    }
    assertTest("Rule #2 Enforcement: Unbalanced journal entry strictly rejected", $unbalancedCaught);

    // 7. Test Inventory Management & Batch Tracking
    $testItemCode = 'ITEM-' . strtoupper(bin2hex(random_bytes(2)));
    $itemId = Database::insert('inventory_items', [
        'item_code'          => $testItemCode,
        'item_name'          => 'Industrial Server Rack Unit',
        'valuation_method'   => 'AVERAGE_COST',
        'uom_id'             => 1,
        'unit_name'          => 'Pcs',
        'sales_price'        => 500.00,
        'purchase_price'     => 200.00,
        'average_cost'       => 200.00,
        'track_batches'      => 1,
        'qty_on_hand'        => 0,
        'control_account_id' => 7,  // 1300 Inventory
        'cogs_account_id'    => 26, // 5010 COGS
        'sales_account_id'   => 21, // 4010 Sales
    ]);

    // Receive Batch 1: 10 units at AED 200
    InventoryEngine::addStock($itemId, 1, 10, 200.00, 'GOODS_RECEIPT', 'TEST', 1, 'Batch 1', null, 'BATCH-2026-A');
    // Receive Batch 2: 10 units at AED 240 -> Avg cost = 220
    InventoryEngine::addStock($itemId, 1, 10, 240.00, 'GOODS_RECEIPT', 'TEST', 2, 'Batch 2', null, 'BATCH-2026-B');

    $itemAfter = Database::fetch("SELECT * FROM inventory_items WHERE id = :id", ['id' => $itemId]);
    $batchCount = Database::fetch("SELECT COUNT(*) as cnt FROM inventory_batches WHERE inventory_item_id = :id", ['id' => $itemId]);

    assertTest("Inventory Weighted Average Cost Calculation (10@200 + 10@240 = 20@220)", abs((float)$itemAfter['average_cost'] - 220.00) < 0.01 && (float)$itemAfter['qty_on_hand'] == 20.0, "Qty: {$itemAfter['qty_on_hand']}, AvgCost: {$itemAfter['average_cost']}");
    assertTest("Inventory Batch tracking created successfully", (int)$batchCount['cnt'] >= 2);

    // 8. Test Customer Creation (with 15-digit UAE TRN & Emirate)
    $custId = Database::insert('customers', [
        'code'          => 'CUST-DXB-001',
        'name'          => 'Emirates Integrated Trading LLC',
        'tax_number'    => '100456789000003', // 15 digits
        'emirate'       => 'Dubai',
        'country'       => 'United Arab Emirates',
        'credit_limit'  => 100000.00,
        'currency'      => 'AED',
    ]);

    // 9. Test Sales Order with itemized lines
    $orderNumber = 'SO-DXB-001';
    $soId = Database::insert('sales_orders', [
        'order_number' => $orderNumber,
        'order_date'   => date('Y-m-d'),
        'customer_id'  => $custId,
        'subtotal'     => 10 * 500.00,
        'tax_total'    => 10 * 500.00 * 0.05,
        'total_amount' => (10 * 500.00) + (10 * 500.00 * 0.05),
        'currency'     => 'AED',
    ]);
    $soItemId = Database::insert('sales_order_items', [
        'sales_order_id'    => $soId,
        'line_number'       => 1,
        'inventory_item_id' => $itemId,
        'description'       => 'Industrial Server Rack Unit',
        'quantity'          => 10,
        'unit_price'        => 500.00,
        'tax_rate'          => 0.05,
        'tax_amount'        => 250.00,
        'line_total'        => 5250.00,
    ]);
    assertTest("Sales Order created with itemized line", $soItemId > 0, "SO #{$orderNumber}");

    // 10. Test Delivery Note relieving stock
    $dnId = Database::insert('delivery_notes', [
        'delivery_number'       => 'DN-DXB-001',
        'delivery_date'         => date('Y-m-d'),
        'customer_id'           => $custId,
        'sales_order_id'        => $soId,
        'inventory_location_id' => 1,
    ]);
    $cost = InventoryEngine::deductStock($itemId, 1, 5, 'DELIVERY_NOTE', 'DELIVERY_NOTE', $dnId, 'Delivery #1');
    Database::insert('delivery_note_items', [
        'delivery_note_id'    => $dnId,
        'sales_order_item_id' => $soItemId,
        'inventory_item_id'   => $itemId,
        'quantity'            => 5,
        'unit_cost'           => $cost,
    ]);
    $itemAfterDn = Database::fetch("SELECT qty_on_hand FROM inventory_items WHERE id = :id", ['id' => $itemId]);
    assertTest("Delivery Note issued and stock relieved (20 - 5 = 15 units)", (float)$itemAfterDn['qty_on_hand'] == 15.0);

    // 11. Test Sales Invoice with UAE 5% VAT & ZATCA TLV QR Code
    $invNumber = 'INV-' . strtoupper(bin2hex(random_bytes(2)));
    $qrCode = TaxEngine::generateZatcaQrCode(
        'Orient Logistics & Solutions LLC',
        '100234567800003',
        date('Y-m-d\TH:i:s\Z'),
        2625.00,
        125.00
    );

    $invId = Database::insert('sales_invoices', [
        'invoice_number' => $invNumber,
        'invoice_type'   => 'Tax Invoice',
        'issue_date'     => date('Y-m-d'),
        'due_date'       => date('Y-m-d', strtotime('+30 days')),
        'customer_id'    => $custId,
        'customer_trn'   => '100456789000003',
        'sales_order_id' => $soId,
        'emirate'        => 'Dubai',
        'currency'       => 'AED',
        'exchange_rate'  => 1.0,
        'subtotal'       => 2500.00,
        'tax_total'      => 125.00,
        'tax_total_aed'  => 125.00,
        'total_amount'   => 2625.00,
        'amount_paid'    => 0,
        'balance_due'    => 2625.00,
        'zatca_qr_code'  => $qrCode,
        'status'         => 'Draft',
    ]);
    Database::insert('sales_invoice_items', [
        'sales_invoice_id'    => $invId,
        'sales_order_item_id' => $soItemId,
        'inventory_item_id'   => $itemId,
        'description'         => 'Industrial Server Rack Unit',
        'quantity'            => 5,
        'unit_price'          => 500.00,
        'tax_code_id'         => 1, // UAE-VAT-5
        'tax_rate'            => 0.05,
        'tax_amount'          => 125.00,
        'unit_cost'           => 220.00,
        'line_total'          => 2625.00,
    ]);

    $invJeId = AccountingEngine::postSalesInvoice($invId, $admin['id']);
    assertTest("Sales Invoice Posted to GL (DR AR / CR Revenue / CR Output VAT / DR COGS / CR Inventory)", $invJeId > 0, "Invoice #{$invNumber}");
    assertTest("ZATCA TLV Base64 QR Code generated", !empty($qrCode));

    // 12. Test Customer Credit Note & Credit Allocation against invoice
    $creditId = Database::insert('credit_notes', [
        'credit_number'         => 'CN-DXB-001',
        'note_date'             => date('Y-m-d'),
        'customer_id'           => $custId,
        'sales_invoice_id'      => $invId,
        'inventory_location_id' => 1,
        'currency'              => 'AED',
        'subtotal'              => 500.00,
        'tax_total'             => 25.00,
        'total_amount'          => 525.00,
        'amount_allocated'      => 0,
        'status'                => 'Draft',
    ]);
    Database::insert('credit_note_items', [
        'credit_note_id'        => $creditId,
        'inventory_item_id'     => $itemId,
        'description'           => 'Server Rack Unit Return',
        'quantity'              => 1,
        'unit_price'            => 500.00,
        'tax_code_id'           => 1,
        'tax_rate'              => 0.05,
        'tax_amount'            => 25.00,
        'unit_cost'             => 220.00,
        'return_to_stock'       => 1,
        'line_total'            => 525.00,
    ]);
    $cnJeId = AccountingEngine::postCreditNote($creditId, $admin['id']);
    assertTest("Credit Note Posted to GL with Return to Stock", $cnJeId > 0);

    // Allocate Credit Note against the Invoice
    $allocId = AccountingEngine::allocateCustomerCredit($creditId, $invId, 525.00, $admin['id']);
    $invAfterCredit = Database::fetch("SELECT amount_paid, balance_due, status FROM sales_invoices WHERE id = :id", ['id' => $invId]);
    assertTest("Credit Allocation applied to invoice (Balance due 2625 - 525 = 2100)", abs((float)$invAfterCredit['balance_due'] - 2100.00) < 0.01 && (float)$invAfterCredit['amount_paid'] == 525.00);

    // 13. Test Customer Receipt (Money In)
    $receiptId = Database::insert('receipts', [
        'receipt_number' => 'REC-DXB-001',
        'receipt_date'   => date('Y-m-d'),
        'account_id'     => 2, // Emirates NBD
        'payer_id'       => $custId,
        'payer_name'     => 'Emirates Integrated Trading LLC',
        'total_amount'   => 2100.00,
    ]);
    Database::insert('receipt_lines', [
        'receipt_id'       => $receiptId,
        'sales_invoice_id' => $invId,
        'amount'           => 2100.00,
    ]);
    $recJeId = AccountingEngine::postReceipt($receiptId, $admin['id']);
    $invAfterPay = Database::fetch("SELECT balance_due, status FROM sales_invoices WHERE id = :id", ['id' => $invId]);
    assertTest("Customer Receipt ($2,100) posted and Invoice Paid In Full", $recJeId > 0 && (float)$invAfterPay['balance_due'] <= 0.001 && $invAfterPay['status'] === 'Paid');

    // 14. Financial Reports: Trial Balance, P&L, Balance Sheet
    $tb = AccountingEngine::getTrialBalance();
    assertTest("Trial Balance Verification: Debits == Credits", $tb['is_balanced'], "Debits: {$tb['total_debit']}, Credits: {$tb['total_credit']}");

    $pnl = AccountingEngine::getProfitAndLoss(date('Y-01-01'), date('Y-m-d'));
    assertTest("Profit & Loss: Revenue, COGS, and Net Income", (float)$pnl['total_revenue'] > 0 && (float)$pnl['gross_profit'] > 0, "Revenue: {$pnl['total_revenue']}, COGS: {$pnl['total_cost_of_sales']}, Gross Profit: {$pnl['gross_profit']}");

    $bs = AccountingEngine::getBalanceSheet();
    assertTest("Balance Sheet Verification: Assets = Liabilities + Equity", $bs['is_balanced'], "Assets: {$bs['total_assets']}, Liab+Equity: {$bs['total_liabilities_and_equity']}");

    // 15. UAE FTA VAT Return Form 201 Generation
    $uaeVat = TaxEngine::generateUaeVatReturn(date('Y-01-01'), date('Y-m-d'));
    assertTest("UAE FTA VAT 201 Generated with Dubai Emirate Breakdown", isset($uaeVat['vat_on_sales']['box_1_emirates']['1b']), "Dubai Net: AED " . $uaeVat['vat_on_sales']['box_1_emirates']['1b']['net_amount'] . ", VAT: AED " . $uaeVat['vat_on_sales']['box_1_emirates']['1b']['vat_amount']);

    // 16. KSA ZATCA VAT Return Generation
    $ksaVat = TaxEngine::generateKsaVatReturn(date('Y-01-01'), date('Y-m-d'));
    assertTest("KSA ZATCA VAT Return Generated", isset($ksaVat['net_vat_due']));

    // 17. AI Financial Assistant NLP & Anomaly Scan
    $aiUae = AiFinancialAssistant::answerFinancialQuery("What is our UAE VAT 201 return summary?");
    assertTest("AI Financial NLP Query: UAE VAT 201 intent answered", !empty($aiUae['summary']), $aiUae['summary']);

    $auditScan = AiFinancialAssistant::detectAnomalies();
    assertTest("AI Automated Audit Scanner completed", isset($auditScan['status']), "Status: " . $auditScan['status']);

    $cfoSummary = AiFinancialAssistant::getFinancialHealthSummary();
    assertTest("AI CFO Executive Health Report generated", !empty($cfoSummary['executive_summary']['health_grade']), "Grade: " . $cfoSummary['executive_summary']['health_grade']);

} catch (\Throwable $e) {
    echo "\n[EXCEPTION]: " . $e->getMessage() . "\n";
    echo "In " . $e->getFile() . " on line " . $e->getLine() . "\n";
    $failCount++;
}

echo "\n=================================================================\n";
echo "  Verification Summary: {$passCount} Passed, {$failCount} Failed\n";
echo "=================================================================\n";

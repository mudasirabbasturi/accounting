<?php
namespace App\Services;

use Core\Database;

class AccountingEngine
{
    /**
     * Create and post a balanced double-entry journal entry.
     * Enforces Accounting Rule #2: Sum(Debits) must equal Sum(Credits).
     */
    public static function postJournalEntry(array $header, array $lines, ?int $userId = null): int
    {
        $totalDebit = 0.0;
        $totalCredit = 0.0;

        foreach ($lines as $line) {
            $totalDebit += (float)($line['debit'] ?? 0);
            $totalCredit += (float)($line['credit'] ?? 0);
        }

        // Strict Double-entry verification (within 0.001 precision)
        if (abs($totalDebit - $totalCredit) > 0.001) {
            throw new \Exception("Accounting Rule Violation: Total Debits ({$totalDebit}) must equal Total Credits ({$totalCredit}).");
        }

        if ($totalDebit <= 0) {
            throw new \Exception("Journal entry amount must be greater than zero.");
        }

        $entryNumber = $header['entry_number'] ?? 'JE-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
        $entryDate = $header['entry_date'] ?? date('Y-m-d');

        return Database::transaction(function () use ($header, $lines, $totalDebit, $totalCredit, $entryNumber, $entryDate, $userId) {
            $journalId = Database::insert('journal_entries', [
                'entry_number' => $entryNumber,
                'entry_date'   => $entryDate,
                'reference'    => $header['reference'] ?? null,
                'narration'    => $header['narration'] ?? '',
                'source_type'  => $header['source_type'] ?? 'MANUAL',
                'source_id'    => $header['source_id'] ?? null,
                'currency'     => $header['currency'] ?? 'AED',
                'exchange_rate'=> (float)($header['exchange_rate'] ?? 1.0),
                'total_debit'  => $totalDebit,
                'total_credit' => $totalCredit,
                'status'       => 'Posted',
                'created_by'   => $userId,
                'created_at'   => date('Y-m-d H:i:s'),
            ]);

            foreach ($lines as $line) {
                $accountId = (int)$line['account_id'];
                $debit = (float)($line['debit'] ?? 0);
                $credit = (float)($line['credit'] ?? 0);

                Database::insert('journal_entry_lines', [
                    'journal_entry_id' => $journalId,
                    'account_id'       => $accountId,
                    'division_id'      => $line['division_id'] ?? null,
                    'project_id'       => $line['project_id'] ?? null,
                    'description'      => $line['description'] ?? '',
                    'debit'            => $debit,
                    'credit'           => $credit,
                    'foreign_amount'   => $line['foreign_amount'] ?? null,
                    'currency'         => $line['currency'] ?? null,
                    'entity_type'      => $line['entity_type'] ?? null,
                    'entity_id'        => $line['entity_id'] ?? null,
                ]);

                // Update account current balance
                self::updateAccountBalance($accountId);
            }

            return $journalId;
        });
    }

    /**
     * Recalculate account balance based on normal balance (Asset/Expense = Debit, Liability/Equity/Revenue = Credit)
     */
    public static function updateAccountBalance(int $accountId): void
    {
        $account = Database::fetch("SELECT id, normal_balance, opening_balance FROM accounts WHERE id = :id", ['id' => $accountId]);
        if (!$account) return;

        $sums = Database::fetch(
            "SELECT COALESCE(SUM(jel.debit), 0) as total_debit, COALESCE(SUM(jel.credit), 0) as total_credit
             FROM journal_entry_lines jel
             JOIN journal_entries je ON je.id = jel.journal_entry_id
             WHERE jel.account_id = :account_id AND je.status = 'Posted'",
            ['account_id' => $accountId]
        );

        $totalDebit = (float)$sums['total_debit'];
        $totalCredit = (float)$sums['total_credit'];
        $opening = (float)$account['opening_balance'];

        if ($account['normal_balance'] === 'Debit') {
            $balance = $opening + $totalDebit - $totalCredit;
        } else {
            $balance = $opening + $totalCredit - $totalDebit;
        }

        Database::update('accounts', ['current_balance' => $balance], 'id = :id', ['id' => $accountId]);
    }

    /**
     * Post Sales Invoice to General Ledger
     * DR Accounts Receivable (Gross)
     * CR Sales Revenue (Net)
     * CR Output VAT Payable (Tax)
     * DR COGS (Expense matching)
     * CR Inventory on Hand (Asset relief)
     */
    public static function postSalesInvoice(int $invoiceId, ?int $userId = null): int
    {
        $invoice = Database::fetch("SELECT * FROM sales_invoices WHERE id = :id", ['id' => $invoiceId]);
        if (!$invoice) throw new \Exception("Sales invoice not found");

        $items = Database::fetchAll("SELECT * FROM sales_invoice_items WHERE sales_invoice_id = :id", ['id' => $invoiceId]);

        // Default Control Accounts
        $arAccount = Database::fetch("SELECT id FROM accounts WHERE control_type = 'AR' LIMIT 1");
        $salesAccount = Database::fetch("SELECT id FROM accounts WHERE code = '4010' LIMIT 1");
        $taxAccount = Database::fetch("SELECT id FROM accounts WHERE control_type = 'OUTPUT_TAX' LIMIT 1");
        $cogsAccount = Database::fetch("SELECT id FROM accounts WHERE code = '5010' LIMIT 1");
        $inventoryAccount = Database::fetch("SELECT id FROM accounts WHERE control_type = 'INVENTORY' LIMIT 1");

        $arAccountId = $arAccount ? $arAccount['id'] : 5;
        $salesAccountId = $salesAccount ? $salesAccount['id'] : 21;
        $taxAccountId = $taxAccount ? $taxAccount['id'] : 14;
        $cogsAccountId = $cogsAccount ? $cogsAccount['id'] : 26;
        $inventoryAccountId = $inventoryAccount ? $inventoryAccount['id'] : 7;

        $lines = [];

        // 1. DR Accounts Receivable with total amount
        $lines[] = [
            'account_id'  => $arAccountId,
            'description' => "Sales Invoice #{$invoice['invoice_number']}",
            'debit'       => (float)$invoice['total_amount'],
            'credit'      => 0,
            'entity_type' => 'Customer',
            'entity_id'   => $invoice['customer_id'],
        ];

        // 2. CR Sales Revenue
        $netSales = (float)$invoice['subtotal'] - (float)$invoice['discount_amount'];
        $lines[] = [
            'account_id'  => $salesAccountId,
            'description' => "Revenue for Invoice #{$invoice['invoice_number']}",
            'debit'       => 0,
            'credit'      => $netSales,
        ];

        // 3. CR Output VAT Payable (if applicable)
        if ((float)$invoice['tax_total'] > 0) {
            $lines[] = [
                'account_id'  => $taxAccountId,
                'description' => "Output VAT for Invoice #{$invoice['invoice_number']}",
                'debit'       => 0,
                'credit'      => (float)$invoice['tax_total'],
            ];
        }

        // 4. COGS & Inventory Relief
        $totalCogs = 0.0;
        foreach ($items as $item) {
            $totalCogs += (float)($item['unit_cost'] * $item['quantity']);
        }

        if ($totalCogs > 0) {
            $lines[] = [
                'account_id'  => $cogsAccountId,
                'description' => "COGS for Invoice #{$invoice['invoice_number']}",
                'debit'       => $totalCogs,
                'credit'      => 0,
            ];
            $lines[] = [
                'account_id'  => $inventoryAccountId,
                'description' => "Inventory relief for #{$invoice['invoice_number']}",
                'debit'       => 0,
                'credit'      => $totalCogs,
            ];
        }

        $journalId = self::postJournalEntry([
            'entry_number' => 'JE-INV-' . $invoice['invoice_number'],
            'entry_date'   => $invoice['issue_date'],
            'reference'    => $invoice['invoice_number'],
            'narration'    => "Posting for Sales Invoice #{$invoice['invoice_number']}",
            'source_type'  => 'SALES_INVOICE',
            'source_id'    => $invoiceId,
            'currency'     => $invoice['currency'],
        ], $lines, $userId);

        Database::update('sales_invoices', [
            'status'           => 'Sent',
            'journal_entry_id' => $journalId,
            'cost_of_sales'    => $totalCogs,
        ], 'id = :id', ['id' => $invoiceId]);

        self::updateCustomerReceivable($invoice['customer_id']);

        return $journalId;
    }

    /**
     * Post Purchase Invoice to General Ledger
     * DR Inventory / Expense accounts
     * DR Input VAT Recoverable (Asset)
     * CR Accounts Payable (Trade Creditors)
     * Or for RCM: DR Input Tax, CR Reverse Charge Liability
     */
    public static function postPurchaseInvoice(int $invoiceId, ?int $userId = null): int
    {
        $invoice = Database::fetch("SELECT * FROM purchase_invoices WHERE id = :id", ['id' => $invoiceId]);
        if (!$invoice) throw new \Exception("Purchase invoice not found");

        $items = Database::fetchAll("SELECT * FROM purchase_invoice_items WHERE purchase_invoice_id = :id", ['id' => $invoiceId]);

        $apAccount = Database::fetch("SELECT id FROM accounts WHERE control_type = 'AP' LIMIT 1");
        $inventoryAccount = Database::fetch("SELECT id FROM accounts WHERE control_type = 'INVENTORY' LIMIT 1");
        $inputTaxAccount = Database::fetch("SELECT id FROM accounts WHERE control_type = 'INPUT_TAX' LIMIT 1");
        $rcmAccount = Database::fetch("SELECT id FROM accounts WHERE control_type = 'RCM_TAX' LIMIT 1");

        $apAccountId = $apAccount ? $apAccount['id'] : 13;
        $inventoryAccountId = $inventoryAccount ? $inventoryAccount['id'] : 7;
        $inputTaxAccountId = $inputTaxAccount ? $inputTaxAccount['id'] : 9;
        $rcmAccountId = $rcmAccount ? $rcmAccount['id'] : 15;

        $lines = [];

        // 1. Debit Inventory / Expense accounts
        foreach ($items as $item) {
            $itemAccount = $item['account_id'] ?: $inventoryAccountId;
            $lineNet = (float)$item['line_total'] - (float)$item['tax_amount'];

            $lines[] = [
                'account_id'  => $itemAccount,
                'description' => $item['description'] ?: "Purchase Item for #{$invoice['invoice_number']}",
                'debit'       => $lineNet,
                'credit'      => 0,
            ];
        }

        // 2. Input VAT Recoverable
        if ((float)$invoice['tax_total'] > 0) {
            $lines[] = [
                'account_id'  => $inputTaxAccountId,
                'description' => "Input VAT for Purchase #{$invoice['invoice_number']}",
                'debit'       => (float)$invoice['tax_total'],
                'credit'      => 0,
            ];
        }

        // 3. Credit Accounts Payable
        $lines[] = [
            'account_id'  => $apAccountId,
            'description' => "Purchase Invoice #{$invoice['invoice_number']}",
            'debit'       => 0,
            'credit'      => (float)$invoice['total_amount'],
            'entity_type' => 'Supplier',
            'entity_id'   => $invoice['supplier_id'],
        ];

        // 4. Reverse Charge Mechanism (RCM - Self Accounting)
        if ($invoice['is_reverse_charge'] && (float)$invoice['tax_total'] > 0) {
            // DR Input Tax (already added above) and CR RCM Liability
            $lines[] = [
                'account_id'  => $rcmAccountId,
                'description' => "RCM Output VAT for Import #{$invoice['invoice_number']}",
                'debit'       => 0,
                'credit'      => (float)$invoice['tax_total'],
            ];
            // Net AP is only the subtotal
            $lines[count($lines) - 2]['credit'] = (float)$invoice['subtotal'];
        }

        $journalId = self::postJournalEntry([
            'entry_number' => 'JE-PUR-' . $invoice['invoice_number'],
            'entry_date'   => $invoice['issue_date'],
            'reference'    => $invoice['invoice_number'],
            'narration'    => "Posting for Purchase Invoice #{$invoice['invoice_number']}",
            'source_type'  => 'PURCHASE_INVOICE',
            'source_id'    => $invoiceId,
            'currency'     => $invoice['currency'],
        ], $lines, $userId);

        Database::update('purchase_invoices', [
            'status'           => 'Received',
            'journal_entry_id' => $journalId,
        ], 'id = :id', ['id' => $invoiceId]);

        self::updateSupplierPayable($invoice['supplier_id']);

        return $journalId;
    }

    /**
     * Post Customer Credit Note to General Ledger
     * DR Sales Revenue
     * DR Output VAT (reduction of VAT payable)
     * CR Accounts Receivable
     */
    public static function postCreditNote(int $creditNoteId, ?int $userId = null): int
    {
        $cn = Database::fetch("SELECT * FROM credit_notes WHERE id = :id", ['id' => $creditNoteId]);
        if (!$cn) throw new \Exception("Credit note not found");

        $items = Database::fetchAll("SELECT * FROM credit_note_items WHERE credit_note_id = :id", ['id' => $creditNoteId]);

        $arAccount = Database::fetch("SELECT id FROM accounts WHERE control_type = 'AR' LIMIT 1");
        $salesAccount = Database::fetch("SELECT id FROM accounts WHERE code = '4010' LIMIT 1");
        $taxAccount = Database::fetch("SELECT id FROM accounts WHERE control_type = 'OUTPUT_TAX' LIMIT 1");
        $cogsAccount = Database::fetch("SELECT id FROM accounts WHERE code = '5010' LIMIT 1");
        $inventoryAccount = Database::fetch("SELECT id FROM accounts WHERE control_type = 'INVENTORY' LIMIT 1");

        $arAccountId = $arAccount ? $arAccount['id'] : 5;
        $salesAccountId = $salesAccount ? $salesAccount['id'] : 21;
        $taxAccountId = $taxAccount ? $taxAccount['id'] : 14;
        $cogsAccountId = $cogsAccount ? $cogsAccount['id'] : 26;
        $inventoryAccountId = $inventoryAccount ? $inventoryAccount['id'] : 7;

        $lines = [];

        // 1. DR Sales Revenue (Sales Return)
        $lines[] = [
            'account_id'  => $salesAccountId,
            'description' => "Sales Return Credit Note #{$cn['credit_number']}",
            'debit'       => (float)$cn['subtotal'],
            'credit'      => 0,
        ];

        // 2. DR Output VAT (VAT Relief)
        if ((float)$cn['tax_total'] > 0) {
            $lines[] = [
                'account_id'  => $taxAccountId,
                'description' => "VAT Relief on Credit Note #{$cn['credit_number']}",
                'debit'       => (float)$cn['tax_total'],
                'credit'      => 0,
            ];
        }

        // 3. CR Accounts Receivable
        $lines[] = [
            'account_id'  => $arAccountId,
            'description' => "Credit Note #{$cn['credit_number']}",
            'debit'       => 0,
            'credit'      => (float)$cn['total_amount'],
            'entity_type' => 'Customer',
            'entity_id'   => $cn['customer_id'],
        ];

        // 4. If goods returned to stock: DR Inventory, CR COGS
        $returnCost = 0.0;
        foreach ($items as $it) {
            if ($it['return_to_stock'] && $it['inventory_item_id']) {
                $returnCost += (float)($it['unit_cost'] * $it['quantity']);
            }
        }

        if ($returnCost > 0) {
            $lines[] = [
                'account_id'  => $inventoryAccountId,
                'description' => "Stock re-entry on #{$cn['credit_number']}",
                'debit'       => $returnCost,
                'credit'      => 0,
            ];
            $lines[] = [
                'account_id'  => $cogsAccountId,
                'description' => "COGS reversal on #{$cn['credit_number']}",
                'debit'       => 0,
                'credit'      => $returnCost,
            ];
        }

        $journalId = self::postJournalEntry([
            'entry_number' => 'JE-CN-' . $cn['credit_number'],
            'entry_date'   => $cn['note_date'],
            'reference'    => $cn['credit_number'],
            'narration'    => "Credit Note: " . ($cn['reason'] ?: 'Sales Return'),
            'source_type'  => 'CREDIT_NOTE',
            'source_id'    => $creditNoteId,
            'currency'     => $cn['currency'],
        ], $lines, $userId);

        Database::update('credit_notes', [
            'status'           => 'Approved',
            'journal_entry_id' => $journalId,
        ], 'id = :id', ['id' => $creditNoteId]);

        self::updateCustomerReceivable($cn['customer_id']);

        return $journalId;
    }

    /**
     * Allocate Customer Credit Note against Open Sales Invoice
     */
    public static function allocateCustomerCredit(int $creditNoteId, int $salesInvoiceId, float $amount, ?int $userId = null): int
    {
        $cn = Database::fetch("SELECT * FROM credit_notes WHERE id = :id", ['id' => $creditNoteId]);
        if (!$cn) throw new \Exception("Credit note not found");

        $inv = Database::fetch("SELECT * FROM sales_invoices WHERE id = :id", ['id' => $salesInvoiceId]);
        if (!$inv) throw new \Exception("Sales invoice not found");

        $availCredit = (float)$cn['total_amount'] - (float)$cn['amount_allocated'];
        if ($amount > $availCredit + 0.001) {
            throw new \Exception("Amount ({$amount}) exceeds available credit ({$availCredit}).");
        }

        if ($amount > (float)$inv['balance_due'] + 0.001) {
            throw new \Exception("Amount ({$amount}) exceeds invoice balance due ({$inv['balance_due']}).");
        }

        return Database::transaction(function () use ($cn, $inv, $creditNoteId, $salesInvoiceId, $amount, $userId) {
            $allocId = Database::insert('customer_credit_allocations', [
                'credit_note_id'     => $creditNoteId,
                'sales_invoice_id'   => $salesInvoiceId,
                'allocation_date'    => date('Y-m-d'),
                'amount'             => $amount,
                'exchange_gain_loss' => 0.0000,
                'created_by'         => $userId,
                'created_at'         => date('Y-m-d H:i:s'),
            ]);

            // Update credit note allocated amount
            $newAllocated = (float)$cn['amount_allocated'] + $amount;
            Database::update('credit_notes', ['amount_allocated' => $newAllocated], 'id = :id', ['id' => $creditNoteId]);

            // Update invoice amount paid & balance due
            $newPaid = (float)$inv['amount_paid'] + $amount;
            $newDue = max(0.0, (float)$inv['balance_due'] - $amount);
            $newStatus = ($newDue <= 0.001) ? 'Paid' : 'Partially Paid';

            Database::update('sales_invoices', [
                'amount_paid' => $newPaid,
                'balance_due' => $newDue,
                'status'      => $newStatus,
            ], 'id = :id', ['id' => $salesInvoiceId]);

            self::updateCustomerReceivable($inv['customer_id']);

            return $allocId;
        });
    }

    /**
     * Post Customer Payment Receipt (Money In)
     * DR Bank / Cash
     * CR Accounts Receivable
     */
    public static function postReceipt(int $receiptId, ?int $userId = null): int
    {
        $receipt = Database::fetch("SELECT * FROM receipts WHERE id = :id", ['id' => $receiptId]);
        if (!$receipt) throw new \Exception("Receipt not found");

        $lines = Database::fetchAll("SELECT * FROM receipt_lines WHERE receipt_id = :id", ['id' => $receiptId]);
        $arAccount = Database::fetch("SELECT id FROM accounts WHERE control_type = 'AR' LIMIT 1");
        $arAccountId = $arAccount ? $arAccount['id'] : 5;

        $journalLines = [];

        // 1. DR Bank/Cash
        $journalLines[] = [
            'account_id'  => $receipt['account_id'],
            'description' => "Customer Receipt #{$receipt['receipt_number']}",
            'debit'       => (float)$receipt['total_amount'],
            'credit'      => 0,
        ];

        // 2. CR Accounts Receivable
        foreach ($lines as $line) {
            $accId = $line['account_id'] ?: $arAccountId;
            $journalLines[] = [
                'account_id'  => $accId,
                'description' => $line['description'] ?: "Receipt from {$receipt['payer_name']}",
                'debit'       => 0,
                'credit'      => (float)$line['amount'],
                'entity_type' => 'Customer',
                'entity_id'   => $receipt['payer_id'],
            ];

            // Apply to invoice
            if (!empty($line['sales_invoice_id'])) {
                self::applyReceiptToInvoice((int)$line['sales_invoice_id'], (float)$line['amount']);
            }
        }

        $journalId = self::postJournalEntry([
            'entry_number' => 'JE-REC-' . $receipt['receipt_number'],
            'entry_date'   => $receipt['receipt_date'],
            'reference'    => $receipt['receipt_number'],
            'narration'    => "Customer Receipt #{$receipt['receipt_number']}",
            'source_type'  => 'RECEIPT',
            'source_id'    => $receiptId,
            'currency'     => $receipt['currency'],
        ], $journalLines, $userId);

        Database::update('receipts', ['journal_entry_id' => $journalId], 'id = :id', ['id' => $receiptId]);

        if ($receipt['payer_id']) {
            self::updateCustomerReceivable($receipt['payer_id']);
        }

        return $journalId;
    }

    /**
     * Post Supplier Payment (Money Out)
     * DR Accounts Payable
     * CR Bank / Cash
     */
    public static function postPayment(int $paymentId, ?int $userId = null): int
    {
        $payment = Database::fetch("SELECT * FROM payments WHERE id = :id", ['id' => $paymentId]);
        if (!$payment) throw new \Exception("Payment not found");

        $lines = Database::fetchAll("SELECT * FROM payment_lines WHERE payment_id = :id", ['id' => $paymentId]);
        $apAccount = Database::fetch("SELECT id FROM accounts WHERE control_type = 'AP' LIMIT 1");
        $apAccountId = $apAccount ? $apAccount['id'] : 13;

        $journalLines = [];

        // 1. DR Accounts Payable / Expenses
        foreach ($lines as $line) {
            $accId = $line['account_id'] ?: $apAccountId;
            $journalLines[] = [
                'account_id'  => $accId,
                'description' => $line['description'] ?: "Payment to {$payment['payee_name']}",
                'debit'       => (float)$line['amount'],
                'credit'      => 0,
                'entity_type' => 'Supplier',
                'entity_id'   => $payment['payee_id'],
            ];

            if (!empty($line['purchase_invoice_id'])) {
                self::applyPaymentToInvoice((int)$line['purchase_invoice_id'], (float)$line['amount']);
            }
        }

        // 2. CR Bank/Cash
        $journalLines[] = [
            'account_id'  => $payment['account_id'],
            'description' => "Payment #{$payment['payment_number']}",
            'debit'       => 0,
            'credit'      => (float)$payment['total_amount'],
        ];

        $journalId = self::postJournalEntry([
            'entry_number' => 'JE-PAY-' . $payment['payment_number'],
            'entry_date'   => $payment['payment_date'],
            'reference'    => $payment['payment_number'],
            'narration'    => "Supplier Payment #{$payment['payment_number']}",
            'source_type'  => 'PAYMENT',
            'source_id'    => $paymentId,
            'currency'     => $payment['currency'],
        ], $journalLines, $userId);

        Database::update('payments', ['journal_entry_id' => $journalId], 'id = :id', ['id' => $paymentId]);

        if ($payment['payee_id']) {
            self::updateSupplierPayable($payment['payee_id']);
        }

        return $journalId;
    }

    private static function applyReceiptToInvoice(int $invoiceId, float $amount): void
    {
        $inv = Database::fetch("SELECT amount_paid, balance_due, total_amount FROM sales_invoices WHERE id = :id", ['id' => $invoiceId]);
        if (!$inv) return;

        $newPaid = (float)$inv['amount_paid'] + $amount;
        $newDue = max(0.0, (float)$inv['balance_due'] - $amount);
        $status = ($newDue <= 0.001) ? 'Paid' : 'Partially Paid';

        Database::update('sales_invoices', [
            'amount_paid' => $newPaid,
            'balance_due' => $newDue,
            'status'      => $status,
        ], 'id = :id', ['id' => $invoiceId]);
    }

    private static function applyPaymentToInvoice(int $invoiceId, float $amount): void
    {
        $inv = Database::fetch("SELECT amount_paid, balance_due, total_amount FROM purchase_invoices WHERE id = :id", ['id' => $invoiceId]);
        if (!$inv) return;

        $newPaid = (float)$inv['amount_paid'] + $amount;
        $newDue = max(0.0, (float)$inv['balance_due'] - $amount);
        $status = ($newDue <= 0.001) ? 'Paid' : 'Partially Paid';

        Database::update('purchase_invoices', [
            'amount_paid' => $newPaid,
            'balance_due' => $newDue,
            'status'      => $status,
        ], 'id = :id', ['id' => $invoiceId]);
    }

    public static function updateCustomerReceivable(int $customerId): void
    {
        $due = Database::fetch(
            "SELECT COALESCE(SUM(balance_due), 0) as total_due FROM sales_invoices
             WHERE customer_id = :id AND status NOT IN ('Draft', 'Void')",
            ['id' => $customerId]
        );
        Database::update('customers', ['accounts_receivable' => (float)$due['total_due']], 'id = :id', ['id' => $customerId]);
    }

    public static function updateSupplierPayable(int $supplierId): void
    {
        $due = Database::fetch(
            "SELECT COALESCE(SUM(balance_due), 0) as total_due FROM purchase_invoices
             WHERE supplier_id = :id AND status NOT IN ('Draft', 'Void')",
            ['id' => $supplierId]
        );
        Database::update('suppliers', ['accounts_payable' => (float)$due['total_due']], 'id = :id', ['id' => $supplierId]);
    }

    // =========================================================================
    // Core Financial Statements: Trial Balance, P&L, Balance Sheet
    // =========================================================================

    public static function getTrialBalance(?string $asOfDate = null): array
    {
        $dateCondition = $asOfDate ? "AND je.entry_date <= :as_of" : "";
        $params = $asOfDate ? ['as_of' => $asOfDate] : [];

        $sql = "SELECT a.id, a.code, a.name, a.account_type, a.normal_balance, a.opening_balance,
                       COALESCE(SUM(jel.debit), 0) as period_debit,
                       COALESCE(SUM(jel.credit), 0) as period_credit
                FROM accounts a
                LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
                LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.status = 'Posted' {$dateCondition}
                WHERE a.is_active = 1
                GROUP BY a.id, a.code, a.name, a.account_type, a.normal_balance, a.opening_balance
                ORDER BY a.code ASC";

        $rows = Database::fetchAll($sql, $params);

        $report = [];
        $totalDebit = 0.0;
        $totalCredit = 0.0;

        foreach ($rows as $row) {
            $pDebit = (float)$row['period_debit'];
            $pCredit = (float)$row['period_credit'];
            $open = (float)$row['opening_balance'];

            if ($row['normal_balance'] === 'Debit') {
                $netBalance = $open + $pDebit - $pCredit;
                $displayDebit = ($netBalance >= 0) ? $netBalance : 0;
                $displayCredit = ($netBalance < 0) ? abs($netBalance) : 0;
            } else {
                $netBalance = $open + $pCredit - $pDebit;
                $displayCredit = ($netBalance >= 0) ? $netBalance : 0;
                $displayDebit = ($netBalance < 0) ? abs($netBalance) : 0;
            }

            if ($displayDebit != 0 || $displayCredit != 0) {
                $report[] = [
                    'account_id'     => $row['id'],
                    'code'           => $row['code'],
                    'name'           => $row['name'],
                    'account_type'   => $row['account_type'],
                    'normal_balance' => $row['normal_balance'],
                    'debit'          => round($displayDebit, 4),
                    'credit'         => round($displayCredit, 4),
                ];
                $totalDebit += $displayDebit;
                $totalCredit += $displayCredit;
            }
        }

        return [
            'as_of_date'   => $asOfDate ?: date('Y-m-d'),
            'accounts'     => $report,
            'total_debit'  => round($totalDebit, 4),
            'total_credit' => round($totalCredit, 4),
            'is_balanced'  => abs($totalDebit - $totalCredit) < 0.01,
            'difference'   => round(abs($totalDebit - $totalCredit), 4),
        ];
    }

    public static function getProfitAndLoss(string $startDate, string $endDate): array
    {
        $sql = "SELECT a.id, a.code, a.name, a.account_type, a.sub_type, a.normal_balance,
                       COALESCE(SUM(jel.debit), 0) as period_debit,
                       COALESCE(SUM(jel.credit), 0) as period_credit
                FROM accounts a
                JOIN journal_entry_lines jel ON jel.account_id = a.id
                JOIN journal_entries je ON je.id = jel.journal_entry_id
                WHERE a.account_type IN ('Revenue', 'Expense')
                  AND je.status = 'Posted'
                  AND je.entry_date BETWEEN :start_date AND :end_date
                GROUP BY a.id, a.code, a.name, a.account_type, a.sub_type, a.normal_balance
                ORDER BY a.code ASC";

        $rows = Database::fetchAll($sql, ['start_date' => $startDate, 'end_date' => $endDate]);

        $revenues = [];
        $costOfSales = [];
        $operatingExpenses = [];

        $totalRevenue = 0.0;
        $totalCogs = 0.0;
        $totalExpenses = 0.0;

        foreach ($rows as $row) {
            $debit = (float)$row['period_debit'];
            $credit = (float)$row['period_credit'];

            if ($row['account_type'] === 'Revenue') {
                $net = $credit - $debit;
                $revenues[] = [
                    'code'   => $row['code'],
                    'name'   => $row['name'],
                    'amount' => round($net, 4),
                ];
                $totalRevenue += $net;
            } else {
                $net = $debit - $credit;
                if (str_contains(strtolower($row['sub_type']), 'cost of sales') || in_array($row['code'], ['5010', '5020'])) {
                    $costOfSales[] = [
                        'code'   => $row['code'],
                        'name'   => $row['name'],
                        'amount' => round($net, 4),
                    ];
                    $totalCogs += $net;
                } else {
                    $operatingExpenses[] = [
                        'code'   => $row['code'],
                        'name'   => $row['name'],
                        'amount' => round($net, 4),
                    ];
                    $totalExpenses += $net;
                }
            }
        }

        $grossProfit = $totalRevenue - $totalCogs;
        $netIncome = $grossProfit - $totalExpenses;

        return [
            'period'              => ['start_date' => $startDate, 'end_date' => $endDate],
            'revenues'            => $revenues,
            'total_revenue'       => round($totalRevenue, 4),
            'cost_of_sales'       => $costOfSales,
            'total_cost_of_sales' => round($totalCogs, 4),
            'gross_profit'        => round($grossProfit, 4),
            'operating_expenses'  => $operatingExpenses,
            'total_expenses'      => round($totalExpenses, 4),
            'net_profit'          => round($netIncome, 4),
            'profit_margin'       => ($totalRevenue > 0) ? round(($netIncome / $totalRevenue) * 100, 2) . '%' : '0%',
        ];
    }

    public static function getBalanceSheet(?string $asOfDate = null): array
    {
        $asOf = $asOfDate ?: date('Y-m-d');
        $tb = self::getTrialBalance($asOf);

        $assets = [];
        $liabilities = [];
        $equity = [];

        $totalAssets = 0.0;
        $totalLiabilities = 0.0;
        $totalEquity = 0.0;

        foreach ($tb['accounts'] as $acc) {
            if ($acc['account_type'] === 'Asset') {
                $val = $acc['debit'] - $acc['credit'];
                $assets[] = ['code' => $acc['code'], 'name' => $acc['name'], 'amount' => round($val, 4)];
                $totalAssets += $val;
            } elseif ($acc['account_type'] === 'Liability') {
                $val = $acc['credit'] - $acc['debit'];
                $liabilities[] = ['code' => $acc['code'], 'name' => $acc['name'], 'amount' => round($val, 4)];
                $totalLiabilities += $val;
            } elseif ($acc['account_type'] === 'Equity') {
                $val = $acc['credit'] - $acc['debit'];
                $equity[] = ['code' => $acc['code'], 'name' => $acc['name'], 'amount' => round($val, 4)];
                $totalEquity += $val;
            }
        }

        $yearStart = date('Y-01-01', strtotime($asOf));
        $pnl = self::getProfitAndLoss($yearStart, $asOf);
        $ytdNetProfit = $pnl['net_profit'];

        $equity[] = [
            'code'   => 'NET-YTD',
            'name'   => 'Current Year Earnings (YTD Net Income)',
            'amount' => round($ytdNetProfit, 4),
        ];
        $totalEquity += $ytdNetProfit;

        $totalLiabilitiesAndEquity = $totalLiabilities + $totalEquity;

        return [
            'as_of_date'                   => $asOf,
            'assets'                       => $assets,
            'total_assets'                 => round($totalAssets, 4),
            'liabilities'                  => $liabilities,
            'total_liabilities'            => round($totalLiabilities, 4),
            'equity'                       => $equity,
            'total_equity'                 => round($totalEquity, 4),
            'total_liabilities_and_equity' => round($totalLiabilitiesAndEquity, 4),
            'is_balanced'                  => abs($totalAssets - $totalLiabilitiesAndEquity) < 0.01,
            'equation_verification'        => [
                'rule'     => 'Assets = Liabilities + Equity',
                'formula'  => "{$totalAssets} == {$totalLiabilities} + {$totalEquity} ({$totalLiabilitiesAndEquity})",
                'variance' => round($totalAssets - $totalLiabilitiesAndEquity, 4),
            ],
        ];
    }
}

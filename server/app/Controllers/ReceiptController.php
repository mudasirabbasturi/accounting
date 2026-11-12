<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;
use App\Services\AccountingEngine;

class ReceiptController extends Controller
{
    public function index(Request $request): Response
    {
        $receipts = Database::fetchAll(
            "SELECT r.*, a.name as account_name, a.code as account_code
             FROM receipts r
             JOIN accounts a ON a.id = r.account_id
             ORDER BY r.receipt_date DESC, r.id DESC"
        );
        return $this->success($receipts);
    }

    public function show(Request $request, string $id): Response
    {
        $receipt = Database::fetch(
            "SELECT r.*, a.name as account_name, a.code as account_code
             FROM receipts r
             JOIN accounts a ON a.id = r.account_id
             WHERE r.id = :id",
            ['id' => $id]
        );
        if (!$receipt) return $this->notFound('Receipt not found');

        $lines = Database::fetchAll(
            "SELECT rl.*, a.code as account_code, a.name as account_name
             FROM receipt_lines rl
             LEFT JOIN accounts a ON a.id = rl.account_id
             WHERE rl.receipt_id = :id",
            ['id' => $id]
        );

        $receipt['lines'] = $lines;
        return $this->success($receipt);
    }

    public function store(Request $request): Response
    {
        $errors = $this->validate($request, [
            'account_id'   => 'required|integer',
            'receipt_date' => 'required|date',
            'lines'        => 'required|array',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $lines = $request->input('lines', []);
        $totalAmount = 0.0;
        foreach ($lines as $ln) {
            $totalAmount += (float)($ln['amount'] ?? 0);
        }

        if ($totalAmount <= 0) return $this->error('Total receipt amount must be greater than zero', 422);

        $num = $request->input('receipt_number') ?: 'REC-' . strtoupper(bin2hex(random_bytes(3)));
        $userId = $request->user['id'] ?? null;

        $receiptId = Database::transaction(function () use ($request, $num, $lines, $totalAmount, $userId) {
            $rId = Database::insert('receipts', [
                'receipt_number' => $num,
                'receipt_date'   => $request->input('receipt_date'),
                'account_id'     => (int)$request->input('account_id'),
                'payer_type'     => $request->input('payer_type', 'Customer'),
                'payer_id'       => $request->input('payer_id') ?: null,
                'payer_name'     => $request->input('payer_name'),
                'payment_method' => $request->input('payment_method', 'Bank Transfer'),
                'reference'      => $request->input('reference'),
                'currency'       => $request->input('currency', 'USD'),
                'total_amount'   => $totalAmount,
                'notes'          => $request->input('notes'),
                'created_by'     => $userId,
                'created_at'     => date('Y-m-d H:i:s'),
            ]);

            foreach ($lines as $ln) {
                Database::insert('receipt_lines', [
                    'receipt_id'       => $rId,
                    'account_id'       => $ln['account_id'] ?: null,
                    'sales_invoice_id' => $ln['sales_invoice_id'] ?: null,
                    'description'      => $ln['description'] ?? 'Receipt line',
                    'amount'           => (float)$ln['amount'],
                ]);
            }

            return $rId;
        });

        // Automatically Post to General Ledger (DR Bank, CR AR/Income)
        $journalId = AccountingEngine::postReceipt($receiptId, $userId);

        return $this->success([
            'id'               => $receiptId,
            'receipt_number'   => $num,
            'journal_entry_id' => $journalId,
            'total_amount'     => $totalAmount,
        ], 'Receipt recorded and posted to General Ledger', 201);
    }

    // =========================================================================
    // Inter-Account Bank/Cash Transfers
    // =========================================================================

    public function transfers(Request $request): Response
    {
        $transfers = Database::fetchAll(
            "SELECT t.*, fa.name as from_account_name, ta.name as to_account_name
             FROM inter_account_transfers t
             JOIN accounts fa ON fa.id = t.from_account_id
             JOIN accounts ta ON ta.id = t.to_account_id
             ORDER BY t.transfer_date DESC, t.id DESC"
        );
        return $this->success($transfers);
    }

    public function storeTransfer(Request $request): Response
    {
        $errors = $this->validate($request, [
            'from_account_id' => 'required|integer',
            'to_account_id'   => 'required|integer',
            'transfer_date'   => 'required|date',
            'amount'          => 'required|numeric',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $fromId = (int)$request->input('from_account_id');
        $toId = (int)$request->input('to_account_id');
        if ($fromId === $toId) return $this->error('From and To accounts must be different', 422);

        $amount = (float)$request->input('amount');
        if ($amount <= 0) return $this->error('Transfer amount must be greater than zero', 422);

        $ref = $request->input('reference') ?: 'TXF-' . strtoupper(bin2hex(random_bytes(3)));
        $userId = $request->user['id'] ?? null;

        // Post Journal Entry (DR ToAccount, CR FromAccount)
        $journalId = AccountingEngine::postJournalEntry([
            'entry_number' => 'JE-TXF-' . $ref,
            'entry_date'   => $request->input('transfer_date'),
            'reference'    => $ref,
            'narration'    => "Bank Transfer: " . ($request->input('description') ?: 'Inter-account fund movement'),
            'source_type'  => 'TRANSFER',
        ], [
            [
                'account_id'  => $toId,
                'description' => 'Transfer deposit',
                'debit'       => $amount,
                'credit'      => 0,
            ],
            [
                'account_id'  => $fromId,
                'description' => 'Transfer withdrawal',
                'debit'       => 0,
                'credit'      => $amount,
            ]
        ], $userId);

        $id = Database::insert('inter_account_transfers', [
            'transfer_date'    => $request->input('transfer_date'),
            'reference'        => $ref,
            'from_account_id'  => $fromId,
            'to_account_id'    => $toId,
            'amount'           => $amount,
            'description'      => $request->input('description'),
            'journal_entry_id' => $journalId,
            'created_by'       => $userId,
            'created_at'       => date('Y-m-d H:i:s'),
        ]);

        return $this->success([
            'id'               => $id,
            'reference'        => $ref,
            'journal_entry_id' => $journalId,
        ], 'Inter-account transfer completed', 201);
    }
}

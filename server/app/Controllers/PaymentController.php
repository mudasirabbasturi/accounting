<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;
use App\Services\AccountingEngine;

class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $payments = Database::fetchAll(
            "SELECT p.*, a.name as account_name, a.code as account_code
             FROM payments p
             JOIN accounts a ON a.id = p.account_id
             ORDER BY p.payment_date DESC, p.id DESC"
        );
        return $this->success($payments);
    }

    public function show(Request $request, string $id): Response
    {
        $payment = Database::fetch(
            "SELECT p.*, a.name as account_name, a.code as account_code
             FROM payments p
             JOIN accounts a ON a.id = p.account_id
             WHERE p.id = :id",
            ['id' => $id]
        );
        if (!$payment) return $this->notFound('Payment not found');

        $lines = Database::fetchAll(
            "SELECT pl.*, a.code as account_code, a.name as account_name
             FROM payment_lines pl
             LEFT JOIN accounts a ON a.id = pl.account_id
             WHERE pl.payment_id = :id",
            ['id' => $id]
        );

        $payment['lines'] = $lines;
        return $this->success($payment);
    }

    public function store(Request $request): Response
    {
        $errors = $this->validate($request, [
            'account_id'   => 'required|integer',
            'payment_date' => 'required|date',
            'lines'        => 'required|array',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $lines = $request->input('lines', []);
        $totalAmount = 0.0;
        foreach ($lines as $ln) {
            $totalAmount += (float)($ln['amount'] ?? 0);
        }

        if ($totalAmount <= 0) return $this->error('Total payment amount must be greater than zero', 422);

        $num = $request->input('payment_number') ?: 'PAY-' . strtoupper(bin2hex(random_bytes(3)));
        $userId = $request->user['id'] ?? null;

        $paymentId = Database::transaction(function () use ($request, $num, $lines, $totalAmount, $userId) {
            $pId = Database::insert('payments', [
                'payment_number' => $num,
                'payment_date'   => $request->input('payment_date'),
                'account_id'     => (int)$request->input('account_id'),
                'payee_type'     => $request->input('payee_type', 'Supplier'),
                'payee_id'       => $request->input('payee_id') ?: null,
                'payee_name'     => $request->input('payee_name'),
                'payment_method' => $request->input('payment_method', 'Bank Transfer'),
                'reference'      => $request->input('reference'),
                'currency'       => $request->input('currency', 'USD'),
                'total_amount'   => $totalAmount,
                'notes'          => $request->input('notes'),
                'created_by'     => $userId,
                'created_at'     => date('Y-m-d H:i:s'),
            ]);

            foreach ($lines as $ln) {
                Database::insert('payment_lines', [
                    'payment_id'          => $pId,
                    'account_id'          => $ln['account_id'] ?: null,
                    'purchase_invoice_id' => $ln['purchase_invoice_id'] ?: null,
                    'description'         => $ln['description'] ?? 'Payment line',
                    'amount'              => (float)$ln['amount'],
                ]);
            }

            return $pId;
        });

        // Automatically Post to General Ledger (DR AP/Expense, CR Bank)
        $journalId = AccountingEngine::postPayment($paymentId, $userId);

        return $this->success([
            'id'               => $paymentId,
            'payment_number'   => $num,
            'journal_entry_id' => $journalId,
            'total_amount'     => $totalAmount,
        ], 'Payment recorded and posted to General Ledger', 201);
    }
}

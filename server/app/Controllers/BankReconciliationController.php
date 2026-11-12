<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;

class BankReconciliationController extends Controller
{
    public function index(Request $request): Response
    {
        $reconciliations = Database::fetchAll(
            "SELECT br.*, a.name as account_name, a.code as account_code
             FROM bank_reconciliations br
             JOIN accounts a ON a.id = br.account_id
             ORDER BY br.reconciliation_date DESC, br.id DESC"
        );
        return $this->success($reconciliations);
    }

    public function show(Request $request, string $id): Response
    {
        $rec = Database::fetch(
            "SELECT br.*, a.name as account_name, a.code as account_code
             FROM bank_reconciliations br
             JOIN accounts a ON a.id = br.account_id
             WHERE br.id = :id",
            ['id' => $id]
        );
        if (!$rec) return $this->notFound('Bank reconciliation not found');

        $items = Database::fetchAll(
            "SELECT * FROM bank_reconciliation_items WHERE bank_reconciliation_id = :id ORDER BY transaction_date ASC",
            ['id' => $id]
        );

        $rec['transactions'] = $items;
        return $this->success($rec);
    }

    public function store(Request $request): Response
    {
        $errors = $this->validate($request, [
            'account_id'           => 'required|integer',
            'reconciliation_date'  => 'required|date',
            'statement_start_date' => 'required|date',
            'statement_end_date'   => 'required|date',
            'statement_balance'    => 'required|numeric',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $accountId = (int)$request->input('account_id');
        $account = Database::fetch("SELECT current_balance FROM accounts WHERE id = :id", ['id' => $accountId]);
        if (!$account) return $this->error('Bank account not found', 404);

        $statementBal = (float)$request->input('statement_balance');
        $bookBal = (float)$account['current_balance'];
        $discrepancy = $statementBal - $bookBal;
        $status = (abs($discrepancy) < 0.01) ? 'Reconciled' : 'Discrepancy';

        $recId = Database::insert('bank_reconciliations', [
            'reconciliation_date'  => $request->input('reconciliation_date'),
            'account_id'           => $accountId,
            'statement_start_date' => $request->input('statement_start_date'),
            'statement_end_date'   => $request->input('statement_end_date'),
            'statement_balance'    => $statementBal,
            'book_balance'         => $bookBal,
            'discrepancy'          => $discrepancy,
            'status'               => $status,
            'notes'                => $request->input('notes'),
            'created_by'           => $request->user['id'] ?? null,
            'created_at'           => date('Y-m-d H:i:s'),
        ]);

        return $this->success([
            'id'          => $recId,
            'status'      => $status,
            'discrepancy' => $discrepancy,
        ], 'Bank reconciliation created', 201);
    }
}

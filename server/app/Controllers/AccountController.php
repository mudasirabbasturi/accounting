<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;
use App\Services\AccountingEngine;

class AccountController extends Controller
{
    public function index(Request $request): Response
    {
        $type = $request->query('account_type');
        $search = $request->query('search');

        $where = ["is_active = 1"];
        $params = [];

        if (!empty($type)) {
            $where[] = "account_type = :type";
            $params['type'] = $type;
        }

        if (!empty($search)) {
            $where[] = "(code LIKE :search OR name LIKE :search)";
            $params['search'] = "%{$search}%";
        }

        $whereClause = implode(" AND ", $where);
        $accounts = Database::fetchAll("SELECT * FROM accounts WHERE {$whereClause} ORDER BY code ASC", $params);

        return $this->success($accounts);
    }

    public function show(Request $request, string $id): Response
    {
        $account = Database::fetch("SELECT * FROM accounts WHERE id = :id", ['id' => $id]);
        if (!$account) return $this->notFound('Account not found');

        // Recent ledger entries
        $entries = Database::fetchAll(
            "SELECT jel.*, je.entry_number, je.entry_date, je.reference, je.source_type
             FROM journal_entry_lines jel
             JOIN journal_entries je ON je.id = jel.journal_entry_id
             WHERE jel.account_id = :id AND je.status = 'Posted'
             ORDER BY je.entry_date DESC, je.id DESC
             LIMIT 50",
            ['id' => $id]
        );

        $account['recent_transactions'] = $entries;
        return $this->success($account);
    }

    public function store(Request $request): Response
    {
        $errors = $this->validate($request, [
            'code'           => 'required',
            'name'           => 'required',
            'account_type'   => 'required|in:Asset,Liability,Equity,Revenue,Expense',
            'sub_type'       => 'required',
            'normal_balance' => 'required|in:Debit,Credit',
        ]);

        if ($errors) return $this->error('Validation failed', 422, $errors);

        // Check unique code
        $existing = Database::fetch("SELECT id FROM accounts WHERE code = :code", ['code' => $request->input('code')]);
        if ($existing) return $this->error("Account code '{$request->input('code')}' already exists", 422);

        $id = Database::insert('accounts', [
            'code'               => $request->input('code'),
            'name'               => $request->input('name'),
            'account_type'       => $request->input('account_type'),
            'sub_type'           => $request->input('sub_type'),
            'normal_balance'     => $request->input('normal_balance'),
            'parent_id'          => $request->input('parent_id') ?: null,
            'is_control_account' => $request->input('is_control_account', 0) ? 1 : 0,
            'control_type'       => $request->input('control_type', 'NONE'),
            'currency'           => $request->input('currency', 'USD'),
            'bank_name'          => $request->input('bank_name'),
            'account_number'     => $request->input('account_number'),
            'iban'               => $request->input('iban'),
            'swift_code'         => $request->input('swift_code'),
            'opening_balance'    => (float)$request->input('opening_balance', 0),
            'current_balance'    => (float)$request->input('opening_balance', 0),
            'notes'              => $request->input('notes'),
            'created_at'         => date('Y-m-d H:i:s'),
        ]);

        return $this->success(['id' => $id], 'Account created successfully', 201);
    }

    public function update(Request $request, string $id): Response
    {
        $account = Database::fetch("SELECT id FROM accounts WHERE id = :id", ['id' => $id]);
        if (!$account) return $this->notFound('Account not found');

        $data = $request->only([
            'name', 'sub_type', 'parent_id', 'is_control_account', 'control_type',
            'currency', 'bank_name', 'account_number', 'iban', 'swift_code', 'notes', 'is_active'
        ]);

        if (!empty($data)) {
            Database::update('accounts', $data, 'id = :id', ['id' => $id]);
        }

        return $this->success(null, 'Account updated successfully');
    }

    public function destroy(Request $request, string $id): Response
    {
        $hasTransactions = Database::fetch("SELECT id FROM journal_entry_lines WHERE account_id = :id LIMIT 1", ['id' => $id]);
        if ($hasTransactions) {
            Database::update('accounts', ['is_active' => 0], 'id = :id', ['id' => $id]);
            return $this->success(null, 'Account has existing transactions and has been deactivated instead of deleted');
        }

        Database::delete('accounts', 'id = :id', ['id' => $id]);
        return $this->success(null, 'Account deleted successfully');
    }

    public function controlAccounts(Request $request): Response
    {
        $accounts = Database::fetchAll("SELECT * FROM accounts WHERE is_control_account = 1 ORDER BY code ASC");
        return $this->success($accounts);
    }
}

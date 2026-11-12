<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;

class ProjectController extends Controller
{
    // =========================================================================
    // 1. Projects
    // =========================================================================

    public function index(Request $request): Response
    {
        $projects = Database::fetchAll(
            "SELECT p.*, c.name as customer_name
             FROM projects p
             LEFT JOIN customers c ON c.id = p.customer_id
             WHERE p.is_active = 1
             ORDER BY p.code ASC"
        );
        return $this->success($projects);
    }

    public function show(Request $request, string $id): Response
    {
        $project = Database::fetch("SELECT * FROM projects WHERE id = :id", ['id' => $id]);
        if (!$project) return $this->notFound('Project not found');

        // Calculate Project Income & Cost from General Ledger
        $financials = Database::fetch(
            "SELECT COALESCE(SUM(jel.credit - jel.debit), 0) as income
             FROM journal_entry_lines jel
             JOIN accounts a ON a.id = jel.account_id
             JOIN journal_entries je ON je.id = jel.journal_entry_id
             WHERE jel.project_id = :id AND a.account_type = 'Revenue' AND je.status = 'Posted'",
            ['id' => $id]
        );

        $expenses = Database::fetch(
            "SELECT COALESCE(SUM(jel.debit - jel.credit), 0) as expense
             FROM journal_entry_lines jel
             JOIN accounts a ON a.id = jel.account_id
             JOIN journal_entries je ON je.id = jel.journal_entry_id
             WHERE jel.project_id = :id AND a.account_type = 'Expense' AND je.status = 'Posted'",
            ['id' => $id]
        );

        $inc = (float)$financials['income'];
        $exp = (float)$expenses['expense'];

        $project['actual_income'] = $inc;
        $project['actual_expenses'] = $exp;
        $project['actual_profit'] = $inc - $exp;

        return $this->success($project);
    }

    public function store(Request $request): Response
    {
        $errors = $this->validate($request, [
            'name' => 'required',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $code = $request->input('code') ?: 'PRJ-' . strtoupper(bin2hex(random_bytes(3)));

        $id = Database::insert('projects', [
            'code'              => $code,
            'name'              => $request->input('name'),
            'customer_id'       => $request->input('customer_id') ?: null,
            'start_date'        => $request->input('start_date'),
            'end_date'          => $request->input('end_date'),
            'status'            => $request->input('status', 'Active'),
            'budget'            => (float)$request->input('budget', 0),
            'estimated_revenue' => (float)$request->input('estimated_revenue', 0),
            'currency'          => $request->input('currency', 'USD'),
            'notes'             => $request->input('notes'),
            'created_at'        => date('Y-m-d H:i:s'),
        ]);

        return $this->success(['id' => $id, 'code' => $code], 'Project created successfully', 201);
    }

    // =========================================================================
    // 2. Divisions & Tax Codes
    // =========================================================================

    public function divisions(Request $request): Response
    {
        $divisions = Database::fetchAll("SELECT * FROM divisions WHERE is_active = 1 ORDER BY code ASC");
        return $this->success($divisions);
    }

    public function storeDivision(Request $request): Response
    {
        $errors = $this->validate($request, [
            'code' => 'required',
            'name' => 'required',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $id = Database::insert('divisions', [
            'code'        => $request->input('code'),
            'name'        => $request->input('name'),
            'description' => $request->input('description'),
            'created_at'  => date('Y-m-d H:i:s'),
        ]);

        return $this->success(['id' => $id], 'Division created', 201);
    }

    public function taxCodes(Request $request): Response
    {
        $taxCodes = Database::fetchAll("SELECT * FROM tax_codes WHERE is_active = 1 ORDER BY rate ASC");
        return $this->success($taxCodes);
    }
}

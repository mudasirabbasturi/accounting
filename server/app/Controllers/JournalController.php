<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;
use App\Services\AccountingEngine;

class JournalController extends Controller
{
    public function index(Request $request): Response
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $sourceType = $request->query('source_type');

        $where = ["1=1"];
        $params = [];

        if (!empty($startDate) && !empty($endDate)) {
            $where[] = "entry_date BETWEEN :start_date AND :end_date";
            $params['start_date'] = $startDate;
            $params['end_date'] = $endDate;
        }

        if (!empty($sourceType)) {
            $where[] = "source_type = :source";
            $params['source'] = $sourceType;
        }

        $whereClause = implode(" AND ", $where);
        $entries = Database::fetchAll(
            "SELECT je.*, u.full_name as created_by_name
             FROM journal_entries je
             LEFT JOIN users u ON u.id = je.created_by
             WHERE {$whereClause}
             ORDER BY je.entry_date DESC, je.id DESC
             LIMIT 100",
            $params
        );

        return $this->success($entries);
    }

    public function show(Request $request, string $id): Response
    {
        $entry = Database::fetch("SELECT * FROM journal_entries WHERE id = :id", ['id' => $id]);
        if (!$entry) return $this->notFound('Journal entry not found');

        $lines = Database::fetchAll(
            "SELECT jel.*, a.code as account_code, a.name as account_name, a.account_type, a.normal_balance
             FROM journal_entry_lines jel
             JOIN accounts a ON a.id = jel.account_id
             WHERE jel.journal_entry_id = :id
             ORDER BY jel.id ASC",
            ['id' => $id]
        );

        $entry['lines'] = $lines;
        $entry['is_balanced'] = abs((float)$entry['total_debit'] - (float)$entry['total_credit']) < 0.001;

        return $this->success($entry);
    }

    public function store(Request $request): Response
    {
        $errors = $this->validate($request, [
            'entry_date' => 'required|date',
            'lines'      => 'required|array',
        ]);

        if ($errors) return $this->error('Validation failed', 422, $errors);

        $lines = $request->input('lines', []);
        if (count($lines) < 2) {
            return $this->error('Accounting Rule #2: A journal entry must have at least two balanced lines (one debit and one credit).', 422);
        }

        try {
            $userId = $request->user['id'] ?? null;
            $journalId = AccountingEngine::postJournalEntry([
                'entry_number' => $request->input('entry_number'),
                'entry_date'   => $request->input('entry_date'),
                'reference'    => $request->input('reference'),
                'narration'    => $request->input('narration'),
                'source_type'  => 'MANUAL',
                'currency'     => $request->input('currency', 'USD'),
            ], $lines, $userId);

            return $this->success(['id' => $journalId], 'Journal entry posted successfully to General Ledger', 201);
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 422);
        }
    }
}

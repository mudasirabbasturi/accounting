<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;
use App\Services\AccountingEngine;

class ReportController extends Controller
{
    public function trialBalance(Request $request): Response
    {
        $asOfDate = $request->query('as_of_date') ?: date('Y-m-d');
        $report = AccountingEngine::getTrialBalance($asOfDate);
        return $this->success($report);
    }

    public function profitAndLoss(Request $request): Response
    {
        $startDate = $request->query('start_date') ?: date('Y-01-01');
        $endDate = $request->query('end_date') ?: date('Y-m-d');

        $report = AccountingEngine::getProfitAndLoss($startDate, $endDate);
        return $this->success($report);
    }

    public function balanceSheet(Request $request): Response
    {
        $asOfDate = $request->query('as_of_date') ?: date('Y-m-d');
        $report = AccountingEngine::getBalanceSheet($asOfDate);
        return $this->success($report);
    }

    public function generalLedger(Request $request): Response
    {
        $accountId = $request->query('account_id');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $where = ["je.status = 'Posted'"];
        $params = [];

        if (!empty($accountId)) {
            $where[] = "jel.account_id = :acc_id";
            $params['acc_id'] = $accountId;
        }

        if (!empty($startDate) && !empty($endDate)) {
            $where[] = "je.entry_date BETWEEN :s_date AND :e_date";
            $params['s_date'] = $startDate;
            $params['e_date'] = $endDate;
        }

        $whereClause = implode(" AND ", $where);
        $entries = Database::fetchAll(
            "SELECT jel.*, je.entry_number, je.entry_date, je.reference, je.source_type,
                    a.code as account_code, a.name as account_name, a.normal_balance
             FROM journal_entry_lines jel
             JOIN journal_entries je ON je.id = jel.journal_entry_id
             JOIN accounts a ON a.id = jel.account_id
             WHERE {$whereClause}
             ORDER BY je.entry_date ASC, jel.id ASC",
            $params
        );

        return $this->success($entries);
    }

    public function agedReceivables(Request $request): Response
    {
        $today = date('Y-m-d');
        $invoices = Database::fetchAll(
            "SELECT si.id, si.invoice_number, si.issue_date, si.due_date, si.total_amount, si.balance_due,
                    c.id as customer_id, c.code as customer_code, c.name as customer_name,
                    DATEDIFF(:today, si.due_date) as days_overdue
             FROM sales_invoices si
             JOIN customers c ON c.id = si.customer_id
             WHERE si.balance_due > 0 AND si.status NOT IN ('Draft', 'Void')
             ORDER BY c.name ASC, si.due_date ASC",
            ['today' => $today]
        );

        $agingBuckets = [
            'current' => 0.0,
            '1_30'    => 0.0,
            '31_60'   => 0.0,
            '61_90'   => 0.0,
            '90_plus' => 0.0,
            'total'   => 0.0,
        ];

        foreach ($invoices as &$inv) {
            $overdue = (int)$inv['days_overdue'];
            $due = (float)$inv['balance_due'];

            if ($overdue <= 0) {
                $inv['bucket'] = 'Current';
                $agingBuckets['current'] += $due;
            } elseif ($overdue <= 30) {
                $inv['bucket'] = '1-30 Days';
                $agingBuckets['1_30'] += $due;
            } elseif ($overdue <= 60) {
                $inv['bucket'] = '31-60 Days';
                $agingBuckets['31_60'] += $due;
            } elseif ($overdue <= 90) {
                $inv['bucket'] = '61-90 Days';
                $agingBuckets['61_90'] += $due;
            } else {
                $inv['bucket'] = '90+ Days';
                $agingBuckets['90_plus'] += $due;
            }
            $agingBuckets['total'] += $due;
        }

        return $this->success([
            'as_of_date' => $today,
            'summary'    => $agingBuckets,
            'invoices'   => $invoices,
        ]);
    }

    public function agedPayables(Request $request): Response
    {
        $today = date('Y-m-d');
        $invoices = Database::fetchAll(
            "SELECT pi.id, pi.invoice_number, pi.issue_date, pi.due_date, pi.total_amount, pi.balance_due,
                    s.id as supplier_id, s.code as supplier_code, s.name as supplier_name,
                    DATEDIFF(:today, pi.due_date) as days_overdue
             FROM purchase_invoices pi
             JOIN suppliers s ON s.id = pi.supplier_id
             WHERE pi.balance_due > 0 AND pi.status NOT IN ('Draft', 'Void')
             ORDER BY s.name ASC, pi.due_date ASC",
            ['today' => $today]
        );

        $agingBuckets = [
            'current' => 0.0,
            '1_30'    => 0.0,
            '31_60'   => 0.0,
            '61_90'   => 0.0,
            '90_plus' => 0.0,
            'total'   => 0.0,
        ];

        foreach ($invoices as &$inv) {
            $overdue = (int)$inv['days_overdue'];
            $due = (float)$inv['balance_due'];

            if ($overdue <= 0) {
                $inv['bucket'] = 'Current';
                $agingBuckets['current'] += $due;
            } elseif ($overdue <= 30) {
                $inv['bucket'] = '1-30 Days';
                $agingBuckets['1_30'] += $due;
            } elseif ($overdue <= 60) {
                $inv['bucket'] = '31-60 Days';
                $agingBuckets['31_60'] += $due;
            } elseif ($overdue <= 90) {
                $inv['bucket'] = '61-90 Days';
                $agingBuckets['61_90'] += $due;
            } else {
                $inv['bucket'] = '90+ Days';
                $agingBuckets['90_plus'] += $due;
            }
            $agingBuckets['total'] += $due;
        }

        return $this->success([
            'as_of_date' => $today,
            'summary'    => $agingBuckets,
            'invoices'   => $invoices,
        ]);
    }

    public function inventoryValuation(Request $request): Response
    {
        $items = Database::fetchAll(
            "SELECT id, item_code, item_name, unit_name, valuation_method,
                    qty_on_hand, qty_reserved, qty_available, average_cost, total_cost
             FROM inventory_items
             WHERE is_active = 1
             ORDER BY item_code ASC"
        );

        $totalValuation = array_sum(array_column($items, 'total_cost'));

        return $this->success([
            'as_of_date'             => date('Y-m-d'),
            'total_inventory_value'  => round($totalValuation, 2),
            'items'                  => $items,
        ]);
    }
}

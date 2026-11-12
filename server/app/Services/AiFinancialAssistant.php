<?php
namespace App\Services;

use Core\Database;

class AiFinancialAssistant
{
    /**
     * Process Natural Language Financial Query (General + UAE FTA & KSA ZATCA)
     */
    public static function answerFinancialQuery(string $query): array
    {
        $q = strtolower(trim($query));
        $now = date('Y-m-d');
        $startOfYear = date('Y-01-01');

        // 1. UAE FTA VAT Return (Form 201)
        if (str_contains($q, 'uae') || str_contains($q, 'vat 201') || str_contains($q, 'fta') || str_contains($q, 'emirate')) {
            $quarterStart = date('Y-m-01', strtotime('-2 months'));
            $vatReturn = TaxEngine::generateUaeVatReturn($quarterStart, $now);
            $summary = "UAE VAT 201 Summary: Total Standard Rated Supplies: AED " .
                $vatReturn['vat_on_sales']['box_1_total']['net'] . " (VAT: AED " .
                $vatReturn['vat_on_sales']['box_1_total']['vat'] . "). Net VAT Payable: AED " .
                $vatReturn['net_vat_summary']['box_12_total_payable_vat'] . ".";

            return [
                'query'       => $query,
                'intent'      => 'UAE_VAT_RETURN_201_ANALYSIS',
                'summary'     => $summary,
                'vat_return'  => $vatReturn,
            ];
        }

        // 2. KSA ZATCA VAT Return / E-Invoicing
        if (str_contains($q, 'ksa') || str_contains($q, 'zatca') || str_contains($q, 'fatoora') || str_contains($q, 'saudi')) {
            $quarterStart = date('Y-m-01', strtotime('-2 months'));
            $vatReturn = TaxEngine::generateKsaVatReturn($quarterStart, $now);
            $summary = "KSA ZATCA VAT Summary: Total Standard Rated 15% Sales: SAR " .
                $vatReturn['sales_vat']['box_1_standard_15']['net'] . " (VAT: SAR " .
                $vatReturn['sales_vat']['total_sales_vat'] . "). Net VAT Due: SAR " .
                $vatReturn['net_vat_due'] . ". Status: " . $vatReturn['status'];

            return [
                'query'       => $query,
                'intent'      => 'KSA_ZATCA_VAT_ANALYSIS',
                'summary'     => $summary,
                'vat_return'  => $vatReturn,
            ];
        }

        // 3. Profit, Net Income or Margins
        if (str_contains($q, 'profit') || str_contains($q, 'income') || str_contains($q, 'margin') || str_contains($q, 'revenue')) {
            $pnl = AccountingEngine::getProfitAndLoss($startOfYear, $now);
            return [
                'query'       => $query,
                'intent'      => 'PROFIT_AND_LOSS_ANALYSIS',
                'summary'     => "Year-to-date total revenue is \${$pnl['total_revenue']} with a gross profit of \${$pnl['gross_profit']} and a net profit of \${$pnl['net_profit']} (Profit Margin: {$pnl['profit_margin']}).",
                'metrics'     => [
                    'total_revenue'   => $pnl['total_revenue'],
                    'cost_of_sales'   => $pnl['total_cost_of_sales'],
                    'gross_profit'    => $pnl['gross_profit'],
                    'total_expenses'  => $pnl['total_expenses'],
                    'net_profit'      => $pnl['net_profit'],
                    'profit_margin'   => $pnl['profit_margin'],
                ],
                'data'        => $pnl,
            ];
        }

        // 4. Overdue, Debtors, Receivables
        if (str_contains($q, 'overdue') || str_contains($q, 'owes') || str_contains($q, 'receivable') || str_contains($q, 'debtor')) {
            $customers = Database::fetchAll(
                "SELECT c.id, c.code, c.name, c.accounts_receivable, c.credit_limit,
                        COUNT(si.id) as overdue_invoices,
                        COALESCE(SUM(si.balance_due), 0) as total_overdue_amount
                 FROM customers c
                 LEFT JOIN sales_invoices si ON si.customer_id = c.id AND si.due_date < :now AND si.status IN ('Sent', 'Partially Paid', 'Overdue')
                 WHERE c.accounts_receivable > 0
                 GROUP BY c.id, c.code, c.name, c.accounts_receivable, c.credit_limit
                 ORDER BY c.accounts_receivable DESC
                 LIMIT 10",
                ['now' => $now]
            );

            $totalAr = array_sum(array_column($customers, 'accounts_receivable'));

            return [
                'query'            => $query,
                'intent'           => 'ACCOUNTS_RECEIVABLE_INSPECTION',
                'summary'          => "There are " . count($customers) . " customers with outstanding balances totaling \${$totalAr}.",
                'top_debtors'      => $customers,
                'total_receivable' => $totalAr,
            ];
        }

        // 5. Stock, Inventory, Reorder
        if (str_contains($q, 'stock') || str_contains($q, 'inventory') || str_contains($q, 'reorder') || str_contains($q, 'items')) {
            $lowStock = Database::fetchAll(
                "SELECT id, item_code, item_name, qty_on_hand, qty_reserved, qty_available, qty_desired, average_cost
                 FROM inventory_items
                 WHERE qty_on_hand <= qty_desired AND is_active = 1
                 ORDER BY qty_on_hand ASC"
            );

            $valuation = Database::fetch(
                "SELECT COALESCE(SUM(total_cost), 0) as total_inventory_valuation, COUNT(id) as total_items
                 FROM inventory_items WHERE is_active = 1"
            );

            return [
                'query'                 => $query,
                'intent'                => 'INVENTORY_HEALTH_ANALYSIS',
                'summary'               => "Total inventory is valued at \${$valuation['total_inventory_valuation']} across {$valuation['total_items']} items. Currently, " . count($lowStock) . " items are below reorder threshold.",
                'total_valuation'       => (float)$valuation['total_inventory_valuation'],
                'items_needing_reorder' => $lowStock,
            ];
        }

        // 6. Cash, Bank or Liquidity
        if (str_contains($q, 'cash') || str_contains($q, 'bank') || str_contains($q, 'liquidity')) {
            $bankAccounts = Database::fetchAll(
                "SELECT id, code, name, current_balance, currency
                 FROM accounts
                 WHERE control_type = 'BANK' AND is_active = 1
                 ORDER BY code ASC"
            );

            $totalLiquidity = array_sum(array_column($bankAccounts, 'current_balance'));

            return [
                'query'           => $query,
                'intent'          => 'LIQUIDITY_ANALYSIS',
                'summary'         => "Total available cash and bank liquidity is \${$totalLiquidity} across " . count($bankAccounts) . " accounts.",
                'total_liquidity' => $totalLiquidity,
                'accounts'        => $bankAccounts,
            ];
        }

        // Default: Balance Sheet Overview
        $bs = AccountingEngine::getBalanceSheet();
        return [
            'query'   => $query,
            'intent'  => 'GENERAL_FINANCIAL_OVERVIEW',
            'summary' => "Current Financial Position: Total Assets = \${$bs['total_assets']}, Total Liabilities = \${$bs['total_liabilities']}, Total Equity = \${$bs['total_equity']}. Accounting Equation Balance: " . ($bs['is_balanced'] ? 'BALANCED' : 'UNBALANCED'),
            'balance_sheet' => $bs,
        ];
    }

    /**
     * Automated Internal Audit Scanner for Financial & Tax Anomalies
     */
    public static function detectAnomalies(): array
    {
        $anomalies = [];

        // 1. Unbalanced Journal Entries
        $unbalancedJournals = Database::fetchAll(
            "SELECT id, entry_number, entry_date, total_debit, total_credit, ABS(total_debit - total_credit) as diff
             FROM journal_entries
             WHERE ABS(total_debit - total_credit) > 0.001 AND status = 'Posted'"
        );
        if (!empty($unbalancedJournals)) {
            $anomalies[] = [
                'type'        => 'CRITICAL_ACCOUNTING_ERROR',
                'severity'    => 'CRITICAL',
                'description' => "Found " . count($unbalancedJournals) . " journal entries where Total Debits do NOT equal Total Credits.",
                'records'     => $unbalancedJournals,
            ];
        }

        // 2. Negative Inventory Quantities
        $negativeStock = Database::fetchAll(
            "SELECT id, item_code, item_name, qty_on_hand
             FROM inventory_items
             WHERE qty_on_hand < 0"
        );
        if (!empty($negativeStock)) {
            $anomalies[] = [
                'type'        => 'INVENTORY_NEGATIVE_STOCK',
                'severity'    => 'HIGH',
                'description' => "Found " . count($negativeStock) . " inventory items with negative stock counts.",
                'records'     => $negativeStock,
            ];
        }

        // 3. Customers with Invalid TRN Format (UAE/KSA must be 15 digits)
        $invalidTrns = Database::fetchAll(
            "SELECT id, code, name, tax_number
             FROM customers
             WHERE tax_number IS NOT NULL AND tax_number != ''
               AND (LENGTH(tax_number) != 15 OR tax_number NOT REGEXP '^[0-9]+$')"
        );
        if (!empty($invalidTrns)) {
            $anomalies[] = [
                'type'        => 'TAX_REGISTRATION_INVALID',
                'severity'    => 'MEDIUM',
                'description' => "Found " . count($invalidTrns) . " customers with invalid TRN format (must be 15 numeric digits for UAE FTA / KSA ZATCA).",
                'records'     => $invalidTrns,
            ];
        }

        // 4. Overdue Invoices Older than 60 days
        $sixtyDaysAgo = date('Y-m-d', strtotime('-60 days'));
        $chronicOverdue = Database::fetchAll(
            "SELECT id, invoice_number, customer_id, issue_date, due_date, total_amount, balance_due
             FROM sales_invoices
             WHERE status IN ('Sent', 'Partially Paid', 'Overdue') AND due_date < :cutoff",
            ['cutoff' => $sixtyDaysAgo]
        );
        if (!empty($chronicOverdue)) {
            $anomalies[] = [
                'type'        => 'CHRONIC_OVERDUE_DEBT',
                'severity'    => 'HIGH',
                'description' => "Found " . count($chronicOverdue) . " sales invoices overdue for more than 60 days.",
                'records'     => $chronicOverdue,
            ];
        }

        return [
            'scan_timestamp'    => date('Y-m-d H:i:s'),
            'anomalies_found'   => count($anomalies),
            'status'            => empty($anomalies) ? 'CLEAN_AUDIT' : 'ANOMALIES_DETECTED',
            'audit_issues'      => $anomalies,
        ];
    }

    /**
     * Executive CFO Financial Health Report
     */
    public static function getFinancialHealthSummary(): array
    {
        $bs = AccountingEngine::getBalanceSheet();
        $startOfYear = date('Y-01-01');
        $now = date('Y-m-d');
        $pnl = AccountingEngine::getProfitAndLoss($startOfYear, $now);

        $totalAssets = (float)$bs['total_assets'];
        $totalLiabilities = (float)$bs['total_liabilities'];
        $totalEquity = (float)$bs['total_equity'];
        $revenue = (float)$pnl['total_revenue'];
        $netProfit = (float)$pnl['net_profit'];

        $currentAssetsRow = Database::fetch(
            "SELECT COALESCE(SUM(current_balance), 0) as total FROM accounts
             WHERE account_type = 'Asset' AND sub_type IN ('Current Assets', 'Cash & Cash Equivalents')"
        );
        $currentLiabilitiesRow = Database::fetch(
            "SELECT COALESCE(SUM(current_balance), 0) as total FROM accounts
             WHERE account_type = 'Liability' AND sub_type = 'Current Liabilities'"
        );

        $currentAssets = (float)$currentAssetsRow['total'];
        $currentLiabilities = (float)$currentLiabilitiesRow['total'];
        $workingCapital = $currentAssets - $currentLiabilities;
        $currentRatio = ($currentLiabilities > 0) ? round($currentAssets / $currentLiabilities, 2) : 0;
        $debtToEquity = ($totalEquity > 0) ? round($totalLiabilities / $totalEquity, 2) : 0;
        $netMargin = ($revenue > 0) ? round(($netProfit / $revenue) * 100, 2) : 0;

        return [
            'executive_summary' => [
                'health_grade'       => ($currentRatio >= 1.5 && $netProfit >= 0) ? 'EXCELLENT' : 'NEEDS_ATTENTION',
                'working_capital'    => $workingCapital,
                'current_ratio'      => $currentRatio,
                'debt_to_equity'     => $debtToEquity,
                'net_profit_margin'  => $netMargin . '%',
            ],
            'key_metrics' => [
                'total_assets'        => $totalAssets,
                'total_liabilities'   => $totalLiabilities,
                'total_equity'        => $totalEquity,
                'ytd_revenue'         => $revenue,
                'ytd_net_income'      => $netProfit,
            ],
            'commentary' => [
                'liquidity' => ($currentRatio >= 1.5)
                    ? "Healthy liquidity ratio of {$currentRatio}. The enterprise possesses sufficient short-term assets to cover immediate obligations."
                    : "Current ratio of {$currentRatio} is below the 1.5 benchmark. Monitor cash flow closely.",
                'profitability' => ($netProfit > 0)
                    ? "Operationally profitable with {$netMargin}% net margin."
                    : "Negative net margin. Review cost of goods sold and operating expenses.",
            ]
        ];
    }
}

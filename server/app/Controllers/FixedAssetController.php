<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;
use App\Services\AccountingEngine;

class FixedAssetController extends Controller
{
    public function index(Request $request): Response
    {
        $assets = Database::fetchAll(
            "SELECT fa.*, aa.name as asset_account_name, ada.name as accum_deprec_name
             FROM fixed_assets fa
             JOIN accounts aa ON aa.id = fa.asset_account_id
             JOIN accounts ada ON ada.id = fa.accum_deprec_account_id
             ORDER BY fa.code ASC"
        );
        return $this->success($assets);
    }

    public function show(Request $request, string $id): Response
    {
        $asset = Database::fetch("SELECT * FROM fixed_assets WHERE id = :id", ['id' => $id]);
        if (!$asset) return $this->notFound('Fixed asset not found');

        $entries = Database::fetchAll(
            "SELECT de.*, je.entry_number
             FROM depreciation_entries de
             LEFT JOIN journal_entries je ON je.id = de.journal_entry_id
             WHERE de.fixed_asset_id = :id
             ORDER BY de.entry_date DESC",
            ['id' => $id]
        );

        $asset['depreciation_history'] = $entries;
        return $this->success($asset);
    }

    public function store(Request $request): Response
    {
        $errors = $this->validate($request, [
            'name'             => 'required',
            'purchase_date'    => 'required|date',
            'acquisition_cost' => 'required|numeric',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $cost = (float)$request->input('acquisition_cost');
        $code = $request->input('code') ?: 'FA-' . strtoupper(bin2hex(random_bytes(3)));

        $assetAccountId = $request->input('asset_account_id') ?: 7;      // 1500 Equipment
        $accumAccountId = $request->input('accum_deprec_account_id') ?: 8; // 1510 Accumulated Depreciation
        $expenseAccountId = $request->input('deprec_expense_account_id') ?: 25; // 6040 Depreciation Expense

        $id = Database::insert('fixed_assets', [
            'code'                      => $code,
            'name'                      => $request->input('name'),
            'asset_type'                => $request->input('asset_type', 'Equipment'),
            'serial_number'             => $request->input('serial_number'),
            'purchase_date'             => $request->input('purchase_date'),
            'service_start_date'        => $request->input('service_start_date') ?: $request->input('purchase_date'),
            'depreciation_method'       => $request->input('depreciation_method', 'Straight Line'),
            'depreciation_rate'         => (float)$request->input('depreciation_rate', 0.20),
            'useful_life_years'         => (int)$request->input('useful_life_years', 5),
            'salvage_value'             => (float)$request->input('salvage_value', 0),
            'acquisition_cost'          => $cost,
            'accumulated_depreciation'  => 0,
            'book_value'                => $cost,
            'asset_account_id'          => $assetAccountId,
            'accum_deprec_account_id'   => $accumAccountId,
            'deprec_expense_account_id' => $expenseAccountId,
            'status'                    => 'Active',
            'notes'                     => $request->input('notes'),
            'created_at'                => date('Y-m-d H:i:s'),
        ]);

        return $this->success(['id' => $id, 'code' => $code], 'Fixed asset registered', 201);
    }

    public function runDepreciation(Request $request, string $id): Response
    {
        $asset = Database::fetch("SELECT * FROM fixed_assets WHERE id = :id", ['id' => $id]);
        if (!$asset) return $this->notFound('Fixed asset not found');

        $cost = (float)$asset['acquisition_cost'];
        $accum = (float)$asset['accumulated_depreciation'];
        $salvage = (float)$asset['salvage_value'];
        $years = (int)$asset['useful_life_years'] ?: 5;
        $deprecDate = $request->input('entry_date', date('Y-m-d'));

        // Monthly straight-line depreciation = (Cost - Salvage) / (Years * 12)
        $monthlyDeprec = ($cost - $salvage) / ($years * 12);
        $amount = (float)$request->input('amount', $monthlyDeprec);

        if ($accum + $amount > ($cost - $salvage)) {
            $amount = max(0.0, ($cost - $salvage) - $accum);
        }

        if ($amount <= 0) {
            return $this->error('Asset is already fully depreciated', 422);
        }

        $userId = $request->user['id'] ?? null;

        // Post Journal Entry: DR Depreciation Expense (6040), CR Accumulated Depreciation (1510)
        $journalId = AccountingEngine::postJournalEntry([
            'entry_number' => 'JE-DEP-' . $asset['code'] . '-' . date('Ymd', strtotime($deprecDate)),
            'entry_date'   => $deprecDate,
            'reference'    => $asset['code'],
            'narration'    => "Depreciation run for {$asset['name']}",
            'source_type'  => 'DEPRECIATION',
            'source_id'    => (int)$id,
        ], [
            [
                'account_id'  => $asset['deprec_expense_account_id'],
                'description' => "Depreciation expense for {$asset['name']}",
                'debit'       => $amount,
                'credit'      => 0,
            ],
            [
                'account_id'  => $asset['accum_deprec_account_id'],
                'description' => "Accumulated depreciation for {$asset['name']}",
                'debit'       => 0,
                'credit'      => $amount,
            ]
        ], $userId);

        $newAccum = $accum + $amount;
        $newBookValue = max(0.0, $cost - $newAccum);

        Database::update('fixed_assets', [
            'accumulated_depreciation' => $newAccum,
            'book_value'               => $newBookValue,
            'status'                   => ($newBookValue <= $salvage) ? 'Fully Depreciated' : 'Active',
        ], 'id = :id', ['id' => $id]);

        $entryRecordId = Database::insert('depreciation_entries', [
            'entry_date'       => $deprecDate,
            'fixed_asset_id'   => (int)$id,
            'amount'           => $amount,
            'journal_entry_id' => $journalId,
            'notes'            => $request->input('notes', 'Periodic depreciation'),
            'created_at'       => date('Y-m-d H:i:s'),
        ]);

        return $this->success([
            'depreciation_entry_id' => $entryRecordId,
            'journal_entry_id'      => $journalId,
            'amount_depreciated'    => $amount,
            'new_book_value'        => $newBookValue,
        ], 'Depreciation posted successfully');
    }
}

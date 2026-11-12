<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;
use App\Services\TaxEngine;

class TaxController extends Controller
{
    public function index(Request $request): Response
    {
        $jurisdiction = $request->query('jurisdiction');
        $where = ["is_active = 1"];
        $params = [];

        if (!empty($jurisdiction)) {
            $where[] = "jurisdiction = :jur";
            $params['jur'] = $jurisdiction;
        }

        $whereClause = implode(" AND ", $where);
        $taxes = Database::fetchAll("SELECT * FROM tax_codes WHERE {$whereClause} ORDER BY rate DESC", $params);

        return $this->success($taxes);
    }

    public function store(Request $request): Response
    {
        $errors = $this->validate($request, [
            'code' => 'required',
            'name' => 'required',
            'rate' => 'required|numeric',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $id = Database::insert('tax_codes', [
            'code'                    => $request->input('code'),
            'name'                    => $request->input('name'),
            'jurisdiction'            => $request->input('jurisdiction', 'UAE'),
            'tax_type'                => $request->input('tax_type', 'Standard'),
            'rate'                    => (float)$request->input('rate'),
            'sales_tax_account_id'    => $request->input('sales_tax_account_id') ?: 14,
            'purchase_tax_account_id' => $request->input('purchase_tax_account_id') ?: 9,
            'rcm_tax_account_id'      => $request->input('rcm_tax_account_id') ?: 15,
            'is_compound'             => $request->input('is_compound', 0) ? 1 : 0,
            'description'             => $request->input('description'),
            'is_active'               => 1,
            'created_at'              => date('Y-m-d H:i:s'),
        ]);

        return $this->success(['id' => $id], 'Tax code created successfully', 201);
    }

    /**
     * Generate UAE Federal Tax Authority (FTA) Form 201 Return
     */
    public function uaeVatReturn(Request $request): Response
    {
        $startDate = $request->query('start_date') ?: date('Y-m-01', strtotime('-2 months'));
        $endDate = $request->query('end_date') ?: date('Y-m-d');

        try {
            $report = TaxEngine::generateUaeVatReturn($startDate, $endDate);
            return $this->success($report);
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Generate KSA ZATCA VAT Return
     */
    public function ksaVatReturn(Request $request): Response
    {
        $startDate = $request->query('start_date') ?: date('Y-m-01', strtotime('-2 months'));
        $endDate = $request->query('end_date') ?: date('Y-m-d');

        try {
            $report = TaxEngine::generateKsaVatReturn($startDate, $endDate);
            return $this->success($report);
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Generate ZATCA Phase 1 & 2 Base64 TLV QR Code
     */
    public function zatcaQr(Request $request): Response
    {
        $errors = $this->validate($request, [
            'seller_name' => 'required',
            'vat_number'  => 'required',
            'total'       => 'required|numeric',
            'vat_total'   => 'required|numeric',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $qrCode = TaxEngine::generateZatcaQrCode(
            $request->input('seller_name'),
            $request->input('vat_number'),
            $request->input('timestamp', date('Y-m-d\TH:i:s\Z')),
            (float)$request->input('total'),
            (float)$request->input('vat_total'),
            $request->input('invoice_hash'),
            $request->input('signature'),
            $request->input('public_key')
        );

        return $this->success(['qr_code_base64' => $qrCode]);
    }
}


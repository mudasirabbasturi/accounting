<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;

class SettingsController extends Controller
{
    public function company(Request $request): Response
    {
        $settings = Database::fetch("SELECT * FROM company_settings LIMIT 1");
        return $this->success($settings);
    }

    public function updateCompany(Request $request): Response
    {
        $data = $request->only([
            'company_name', 'legal_name_ar', 'tax_country', 'tax_registration_number',
            'commercial_registration_no', 'base_currency', 'financial_year_start',
            'default_emirate', 'zatca_environment', 'address', 'phone', 'email', 'website'
        ]);

        $exists = Database::fetch("SELECT id FROM company_settings LIMIT 1");
        if ($exists) {
            Database::update('company_settings', $data, 'id = :id', ['id' => $exists['id']]);
        } else {
            Database::insert('company_settings', $data);
        }

        return $this->success(null, 'Company settings updated successfully');
    }

    public function currencies(Request $request): Response
    {
        $currencies = Database::fetchAll("SELECT * FROM currencies WHERE is_active = 1 ORDER BY is_base DESC, code ASC");
        return $this->success($currencies);
    }

    public function exchangeRates(Request $request): Response
    {
        $rates = Database::fetchAll("SELECT * FROM currency_exchange_rates ORDER BY rate_date DESC LIMIT 50");
        return $this->success($rates);
    }

    public function storeExchangeRate(Request $request): Response
    {
        $errors = $this->validate($request, [
            'currency_code' => 'required',
            'rate_date'     => 'required|date',
            'exchange_rate' => 'required|numeric',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $code = strtoupper($request->input('currency_code'));
        $date = $request->input('rate_date');

        $existing = Database::fetch(
            "SELECT id FROM currency_exchange_rates WHERE currency_code = :code AND rate_date = :date",
            ['code' => $code, 'date' => $date]
        );

        if ($existing) {
            Database::update('currency_exchange_rates', [
                'exchange_rate' => (float)$request->input('exchange_rate'),
                'source'        => $request->input('source', 'Manual Entry'),
            ], 'id = :id', ['id' => $existing['id']]);
        } else {
            Database::insert('currency_exchange_rates', [
                'currency_code' => $code,
                'rate_date'     => $date,
                'exchange_rate' => (float)$request->input('exchange_rate'),
                'source'        => $request->input('source', 'Manual Entry'),
            ]);
        }

        return $this->success(null, 'Exchange rate saved successfully');
    }

    public function uoms(Request $request): Response
    {
        $uoms = Database::fetchAll("SELECT * FROM units_of_measure WHERE is_active = 1 ORDER BY is_base_unit DESC, code ASC");
        return $this->success($uoms);
    }

    public function storeUom(Request $request): Response
    {
        $errors = $this->validate($request, [
            'code'   => 'required',
            'name'   => 'required',
            'symbol' => 'required',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $id = Database::insert('units_of_measure', [
            'code'              => strtoupper($request->input('code')),
            'name'              => $request->input('name'),
            'symbol'            => $request->input('symbol'),
            'is_base_unit'      => $request->input('is_base_unit', 1) ? 1 : 0,
            'base_unit_id'      => $request->input('base_unit_id') ?: null,
            'conversion_factor' => (float)$request->input('conversion_factor', 1.0),
            'is_active'         => 1,
        ]);

        return $this->success(['id' => $id], 'Unit of measure registered', 201);
    }
}


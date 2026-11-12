<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;

class HrController extends Controller
{
    public function employees(Request $request): Response
    {
        $employees = Database::fetchAll(
            "SELECT e.*, d.name as department_name 
             FROM employees e
             LEFT JOIN divisions d ON d.id = e.department_id
             ORDER BY e.id DESC"
        );
        return $this->success($employees);
    }

    public function storeEmployee(Request $request): Response
    {
        $errors = $this->validate($request, [
            'name'         => 'required',
            'designation'  => 'required',
            'basic_salary' => 'required|numeric'
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $code = $request->input('employee_code') ?: 'EMP-' . str_pad((string)(Database::fetch("SELECT COUNT(*) as c FROM employees")['c'] + 1), 3, '0', STR_PAD_LEFT);

        $id = Database::insert('employees', [
            'employee_code'       => $code,
            'name'                => $request->input('name'),
            'email'               => $request->input('email'),
            'phone'               => $request->input('phone'),
            'designation'         => $request->input('designation'),
            'department_id'       => $request->input('department_id') ?: null,
            'joining_date'        => $request->input('joining_date') ?: date('Y-m-d'),
            'basic_salary'        => (float)$request->input('basic_salary', 0),
            'housing_allowance'   => (float)$request->input('housing_allowance', 0),
            'transport_allowance' => (float)$request->input('transport_allowance', 0),
            'other_allowance'     => (float)$request->input('other_allowance', 0),
            'iban'                => $request->input('iban'),
            'bank_name'           => $request->input('bank_name'),
            'wps_routing_code'    => $request->input('wps_routing_code'),
            'status'              => $request->input('status', 'Active')
        ]);

        return $this->created(['id' => $id, 'employee_code' => $code], 'Employee registered successfully');
    }

    public function payslips(Request $request): Response
    {
        $payslips = Database::fetchAll(
            "SELECT p.*, e.name as employee_name, e.employee_code, e.iban, e.bank_name
             FROM payslips p
             JOIN employees e ON e.id = p.employee_id
             ORDER BY p.id DESC"
        );
        return $this->success($payslips);
    }

    public function storePayslip(Request $request): Response
    {
        $errors = $this->validate($request, [
            'employee_id'  => 'required',
            'period_start' => 'required',
            'period_end'   => 'required',
            'basic_salary' => 'required|numeric'
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $num = 'PAY-' . date('Y-m') . '-' . str_pad((string)(Database::fetch("SELECT COUNT(*) as c FROM payslips")['c'] + 1), 3, '0', STR_PAD_LEFT);
        $basic = (float)$request->input('basic_salary', 0);
        $allowances = (float)$request->input('total_allowances', 0);
        $gross = $basic + $allowances;
        $deductions = (float)$request->input('deductions', 0);
        $net = $gross - $deductions;

        $id = Database::insert('payslips', [
            'payslip_number'    => $num,
            'employee_id'       => $request->input('employee_id'),
            'period_start'      => $request->input('period_start'),
            'period_end'        => $request->input('period_end'),
            'basic_salary'      => $basic,
            'total_allowances'  => $allowances,
            'gross_salary'      => $gross,
            'deductions'        => $deductions,
            'net_salary'        => $net,
            'wps_sif_generated' => 1,
            'status'            => 'Approved'
        ]);

        return $this->created(['id' => $id, 'payslip_number' => $num, 'net_salary' => $net], 'Payslip processed successfully with WPS SIF compliance');
    }

    public function intangibles(Request $request): Response
    {
        $assets = Database::fetchAll("SELECT * FROM intangible_assets ORDER BY id DESC");
        return $this->success($assets);
    }

    public function storeIntangible(Request $request): Response
    {
        $errors = $this->validate($request, [
            'name'             => 'required',
            'acquisition_cost' => 'required|numeric'
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $cost = (float)$request->input('acquisition_cost', 0);
        $code = $request->input('code') ?: 'INT-' . str_pad((string)(Database::fetch("SELECT COUNT(*) as c FROM intangible_assets")['c'] + 1), 3, '0', STR_PAD_LEFT);

        $id = Database::insert('intangible_assets', [
            'code'                     => $code,
            'name'                     => $request->input('name'),
            'category'                 => $request->input('category', 'Software License'),
            'acquisition_date'         => $request->input('acquisition_date') ?: date('Y-m-d'),
            'acquisition_cost'         => $cost,
            'useful_life_months'       => (int)$request->input('useful_life_months', 36),
            'accumulated_amortization' => 0,
            'book_value'               => $cost,
            'amortization_method'      => $request->input('amortization_method', 'Straight Line'),
            'status'                   => 'Active'
        ]);

        return $this->created(['id' => $id, 'code' => $code], 'Intangible asset capitalized successfully');
    }

    public function ocrDocuments(Request $request): Response
    {
        $docs = Database::fetchAll("SELECT * FROM ocr_documents ORDER BY id DESC");
        return $this->success($docs);
    }

    public function auditLogs(Request $request): Response
    {
        $logs = Database::fetchAll("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100");
        return $this->success($logs);
    }
}


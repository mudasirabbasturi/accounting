<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $where = ["is_active = 1"];
        $params = [];

        if (!empty($search)) {
            $where[] = "(code LIKE :s OR name LIKE :s OR email LIKE :s OR phone LIKE :s)";
            $params['s'] = "%{$search}%";
        }

        $whereClause = implode(" AND ", $where);
        $suppliers = Database::fetchAll("SELECT * FROM suppliers WHERE {$whereClause} ORDER BY name ASC", $params);

        return $this->success($suppliers);
    }

    public function show(Request $request, string $id): Response
    {
        $supplier = Database::fetch("SELECT * FROM suppliers WHERE id = :id", ['id' => $id]);
        if (!$supplier) return $this->notFound('Supplier not found');

        $addresses = Database::fetchAll("SELECT * FROM supplier_addresses WHERE supplier_id = :id", ['id' => $id]);
        $supplier['addresses'] = $addresses;

        // Recent Invoices
        $invoices = Database::fetchAll(
            "SELECT id, invoice_number, issue_date, due_date, total_amount, balance_due, status
             FROM purchase_invoices WHERE supplier_id = :id ORDER BY issue_date DESC LIMIT 20",
            ['id' => $id]
        );
        $supplier['invoices'] = $invoices;

        return $this->success($supplier);
    }

    public function store(Request $request): Response
    {
        $errors = $this->validate($request, [
            'name' => 'required',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $code = $request->input('code') ?: 'SUPP-' . strtoupper(bin2hex(random_bytes(3)));

        $id = Database::insert('suppliers', [
            'code'          => $code,
            'name'          => $request->input('name'),
            'email'         => $request->input('email'),
            'phone'         => $request->input('phone'),
            'mobile'        => $request->input('mobile'),
            'website'       => $request->input('website'),
            'tax_number'    => $request->input('tax_number'),
            'credit_limit'  => (float)$request->input('credit_limit', 0),
            'payment_terms' => $request->input('payment_terms', 'Net 30'),
            'currency'      => $request->input('currency', 'USD'),
            'notes'         => $request->input('notes'),
            'created_at'    => date('Y-m-d H:i:s'),
        ]);

        if ($request->has('address')) {
            $addr = $request->input('address');
            Database::insert('supplier_addresses', [
                'supplier_id' => $id,
                'address1'    => $addr['address1'] ?? '',
                'address2'    => $addr['address2'] ?? '',
                'city'        => $addr['city'] ?? '',
                'state'       => $addr['state'] ?? '',
                'postal_code' => $addr['postal_code'] ?? '',
                'country'     => $addr['country'] ?? '',
            ]);
        }

        return $this->success(['id' => $id, 'code' => $code], 'Supplier created successfully', 201);
    }

    public function update(Request $request, string $id): Response
    {
        $supplier = Database::fetch("SELECT id FROM suppliers WHERE id = :id", ['id' => $id]);
        if (!$supplier) return $this->notFound('Supplier not found');

        $data = $request->only(['name', 'email', 'phone', 'mobile', 'website', 'tax_number', 'credit_limit', 'payment_terms', 'currency', 'notes', 'is_active']);
        if (!empty($data)) {
            Database::update('suppliers', $data, 'id = :id', ['id' => $id]);
        }

        return $this->success(null, 'Supplier updated successfully');
    }

    public function statement(Request $request, string $id): Response
    {
        $supplier = Database::fetch("SELECT * FROM suppliers WHERE id = :id", ['id' => $id]);
        if (!$supplier) return $this->notFound('Supplier not found');

        $invoices = Database::fetchAll(
            "SELECT id, invoice_number, issue_date, due_date, total_amount, balance_due, status
             FROM purchase_invoices WHERE supplier_id = :id AND status != 'Void' ORDER BY issue_date ASC",
            ['id' => $id]
        );

        $payments = Database::fetchAll(
            "SELECT id, payment_number, payment_date, total_amount
             FROM payments WHERE payee_id = :id ORDER BY payment_date ASC",
            ['id' => $id]
        );

        return $this->success([
            'supplier'      => $supplier,
            'total_payable' => (float)$supplier['accounts_payable'],
            'invoices'      => $invoices,
            'payments'      => $payments,
        ]);
    }
}

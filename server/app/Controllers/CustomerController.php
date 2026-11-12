<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;

class CustomerController extends Controller
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
        $customers = Database::fetchAll("SELECT * FROM customers WHERE {$whereClause} ORDER BY name ASC", $params);

        return $this->success($customers);
    }

    public function show(Request $request, string $id): Response
    {
        $customer = Database::fetch("SELECT * FROM customers WHERE id = :id", ['id' => $id]);
        if (!$customer) return $this->notFound('Customer not found');

        $addresses = Database::fetchAll("SELECT * FROM customer_addresses WHERE customer_id = :id", ['id' => $id]);
        $customer['addresses'] = $addresses;

        // Recent Invoices
        $invoices = Database::fetchAll(
            "SELECT id, invoice_number, issue_date, due_date, total_amount, balance_due, status
             FROM sales_invoices WHERE customer_id = :id ORDER BY issue_date DESC LIMIT 20",
            ['id' => $id]
        );
        $customer['invoices'] = $invoices;

        return $this->success($customer);
    }

    public function store(Request $request): Response
    {
        $errors = $this->validate($request, [
            'name' => 'required',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $code = $request->input('code') ?: 'CUST-' . strtoupper(bin2hex(random_bytes(3)));

        $id = Database::insert('customers', [
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

        // Optional address
        if ($request->has('address')) {
            $addr = $request->input('address');
            Database::insert('customer_addresses', [
                'customer_id' => $id,
                'type'        => 'billing',
                'address1'    => $addr['address1'] ?? '',
                'address2'    => $addr['address2'] ?? '',
                'city'        => $addr['city'] ?? '',
                'state'       => $addr['state'] ?? '',
                'postal_code' => $addr['postal_code'] ?? '',
                'country'     => $addr['country'] ?? '',
            ]);
        }

        return $this->success(['id' => $id, 'code' => $code], 'Customer created successfully', 201);
    }

    public function update(Request $request, string $id): Response
    {
        $customer = Database::fetch("SELECT id FROM customers WHERE id = :id", ['id' => $id]);
        if (!$customer) return $this->notFound('Customer not found');

        $data = $request->only(['name', 'email', 'phone', 'mobile', 'website', 'tax_number', 'credit_limit', 'payment_terms', 'currency', 'notes', 'is_active']);
        if (!empty($data)) {
            Database::update('customers', $data, 'id = :id', ['id' => $id]);
        }

        return $this->success(null, 'Customer updated successfully');
    }

    public function statement(Request $request, string $id): Response
    {
        $customer = Database::fetch("SELECT * FROM customers WHERE id = :id", ['id' => $id]);
        if (!$customer) return $this->notFound('Customer not found');

        $invoices = Database::fetchAll(
            "SELECT id, invoice_number, issue_date, due_date, total_amount, balance_due, status
             FROM sales_invoices WHERE customer_id = :id AND status != 'Void' ORDER BY issue_date ASC",
            ['id' => $id]
        );

        $receipts = Database::fetchAll(
            "SELECT id, receipt_number, receipt_date, total_amount
             FROM receipts WHERE payer_id = :id ORDER BY receipt_date ASC",
            ['id' => $id]
        );

        return $this->success([
            'customer'          => $customer,
            'total_receivable'  => (float)$customer['accounts_receivable'],
            'invoices'          => $invoices,
            'receipts'          => $receipts,
        ]);
    }
}

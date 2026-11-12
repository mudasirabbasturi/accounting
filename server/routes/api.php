<?php
/**
 * API Routes Definition
 */

use Core\App;
use Core\Request;
use Core\Response;
use App\Middleware\AuthMiddleware;
use App\Middleware\RbacMiddleware;

$router = App::getInstance()->getRouter();

// Root Welcome / Healthcheck
$router->get('/', function (Request $req) {
    return Response::success([
        'system'      => 'Enterprise Double-Entry Accounting & Inventory API',
        'status'      => 'healthy',
        'version'     => '2.0.0',
        'architecture'=> 'Manager.io / QuickBooks / Peachtree Aligned',
        'tax_modules' => ['UAE Federal Tax Authority (Form 201)', 'KSA ZATCA Fatoora (Phase 1 & 2)'],
        'timestamp'   => date('Y-m-d H:i:s'),
    ], 'Enterprise Accounting Server is running');
});

// Authentication Routes (Public)
$router->post('/api/auth/login', 'AuthController@login');

// Authenticated Routes Group
$router->group('/api', function ($router) {

    // Current User Profile & Users
    $router->get('/auth/profile', 'AuthController@profile');
    $router->post('/auth/logout', 'AuthController@logout');
    $router->get('/users', 'AuthController@users');
    $router->get('/roles', 'AuthController@roles');

    // Company Settings, Multi-Currency & UOM
    $router->get('/settings/company', 'SettingsController@company');
    $router->post('/settings/company', 'SettingsController@updateCompany');
    $router->get('/settings/currencies', 'SettingsController@currencies');
    $router->get('/settings/exchange-rates', 'SettingsController@exchangeRates');
    $router->post('/settings/exchange-rates', 'SettingsController@storeExchangeRate');
    $router->get('/settings/uoms', 'SettingsController@uoms');
    $router->post('/settings/uoms', 'SettingsController@storeUom');

    // Chart of Accounts
    $router->get('/accounts', 'AccountController@index');
    $router->get('/accounts/control', 'AccountController@controlAccounts');
    $router->get('/accounts/{id}', 'AccountController@show');
    $router->post('/accounts', 'AccountController@store');
    $router->put('/accounts/{id}', 'AccountController@update');
    $router->delete('/accounts/{id}', 'AccountController@destroy');

    // General Ledger & Journal Entries
    $router->get('/journals', 'JournalController@index');
    $router->get('/journals/{id}', 'JournalController@show');
    $router->post('/journals', 'JournalController@store');

    // Customers & Receivables
    $router->get('/customers', 'CustomerController@index');
    $router->get('/customers/{id}', 'CustomerController@show');
    $router->get('/customers/{id}/statement', 'CustomerController@statement');
    $router->post('/customers', 'CustomerController@store');
    $router->put('/customers/{id}', 'CustomerController@update');

    // Suppliers & Payables
    $router->get('/suppliers', 'SupplierController@index');
    $router->get('/suppliers/{id}', 'SupplierController@show');
    $router->get('/suppliers/{id}/statement', 'SupplierController@statement');
    $router->post('/suppliers', 'SupplierController@store');
    $router->put('/suppliers/{id}', 'SupplierController@update');

    // Advanced Inventory Management
    $router->get('/inventory/items', 'InventoryController@index');
    $router->get('/inventory/items/{id}', 'InventoryController@show');
    $router->post('/inventory/items', 'InventoryController@store');
    $router->put('/inventory/items/{id}', 'InventoryController@update');

    $router->get('/inventory/locations', 'InventoryController@locations');
    $router->post('/inventory/locations', 'InventoryController@storeLocation');

    $router->get('/inventory/transfers', 'InventoryController@transfers');
    $router->post('/inventory/transfers', 'InventoryController@storeTransfer');

    $router->get('/inventory/write-offs', 'InventoryController@writeOffs');
    $router->post('/inventory/write-offs', 'InventoryController@storeWriteOff');

    $router->get('/inventory/production-orders', 'InventoryController@productionOrders');
    $router->post('/inventory/production-orders', 'InventoryController@storeProductionOrder');

    // Sales Cycle (Quotes -> Orders -> Delivery Notes -> Invoices -> Credit Notes -> Allocations)
    $router->get('/sales/quotes', 'SalesController@quotes');
    $router->get('/sales/quotes/{id}', 'SalesController@showQuote');
    $router->post('/sales/quotes', 'SalesController@storeQuote');

    $router->get('/sales/orders', 'SalesController@orders');
    $router->get('/sales/orders/{id}', 'SalesController@showOrder');
    $router->post('/sales/orders', 'SalesController@storeOrder');

    $router->get('/sales/delivery-notes', 'SalesController@deliveryNotes');
    $router->post('/sales/delivery-notes', 'SalesController@storeDeliveryNote');

    $router->get('/sales/invoices', 'SalesController@indexInvoices');
    $router->get('/sales/invoices/{id}', 'SalesController@showInvoice');
    $router->post('/sales/invoices', 'SalesController@storeInvoice');

    $router->get('/sales/credit-notes', 'SalesController@creditNotes');
    $router->post('/sales/credit-notes', 'SalesController@storeCreditNote');
    $router->post('/sales/credit-notes/{id}/allocate', 'SalesController@allocateCredit');

    // Procurement Cycle (Quotes -> Orders -> Goods Receipts -> Invoices)
    $router->get('/purchases/quotes', 'PurchaseController@quotes');
    $router->post('/purchases/quotes', 'PurchaseController@storeQuote');

    $router->get('/purchases/orders', 'PurchaseController@orders');
    $router->post('/purchases/orders', 'PurchaseController@storeOrder');

    $router->get('/purchases/goods-receipts', 'PurchaseController@goodsReceipts');
    $router->post('/purchases/goods-receipts', 'PurchaseController@storeGoodsReceipt');

    $router->get('/purchases/invoices', 'PurchaseController@indexInvoices');
    $router->get('/purchases/invoices/{id}', 'PurchaseController@showInvoice');
    $router->post('/purchases/invoices', 'PurchaseController@storeInvoice');

    // Banking & Cash Operations
    $router->get('/banking/payments', 'PaymentController@index');
    $router->get('/banking/payments/{id}', 'PaymentController@show');
    $router->post('/banking/payments', 'PaymentController@store');

    $router->get('/banking/receipts', 'ReceiptController@index');
    $router->get('/banking/receipts/{id}', 'ReceiptController@show');
    $router->post('/banking/receipts', 'ReceiptController@store');

    $router->get('/banking/transfers', 'ReceiptController@transfers');
    $router->post('/banking/transfers', 'ReceiptController@storeTransfer');

    $router->get('/banking/reconciliations', 'BankReconciliationController@index');
    $router->get('/banking/reconciliations/{id}', 'BankReconciliationController@show');
    $router->post('/banking/reconciliations', 'BankReconciliationController@store');

    // Fixed Assets & Depreciation
    $router->get('/assets', 'FixedAssetController@index');
    $router->get('/assets/{id}', 'FixedAssetController@show');
    $router->post('/assets', 'FixedAssetController@store');
    $router->post('/assets/{id}/depreciate', 'FixedAssetController@runDepreciation');
    $router->get('/assets/intangible', 'HrController@intangibles');
    $router->post('/assets/intangible', 'HrController@storeIntangible');

    // HR & Payroll
    $router->get('/hr/employees', 'HrController@employees');
    $router->post('/hr/employees', 'HrController@storeEmployee');
    $router->get('/hr/payslips', 'HrController@payslips');
    $router->post('/hr/payslips', 'HrController@storePayslip');

    // AI & Document Processing
    $router->get('/ai/ocr-documents', 'HrController@ocrDocuments');

    // Audit Trail
    $router->get('/settings/audit-trail', 'HrController@auditLogs');

    // Taxation & Country Returns (UAE FTA Form 201 & KSA ZATCA)
    $router->get('/tax/codes', 'TaxController@index');
    $router->post('/tax/codes', 'TaxController@store');
    $router->get('/tax/uae-vat-return', 'TaxController@uaeVatReturn');
    $router->get('/tax/ksa-vat-return', 'TaxController@ksaVatReturn');
    $router->post('/tax/zatca-qr', 'TaxController@zatcaQr');

    // Projects & Divisions
    $router->get('/projects', 'ProjectController@index');
    $router->get('/projects/{id}', 'ProjectController@show');
    $router->post('/projects', 'ProjectController@store');
    $router->get('/divisions', 'ProjectController@divisions');
    $router->post('/divisions', 'ProjectController@storeDivision');

    // Financial Reports
    $router->get('/reports/trial-balance', 'ReportController@trialBalance');
    $router->get('/reports/profit-and-loss', 'ReportController@profitAndLoss');
    $router->get('/reports/balance-sheet', 'ReportController@balanceSheet');
    $router->get('/reports/general-ledger', 'ReportController@generalLedger');
    $router->get('/reports/aged-receivables', 'ReportController@agedReceivables');
    $router->get('/reports/aged-payables', 'ReportController@agedPayables');
    $router->get('/reports/inventory-valuation', 'ReportController@inventoryValuation');

    // AI Financial Assistant Endpoints
    $router->post('/ai/query', 'AiController@query');
    $router->get('/ai/anomalies', 'AiController@anomalies');
    $router->get('/ai/health', 'AiController@health');
    $router->post('/ai/explain', 'AiController@explain');

}, [AuthMiddleware::class]);

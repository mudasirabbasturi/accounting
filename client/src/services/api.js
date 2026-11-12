// API Service Layer for Accounting & ERP System
const BASE_URL = '/api';

export const getAuthToken = () => {
    return localStorage.getItem('token') || '';
};

export const setAuthSession = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuthSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getCurrentUser = () => {
    try {
        const u = localStorage.getItem('user');
        return u ? JSON.parse(u) : { username: 'Admin', role: 'admin', display_name: 'Administrator' };
    } catch {
        return { username: 'Admin', role: 'admin', display_name: 'Administrator' };
    }
};

async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const errorMsg = data?.error || data?.message || `HTTP error ${response.status}`;
            throw new Error(errorMsg);
        }

        return data;
    } catch (err) {
        console.error(`[API Error] ${endpoint}:`, err);
        throw err;
    }
}

export const api = {
    // Auth
    login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),

    // Dashboard & Metrics
    getDashboardStats: () => apiRequest('/reports/dashboard-stats'),

    // Customers
    getCustomers: () => apiRequest('/customers'),
    createCustomer: (data) => apiRequest('/customers', { method: 'POST', body: JSON.stringify(data) }),
    getCustomer: (id) => apiRequest(`/customers/${id}`),

    // Suppliers
    getSuppliers: () => apiRequest('/suppliers'),
    createSupplier: (data) => apiRequest('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    getSupplier: (id) => apiRequest(`/suppliers/${id}`),

    // Sales Invoices
    getSalesInvoices: () => apiRequest('/sales-invoices'),
    createSalesInvoice: (data) => apiRequest('/sales-invoices', { method: 'POST', body: JSON.stringify(data) }),
    getSalesInvoice: (id) => apiRequest(`/sales-invoices/${id}`),
    paySalesInvoice: (id, payment) => apiRequest(`/sales-invoices/${id}/pay`, { method: 'POST', body: JSON.stringify(payment) }),

    // Purchase Invoices
    getPurchaseInvoices: () => apiRequest('/purchase-invoices'),
    createPurchaseInvoice: (data) => apiRequest('/purchase-invoices', { method: 'POST', body: JSON.stringify(data) }),
    getPurchaseInvoice: (id) => apiRequest(`/purchase-invoices/${id}`),

    // Receipts & Payments
    getReceipts: () => apiRequest('/receipts'),
    createReceipt: (data) => apiRequest('/receipts', { method: 'POST', body: JSON.stringify(data) }),
    getPayments: () => apiRequest('/payments'),
    createPayment: (data) => apiRequest('/payments', { method: 'POST', body: JSON.stringify(data) }),

    // Inventory
    getInventoryItems: () => apiRequest('/inventory/items'),
    createInventoryItem: (data) => apiRequest('/inventory/items', { method: 'POST', body: JSON.stringify(data) }),
    getInventoryValuation: () => apiRequest('/inventory/valuation'),
    getInventoryTransfers: () => apiRequest('/inventory/transfers'),
    createInventoryTransfer: (data) => apiRequest('/inventory/transfers', { method: 'POST', body: JSON.stringify(data) }),
    getInventoryLocations: () => apiRequest('/inventory/locations'),

    // Banking & Cash
    getBankAccounts: () => apiRequest('/bank-accounts'),
    createBankAccount: (data) => apiRequest('/bank-accounts', { method: 'POST', body: JSON.stringify(data) }),
    getCashAccounts: () => apiRequest('/cash-accounts'),
    createCashAccount: (data) => apiRequest('/cash-accounts', { method: 'POST', body: JSON.stringify(data) }),
    getTransfers: () => apiRequest('/bank-transfers'),
    createTransfer: (data) => apiRequest('/bank-transfers', { method: 'POST', body: JSON.stringify(data) }),

    // Accounting & General Ledger
    getAccounts: () => apiRequest('/accounts'),
    createAccount: (data) => apiRequest('/accounts', { method: 'POST', body: JSON.stringify(data) }),
    getJournalEntries: () => apiRequest('/journal-entries'),
    createJournalEntry: (data) => apiRequest('/journal-entries', { method: 'POST', body: JSON.stringify(data) }),

    // Tax & Compliance
    getTaxCodes: () => apiRequest('/tax/codes'),
    getUaeVatReturn: (params) => apiRequest(`/tax/uae-vat-return?${new URLSearchParams(params).toString()}`),
    getKsaVatReturn: (params) => apiRequest(`/tax/ksa-vat-return?${new URLSearchParams(params).toString()}`),

    // Reports
    getTrialBalance: (date) => apiRequest(`/reports/trial-balance${date ? `?date=${date}` : ''}`),
    getProfitAndLoss: (params) => apiRequest(`/reports/profit-and-loss?${new URLSearchParams(params).toString()}`),
    getBalanceSheet: (date) => apiRequest(`/reports/balance-sheet${date ? `?date=${date}` : ''}`),
    getGeneralLedger: (params) => apiRequest(`/reports/general-ledger?${new URLSearchParams(params).toString()}`),

    // Assets & Depreciation
    getFixedAssets: () => apiRequest('/assets'),
    createFixedAsset: (data) => apiRequest('/assets', { method: 'POST', body: JSON.stringify(data) }),
    getDepreciationHistory: (id) => apiRequest(`/assets/${id}`),
    runDepreciation: (id, data) => apiRequest(`/assets/${id}/depreciate`, { method: 'POST', body: JSON.stringify(data) }),
    getIntangibleAssets: () => apiRequest('/assets/intangible'),
    createIntangibleAsset: (data) => apiRequest('/assets/intangible', { method: 'POST', body: JSON.stringify(data) }),

    // HR & Payroll
    getEmployees: () => apiRequest('/hr/employees'),
    createEmployee: (data) => apiRequest('/hr/employees', { method: 'POST', body: JSON.stringify(data) }),
    getPayslips: () => apiRequest('/hr/payslips'),
    createPayslip: (data) => apiRequest('/hr/payslips', { method: 'POST', body: JSON.stringify(data) }),

    // Settings & Logs
    getCompanySettings: () => apiRequest('/settings/company'),
    updateCompanySettings: (data) => apiRequest('/settings/company', { method: 'POST', body: JSON.stringify(data) }),
    getAuditTrail: () => apiRequest('/settings/audit-trail'),
    getUsers: () => apiRequest('/users'),
    getRoles: () => apiRequest('/roles'),

    // AI & Document Processing
    getOcrDocuments: () => apiRequest('/ai/ocr-documents'),
    queryAi: (prompt) => apiRequest('/ai/query', { method: 'POST', body: JSON.stringify({ prompt }) })
};

export default api;


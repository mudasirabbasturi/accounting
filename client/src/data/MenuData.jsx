import React from 'react';
import {
    LuLayoutDashboard,
    LuLandmark,
    LuReceipt,
    LuCreditCard,
    LuBoxes,
    LuCalculator,
    LuShieldCheck,
    LuChartBar,
    LuBriefcase,
    LuUsers,
    LuFileSpreadsheet,
    LuSparkles,
    LuSettings
} from 'react-icons/lu';

export const menuItems = [
    {
        title: "Dashboard",
        icon: <LuLayoutDashboard strokeWidth={1.5} />,
        path: "/"
    },
    {
        title: "Banking",
        icon: <LuLandmark strokeWidth={1.5} />,
        submenu: [
            {
                label: "Accounts",
                path: "/banking/accounts",
                submenu: [
                    { label: "Bank Accounts", path: "/banking/accounts/bank" },
                    { label: "Cash Accounts", path: "/banking/accounts/cash" }
                ]
            },
            { label: "Inter-Account Transfers", path: "/banking/transfers" },
            {
                label: "Reconciliations",
                path: "/banking/reconciliations",
                submenu: [
                    { label: "Pending Reconciliations", path: "/banking/reconciliations/pending" },
                    { label: "Completed Reconciliations", path: "/banking/reconciliations/completed" }
                ]
            }
        ]
    },
    {
        title: "Receivables",
        icon: <LuReceipt strokeWidth={1.5} />,
        submenu: [
            { label: "Sales Invoices", path: "/receivables/sales/invoices" },
            { label: "Customers", path: "/receivables/customers" },
            { label: "Customer Receipts", path: "/receivables/receipts" },
            { label: "Sales Quotes", path: "/receivables/sales/quotes" },
            { label: "Sales Orders", path: "/receivables/sales/orders" },
            { label: "Credit Notes", path: "/receivables/credit-notes" },
            { label: "Delivery Notes", path: "/receivables/delivery-notes" }
        ]
    },
    {
        title: "Payables",
        icon: <LuCreditCard strokeWidth={1.5} />,
        submenu: [
            { label: "Purchase Invoices", path: "/payables/invoices" },
            { label: "Suppliers", path: "/payables/suppliers" },
            { label: "Supplier Payments", path: "/payables/payments" },
            { label: "Purchase Quotes", path: "/payables/quotes" },
            { label: "Purchase Orders", path: "/payables/orders" },
            { label: "Debit Notes", path: "/payables/debit-notes" },
            { label: "Goods Receipts", path: "/payables/goods-receipts" }
        ]
    },
    {
        title: "Inventory",
        label: "Inventory & Production",
        icon: <LuBoxes strokeWidth={1.5} />,
        submenu: [
            { label: "Inventory Items", path: "/inventory/items" },
            { label: "Inventory Transfers", path: "/inventory/transfers" },
            { label: "Inventory Write-Offs", path: "/inventory/write-offs" },
            { label: "Production Orders", path: "/inventory/production-orders" },
            { label: "Locations & Warehouses", path: "/inventory/locations" }
        ]
    },
    {
        title: "Accounting",
        icon: <LuCalculator strokeWidth={1.5} />,
        submenu: [
            { label: "Chart of Accounts", path: "/accounting/chart-of-accounts" },
            { label: "Journal Entries", path: "/accounting/journal-entries" },
            { label: "Capital Accounts", path: "/accounting/capital" },
            { label: "Special Accounts", path: "/accounting/special" }
        ]
    },
    {
        title: "Tax & Compliance",
        icon: <LuShieldCheck strokeWidth={1.5} />,
        submenu: [
            { label: "UAE VAT Return (Form 201)", path: "/tax/uae-vat-return" },
            { label: "KSA VAT Return (ZATCA)", path: "/tax/ksa-vat-return" },
            { label: "Tax Codes & Rates", path: "/tax/tax-codes" }
        ]
    },
    {
        title: "Reports",
        icon: <LuChartBar strokeWidth={1.5} />,
        submenu: [
            { label: "Financial Reports", path: "/reports" },
            { label: "Trial Balance", path: "/reports/trial-balance" },
            { label: "Profit & Loss", path: "/reports/profit-and-loss" },
            { label: "Balance Sheet", path: "/reports/balance-sheet" },
            { label: "General Ledger", path: "/reports/general-ledger" },
            { label: "Aged Receivables", path: "/reports/aged-receivables" },
            { label: "Aged Payables", path: "/reports/aged-payables" },
            { label: "Inventory Summary", path: "/reports/inventory-summary" }
        ]
    },
    {
        title: "Projects",
        label: "Projects & Cost Centers",
        icon: <LuBriefcase strokeWidth={1.5} />,
        submenu: [
            { label: "Projects", path: "/projects/list" },
            { label: "Divisions / Cost Centers", path: "/projects/divisions" },
            { label: "Expense Claims", path: "/projects/expenses" }
        ]
    },
    {
        title: "HR",
        label: "HR & Payroll",
        icon: <LuUsers strokeWidth={1.5} />,
        submenu: [
            { label: "Employees", path: "/hr/employees" },
            { label: "Payslips", path: "/hr/payslips" }
        ]
    },
    {
        title: "Assets",
        label: "Fixed & Intangible Assets",
        icon: <LuFileSpreadsheet strokeWidth={1.5} />,
        submenu: [
            { label: "Fixed Assets", path: "/assets/fixed-assets" },
            { label: "Depreciation Entries", path: "/assets/depreciation" },
            { label: "Intangible Assets", path: "/assets/intangible-assets" }
        ]
    },
    {
        title: "AI & Tools",
        icon: <LuSparkles strokeWidth={1.5} />,
        submenu: [
            { label: "AI Financial Assistant", path: "/ai/assistant" },
            { label: "Automated OCR & Scanning", path: "/ai/ocr-inbox" }
        ]
    },
    {
        title: "Settings",
        icon: <LuSettings strokeWidth={1.5} />,
        submenu: [
            { label: "System Users & Roles", path: "/settings/users" },
            { label: "Company Information", path: "/settings/company" },
            { label: "Audit Trail & Logs", path: "/settings/audit-trail" }
        ]
    }
];

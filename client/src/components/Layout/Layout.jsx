import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';
import { BiHome, BiChevronRight } from 'react-icons/bi';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import styles from './Layout.module.css';
import contentStyles from './Content.module.css';

// Page Imports
// Dashboard
import Dashboard from '../../pages/Dashboard/Dashboard';

// Banking
import BankAccounts from '../../pages/Banking/BankAccounts';
import CashAccounts from '../../pages/Banking/CashAccounts';
import Transfers from '../../pages/Banking/Transfers';
import PendingReconciliations from '../../pages/Banking/PendingReconciliations';
import CompletedReconciliations from '../../pages/Banking/CompletedReconciliations';

// Receivables
import SalesInvoices from '../../pages/Receivables/SalesInvoices';
import Customers from '../../pages/Receivables/Customers';
import Receipts from '../../pages/Receivables/Receipts';
import SalesQuotes from '../../pages/Receivables/SalesQuotes';
import SalesOrders from '../../pages/Receivables/SalesOrders';
import CreditNotes from '../../pages/Receivables/CreditNotes';
import DeliveryNotes from '../../pages/Receivables/DeliveryNotes';

// Payables
import PurchaseInvoices from '../../pages/Payables/PurchaseInvoices';
import Suppliers from '../../pages/Payables/Suppliers';
import Payments from '../../pages/Payables/Payments';
import PurchaseQuotes from '../../pages/Payables/PurchaseQuotes';
import PurchaseOrders from '../../pages/Payables/PurchaseOrders';
import DebitNotes from '../../pages/Payables/DebitNotes';
import GoodsReceipts from '../../pages/Payables/GoodsReceipts';

// Inventory
import InventoryItems from '../../pages/Inventory/InventoryItems';
import InventoryTransfers from '../../pages/Inventory/InventoryTransfers';
import InventoryWriteOffs from '../../pages/Inventory/InventoryWriteOffs';
import ProductionOrders from '../../pages/Inventory/ProductionOrders';
import InventoryLocations from '../../pages/Inventory/InventoryLocations';

// Accounting
import ChartOfAccounts from '../../pages/Accounting/ChartOfAccounts';
import JournalEntries from '../../pages/Accounting/JournalEntries';
import CapitalAccounts from '../../pages/Accounting/CapitalAccounts';
import SpecialAccounts from '../../pages/Accounting/SpecialAccounts';

// Tax & Compliance
import UaeVatReturn from '../../pages/Tax/UaeVatReturn';
import KsaVatReturn from '../../pages/Tax/KsaVatReturn';
import TaxCodes from '../../pages/Tax/TaxCodes';

// Reports
import ReportsHub from '../../pages/Reports/ReportsHub';
import TrialBalance from '../../pages/Reports/TrialBalance';
import ProfitAndLoss from '../../pages/Reports/ProfitAndLoss';
import BalanceSheet from '../../pages/Reports/BalanceSheet';
import GeneralLedgerReport from '../../pages/Reports/GeneralLedgerReport';
import AgedReceivablesReport from '../../pages/Reports/AgedReceivablesReport';
import AgedPayablesReport from '../../pages/Reports/AgedPayablesReport';
import InventorySummaryReport from '../../pages/Reports/InventorySummaryReport';

// Projects & Cost Centers
import ProjectsList from '../../pages/Projects/ProjectsList';
import DivisionsList from '../../pages/Projects/DivisionsList';
import ExpenseClaims from '../../pages/Projects/ExpenseClaims';

// HR & Payroll
import Employees from '../../pages/HR/Employees';
import Payslips from '../../pages/HR/Payslips';

// Assets
import FixedAssets from '../../pages/Assets/FixedAssets';
import DepreciationEntries from '../../pages/Assets/DepreciationEntries';
import IntangibleAssets from '../../pages/Assets/IntangibleAssets';

// AI & Document Processing
import AiAssistant from '../../pages/AI/AiAssistant';
import OcrInbox from '../../pages/AI/OcrInbox';

// Settings & Security
import UsersRoles from '../../pages/Settings/UsersRoles';
import CompanySettings from '../../pages/Settings/CompanySettings';
import AuditTrail from '../../pages/Settings/AuditTrail';

const Layout = () => {
    // Initial state from localStorage or default to 'expanded'
    const [sidebarMode, setSidebarMode] = useState(() => {
        return localStorage.getItem('sidebarPreference') || 'expanded';
    });
    const [isMobile, setIsMobile] = useState(false);
    const location = useLocation();

    // Screen size listener
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);

            if (mobile) {
                setSidebarMode('hidden');
            } else {
                const savedPreference = localStorage.getItem('sidebarPreference') || 'expanded';
                setSidebarMode(savedPreference);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Save preference to localStorage whenever it changes
    useEffect(() => {
        if (!isMobile) {
            localStorage.setItem('sidebarPreference', sidebarMode);
        }
    }, [sidebarMode, isMobile]);

    const toggleSidebar = () => {
        setSidebarMode((prev) => (prev === 'hidden' ? 'expanded' : 'hidden'));
    };

    const toggleSidebarSize = () => {
        setSidebarMode((prev) => {
            if (prev === 'hidden') return 'expanded';
            return prev === 'expanded' ? 'mini' : 'expanded';
        });
    };

    const toggleSidebarVisibility = () => {
        setSidebarMode((prev) => (prev === 'hidden' ? 'expanded' : 'hidden'));
    };

    const handleBackdropClick = () => {
        if (isMobile && sidebarMode === 'expanded') {
            setSidebarMode('hidden');
        }
    };

    // Breadcrumb Logic
    const pathnames = location.pathname.split('/').filter((x) => x);

    const breadcrumbs = pathnames.length > 0 ? (
        <nav className={contentStyles.breadcrumbContainer}>
            <Link to="/" className={contentStyles.breadcrumbLink}>
                <BiHome size={18} />
                <span>Dashboard</span>
            </Link>
            {pathnames.map((value, index) => {
                const last = index === pathnames.length - 1;
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const label = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

                return (
                    <div key={to} className={contentStyles.breadcrumbItem}>
                        <BiChevronRight className={contentStyles.separator} />
                        {last ? (
                            <span className={contentStyles.current}>{label}</span>
                        ) : (
                            <Link to={to} className={contentStyles.breadcrumbLink}>
                                {label}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    ) : null;

    return (
        <div className={styles.layout}>
            <Header
                toggleSidebar={toggleSidebar}
                toggleSidebarSize={toggleSidebarSize}
                toggleSidebarVisibility={toggleSidebarVisibility}
                sidebarMode={sidebarMode}
                isMobile={isMobile}
            />
            <div className={styles.container}>
                <Sidebar sidebarMode={sidebarMode} isMobile={isMobile} />

                {isMobile && sidebarMode !== 'hidden' && (
                    <div className={styles.backdrop} onClick={handleBackdropClick} />
                )}

                <main
                    className={`
                        ${styles.mainContent} 
                        ${styles[sidebarMode]} 
                        ${isMobile ? styles.mobileMain : ''}
                    `}
                >
                    <div className={styles.contentInner}>
                        <div className={contentStyles.pageHeader}>
                            {breadcrumbs}
                        </div>

                        <div className={contentStyles.pageBody}>
                            <Routes>
                                {/* Dashboard */}
                                <Route path="/" element={<Dashboard />} />

                                {/* Banking */}
                                <Route path="/banking/accounts" element={<BankAccounts />} />
                                <Route path="/banking/accounts/bank" element={<BankAccounts />} />
                                <Route path="/banking/accounts/cash" element={<CashAccounts />} />
                                <Route path="/banking/transfers" element={<Transfers />} />
                                <Route path="/banking/reconciliations" element={<PendingReconciliations />} />
                                <Route path="/banking/reconciliations/pending" element={<PendingReconciliations />} />
                                <Route path="/banking/reconciliations/completed" element={<CompletedReconciliations />} />

                                {/* Receivables */}
                                <Route path="/receivables/sales/invoices" element={<SalesInvoices />} />
                                <Route path="/receivables/customers" element={<Customers />} />
                                <Route path="/receivables/receipts" element={<Receipts />} />
                                <Route path="/receivables/sales/quotes" element={<SalesQuotes />} />
                                <Route path="/receivables/sales/orders" element={<SalesOrders />} />
                                <Route path="/receivables/credit-notes" element={<CreditNotes />} />
                                <Route path="/receivables/delivery-notes" element={<DeliveryNotes />} />

                                {/* Payables */}
                                <Route path="/payables/invoices" element={<PurchaseInvoices />} />
                                <Route path="/payables/suppliers" element={<Suppliers />} />
                                <Route path="/payables/payments" element={<Payments />} />
                                <Route path="/payables/quotes" element={<PurchaseQuotes />} />
                                <Route path="/payables/orders" element={<PurchaseOrders />} />
                                <Route path="/payables/debit-notes" element={<DebitNotes />} />
                                <Route path="/payables/goods-receipts" element={<GoodsReceipts />} />

                                {/* Inventory & Production */}
                                <Route path="/inventory/items" element={<InventoryItems />} />
                                <Route path="/inventory/transfers" element={<InventoryTransfers />} />
                                <Route path="/inventory/write-offs" element={<InventoryWriteOffs />} />
                                <Route path="/inventory/production-orders" element={<ProductionOrders />} />
                                <Route path="/inventory/locations" element={<InventoryLocations />} />

                                {/* Accounting */}
                                <Route path="/accounting/chart-of-accounts" element={<ChartOfAccounts />} />
                                <Route path="/accounting/journal-entries" element={<JournalEntries />} />
                                <Route path="/accounting/capital" element={<CapitalAccounts />} />
                                <Route path="/accounting/special" element={<SpecialAccounts />} />

                                {/* Tax & Compliance */}
                                <Route path="/tax/uae-vat-return" element={<UaeVatReturn />} />
                                <Route path="/tax/ksa-vat-return" element={<KsaVatReturn />} />
                                <Route path="/tax/tax-codes" element={<TaxCodes />} />

                                {/* Reports */}
                                <Route path="/reports" element={<ReportsHub />} />
                                <Route path="/reports/trial-balance" element={<TrialBalance />} />
                                <Route path="/reports/profit-and-loss" element={<ProfitAndLoss />} />
                                <Route path="/reports/balance-sheet" element={<BalanceSheet />} />
                                <Route path="/reports/general-ledger" element={<GeneralLedgerReport />} />
                                <Route path="/reports/aged-receivables" element={<AgedReceivablesReport />} />
                                <Route path="/reports/aged-payables" element={<AgedPayablesReport />} />
                                <Route path="/reports/inventory-summary" element={<InventorySummaryReport />} />

                                {/* Projects & Cost Centers */}
                                <Route path="/projects/list" element={<ProjectsList />} />
                                <Route path="/projects/divisions" element={<DivisionsList />} />
                                <Route path="/projects/expenses" element={<ExpenseClaims />} />

                                {/* HR & Payroll */}
                                <Route path="/hr/employees" element={<Employees />} />
                                <Route path="/hr/payslips" element={<Payslips />} />

                                {/* Fixed & Intangible Assets */}
                                <Route path="/assets/fixed-assets" element={<FixedAssets />} />
                                <Route path="/assets/depreciation" element={<DepreciationEntries />} />
                                <Route path="/assets/intangible-assets" element={<IntangibleAssets />} />

                                {/* AI Assistant & Document Processing */}
                                <Route path="/ai/assistant" element={<AiAssistant />} />
                                <Route path="/ai/ocr-inbox" element={<OcrInbox />} />

                                {/* Settings & Security */}
                                <Route path="/settings/users" element={<UsersRoles />} />
                                <Route path="/settings/company" element={<CompanySettings />} />
                                <Route path="/settings/audit-trail" element={<AuditTrail />} />

                                {/* Fallback route */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;

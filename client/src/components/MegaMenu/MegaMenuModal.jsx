import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
    BiSearch, 
    BiUser, 
    BiCog, 
    BiLogOut 
} from 'react-icons/bi';
import { 
    LuX, 
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
    LuSettings, 
    LuClock,
    LuArrowUpRight
} from 'react-icons/lu';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './MegaMenuModal.module.css';

// All business module definitions with icons, badges, and deep links
export const MEGA_CATEGORIES = [
    {
        id: 'overview',
        title: 'Dashboard',
        icon: <LuLayoutDashboard strokeWidth={1.7} />,
        color: '#4f46e5',
        bgColor: '#eef2ff',
        items: [
            { label: 'Executive Dashboard', path: '/', badge: 'Home' }
        ]
    },
    {
        id: 'banking',
        title: 'Banking & Treasury',
        icon: <LuLandmark strokeWidth={1.7} />,
        color: '#4f46e5',
        bgColor: '#eef2ff',
        items: [
            { label: 'Bank Accounts', path: '/banking/accounts/bank' },
            { label: 'Cash Accounts', path: '/banking/accounts/cash' },
            { label: 'Inter-Account Transfers', path: '/banking/transfers' },
            { label: 'Pending Reconciliations', path: '/banking/reconciliations/pending', badge: 'Pending', badgeColor: '#f59e0b' },
            { label: 'Completed Reconciliations', path: '/banking/reconciliations/completed', badge: 'Cleared', badgeColor: '#10b981' },
        ]
    },
    {
        id: 'receivables',
        title: 'Receivables & Sales',
        icon: <LuReceipt strokeWidth={1.7} />,
        color: '#0284c7',
        bgColor: '#f0f9ff',
        items: [
            { label: 'Sales Invoices', path: '/receivables/sales/invoices' },
            { label: 'Customers', path: '/receivables/customers' },
            { label: 'Customer Receipts', path: '/receivables/receipts' },
            { label: 'Sales Quotes', path: '/receivables/sales/quotes' },
            { label: 'Sales Orders', path: '/receivables/sales/orders' },
            { label: 'Credit Notes', path: '/receivables/credit-notes' },
            { label: 'Delivery Notes', path: '/receivables/delivery-notes' },
        ]
    },
    {
        id: 'payables',
        title: 'Payables & Purchases',
        icon: <LuCreditCard strokeWidth={1.7} />,
        color: '#d97706',
        bgColor: '#fffbeb',
        items: [
            { label: 'Purchase Invoices', path: '/payables/invoices' },
            { label: 'Suppliers', path: '/payables/suppliers' },
            { label: 'Supplier Payments', path: '/payables/payments' },
            { label: 'Purchase Quotes', path: '/payables/quotes' },
            { label: 'Purchase Orders', path: '/payables/orders' },
            { label: 'Debit Notes', path: '/payables/debit-notes' },
            { label: 'Goods Receipts', path: '/payables/goods-receipts' },
        ]
    },
    {
        id: 'inventory',
        title: 'Inventory & Operations',
        icon: <LuBoxes strokeWidth={1.7} />,
        color: '#16a34a',
        bgColor: '#f0fdf4',
        items: [
            { label: 'Inventory Items', path: '/inventory/items' },
            { label: 'Inventory Transfers', path: '/inventory/transfers' },
            { label: 'Inventory Write-Offs', path: '/inventory/write-offs' },
            { label: 'Production Orders', path: '/inventory/production-orders' },
            { label: 'Locations & Warehouses', path: '/inventory/locations' },
        ]
    },
    {
        id: 'accounting',
        title: 'General Accounting',
        icon: <LuCalculator strokeWidth={1.7} />,
        color: '#7c3aed',
        bgColor: '#f5f3ff',
        items: [
            { label: 'Chart of Accounts', path: '/accounting/chart-of-accounts' },
            { label: 'Journal Entries', path: '/accounting/journal-entries' },
            { label: 'Capital Accounts', path: '/accounting/capital' },
            { label: 'Special Accounts', path: '/accounting/special' },
        ]
    },
    {
        id: 'tax',
        title: 'Tax & Compliance',
        icon: <LuShieldCheck strokeWidth={1.7} />,
        color: '#059669',
        bgColor: '#ecfdf5',
        items: [
            { label: 'UAE VAT Return (Form 201)', path: '/tax/uae-vat-return', badge: 'FTA', badgeColor: '#059669' },
            { label: 'KSA VAT Return (ZATCA)', path: '/tax/ksa-vat-return', badge: 'ZATCA', badgeColor: '#059669' },
            { label: 'Tax Codes & Rates', path: '/tax/tax-codes' },
        ]
    },
    {
        id: 'reports',
        title: 'Financial Reports',
        icon: <LuChartBar strokeWidth={1.7} />,
        color: '#2563eb',
        bgColor: '#eff6ff',
        items: [
            { label: 'Financial Reports Hub', path: '/reports' },
            { label: 'Trial Balance', path: '/reports/trial-balance' },
            { label: 'Profit & Loss', path: '/reports/profit-and-loss' },
            { label: 'Balance Sheet', path: '/reports/balance-sheet' },
            { label: 'General Ledger', path: '/reports/general-ledger' },
            { label: 'Aged Receivables', path: '/reports/aged-receivables' },
            { label: 'Aged Payables', path: '/reports/aged-payables' },
            { label: 'Inventory Summary', path: '/reports/inventory-summary' },
        ]
    },
    {
        id: 'projects',
        title: 'Projects & Cost Centers',
        icon: <LuBriefcase strokeWidth={1.7} />,
        color: '#ea580c',
        bgColor: '#fff7ed',
        items: [
            { label: 'Projects Register', path: '/projects/list' },
            { label: 'Cost Centers / Divisions', path: '/projects/divisions' },
            { label: 'Expense Claims', path: '/projects/expenses' },
        ]
    },
    {
        id: 'hr',
        title: 'HR & Payroll',
        icon: <LuUsers strokeWidth={1.7} />,
        color: '#db2777',
        bgColor: '#fdf2f8',
        items: [
            { label: 'Employees Register', path: '/hr/employees' },
            { label: 'Monthly Payslips', path: '/hr/payslips' },
        ]
    },
    {
        id: 'assets',
        title: 'Fixed & Intangible Assets',
        icon: <LuFileSpreadsheet strokeWidth={1.7} />,
        color: '#0891b2',
        bgColor: '#ecfeff',
        items: [
            { label: 'Fixed Assets', path: '/assets/fixed-assets' },
            { label: 'Depreciation Entries', path: '/assets/depreciation' },
            { label: 'Intangible Assets', path: '/assets/intangible-assets' },
        ]
    },
    {
        id: 'ai',
        title: 'AI Intelligence & Tools',
        icon: <LuSparkles strokeWidth={1.7} />,
        color: '#9333ea',
        bgColor: '#faf5ff',
        items: [
            { label: 'AI Financial Assistant', path: '/ai/assistant', badge: 'AI', badgeColor: '#9333ea' },
            { label: 'Automated OCR & Scanning', path: '/ai/ocr-inbox', badge: 'OCR', badgeColor: '#4f46e5' },
        ]
    },
    {
        id: 'settings',
        title: 'System & Administration',
        icon: <LuSettings strokeWidth={1.7} />,
        color: '#475569',
        bgColor: '#f8fafc',
        items: [
            { label: 'System Users & Roles', path: '/settings/users' },
            { label: 'Company Information', path: '/settings/company' },
            { label: 'Audit Trail & Logs', path: '/settings/audit-trail', badge: 'Security', badgeColor: '#64748b' },
        ]
    }
];

// Header & Profile Shortcuts
export const HEADER_PROFILE_ACTIONS = [
    { label: 'User Profile', desc: 'Alex Doe (Administrator)', path: '/settings/users', icon: <BiUser size={18} /> },
    { label: 'Company Settings', desc: 'Financial Year & Config', path: '/settings/company', icon: <BiCog size={18} /> },
    { label: 'Security & Audit Trail', desc: 'Audit Logs & History', path: '/settings/audit-trail', icon: <LuShieldCheck size={18} /> },
    { label: 'OCR Inbox & Scanner', desc: 'Smart Document Queue', path: '/ai/ocr-inbox', icon: <LuSparkles size={18} /> },
    { label: 'Pending Reconciliations', desc: 'Bank Action Required', path: '/banking/reconciliations/pending', icon: <LuClock size={18} /> },
    { label: 'Sign Out / Logout', desc: 'Terminate session safely', action: 'logout', icon: <BiLogOut size={18} />, isDanger: true },
];

export const MegaMenuModal = ({ isOpen, onClose, zIndexOffset = 0 }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);
    const panelRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Auto-focus search input when opened
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 80);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Handle Escape key to close
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, onClose]);

    const handleNavigate = useCallback((path) => {
        if (!path) return;
        onClose();
        navigate(path);
    }, [navigate, onClose]);

    const handleLogout = useCallback(() => {
        onClose();
        navigate('/login');
    }, [navigate, onClose]);

    // Filter categories and items based on search query
    const filteredCategories = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return MEGA_CATEGORIES;

        return MEGA_CATEGORIES.map(category => {
            const matchesCategoryTitle = category.title.toLowerCase().includes(query);
            const matchedItems = category.items.filter(item => 
                item.label.toLowerCase().includes(query) || 
                item.path.toLowerCase().includes(query) ||
                (item.badge && item.badge.toLowerCase().includes(query))
            );

            if (matchesCategoryTitle) {
                return category;
            }

            if (matchedItems.length > 0) {
                return {
                    ...category,
                    items: matchedItems
                };
            }

            return null;
        }).filter(Boolean);
    }, [searchQuery]);

    // Filter header & profile actions
    const filteredHeaderActions = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return HEADER_PROFILE_ACTIONS;
        return HEADER_PROFILE_ACTIONS.filter(item => 
            item.label.toLowerCase().includes(query) || 
            item.desc.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const totalLinksCount = useMemo(() => {
        return MEGA_CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
    }, []);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className={styles.megaMenuBackdrop} 
                onClick={onClose}
                style={{ zIndex: 1001 + zIndexOffset }}
                aria-hidden="true"
            />

            {/* Modal Panel */}
            <div 
                ref={panelRef}
                className={styles.megaMenuPanel} 
                style={{ zIndex: 1002 + zIndexOffset }}
                role="dialog" 
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search & Overview Header */}
                <div className={styles.megaHeader}>
                    <div className={styles.searchWrapper}>
                        <BiSearch size={18} className={styles.searchIcon} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search all 50+ registers, modules, accounting settings & features... (Press Esc to close)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button 
                                className={styles.clearSearchBtn}
                                onClick={() => setSearchQuery('')}
                                aria-label="Clear search"
                            >
                                <LuX size={14} />
                            </button>
                        )}
                    </div>

                    <div className={styles.megaHeaderMeta}>
                        <span className={styles.metaCount}>
                            {searchQuery ? `${filteredCategories.reduce((acc, c) => acc + c.items.length, 0)} results found` : `${totalLinksCount} Business Modules & Views`}
                        </span>
                        <button 
                            className={styles.closeMegaBtn}
                            onClick={onClose}
                            aria-label="Close Mega Menu"
                            title="Close (Esc)"
                        >
                            <LuX size={18} />
                        </button>
                    </div>
                </div>

                {/* ── Header & Profile Quick Access Strip ─────────────── */}
                <div className={styles.quickLinksSection}>
                    <div className={styles.quickLinksHeader}>
                        <span className={styles.quickLinksLabel}>Header & Profile Quick Links</span>
                    </div>
                    <div className={styles.quickLinksRow}>
                        {filteredHeaderActions.map((action, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className={`${styles.quickActionCard} ${action.isDanger ? styles.dangerCard : ''}`}
                                onClick={() => {
                                    if (action.action === 'logout') {
                                        handleLogout();
                                    } else {
                                        handleNavigate(action.path);
                                    }
                                }}
                            >
                                <span className={styles.quickActionIcon}>{action.icon}</span>
                                <div className={styles.quickActionDetails}>
                                    <span className={styles.quickActionTitle}>{action.label}</span>
                                    <span className={styles.quickActionDesc}>{action.desc}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Multi-Column Categorized Modules Grid ───────────── */}
                <div className={styles.megaBody}>
                    {filteredCategories.length === 0 ? (
                        <div className={styles.emptyState}>
                            <BiSearch size={32} color="#94a3b8" />
                            <p className={styles.emptyTitle}>No matching pages found for "{searchQuery}"</p>
                            <p className={styles.emptyDesc}>Try searching for "invoices", "reconciliations", "vat", "chart of accounts", or "payroll"</p>
                        </div>
                    ) : (
                        <div className={styles.categoriesGrid}>
                            {filteredCategories.map((cat) => (
                                <div key={cat.id} className={styles.categoryCard}>
                                    <div className={styles.categoryTitleRow}>
                                        <span 
                                            className={styles.categoryIconWrap}
                                            style={{ color: cat.color, background: cat.bgColor }}
                                        >
                                            {cat.icon}
                                        </span>
                                        <h4 className={styles.categoryTitle}>{cat.title}</h4>
                                    </div>

                                    <ul className={styles.itemList}>
                                        {cat.items.map((item, itemIdx) => {
                                            const isActive = location.pathname === item.path;
                                            return (
                                                <li key={itemIdx} className={styles.itemRow}>
                                                    <button
                                                        type="button"
                                                        className={`${styles.navItemButton} ${isActive ? styles.navItemActive : ''}`}
                                                        onClick={() => handleNavigate(item.path)}
                                                    >
                                                        <span className={styles.itemDot} />
                                                        <span className={styles.itemLabel}>{item.label}</span>
                                                        {item.badge && (
                                                            <span 
                                                                className={styles.itemBadge}
                                                                style={{
                                                                    backgroundColor: item.badgeColor ? `${item.badgeColor}15` : '#e0e7ff',
                                                                    color: item.badgeColor || '#4f46e5',
                                                                    borderColor: item.badgeColor ? `${item.badgeColor}30` : '#c7d2fe'
                                                                }}
                                                            >
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                        <LuArrowUpRight size={13} className={styles.hoverArrow} />
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Mega Menu Footer */}
                <div className={styles.megaFooter}>
                    <span className={styles.footerInfo}>
                        Orient Logistics ERP Solution • Press <kbd className={styles.kbd}>Esc</kbd> or click anywhere outside to close
                    </span>
                </div>
            </div>
        </>
    );
};

export default MegaMenuModal;


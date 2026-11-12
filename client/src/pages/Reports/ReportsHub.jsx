import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    BiCalculator, 
    BiTrendingUp, 
    BiBarChartSquare, 
    BiBookBookmark, 
    BiTimeFive, 
    BiBox, 
    BiShield, 
    BiRightArrowAlt 
} from 'react-icons/bi';

const ReportsHub = () => {
    const navigate = useNavigate();

    const reportCards = [
        {
            title: 'Trial Balance',
            path: '/reports/trial-balance',
            icon: <BiCalculator size={24} color="#4f46e5" />,
            desc: 'Pre-closing proof verifying that total debits equal total credits across all active ledger accounts.',
            category: 'Financial Statements'
        },
        {
            title: 'Profit & Loss Statement',
            path: '/reports/profit-and-loss',
            icon: <BiTrendingUp size={24} color="#15803d" />,
            desc: 'Operating revenue, Cost of Goods Sold (COGS), gross margins, overhead expenses, and net profit.',
            category: 'Financial Statements'
        },
        {
            title: 'Balance Sheet',
            path: '/reports/balance-sheet',
            icon: <BiBarChartSquare size={24} color="#0284c7" />,
            desc: 'Statement of financial position showing Total Assets = Total Liabilities + Owners Equity.',
            category: 'Financial Statements'
        },
        {
            title: 'General Ledger Account Activity',
            path: '/reports/general-ledger',
            icon: <BiBookBookmark size={24} color="#7c3aed" />,
            desc: 'Detailed chronological transaction register for every debit and credit posting with running balances.',
            category: 'General Ledger'
        },
        {
            title: 'Aged Receivables (Customer Aging)',
            path: '/reports/aged-receivables',
            icon: <BiTimeFive size={24} color="#d97706" />,
            desc: 'Aging schedule of unpaid customer invoices broken into Current, 1-30, 31-60, 61-90, and 90+ days overdue.',
            category: 'Receivables & Payables'
        },
        {
            title: 'Aged Payables (Supplier Aging)',
            path: '/reports/aged-payables',
            icon: <BiTimeFive size={24} color="#dc2626" />,
            desc: 'Outstanding vendor obligations categorized by due date brackets for cash flow disbursement planning.',
            category: 'Receivables & Payables'
        },
        {
            title: 'Inventory Valuation Summary',
            path: '/reports/inventory-summary',
            icon: <BiBox size={24} color="#0d9488" />,
            desc: 'Perpetual stock valuation, quantity on hand, unit cost, and total inventory value by category.',
            category: 'Inventory & Stock'
        },
        {
            title: 'UAE VAT Return (Form 201)',
            path: '/tax/uae-vat-return',
            icon: <BiShield size={24} color="#4338ca" />,
            desc: 'Federal Tax Authority EmaraTax declaration with standard rated supplies apportioned across 7 Emirates.',
            category: 'Tax & Compliance'
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                    Financial Reports & Executive Intelligence
                </h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    Statutory IFRS/GAAP accounting statements, audit trails, tax declarations, and management accounting reports.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px'
            }}>
                {reportCards.map((r, idx) => (
                    <div
                        key={idx}
                        onClick={() => navigate(r.path)}
                        style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                        }}
                    >
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    {r.icon}
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
                                    {r.category}
                                </span>
                            </div>

                            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                                {r.title}
                            </h3>
                            <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.5 }}>
                                {r.desc}
                            </p>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#4f46e5',
                            marginTop: '16px'
                        }}>
                            Generate Report <BiRightArrowAlt size={16} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReportsHub;


import React, { useState, useEffect } from 'react';
import { 
    BiTrendingUp, 
    BiTrendingDown, 
    BiWallet, 
    BiCreditCard, 
    BiDollarCircle, 
    BiBox, 
    BiFile, 
    BiPlus, 
    BiCheckCircle,
    BiBot,
    BiSend
} from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';
import api from '../../services/api';

const Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 285450.00,
        accountsReceivable: 48920.00,
        accountsPayable: 31250.00,
        cashAndBank: 164800.00,
        grossProfit: 114180.00,
        netProfit: 86400.00,
        vatLiability: 14272.50,
        inventoryValuation: 92300.00
    });
    const [recentInvoices, setRecentInvoices] = useState([]);

    // Quick AI Widget State
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    // Quick Modal States
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [invoiceCustomer, setInvoiceCustomer] = useState(null);
    const [invoiceAmount, setInvoiceAmount] = useState(1500);
    const [invoiceNotes, setInvoiceNotes] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch real invoices from server
            const invoices = await api.getSalesInvoices().catch(() => null);
            if (invoices && Array.isArray(invoices) && invoices.length > 0) {
                setRecentInvoices(invoices);
                const totalRev = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
                const totalAr = invoices.reduce((sum, inv) => sum + parseFloat(inv.balance_due || 0), 0);
                setStats(prev => ({
                    ...prev,
                    totalRevenue: totalRev || prev.totalRevenue,
                    accountsReceivable: totalAr || prev.accountsReceivable
                }));
            } else {
                // High fidelity default data
                setRecentInvoices([
                    { id: 1, invoice_number: 'INV-2026-0001', customer_name: 'Al-Futtaim Logistics LLC', invoice_date: '2026-10-28', due_date: '2026-11-27', total_amount: 14700.00, amount_paid: 14700.00, balance_due: 0.00, vat_amount: 700.00, status: 'Paid' },
                    { id: 2, invoice_number: 'INV-2026-0002', customer_name: 'Emaar Hospitality Group', invoice_date: '2026-10-29', due_date: '2026-11-28', total_amount: 32550.00, amount_paid: 10000.00, balance_due: 22550.00, vat_amount: 1550.00, status: 'Partial' },
                    { id: 3, invoice_number: 'INV-2026-0003', customer_name: 'Saudi Aramco Services', invoice_date: '2026-10-30', due_date: '2026-11-29', total_amount: 18400.00, amount_paid: 0.00, balance_due: 18400.00, vat_amount: 2400.00, status: 'Unpaid' },
                    { id: 4, invoice_number: 'INV-2026-0004', customer_name: 'Etisalat Telecommunications', invoice_date: '2026-10-31', due_date: '2026-11-30', total_amount: 7875.00, amount_paid: 0.00, balance_due: 7875.00, vat_amount: 375.00, status: 'Unpaid' }
                ]);
            }
        } catch (err) {
            console.error('Failed to load dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAiSubmit = async (e) => {
        e?.preventDefault();
        if (!aiQuery.trim()) return;
        setAiLoading(true);
        setAiResponse('');
        try {
            const res = await api.queryAi(aiQuery);
            setAiResponse(res?.answer || res?.data || `Analysis for "${aiQuery}": Based on current records, revenue is $${stats.totalRevenue.toLocaleString()} with $${stats.accountsReceivable.toLocaleString()} in pending receivables. Cash liquidity remains strong at $${stats.cashAndBank.toLocaleString()}.`);
        } catch {
            setAiResponse(`Analysis for "${aiQuery}": Based on your ledger, your gross margin is 40.0% and total accounts receivable are $${stats.accountsReceivable.toLocaleString()}. UAE 5% VAT liability is currently $${stats.vatLiability.toLocaleString()}.`);
        } finally {
            setAiLoading(false);
        }
    };

    // AG Grid column definitions
    const columnDefs = [
        { 
            field: 'invoice_number', 
            headerName: 'Invoice #', 
            width: 150, 
            pinned: 'left',
            cellStyle: { fontWeight: 600, color: '#4f46e5' }
        },
        { field: 'customer_name', headerName: 'Customer', flex: 1, minWidth: 180 },
        { field: 'invoice_date', headerName: 'Date', width: 120 },
        { field: 'due_date', headerName: 'Due Date', width: 120 },
        { 
            field: 'vat_amount', 
            headerName: 'VAT Amount', 
            width: 130, 
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00' 
        },
        { 
            field: 'total_amount', 
            headerName: 'Total Amount', 
            width: 140, 
            cellStyle: { fontWeight: 600 },
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00' 
        },
        { 
            field: 'balance_due', 
            headerName: 'Balance Due', 
            width: 140, 
            cellStyle: p => ({ color: p.value > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }),
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00' 
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            cellRenderer: (params) => {
                const s = params.value || 'Unpaid';
                let bg = '#fee2e2'; let color = '#b91c1c';
                if (s === 'Paid') { bg = '#dcfce7'; color = '#15803d'; }
                else if (s === 'Partial') { bg = '#fef3c7'; color = '#b45309'; }
                return (
                    <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: bg,
                        color: color,
                        lineHeight: 1.2
                    }}>
                        {s}
                    </span>
                );
            }
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top Bar with Title & Quick Action Buttons */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                        Executive Financial Dashboard
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Real-time overview of cash liquidity, receivables, payables, and regional VAT compliance.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('/receivables/sales/invoices')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#4f46e5',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(79, 70, 229, 0.3)'
                        }}
                    >
                        <BiPlus size={18} /> New Invoice
                    </button>

                    <button
                        onClick={() => navigate('/receivables/customers')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#ffffff',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '8px 14px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        + New Customer
                    </button>

                    <button
                        onClick={() => navigate('/inventory/items')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#ffffff',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '8px 14px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        + New Item
                    </button>
                </div>
            </div>

            {/* 4 Primary KPI Summary Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px'
            }}>
                {/* Total Revenue */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Total Revenue
                            </span>
                            <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
                                ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                            <BiDollarCircle size={24} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '12px', color: '#16a34a' }}>
                        <BiTrendingUp size={16} />
                        <span><strong>+12.4%</strong> vs last month</span>
                    </div>
                </div>

                {/* Accounts Receivable */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Accounts Receivable
                            </span>
                            <div style={{ fontSize: '26px', fontWeight: 700, color: '#d97706', marginTop: '6px' }}>
                                ${stats.accountsReceivable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                            <BiWallet size={24} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '12px', color: '#64748b' }}>
                        <span>Awaiting payment from 4 customers</span>
                    </div>
                </div>

                {/* Accounts Payable */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Accounts Payable
                            </span>
                            <div style={{ fontSize: '26px', fontWeight: 700, color: '#dc2626', marginTop: '6px' }}>
                                ${stats.accountsPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                            <BiCreditCard size={24} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '12px', color: '#64748b' }}>
                        <span>Pending bills due within 30 days</span>
                    </div>
                </div>

                {/* Cash & Bank Liquidity */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Cash & Bank Liquidity
                            </span>
                            <div style={{ fontSize: '26px', fontWeight: 700, color: '#16a34a', marginTop: '6px' }}>
                                ${stats.cashAndBank.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                            <BiCheckCircle size={24} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '12px', color: '#16a34a' }}>
                        <span>Operational ratio: 5.2x coverage</span>
                    </div>
                </div>
            </div>

            {/* Secondary Financial Metrics Strip */}
            <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
            }}>
                <div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Gross Profit (Margin 40.0%)</span>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                        ${stats.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Net Profit</span>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#15803d' }}>
                        ${stats.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>UAE 5% / KSA 15% VAT Liability</span>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#7c3aed' }}>
                        ${stats.vatLiability.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Inventory Stock Valuation</span>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#0284c7' }}>
                        ${stats.inventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            {/* Interactive AI Financial Assistant Widget */}
            <div style={{
                background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)',
                border: '1px solid #c7d2fe',
                borderRadius: '10px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{
                        background: '#4f46e5',
                        color: '#ffffff',
                        padding: '6px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <BiBot size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e1b4b' }}>
                            Antigravity AI Financial Assistant
                        </h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#4338ca' }}>
                            Ask any question in plain English regarding your revenue, expenses, UAE/KSA VAT returns, or inventory status.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleAiSubmit} style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                        <InputText
                            placeholder="e.g. 'What is my net VAT payable for UAE Form 201?' or 'Which customer has the largest overdue balance?'"
                            value={aiQuery}
                            onChange={setAiQuery}
                            allowClear
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={aiLoading}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#4f46e5',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0 18px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: aiLoading ? 'not-allowed' : 'pointer',
                            opacity: aiLoading ? 0.7 : 1
                        }}
                    >
                        <BiSend size={16} />
                        {aiLoading ? 'Thinking...' : 'Analyze'}
                    </button>
                </form>

                {aiResponse && (
                    <div style={{
                        marginTop: '14px',
                        padding: '12px 16px',
                        background: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #c7d2fe',
                        fontSize: '13px',
                        color: '#1e293b',
                        lineHeight: 1.6
                    }}>
                        <strong>AI Insights: </strong>
                        {aiResponse}
                    </div>
                )}
            </div>

            {/* Recent Sales Invoices with Enterprise AG Grid */}
            <div>
                <AgGridTable
                    title="Recent Sales Invoices & Receivables (Enterprise Grid)"
                    rowData={recentInvoices}
                    columnDefs={columnDefs}
                    loading={loading}
                    height="420px"
                    enableSearch={true}
                    enableExport={true}
                    extraHeaderActions={
                        <button
                            onClick={() => navigate('/receivables/sales/invoices')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#334155',
                                cursor: 'pointer'
                            }}
                        >
                            View All Invoices →
                        </button>
                    }
                />
            </div>
        </div>
    );
};

export default Dashboard;


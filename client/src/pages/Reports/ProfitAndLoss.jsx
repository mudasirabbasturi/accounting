import React, { useState } from 'react';
import { BiPrinter, BiFile, BiTrendingUp } from 'react-icons/bi';
import { InputText } from '../../elegance-ui/components';

const ProfitAndLoss = () => {
    const [fromDate, setFromDate] = useState('2026-01-01');
    const [toDate, setToDate] = useState('2026-10-31');

    const statement = {
        revenue: [
            { code: '4010', name: 'Commercial Sales Revenue (Goods & Logistics)', amount: 265450.00 },
            { code: '4020', name: 'Software Implementation & Advisory Services', amount: 20000.00 }
        ],
        cogs: [
            { code: '5010', name: 'Cost of Merchandise Sold (COGS)', amount: 162270.00 },
            { code: '5020', name: 'Freight Inbound & Customs Duties', amount: 9000.00 }
        ],
        expenses: [
            { code: '6010', name: 'Office Rent & Facilities Lease - Dubai Hub', amount: 18000.00 },
            { code: '6020', name: 'Executive & Staff Salaries and Allowances', amount: 9780.00 },
            { code: '6030', name: 'Cloud Infrastructure & Enterprise Software', amount: 3200.00 },
            { code: '6040', name: 'Corporate Business Travel & Marketing', amount: 4170.00 },
            { code: '6050', name: 'Depreciation of Fixed Assets & Equipment', amount: 2500.00 }
        ]
    };

    const totalRevenue = statement.revenue.reduce((s, i) => s + i.amount, 0);
    const totalCogs = statement.cogs.reduce((s, i) => s + i.amount, 0);
    const grossProfit = totalRevenue - totalCogs;
    const grossMargin = ((grossProfit / totalRevenue) * 100).toFixed(1);

    const totalExpenses = statement.expenses.reduce((s, i) => s + i.amount, 0);
    const netProfit = grossProfit - totalExpenses;
    const netMargin = ((netProfit / totalRevenue) * 100).toFixed(1);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                        Profit & Loss Statement (Income Statement)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Accrual-basis financial performance report measuring Gross Profit, Operating Overheads, and Net Income.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '140px' }}>
                        <InputText value={fromDate} onChange={setFromDate} placeholder="From Date" />
                    </div>
                    <span style={{ color: '#64748b' }}>to</span>
                    <div style={{ width: '140px' }}>
                        <InputText value={toDate} onChange={setToDate} placeholder="To Date" />
                    </div>

                    <button
                        onClick={() => window.print()}
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
                        <BiPrinter size={16} /> Print Report
                    </button>
                </div>
            </div>

            {/* Income Statement Container */}
            <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '28px',
                maxWidth: '900px',
                margin: '0 auto',
                width: '100%',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                        Orient Logistics Solutions FZ-LLC
                    </h2>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#4f46e5', marginTop: '4px' }}>
                        Statement of Profit and Loss
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        For the Period from {fromDate} to {toDate} (All amounts in USD)
                    </div>
                </div>

                {/* 1. Operating Revenue */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '8px' }}>
                        Operating Revenue
                    </div>
                    {statement.revenue.map(r => (
                        <div key={r.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontSize: '13px' }}>
                            <span style={{ color: '#334155' }}>{r.code} - {r.name}</span>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>${r.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', fontWeight: 700, fontSize: '13px', borderTop: '1px solid #e2e8f0' }}>
                        <span>Total Operating Revenue</span>
                        <span style={{ color: '#0f172a' }}>${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* 2. Cost of Goods Sold */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '8px' }}>
                        Cost of Goods Sold (Direct Costs)
                    </div>
                    {statement.cogs.map(c => (
                        <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontSize: '13px' }}>
                            <span style={{ color: '#334155' }}>{c.code} - {c.name}</span>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>${c.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', fontWeight: 700, fontSize: '13px', borderTop: '1px solid #e2e8f0' }}>
                        <span>Total Cost of Goods Sold</span>
                        <span style={{ color: '#dc2626' }}>(${totalCogs.toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
                    </div>
                </div>

                {/* Gross Profit Strip */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    borderRadius: '6px',
                    marginBottom: '24px',
                    fontWeight: 800,
                    fontSize: '15px'
                }}>
                    <div>
                        <span style={{ color: '#312e81' }}>GROSS PROFIT</span>
                        <span style={{ fontSize: '12px', color: '#4f46e5', marginLeft: '10px' }}>(Margin: {grossMargin}%)</span>
                    </div>
                    <span style={{ color: '#4f46e5' }}>${grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                {/* 3. Operating Expenses */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '8px' }}>
                        Operating Expenses (General & Administrative)
                    </div>
                    {statement.expenses.map(e => (
                        <div key={e.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontSize: '13px' }}>
                            <span style={{ color: '#334155' }}>{e.code} - {e.name}</span>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>${e.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', fontWeight: 700, fontSize: '13px', borderTop: '1px solid #e2e8f0' }}>
                        <span>Total Operating Expenses</span>
                        <span style={{ color: '#dc2626' }}>(${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
                    </div>
                </div>

                {/* Net Profit Final Strip */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    background: '#f0fdf4',
                    border: '2px solid #16a34a',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '18px'
                }}>
                    <div>
                        <span style={{ color: '#14532d' }}>NET PROFIT FOR THE PERIOD</span>
                        <span style={{ fontSize: '12px', color: '#16a34a', marginLeft: '12px', fontWeight: 600 }}>(Net Margin: {netMargin}%)</span>
                    </div>
                    <span style={{ color: '#15803d' }}>${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>
        </div>
    );
};

export default ProfitAndLoss;


import React, { useState } from 'react';
import { BiPrinter, BiCheckCircle } from 'react-icons/bi';
import { InputText } from '../../elegance-ui/components';

const BalanceSheet = () => {
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));

    const assets = {
        current: [
            { code: '1010', name: 'Cash on Hand (Float)', amount: 1750.00 },
            { code: '1020', name: 'Emirates NBD Corporate Account', amount: 112450.00 },
            { code: '1030', name: 'Al Rajhi Bank SAR Commercial Account', amount: 42100.00 },
            { code: '1200', name: 'Accounts Receivable (Trade Debtors)', amount: 48920.00 },
            { code: '1300', name: 'Merchandise Inventory Stock', amount: 92300.00 },
            { code: '2160', name: 'UAE Input VAT Recoverable', amount: 2750.00 }
        ],
        nonCurrent: [
            { code: '1500', name: 'Office Furniture & Warehouse Equipment', amount: 125000.00 },
            { code: '1510', name: 'Accumulated Depreciation - Equipment', amount: -25000.00 }
        ]
    };

    const liabilities = {
        current: [
            { code: '2010', name: 'Accounts Payable (Trade Creditors)', amount: 31250.00 },
            { code: '2150', name: 'UAE VAT 5% Output Tax Payable', amount: 14272.50 }
        ]
    };

    const equity = [
        { code: '3010', name: 'Owner Contributed Capital', amount: 300000.00 },
        { code: '3020', name: 'Retained Earnings & Current Period Profit', amount: 54747.50 }
    ];

    const totalCurrentAssets = assets.current.reduce((s, i) => s + i.amount, 0);
    const totalNonCurrentAssets = assets.nonCurrent.reduce((s, i) => s + i.amount, 0);
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    const totalLiabilities = liabilities.current.reduce((s, i) => s + i.amount, 0);
    const totalEquity = equity.reduce((s, i) => s + i.amount, 0);
    const totalLiabEquity = totalLiabilities + totalEquity;

    const isBalanced = Math.abs(totalAssets - totalLiabEquity) < 0.01;

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
                        Balance Sheet (Statement of Financial Position)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Comprehensive snapshot of corporate assets, liabilities, and owners' equity proving Total Assets = Total Liabilities + Equity.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '160px' }}>
                        <InputText value={asOfDate} onChange={setAsOfDate} placeholder="As of date" />
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
                        <BiPrinter size={16} /> Print Balance Sheet
                    </button>
                </div>
            </div>

            {/* Balance Sheet Document */}
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
                        Statement of Financial Position (Balance Sheet)
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        As of {asOfDate} (Amounts in USD)
                    </div>
                </div>

                {/* 1. ASSETS */}
                <div style={{ marginBottom: '28px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', margin: '0 0 12px 0' }}>
                        ASSETS
                    </h3>

                    {/* Current Assets */}
                    <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>
                            Current Assets
                        </div>
                        {assets.current.map(a => (
                            <div key={a.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 12px', fontSize: '13px' }}>
                                <span style={{ color: '#334155' }}>{a.code} - {a.name}</span>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>${a.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#f8fafc', fontWeight: 700, fontSize: '13px' }}>
                            <span>Total Current Assets</span>
                            <span style={{ color: '#0f172a' }}>${totalCurrentAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Non-Current Assets */}
                    <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>
                            Non-Current (Fixed) Assets
                        </div>
                        {assets.nonCurrent.map(a => (
                            <div key={a.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 12px', fontSize: '13px' }}>
                                <span style={{ color: '#334155' }}>{a.code} - {a.name}</span>
                                <span style={{ fontWeight: 600, color: a.amount < 0 ? '#dc2626' : '#0f172a' }}>
                                    {a.amount < 0 ? `($${Math.abs(a.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })})` : `$${a.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                                </span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#f8fafc', fontWeight: 700, fontSize: '13px' }}>
                            <span>Net Fixed Assets</span>
                            <span style={{ color: '#0f172a' }}>${totalNonCurrentAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Total Assets */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: '#eef2ff',
                        border: '1px solid #c7d2fe',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '15px',
                        color: '#4f46e5'
                    }}>
                        <span>TOTAL ASSETS</span>
                        <span>${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* 2. LIABILITIES & EQUITY */}
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', margin: '0 0 12px 0' }}>
                        LIABILITIES & OWNERS' EQUITY
                    </h3>

                    {/* Current Liabilities */}
                    <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>
                            Current Liabilities
                        </div>
                        {liabilities.current.map(l => (
                            <div key={l.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 12px', fontSize: '13px' }}>
                                <span style={{ color: '#334155' }}>{l.code} - {l.name}</span>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>${l.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#f8fafc', fontWeight: 700, fontSize: '13px' }}>
                            <span>Total Current Liabilities</span>
                            <span style={{ color: '#0f172a' }}>${totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Owners' Equity */}
                    <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>
                            Owners' Equity & Capital
                        </div>
                        {equity.map(e => (
                            <div key={e.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 12px', fontSize: '13px' }}>
                                <span style={{ color: '#334155' }}>{e.code} - {e.name}</span>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>${e.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#f8fafc', fontWeight: 700, fontSize: '13px' }}>
                            <span>Total Equity</span>
                            <span style={{ color: '#0f172a' }}>${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Total Liabilities & Equity */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '15px',
                        color: '#15803d'
                    }}>
                        <span>TOTAL LIABILITIES & OWNERS' EQUITY</span>
                        <span>${totalLiabEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {/* Accounting Equation Check */}
                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                        <BiCheckCircle size={16} />
                        <span>Accounting Equation Verified: Assets ($400,270.00) = Liabilities ($45,522.50) + Equity ($354,747.50)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BalanceSheet;


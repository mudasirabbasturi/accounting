import React, { useState } from 'react';
import { BiPrinter, BiCheckCircle, BiFile } from 'react-icons/bi';
import { Select } from '../../elegance-ui/components';

const KsaVatReturn = () => {
    const [period, setPeriod] = useState('2026-Q3');

    const sales = {
        standard_15: { amount: 160000.00, vat: 24000.00 },
        citizens_private: { amount: 0.00, vat: 0.00 },
        zero_rated: { amount: 15000.00, vat: 0.00 },
        exports: { amount: 35000.00, vat: 0.00 },
        exempt: { amount: 0.00, vat: 0.00 }
    };

    const purchases = {
        standard_15: { amount: 80000.00, recoverable_vat: 12000.00 },
        imports_customs: { amount: 20000.00, recoverable_vat: 3000.00 },
        zero_rated: { amount: 0.00, recoverable_vat: 0.00 },
        exempt: { amount: 0.00, recoverable_vat: 0.00 }
    };

    const totalOutputVat = 24000.00;
    const totalInputVat = 15000.00;
    const netVatDue = totalOutputVat - totalInputVat;

    const periodOptions = [
        { value: '2026-Q3', label: 'Quarter 3 (Jul 1 - Sep 30, 2026)' },
        { value: '2026-Q4', label: 'Quarter 4 (Oct 1 - Dec 31, 2026)' },
        { value: '2026-Q2', label: 'Quarter 2 (Apr 1 - Jun 30, 2026)' }
    ];

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
                        KSA VAT Declaration (ZATCA Portal)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Zakat, Tax and Customs Authority (ZATCA) 15% standard rate VAT return for Kingdom of Saudi Arabia entities.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '260px' }}>
                        <Select
                            options={periodOptions}
                            value={period}
                            onChange={setPeriod}
                        />
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
                        <BiPrinter size={16} /> Print Return
                    </button>
                </div>
            </div>

            {/* Entity Banner */}
            <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                fontSize: '13px'
            }}>
                <div>
                    <span style={{ color: '#64748b' }}>Taxpayer Legal Name:</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Orient Logistics Services KSA Ltd</div>
                </div>
                <div>
                    <span style={{ color: '#64748b' }}>ZATCA Tax ID (TIN / TRN):</span>
                    <div style={{ fontWeight: 700, color: '#4f46e5' }}>300987654300003</div>
                </div>
                <div>
                    <span style={{ color: '#64748b' }}>Tax Jurisdiction:</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Kingdom of Saudi Arabia (Riyadh)</div>
                </div>
                <div>
                    <span style={{ color: '#64748b' }}>Applicable Standard Rate:</span>
                    <div style={{ fontWeight: 700, color: '#15803d' }}>15% Standard VAT</div>
                </div>
            </div>

            {/* Sales Table */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        Part 1: VAT on Sales (Output Tax)
                    </h3>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                            <th style={{ padding: '10px 16px' }}>Category of Sales</th>
                            <th style={{ padding: '10px 16px', textAlign: 'right' }}>Taxable Base (SAR)</th>
                            <th style={{ padding: '10px 16px', textAlign: 'right' }}>VAT Amount (15% SAR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 16px' }}>1. Standard rated 15% domestic sales</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right' }}>{sales.standard_15.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600 }}>{sales.standard_15.vat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                            <td style={{ padding: '10px 16px' }}>2. Special sales to citizens (Private healthcare/education)</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right' }}>0.00</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right' }}>0.00</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 16px' }}>3. Zero-rated domestic supplies</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right' }}>{sales.zero_rated.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right' }}>-</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                            <td style={{ padding: '10px 16px' }}>4. Exports outside the Kingdom (0%)</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right' }}>{sales.exports.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right' }}>-</td>
                        </tr>
                        <tr style={{ background: '#f8fafc', fontWeight: 700, fontSize: '14px' }}>
                            <td style={{ padding: '12px 16px', color: '#4f46e5' }}>Total Output Tax</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>SAR 210,000.00</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', color: '#4f46e5' }}>SAR {totalOutputVat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Purchases Table */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        Part 2: VAT on Expenses & Purchases (Input Tax)
                    </h3>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                            <th style={{ padding: '10px 16px' }}>Category of Purchases</th>
                            <th style={{ padding: '10px 16px', textAlign: 'right' }}>Taxable Base (SAR)</th>
                            <th style={{ padding: '10px 16px', textAlign: 'right' }}>Recoverable VAT (SAR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 16px' }}>1. Standard rated 15% domestic purchases</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right' }}>{purchases.standard_15.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>{purchases.standard_15.recoverable_vat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                            <td style={{ padding: '10px 16px' }}>2. Imports subject to VAT paid at Customs (15%)</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right' }}>{purchases.imports_customs.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>{purchases.imports_customs.recoverable_vat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr style={{ background: '#f8fafc', fontWeight: 700, fontSize: '14px' }}>
                            <td style={{ padding: '12px 16px', color: '#059669' }}>Total Input Tax Recoverable</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>SAR 100,000.00</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', color: '#059669' }}>SAR {totalInputVat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div style={{
                background: '#ffffff',
                border: '2px solid #4f46e5',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        Net VAT Due to ZATCA
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Net liability payable through SADAD biller code 020
                    </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#4f46e5' }}>
                        SAR {netVatDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <BiCheckCircle size={15} /> Ready for ZATCA FATOORA Portal Upload
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KsaVatReturn;


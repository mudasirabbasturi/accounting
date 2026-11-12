import React, { useState } from 'react';
import { BiPrinter, BiBookBookmark, BiFilterAlt } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Select, InputText } from '../../elegance-ui/components';

const GeneralLedgerReport = () => {
    const [selectedAccount, setSelectedAccount] = useState('all');
    const [fromDate, setFromDate] = useState('2026-10-01');
    const [toDate, setToDate] = useState('2026-10-31');

    const allTransactions = [
        { id: 1, date: '2026-10-01', account_code: '1020', account_name: 'Emirates NBD Corporate Account', ref: 'JV-2026-0001', narration: 'Initial Owner Capital Deposit into Operating Account', debit: 300000.00, credit: 0.00, running_balance: 300000.00 },
        { id: 2, date: '2026-10-01', account_code: '3010', account_name: 'Owner Contributed Capital', ref: 'JV-2026-0001', narration: 'Initial Equity Contribution', debit: 0.00, credit: 300000.00, running_balance: 300000.00 },
        { id: 3, date: '2026-10-10', account_code: '6050', account_name: 'Depreciation Expense - Equipment', ref: 'JV-2026-0002', narration: 'Monthly Straight-Line Depreciation', debit: 2500.00, credit: 0.00, running_balance: 2500.00 },
        { id: 4, date: '2026-10-10', account_code: '1510', account_name: 'Accumulated Depreciation - Equipment', ref: 'JV-2026-0002', narration: 'Accumulated Depreciation Provision', debit: 0.00, credit: 2500.00, running_balance: -25000.00 },
        { id: 5, date: '2026-10-18', account_code: '2010', account_name: 'Accounts Payable (Trade Creditors)', ref: 'PMT-2026-001', narration: 'Settlement for Amazon Web Services PINV-2026-081', debit: 13125.00, credit: 0.00, running_balance: 18125.00 },
        { id: 6, date: '2026-10-18', account_code: '1020', account_name: 'Emirates NBD Corporate Account', ref: 'PMT-2026-001', narration: 'Wire payment to AWS MENA', debit: 0.00, credit: 13125.00, running_balance: 286875.00 },
        { id: 7, date: '2026-10-25', account_code: '1020', account_name: 'Emirates NBD Corporate Account', ref: 'RCT-2026-001', narration: 'Inward remittance from Al-Futtaim Logistics INV-2026-0001', debit: 14700.00, credit: 0.00, running_balance: 301575.00 },
        { id: 8, date: '2026-10-25', account_code: '1200', account_name: 'Accounts Receivable (Trade Debtors)', ref: 'RCT-2026-001', narration: 'Receivable cleared by Al-Futtaim Logistics', debit: 0.00, credit: 14700.00, running_balance: 48920.00 }
    ];

    const filteredRows = allTransactions.filter(t => {
        if (selectedAccount !== 'all' && t.account_code !== selectedAccount) return false;
        return true;
    });

    const columnDefs = [
        { field: 'date', headerName: 'Posting Date', width: 120, pinned: 'left' },
        { field: 'account_code', headerName: 'Acct #', width: 100, cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'account_name', headerName: 'Account Title', width: 220, cellStyle: { fontWeight: 600 } },
        { field: 'ref', headerName: 'Voucher Ref', width: 150 },
        { field: 'narration', headerName: 'Transaction Narration', flex: 1, minWidth: 260 },
        { 
            field: 'debit', 
            headerName: 'Debit ($)', 
            width: 140, 
            cellStyle: p => ({ fontWeight: p.value > 0 ? 700 : 400 }),
            valueFormatter: p => p.value > 0 ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-' 
        },
        { 
            field: 'credit', 
            headerName: 'Credit ($)', 
            width: 140, 
            cellStyle: p => ({ fontWeight: p.value > 0 ? 700 : 400 }),
            valueFormatter: p => p.value > 0 ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-' 
        },
        { 
            field: 'running_balance', 
            headerName: 'Cumulative Balance', 
            width: 170, 
            cellStyle: { fontWeight: 700, color: '#0f172a' },
            valueFormatter: p => `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
        }
    ];

    const accountFilterOptions = [
        { value: 'all', label: 'All General Ledger Accounts' },
        { value: '1020', label: '1020 - Emirates NBD Corporate Account' },
        { value: '1200', label: '1200 - Accounts Receivable' },
        { value: '2010', label: '2010 - Accounts Payable' },
        { value: '3010', label: '3010 - Owner Contributed Capital' }
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
                        General Ledger Account Activity Report
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Detailed chronological ledger entries showing historical debits, credits, and cumulative running balances per account.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ width: '260px' }}>
                        <Select
                            options={accountFilterOptions}
                            value={selectedAccount}
                            onChange={setSelectedAccount}
                        />
                    </div>

                    <div style={{ width: '130px' }}>
                        <InputText value={fromDate} onChange={setFromDate} placeholder="From Date" />
                    </div>
                    <span style={{ color: '#64748b' }}>to</span>
                    <div style={{ width: '130px' }}>
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
                        <BiPrinter size={16} /> Print GL
                    </button>
                </div>
            </div>

            <AgGridTable
                title="General Ledger Transactions Detail"
                rowData={filteredRows}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />
        </div>
    );
};

export default GeneralLedgerReport;


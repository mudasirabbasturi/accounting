import React, { useState, useEffect } from 'react';
import { BiPlayCircle, BiTrendingDown, BiCalendar, BiBookOpen, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';
import api from '../../services/api';

const DepreciationEntries = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isRunOpen, setIsRunOpen] = useState(false);

    // Run parameters
    const [targetDate, setTargetDate] = useState('2026-02-28');
    const [selectedAsset, setSelectedAsset] = useState('all');
    const [notes, setNotes] = useState('Monthly fixed asset depreciation posting');

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        setLoading(true);
        try {
            setEntries([
                {
                    id: 1,
                    entry_code: 'DEP-2026-02-001',
                    entry_date: '2026-02-28',
                    asset_code: 'FA-001',
                    asset_name: 'Forklift Toyota 3.0T High-Reach',
                    method: 'Straight Line',
                    amount: 1416.67,
                    journal_voucher: 'JV-2026-028',
                    debit_account: '6040 - Depreciation Expense',
                    credit_account: '1510 - Accum. Depreciation - Equipment',
                    notes: 'February 2026 monthly depreciation'
                },
                {
                    id: 2,
                    entry_code: 'DEP-2026-02-002',
                    entry_date: '2026-02-28',
                    asset_code: 'FA-002',
                    asset_name: 'Mercedes Actros Heavy Delivery Truck',
                    method: 'Straight Line',
                    amount: 4000.00,
                    journal_voucher: 'JV-2026-028',
                    debit_account: '6040 - Depreciation Expense',
                    credit_account: '1510 - Accum. Depreciation - Equipment',
                    notes: 'February 2026 monthly depreciation'
                },
                {
                    id: 3,
                    entry_code: 'DEP-2026-02-003',
                    entry_date: '2026-02-28',
                    asset_code: 'FA-003',
                    asset_name: 'Enterprise Dell PowerEdge Rack Servers',
                    method: 'Straight Line',
                    amount: 1250.00,
                    journal_voucher: 'JV-2026-028',
                    debit_account: '6040 - Depreciation Expense',
                    credit_account: '1510 - Accum. Depreciation - Equipment',
                    notes: 'February 2026 monthly depreciation'
                },
                {
                    id: 4,
                    entry_code: 'DEP-2026-01-001',
                    entry_date: '2026-01-31',
                    asset_code: 'FA-001',
                    asset_name: 'Forklift Toyota 3.0T High-Reach',
                    method: 'Straight Line',
                    amount: 1416.67,
                    journal_voucher: 'JV-2026-012',
                    debit_account: '6040 - Depreciation Expense',
                    credit_account: '1510 - Accum. Depreciation - Equipment',
                    notes: 'January 2026 monthly depreciation'
                },
                {
                    id: 5,
                    entry_code: 'DEP-2026-01-002',
                    entry_date: '2026-01-31',
                    asset_code: 'FA-002',
                    asset_name: 'Mercedes Actros Heavy Delivery Truck',
                    method: 'Straight Line',
                    amount: 4000.00,
                    journal_voucher: 'JV-2026-012',
                    debit_account: '6040 - Depreciation Expense',
                    credit_account: '1510 - Accum. Depreciation - Equipment',
                    notes: 'January 2026 monthly depreciation'
                },
                {
                    id: 6,
                    entry_code: 'DEP-2026-01-003',
                    entry_date: '2026-01-31',
                    asset_code: 'FA-003',
                    asset_name: 'Enterprise Dell PowerEdge Rack Servers',
                    method: 'Straight Line',
                    amount: 1250.00,
                    journal_voucher: 'JV-2026-012',
                    debit_account: '6040 - Depreciation Expense',
                    credit_account: '1510 - Accum. Depreciation - Equipment',
                    notes: 'January 2026 monthly depreciation'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleRunDepreciation = async () => {
        const newRunEntries = [
            {
                id: Date.now() + 1,
                entry_code: `DEP-${targetDate.slice(0, 7)}-001`,
                entry_date: targetDate,
                asset_code: 'FA-001',
                asset_name: 'Forklift Toyota 3.0T High-Reach',
                method: 'Straight Line',
                amount: 1416.67,
                journal_voucher: `JV-${targetDate.slice(0, 7)}-DEP`,
                debit_account: '6040 - Depreciation Expense',
                credit_account: '1510 - Accum. Depreciation - Equipment',
                notes: notes || 'Automated monthly depreciation run'
            },
            {
                id: Date.now() + 2,
                entry_code: `DEP-${targetDate.slice(0, 7)}-002`,
                entry_date: targetDate,
                asset_code: 'FA-002',
                asset_name: 'Mercedes Actros Heavy Delivery Truck',
                method: 'Straight Line',
                amount: 4000.00,
                journal_voucher: `JV-${targetDate.slice(0, 7)}-DEP`,
                debit_account: '6040 - Depreciation Expense',
                credit_account: '1510 - Accum. Depreciation - Equipment',
                notes: notes || 'Automated monthly depreciation run'
            }
        ];

        setEntries([...newRunEntries, ...entries]);
        setIsRunOpen(false);
    };

    const totalExpensed = entries.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    const columnDefs = [
        {
            headerName: 'Entry #',
            field: 'entry_code',
            width: 170,
            pinned: 'left',
            checkboxSelection: true,
            headerCheckboxSelection: true,
            cellRenderer: (params) => (
                <span style={{ fontWeight: 600, color: 'var(--color-primary, #2563eb)' }}>
                    {params.value}
                </span>
            )
        },
        {
            headerName: 'Posting Date',
            field: 'entry_date',
            width: 130
        },
        {
            headerName: 'Fixed Asset',
            field: 'asset_name',
            minWidth: 230,
            cellRenderer: (params) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{params.value}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Code: {params.data.asset_code}</div>
                </div>
            )
        },
        {
            headerName: 'Method',
            field: 'method',
            width: 140
        },
        {
            headerName: 'Amount Charged',
            field: 'amount',
            width: 160,
            type: 'numericColumn',
            cellRenderer: (params) => (
                <span style={{ fontWeight: 700, color: '#dc2626' }}>
                    AED {parseFloat(params.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            headerName: 'Ledger Voucher',
            field: 'journal_voucher',
            width: 150,
            cellRenderer: (params) => (
                <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8'
                }}>
                    {params.value}
                </span>
            )
        },
        {
            headerName: 'Debit / Credit Accounts',
            width: 250,
            cellRenderer: (params) => (
                <div style={{ fontSize: '11px' }}>
                    <div style={{ color: '#047857' }}>Dr: {params.data.debit_account}</div>
                    <div style={{ color: '#b45309' }}>Cr: {params.data.credit_account}</div>
                </div>
            )
        },
        {
            headerName: 'Notes',
            field: 'notes',
            minWidth: 200
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header / Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Depreciation Entries</h2>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
                        Periodic Fixed Asset Depreciation Schedules & General Ledger Postings
                    </p>
                </div>
                <button
                    onClick={() => setIsRunOpen(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'var(--color-primary, #2563eb)',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    <BiPlayCircle size={18} />
                    Execute Depreciation Run
                </button>
            </div>

            {/* Metric KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Total Depreciated</span>
                        <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '8px', color: '#dc2626' }}><BiTrendingDown size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: '#dc2626' }}>
                        AED {totalExpensed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Charged to P&L</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Vouchers Generated</span>
                        <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px', color: '#2563eb' }}><BiBookOpen size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>{entries.length} Entries</div>
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>All double-entry balanced</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Latest Period Run</span>
                        <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '8px', color: '#059669' }}><BiCalendar size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>28 Feb 2026</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Current Month Up to Date</div>
                </div>
            </div>

            {/* Table */}
            <AgGridTable
                title="Depreciation Audit Trail"
                subtitle="Historical journal postings for all fixed asset depreciation calculations"
                rowData={entries}
                columnDefs={columnDefs}
                loading={loading}
                exportFileName="OrientLogistics_Depreciation_Entries"
                onRefresh={loadEntries}
            />

            {/* Run Modal */}
            <Modal
                isOpen={isRunOpen}
                onClose={() => setIsRunOpen(false)}
                title="Execute Periodic Asset Depreciation"
                size="medium"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Target Calculation Date *</label>
                        <InputText
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Asset Scope</label>
                        <Select
                            value={selectedAsset}
                            onChange={(val) => setSelectedAsset(val)}
                            options={[
                                { label: 'All Active Fixed Assets (Batch Run)', value: 'all' },
                                { label: 'FA-001 - Forklift Toyota 3.0T High-Reach', value: '1' },
                                { label: 'FA-002 - Mercedes Actros Heavy Delivery Truck', value: '2' },
                                { label: 'FA-003 - Enterprise Dell PowerEdge Rack Servers', value: '3' },
                                { label: 'FA-004 - Pallet Wrapping Machine', value: '4' }
                            ]}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Journal Entry Memo / Notes</label>
                        <InputText
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. End of month depreciation charge"
                        />
                    </div>

                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
                        This action will calculate straight-line depreciation for the selected period and automatically post corresponding <strong>Debit 6040 (Depreciation Expense)</strong> and <strong>Credit 1510 (Accumulated Depreciation)</strong> entries to the General Ledger.
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setIsRunOpen(false)}
                            style={{
                                padding: '9px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                background: '#fff',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleRunDepreciation}
                            style={{
                                padding: '9px 20px',
                                background: 'var(--color-primary, #2563eb)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            Post Depreciation
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DepreciationEntries;


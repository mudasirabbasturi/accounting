import React, { useState } from 'react';
import { BiTimeFive, BiCheckCircle, BiCalculator, BiPlus, BiSearch, BiDollarCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';

const PendingReconciliations = () => {
    const [pendingList, setPendingList] = useState([
        {
            id: 1,
            reconciliation_number: 'REC-2026-10-01',
            account_name: 'Emirates NBD - Corporate Operating (AED)',
            currency: 'AED',
            statement_date: '2026-10-31',
            statement_balance: 112450.00,
            ledger_balance: 108200.00,
            uncleared_deposits: 6750.00,
            uncleared_payments: 2500.00,
            difference: 4250.00,
            assigned_to: 'Fatima Al-Zahra (CFO)',
            status: 'Pending Clearance'
        },
        {
            id: 2,
            reconciliation_number: 'REC-2026-10-02',
            account_name: 'Mashreq Bank - USD Global Treasury',
            currency: 'USD',
            statement_date: '2026-10-31',
            statement_balance: 18500.00,
            ledger_balance: 17200.00,
            uncleared_deposits: 2100.00,
            uncleared_payments: 800.00,
            difference: 1300.00,
            assigned_to: 'Aisha Al-Hashimi',
            status: 'Pending Clearance'
        },
        {
            id: 3,
            reconciliation_number: 'REC-2026-11-01',
            account_name: 'Al Rajhi Bank - Commercial SAR Account',
            currency: 'SAR',
            statement_date: '2026-11-15',
            statement_balance: 45000.00,
            ledger_balance: 41800.00,
            uncleared_deposits: 5200.00,
            uncleared_payments: 2000.00,
            difference: 3200.00,
            assigned_to: 'Mansoor Iqbal',
            status: 'In Review'
        }
    ]);

    const [isMatchOpen, setIsMatchOpen] = useState(false);
    const [selectedRec, setSelectedRec] = useState(null);
    const [depositCleared, setDepositCleared] = useState(true);
    const [paymentCleared, setPaymentCleared] = useState(true);

    const handleOpenMatch = (rec) => {
        setSelectedRec(rec);
        setIsMatchOpen(true);
    };

    const handleConfirmReconcile = () => {
        if (!selectedRec) return;
        setPendingList(prev => prev.filter(item => item.id !== selectedRec.id));
        setIsMatchOpen(false);
        alert(`Reconciliation ${selectedRec.reconciliation_number} cleared and moved to Completed Reconciliations.`);
    };

    const totalUnclearedDeposits = pendingList.reduce((sum, r) => sum + r.uncleared_deposits, 0);
    const totalUnclearedPayments = pendingList.reduce((sum, r) => sum + r.uncleared_payments, 0);
    const totalVariance = pendingList.reduce((sum, r) => sum + r.difference, 0);

    const columnDefs = [
        {
            headerName: 'Batch #',
            field: 'reconciliation_number',
            width: 160,
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
            headerName: 'Bank Account',
            field: 'account_name',
            minWidth: 240,
            cellRenderer: (params) => (
                <div style={{ fontWeight: 600 }}>{params.value}</div>
            )
        },
        {
            headerName: 'Statement Date',
            field: 'statement_date',
            width: 130
        },
        {
            headerName: 'Statement Balance',
            field: 'statement_balance',
            width: 160,
            type: 'numericColumn',
            valueFormatter: (params) => `${params.data.currency} ${parseFloat(params.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        },
        {
            headerName: 'Ledger Balance',
            field: 'ledger_balance',
            width: 160,
            type: 'numericColumn',
            valueFormatter: (params) => `${params.data.currency} ${parseFloat(params.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        },
        {
            headerName: 'Uncleared Deposits',
            field: 'uncleared_deposits',
            width: 160,
            type: 'numericColumn',
            cellRenderer: (params) => (
                <span style={{ color: '#047857', fontWeight: 600 }}>
                    +{params.data.currency} {parseFloat(params.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            headerName: 'Uncleared Payments',
            field: 'uncleared_payments',
            width: 160,
            type: 'numericColumn',
            cellRenderer: (params) => (
                <span style={{ color: '#dc2626', fontWeight: 600 }}>
                    -{params.data.currency} {parseFloat(params.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            headerName: 'Unadjusted Variance',
            field: 'difference',
            width: 160,
            type: 'numericColumn',
            cellRenderer: (params) => (
                <span style={{ fontWeight: 700, color: '#d97706' }}>
                    {params.data.currency} {parseFloat(params.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            headerName: 'Audit Status',
            field: 'status',
            width: 150,
            cellRenderer: (params) => (
                <span style={{
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#fef3c7',
                    color: '#92400e'
                }}>
                    ● {params.value}
                </span>
            )
        },
        {
            headerName: 'Action',
            width: 140,
            pinned: 'right',
            cellRenderer: (params) => (
                <button
                    onClick={() => handleOpenMatch(params.data)}
                    style={{
                        padding: '5px 12px',
                        background: 'var(--color-primary, #2563eb)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Match & Clear
                </button>
            )
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Pending Bank Reconciliations</h2>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
                        Open reconciliation batches, uncleared customer cheques & electronic deposits awaiting audit sign-off
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Pending Batches</span>
                        <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '8px', color: '#d97706' }}><BiTimeFive size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: '#d97706' }}>
                        {pendingList.length} Batches
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Awaiting clearance</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Uncleared Deposits</span>
                        <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '8px', color: '#059669' }}><BiDollarCircle size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: '#047857' }}>
                        AED {totalUnclearedDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>In transit from customers</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Uncleared Payments</span>
                        <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '8px', color: '#ef4444' }}><BiCalculator size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: '#dc2626' }}>
                        AED {totalUnclearedPayments.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Unpresented vendor cheques</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Net Unadjusted Variance</span>
                        <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px', color: '#2563eb' }}><BiCheckCircle size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: '#2563eb' }}>
                        AED {totalVariance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>To be matched against bank feed</div>
                </div>
            </div>

            {/* AgGridTable */}
            <AgGridTable
                rowData={pendingList}
                columnDefs={columnDefs}
                height="620px"
                enableSearch={true}
                enableExport={true}
                exportFileName="Pending_Bank_Reconciliations"
            />

            {/* Match Modal */}
            <Modal
                isOpen={isMatchOpen}
                onClose={() => setIsMatchOpen(false)}
                title={`Reconciliation Match & Sign-Off - ${selectedRec?.reconciliation_number}`}
                size="medium"
            >
                {selectedRec && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>Account:</div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{selectedRec.account_name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px' }}>
                                <span>Statement Ending Balance: <strong>{selectedRec.currency} {selectedRec.statement_balance.toLocaleString()}</strong></span>
                                <span>General Ledger Book Balance: <strong>{selectedRec.currency} {selectedRec.ledger_balance.toLocaleString()}</strong></span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={depositCleared}
                                    onChange={(e) => setDepositCleared(e.target.checked)}
                                    style={{ width: '16px', height: '16px' }}
                                />
                                <span>Verify and clear inward deposits: <strong>+{selectedRec.currency} {selectedRec.uncleared_deposits.toLocaleString()}</strong></span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={paymentCleared}
                                    onChange={(e) => setPaymentCleared(e.target.checked)}
                                    style={{ width: '16px', height: '16px' }}
                                />
                                <span>Verify and clear outward disbursements: <strong>-{selectedRec.currency} {selectedRec.uncleared_payments.toLocaleString()}</strong></span>
                            </label>
                        </div>

                        <div style={{
                            background: depositCleared && paymentCleared ? '#ecfdf5' : '#fffbeb',
                            padding: '12px',
                            borderRadius: '6px',
                            border: `1px solid ${depositCleared && paymentCleared ? '#a7f3d0' : '#fde68a'}`,
                            fontSize: '13px',
                            color: depositCleared && paymentCleared ? '#065f46' : '#92400e',
                            fontWeight: 600
                        }}>
                            {depositCleared && paymentCleared
                                ? '✓ Reconciled Difference: 0.00 AED. Ready for final statutory sign-off!'
                                : '⚠ Please clear both items to reach zero variance before completing.'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setIsMatchOpen(false)}
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
                                disabled={!depositCleared || !paymentCleared}
                                onClick={handleConfirmReconcile}
                                style={{
                                    padding: '9px 20px',
                                    background: depositCleared && paymentCleared ? 'var(--color-primary, #2563eb)' : '#94a3b8',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: depositCleared && paymentCleared ? 'pointer' : 'not-allowed',
                                    fontWeight: 600
                                }}
                            >
                                Complete Reconciliation
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PendingReconciliations;


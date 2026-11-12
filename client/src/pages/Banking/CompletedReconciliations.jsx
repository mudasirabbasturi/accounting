import React, { useState } from 'react';
import { BiCheckShield, BiCheckCircle, BiFile, BiPrinter, BiDollarCircle, BiAward } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal } from '../../elegance-ui/components';

const CompletedReconciliations = () => {
    const [completedList] = useState([
        {
            id: 101,
            reconciliation_number: 'REC-2026-09-01',
            account_name: 'Emirates NBD - Corporate Operating (AED)',
            currency: 'AED',
            statement_date: '2026-09-30',
            statement_balance: 104500.00,
            ledger_balance: 104500.00,
            difference: 0.00,
            reconciled_by: 'Fatima Al-Zahra (CFO)',
            completed_at: '2026-10-02 11:30',
            status: 'Reconciled & Locked'
        },
        {
            id: 102,
            reconciliation_number: 'REC-2026-09-02',
            account_name: 'Al Rajhi Bank - Commercial SAR Account',
            currency: 'SAR',
            statement_date: '2026-09-30',
            statement_balance: 38200.00,
            ledger_balance: 38200.00,
            difference: 0.00,
            reconciled_by: 'Fatima Al-Zahra (CFO)',
            completed_at: '2026-10-02 14:15',
            status: 'Reconciled & Locked'
        },
        {
            id: 103,
            reconciliation_number: 'REC-2026-08-01',
            account_name: 'Emirates NBD - Corporate Operating (AED)',
            currency: 'AED',
            statement_date: '2026-08-31',
            statement_balance: 92400.00,
            ledger_balance: 92400.00,
            difference: 0.00,
            reconciled_by: 'Aisha Al-Hashimi',
            completed_at: '2026-09-03 09:40',
            status: 'Reconciled & Locked'
        },
        {
            id: 104,
            reconciliation_number: 'REC-2026-08-02',
            account_name: 'Mashreq Bank - USD Global Treasury',
            currency: 'USD',
            statement_date: '2026-08-31',
            statement_balance: 24500.00,
            ledger_balance: 24500.00,
            difference: 0.00,
            reconciled_by: 'Aisha Al-Hashimi',
            completed_at: '2026-09-03 12:10',
            status: 'Reconciled & Locked'
        }
    ]);

    const [selectedCert, setSelectedCert] = useState(null);
    const [isCertOpen, setIsCertOpen] = useState(false);

    const handleViewCert = (item) => {
        setSelectedCert(item);
        setIsCertOpen(true);
    };

    const totalAuditedVolume = completedList.reduce((sum, r) => sum + r.statement_balance, 0);

    const columnDefs = [
        {
            headerName: 'Certificate #',
            field: 'reconciliation_number',
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
            headerName: 'Bank Account',
            field: 'account_name',
            minWidth: 260,
            cellRenderer: (params) => (
                <div style={{ fontWeight: 600 }}>{params.value}</div>
            )
        },
        {
            headerName: 'Statement Period Ending',
            field: 'statement_date',
            width: 170
        },
        {
            headerName: 'Bank Balance',
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
            headerName: 'Variance',
            field: 'difference',
            width: 130,
            type: 'numericColumn',
            cellRenderer: () => (
                <span style={{ fontWeight: 700, color: '#047857' }}>
                    0.00
                </span>
            )
        },
        {
            headerName: 'Audited & Signed By',
            field: 'reconciled_by',
            width: 190
        },
        {
            headerName: 'Audit Status',
            field: 'status',
            width: 170,
            cellRenderer: (params) => (
                <span style={{
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#ecfdf5',
                    color: '#065f46'
                }}>
                    ✓ {params.value}
                </span>
            )
        },
        {
            headerName: 'Action',
            width: 140,
            pinned: 'right',
            cellRenderer: (params) => (
                <button
                    onClick={() => handleViewCert(params.data)}
                    style={{
                        padding: '5px 12px',
                        background: '#fff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    View Certificate
                </button>
            )
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Completed Bank Reconciliations</h2>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
                        Audited and finalized bank reconciliation certificates with confirmed zero variance & signed off balances
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Reconciled Periods</span>
                        <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '8px', color: '#059669' }}><BiCheckShield size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: '#047857' }}>
                        {completedList.length} Periods
                    </div>
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Audited & permanently locked</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Total Audited Volume</span>
                        <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px', color: '#2563eb' }}><BiDollarCircle size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>
                        AED {totalAuditedVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Across commercial accounts</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Audited Difference</span>
                        <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '8px', color: '#047857' }}><BiCheckCircle size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: '#047857' }}>
                        0.00 AED
                    </div>
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Perfect reconciliation match</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Audit Accuracy Rate</span>
                        <div style={{ background: '#f5f3ff', padding: '8px', borderRadius: '8px', color: '#7c3aed' }}><BiAward size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: '#7c3aed' }}>
                        100.0%
                    </div>
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Compliant with IFRS standards</div>
                </div>
            </div>

            {/* AgGridTable */}
            <AgGridTable
                rowData={completedList}
                columnDefs={columnDefs}
                height="620px"
                enableSearch={true}
                enableExport={true}
                exportFileName="Completed_Bank_Reconciliations"
            />

            {/* Certificate Modal */}
            <Modal
                isOpen={isCertOpen}
                onClose={() => setIsCertOpen(false)}
                title="Bank Reconciliation Statutory Certificate"
                size="medium"
            >
                {selectedCert && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{
                            border: '2px solid #059669',
                            borderRadius: '10px',
                            padding: '20px',
                            background: '#f0fdf4',
                            textAlign: 'center'
                        }}>
                            <BiCheckShield size={44} color="#059669" style={{ margin: '0 auto 8px' }} />
                            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: '#065f46' }}>
                                Bank Balance Confirmed & Verified
                            </h3>
                            <div style={{ fontSize: '13px', color: '#047857' }}>
                                Certificate Number: <strong>{selectedCert.reconciliation_number}</strong>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                            <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ color: '#64748b', fontSize: '11px' }}>ACCOUNT</div>
                                <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedCert.account_name}</div>
                            </div>
                            <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ color: '#64748b', fontSize: '11px' }}>PERIOD ENDING</div>
                                <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedCert.statement_date}</div>
                            </div>
                            <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ color: '#64748b', fontSize: '11px' }}>CLOSING BANK BALANCE</div>
                                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                                    {selectedCert.currency} {selectedCert.statement_balance.toLocaleString()}
                                </div>
                            </div>
                            <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ color: '#64748b', fontSize: '11px' }}>GENERAL LEDGER BALANCE</div>
                                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                                    {selectedCert.currency} {selectedCert.ledger_balance.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f8fafc',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            fontSize: '13px'
                        }}>
                            <div>
                                <span style={{ color: '#64748b' }}>Signed off by: </span>
                                <strong>{selectedCert.reconciled_by}</strong>
                            </div>
                            <div style={{ color: '#64748b' }}>
                                {selectedCert.completed_at}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                            <button
                                type="button"
                                onClick={() => setIsCertOpen(false)}
                                style={{
                                    padding: '9px 16px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    background: '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '9px 20px',
                                    background: 'var(--color-primary, #2563eb)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                <BiPrinter size={16} /> Print Certificate
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CompletedReconciliations;


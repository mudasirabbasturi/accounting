import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BiPlus, BiCheckCircle, BiTimeFive, BiCalculator, BiFile } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';
import api from '../../services/api';

const BankReconciliations = ({ defaultStatus = null }) => {
    const location = useLocation();
    
    // Determine initial status filter from URL or props
    const isCompletedRoute = defaultStatus === 'Completed' || location.pathname.includes('/completed');
    const isPendingRoute = defaultStatus === 'Pending' || location.pathname.includes('/pending');
    
    const [statusFilter, setStatusFilter] = useState(
        isCompletedRoute ? 'Completed' : (isPendingRoute ? 'Pending' : 'All')
    );

    const [reconciliations, setReconciliations] = useState([
        {
            id: 1,
            reconciliation_number: 'REC-2026-09-01',
            account_name: 'Emirates NBD - Corporate Operating',
            currency: 'AED',
            statement_date: '2026-09-30',
            statement_balance: 104500.00,
            ledger_balance: 104500.00,
            uncleared_deposits: 0.00,
            uncleared_payments: 0.00,
            difference: 0.00,
            reconciled_by: 'Fatima Al-Zahra',
            status: 'Completed'
        },
        {
            id: 2,
            reconciliation_number: 'REC-2026-09-02',
            account_name: 'Al Rajhi Bank - Commercial SAR Account',
            currency: 'SAR',
            statement_date: '2026-09-30',
            statement_balance: 38200.00,
            ledger_balance: 38200.00,
            uncleared_deposits: 0.00,
            uncleared_payments: 0.00,
            difference: 0.00,
            reconciled_by: 'Fatima Al-Zahra',
            status: 'Completed'
        },
        {
            id: 3,
            reconciliation_number: 'REC-2026-10-01',
            account_name: 'Emirates NBD - Corporate Operating',
            currency: 'AED',
            statement_date: '2026-10-31',
            statement_balance: 112450.00,
            ledger_balance: 112450.00,
            uncleared_deposits: 0.00,
            uncleared_payments: 0.00,
            difference: 0.00,
            reconciled_by: 'Fatima Al-Zahra',
            status: 'Pending'
        },
        {
            id: 4,
            reconciliation_number: 'REC-2026-10-02',
            account_name: 'Mashreq Bank - USD Global Treasury',
            currency: 'USD',
            statement_date: '2026-10-31',
            statement_balance: 8500.00,
            ledger_balance: 8500.00,
            uncleared_deposits: 0.00,
            uncleared_payments: 0.00,
            difference: 0.00,
            reconciled_by: 'Pending Audit',
            status: 'Pending'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState('1');
    const [stmtDate, setStmtDate] = useState(new Date().toISOString().slice(0, 10));
    const [stmtBalance, setStmtBalance] = useState(112450);

    const filteredRows = reconciliations.filter(r => {
        if (statusFilter === 'All') return true;
        return r.status === statusFilter;
    });

    const handleCreateReconciliation = () => {
        const newRec = {
            id: Date.now(),
            reconciliation_number: `REC-2026-${String(reconciliations.length + 5).padStart(2, '0')}`,
            account_name: selectedAccount === '1' ? 'Emirates NBD - Corporate Operating' : 'Al Rajhi Bank SAR Account',
            currency: selectedAccount === '1' ? 'AED' : 'SAR',
            statement_date: stmtDate,
            statement_balance: parseFloat(stmtBalance || 0),
            ledger_balance: parseFloat(stmtBalance || 0),
            uncleared_deposits: 0.00,
            uncleared_payments: 0.00,
            difference: 0.00,
            reconciled_by: 'Current User',
            status: 'Pending'
        };

        setReconciliations(prev => [newRec, ...prev]);
        setIsCreateOpen(false);
    };

    const columnDefs = [
        { field: 'reconciliation_number', headerName: 'Reconciliation #', width: 170, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'account_name', headerName: 'Bank Account', flex: 1, minWidth: 220, cellStyle: { fontWeight: 600 } },
        { field: 'statement_date', headerName: 'Statement Cut-Off', width: 150 },
        { 
            field: 'statement_balance', 
            headerName: 'Statement Balance', 
            width: 170, 
            cellStyle: { fontWeight: 600 },
            valueFormatter: p => p.value ? `${p.data?.currency} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        { 
            field: 'ledger_balance', 
            headerName: 'General Ledger Bal', 
            width: 170, 
            valueFormatter: p => p.value ? `${p.data?.currency} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        { 
            field: 'difference', 
            headerName: 'Discrepancy (Diff)', 
            width: 160, 
            cellStyle: p => ({ color: p.value !== 0 ? '#dc2626' : '#15803d', fontWeight: 700 }),
            valueFormatter: p => p.value ? `${p.data?.currency} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        { field: 'reconciled_by', headerName: 'Reconciled By', width: 160 },
        {
            field: 'status',
            headerName: 'Audit Status',
            width: 130,
            cellRenderer: (params) => {
                const isComp = params.value === 'Completed';
                return (
                    <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: isComp ? '#dcfce7' : '#fef3c7',
                        color: isComp ? '#15803d' : '#b45309',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {isComp ? <BiCheckCircle size={12} /> : <BiTimeFive size={12} />}
                        {params.value}
                    </span>
                );
            }
        }
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
                        Bank Account Statement Reconciliations
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Match electronic bank statements against general ledger cash movements to clear deposits in transit and outstanding cheques.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Status filter tabs */}
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
                        {['All', 'Pending', 'Completed'].map(tab => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setStatusFilter(tab)}
                                style={{
                                    padding: '6px 14px',
                                    border: 'none',
                                    borderRadius: '5px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    background: statusFilter === tab ? '#ffffff' : 'transparent',
                                    color: statusFilter === tab ? '#4f46e5' : '#64748b',
                                    boxShadow: statusFilter === tab ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setIsCreateOpen(true)}
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
                        <BiPlus size={18} /> New Reconciliation
                    </button>
                </div>
            </div>

            <AgGridTable
                title={`Bank Reconciliations Register (${statusFilter})`}
                rowData={filteredRows}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE RECONCILIATION MODAL */}
            <Modal
                open={isCreateOpen}
                title="Start Bank Statement Reconciliation"
                width={560}
                onOk={handleCreateReconciliation}
                onCancel={() => setIsCreateOpen(false)}
                okText="Initialize Reconciliation"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Bank Account to Reconcile <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <Select
                            options={[
                                { value: '1', label: 'Emirates NBD - Corporate Operating (AED)' },
                                { value: '2', label: 'Al Rajhi Bank - Commercial (SAR)' },
                                { value: '3', label: 'Mashreq Bank - USD Global Treasury (USD)' }
                            ]}
                            value={selectedAccount}
                            onChange={setSelectedAccount}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Statement Ending Date
                            </label>
                            <InputText value={stmtDate} onChange={setStmtDate} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Ending Statement Balance
                            </label>
                            <InputNumber
                                value={stmtBalance}
                                precision={2}
                                onChange={setStmtBalance}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default BankReconciliations;


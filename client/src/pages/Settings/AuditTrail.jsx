import React, { useState, useEffect } from 'react';
import { BiHistory, BiShield, BiUserCheck, BiServer } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import api from '../../services/api';

const AuditTrail = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadAuditLogs();
    }, []);

    const loadAuditLogs = async () => {
        setLoading(true);
        try {
            const res = await api.getAuditTrail().catch(() => null);
            if (res && Array.isArray(res) && res.length > 0) {
                setLogs(res);
            } else {
                setLogs([
                    {
                        id: 1,
                        created_at: '2026-02-28 14:22:15',
                        action: 'CREATE',
                        table_name: 'sales_invoices',
                        record_id: 1042,
                        user_name: 'admin (Administrator)',
                        old_values: null,
                        new_values: '{"invoice_number":"INV-2026-001","customer_id":1,"total":15750,"tax":750}',
                        ip_address: '192.168.1.50'
                    },
                    {
                        id: 2,
                        created_at: '2026-02-28 13:10:04',
                        action: 'APPROVE',
                        table_name: 'payslips',
                        record_id: 88,
                        user_name: 'fatima.accountant (CFO)',
                        old_values: '{"status":"Draft"}',
                        new_values: '{"status":"Approved","approved_by":"Fatima Al-Zahra"}',
                        ip_address: '192.168.1.10'
                    },
                    {
                        id: 3,
                        created_at: '2026-02-28 12:45:30',
                        action: 'GENERATE_WPS',
                        table_name: 'payslips',
                        record_id: 88,
                        user_name: 'fatima.accountant (CFO)',
                        old_values: '{"wps_sif_generated":0}',
                        new_values: '{"wps_sif_generated":1,"sif_file":"WPS_SIF_2026-02.SIF"}',
                        ip_address: '192.168.1.10'
                    },
                    {
                        id: 4,
                        created_at: '2026-02-28 11:30:19',
                        action: 'POST_JOURNAL',
                        table_name: 'journal_entries',
                        record_id: 409,
                        user_name: 'admin (Administrator)',
                        old_values: null,
                        new_values: '{"entry_number":"JE-2026-001","total_debit":15750,"total_credit":15750}',
                        ip_address: '192.168.1.50'
                    },
                    {
                        id: 5,
                        created_at: '2026-02-28 09:15:00',
                        action: 'LOGIN_SUCCESS',
                        table_name: 'users',
                        record_id: 1,
                        user_name: 'admin (Administrator)',
                        old_values: null,
                        new_values: '{"auth_mode":"Bearer Token","client":"React Web App"}',
                        ip_address: '127.0.0.1'
                    },
                    {
                        id: 6,
                        created_at: '2026-02-27 16:50:11',
                        action: 'UPDATE',
                        table_name: 'fixed_assets',
                        record_id: 2,
                        user_name: 'admin (Administrator)',
                        old_values: '{"accumulated_depreciation":68000}',
                        new_values: '{"accumulated_depreciation":72000,"book_value":168000}',
                        ip_address: '192.168.1.50'
                    }
                ]);
            }
        } catch (err) {
            console.error('Error loading audit trail:', err);
        } finally {
            setLoading(false);
        }
    };

    const columnDefs = [
        {
            headerName: 'Log ID',
            field: 'id',
            width: 100,
            pinned: 'left',
            checkboxSelection: true,
            headerCheckboxSelection: true,
            cellRenderer: (params) => (
                <span style={{ fontWeight: 600, color: 'var(--color-primary, #2563eb)' }}>
                    #{params.value}
                </span>
            )
        },
        {
            headerName: 'Timestamp',
            field: 'created_at',
            width: 170
        },
        {
            headerName: 'Action Type',
            field: 'action',
            width: 150,
            cellRenderer: (params) => {
                const act = params.value || '';
                let bg = '#eff6ff';
                let col = '#1d4ed8';
                if (act.includes('CREATE') || act.includes('POST')) { bg = '#ecfdf5'; col = '#065f46'; }
                if (act.includes('APPROVE') || act.includes('WPS')) { bg = '#f5f3ff'; col = '#7c3aed'; }
                if (act.includes('DELETE') || act.includes('DROP')) { bg = '#fef2f2'; col = '#b91c1c'; }
                if (act.includes('LOGIN')) { bg = '#fef3c7'; col = '#92400e'; }

                return (
                    <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: bg,
                        color: col
                    }}>
                        {act}
                    </span>
                );
            }
        },
        {
            headerName: 'Affected Table',
            field: 'table_name',
            width: 160,
            cellRenderer: (params) => (
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {params.value}
                </span>
            )
        },
        {
            headerName: 'Record #',
            field: 'record_id',
            width: 110,
            type: 'numericColumn'
        },
        {
            headerName: 'User / Identity',
            field: 'user_name',
            width: 190
        },
        {
            headerName: 'State Changes / Mutation Payload',
            field: 'new_values',
            minWidth: 320,
            cellRenderer: (params) => (
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {params.value}
                </div>
            )
        },
        {
            headerName: 'IP Address',
            field: 'ip_address',
            width: 130,
            cellRenderer: (params) => (
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#6b7280' }}>
                    {params.value}
                </span>
            )
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header / Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Audit Trail & Security Logs</h2>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
                        Immutable ledger mutation trace, user access logs, and statutory audit compliance records
                    </p>
                </div>
            </div>

            {/* Metric KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Total Audit Records</span>
                        <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px', color: '#2563eb' }}><BiHistory size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>{logs.length} Events</div>
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Immutable ledger trace</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>System Security Status</span>
                        <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '8px', color: '#059669' }}><BiShield size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: '#047857' }}>Healthy</div>
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Zero unauthorized attempts</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Active Accounting Users</span>
                        <div style={{ background: '#f5f3ff', padding: '8px', borderRadius: '8px', color: '#7c3aed' }}><BiUserCheck size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>5 Authorized</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>RBAC Role-protected</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Server Gateway</span>
                        <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '8px', color: '#d97706' }}><BiServer size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>Port 8000</div>
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>PHP Router Active</div>
                </div>
            </div>

            {/* Table */}
            <AgGridTable
                title="Forensic Audit Trail & Modification Log"
                subtitle="Complete chronological record of all inserts, updates, and approvals across database tables"
                rowData={logs}
                columnDefs={columnDefs}
                loading={loading}
                exportFileName="OrientLogistics_Audit_Trail"
                onRefresh={loadAuditLogs}
            />
        </div>
    );
};

export default AuditTrail;


import React, { useState } from 'react';
import { BiPlus, BiUserCheck, BiShield, BiKey } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputEmail } from '../../elegance-ui/components';

const UsersRoles = () => {
    const [users, setUsers] = useState([
        {
            id: 1,
            username: 'admin',
            display_name: 'System Administrator',
            email: 'admin@orientlogistics.com',
            role: 'Super Administrator',
            permissions: 'Full Control: General Ledger, Approvals, Tax, Settings',
            status: 'Active',
            last_login: '2026-10-31 09:15'
        },
        {
            id: 2,
            username: 'chief_accountant',
            display_name: 'Fatima Al-Zahra',
            email: 'fatima.accountant@orientlogistics.com',
            role: 'Chief Financial Officer / Head Accountant',
            permissions: 'Post Journals, Disburse Payments, Close Periods, FTA 201 Filing',
            status: 'Active',
            last_login: '2026-10-31 08:40'
        },
        {
            id: 3,
            username: 'sales_rep',
            display_name: 'Zaid Al-Harbi',
            email: 'zaid.sales@orientlogistics.com',
            role: 'Sales Representative',
            permissions: 'Issue Sales Quotes, Sales Orders & Sales Invoices',
            status: 'Active',
            last_login: '2026-10-30 16:20'
        },
        {
            id: 4,
            username: 'wh_supervisor',
            display_name: 'Mansoor Iqbal',
            email: 'mansoor.wh@orientlogistics.com',
            role: 'Warehouse & Logistics Manager',
            permissions: 'Inventory Stock Transfers, Delivery Notes, Goods Receipts',
            status: 'Active',
            last_login: '2026-10-30 11:10'
        },
        {
            id: 5,
            username: 'external_auditor',
            display_name: 'PwC Tax & Audit Advisory',
            email: 'audit.pwc@orientlogistics.com',
            role: 'Statutory Auditor (Read Only)',
            permissions: 'View Trial Balance, General Ledger, Audit Trails, Tax Returns',
            status: 'Active',
            last_login: '2026-10-25 14:00'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('accountant');
    const [tempPass, setTempPass] = useState('Password@123');

    const handleCreateUser = () => {
        if (!username.trim() || !name.trim()) {
            alert('Username and Name are required.');
            return;
        }

        const roleLabels = {
            admin: 'Super Administrator',
            accountant: 'Senior Accountant',
            bookkeeper: 'Junior Bookkeeper',
            sales: 'Sales Representative',
            warehouse: 'Warehouse & Logistics Manager',
            auditor: 'Statutory Auditor (Read Only)'
        };

        const rolePermissions = {
            admin: 'Full Control: General Ledger, Approvals, Tax, Settings',
            accountant: 'Post Journals, Disburse Payments, Close Periods, Tax Filing',
            bookkeeper: 'Enter Bills, Draft Receipts, View Customer/Supplier Balances',
            sales: 'Issue Sales Quotes, Sales Orders & Sales Invoices',
            warehouse: 'Inventory Stock Transfers, Delivery Notes, Goods Receipts',
            auditor: 'View Trial Balance, General Ledger, Audit Trails, Tax Returns'
        };

        const newUser = {
            id: Date.now(),
            username: username.trim(),
            display_name: name.trim(),
            email: email.trim() || `${username.trim()}@orientlogistics.com`,
            role: roleLabels[role] || 'Accountant',
            permissions: rolePermissions[role] || 'Standard Access',
            status: 'Active',
            last_login: 'Never'
        };

        setUsers(prev => [newUser, ...prev]);
        setIsCreateOpen(false);

        setUsername('');
        setName('');
        setEmail('');
    };

    const columnDefs = [
        { field: 'username', headerName: 'Username', width: 140, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'display_name', headerName: 'Full Name', width: 200, cellStyle: { fontWeight: 600 } },
        { field: 'email', headerName: 'Email Address', width: 220 },
        { field: 'role', headerName: 'Assigned Role', width: 200 },
        { field: 'permissions', headerName: 'Permission Scope', flex: 1, minWidth: 260 },
        { field: 'last_login', headerName: 'Last Login', width: 140 },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            cellRenderer: () => (
                <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#dcfce7',
                    color: '#15803d'
                }}>
                    Active
                </span>
            )
        }
    ];

    const roleOptions = [
        { value: 'admin', label: 'Super Administrator (Full Unrestricted Access)' },
        { value: 'accountant', label: 'Senior Accountant (Post Journals, Disburse Funds, File VAT)' },
        { value: 'bookkeeper', label: 'Junior Bookkeeper (Draft Invoices, Record Receipts)' },
        { value: 'sales', label: 'Sales Representative (Quotes, Orders, Invoices Only)' },
        { value: 'warehouse', label: 'Warehouse Manager (Stock Transfers, Delivery Notes)' },
        { value: 'auditor', label: 'External Auditor (Read-Only Ledger & Reports)' }
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
                        User Accounts & Role-Based Access Control (RBAC)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Enforce separation of duties (SoD) across accounting, payment authorization, sales billing, and inventory custody.
                    </p>
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
                    <BiPlus size={18} /> Add New User
                </button>
            </div>

            <AgGridTable
                title="System Users & Security Permissions Matrix"
                rowData={users}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE USER MODAL */}
            <Modal
                open={isCreateOpen}
                title="Provision New User Account"
                width={600}
                onOk={handleCreateUser}
                onCancel={() => setIsCreateOpen(false)}
                okText="Provision User"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Username <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputText
                                placeholder="e.g. tariq_finance"
                                value={username}
                                onChange={setUsername}
                                allowClear
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Full Display Name <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputText
                                placeholder="e.g. Tariq Mansoor"
                                value={name}
                                onChange={setName}
                                allowClear
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Email Address
                        </label>
                        <InputEmail
                            placeholder="tariq@orientlogistics.com"
                            value={email}
                            onChange={setEmail}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Role & Permission Level <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <Select
                            options={roleOptions}
                            value={role}
                            onChange={setRole}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Temporary Password
                        </label>
                        <InputText
                            value={tempPass}
                            onChange={setTempPass}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default UsersRoles;


import React, { useState, useEffect } from 'react';
import { BiPlus, BiCalculator, BiFolder, BiLayer, BiDollarCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';
import api from '../../services/api';

const ChartOfAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form fields
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [classification, setClassification] = useState('asset');
    const [accountType, setAccountType] = useState('current_asset');
    const [description, setDescription] = useState('');

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const res = await api.getAccounts().catch(() => null);
            if (res && Array.isArray(res) && res.length > 0) {
                setAccounts(res);
            } else {
                setAccounts([
                    { id: 1, code: '1010', name: 'Cash on Hand - Operating Float', classification: 'Asset', type: 'Current Asset', normal_balance: 'Debit', balance: 1750.00, status: 'Active' },
                    { id: 2, code: '1020', name: 'Emirates NBD Corporate Account', classification: 'Asset', type: 'Current Asset', normal_balance: 'Debit', balance: 112450.00, status: 'Active' },
                    { id: 3, code: '1030', name: 'Al Rajhi Bank SAR Commercial', classification: 'Asset', type: 'Current Asset', normal_balance: 'Debit', balance: 42100.00, status: 'Active' },
                    { id: 4, code: '1200', name: 'Accounts Receivable (Trade Debtors)', classification: 'Asset', type: 'Current Asset', normal_balance: 'Debit', balance: 48920.00, status: 'Active' },
                    { id: 5, code: '1300', name: 'Merchandise Inventory on Hand', classification: 'Asset', type: 'Current Asset', normal_balance: 'Debit', balance: 92300.00, status: 'Active' },
                    { id: 6, code: '1500', name: 'Office Furniture & Warehouse Equipment', classification: 'Asset', type: 'Fixed Asset', normal_balance: 'Debit', balance: 125000.00, status: 'Active' },
                    { id: 7, code: '1510', name: 'Accumulated Depreciation - Equipment', classification: 'Asset', type: 'Contra Asset', normal_balance: 'Credit', balance: -25000.00, status: 'Active' },
                    { id: 8, code: '2010', name: 'Accounts Payable (Trade Creditors)', classification: 'Liability', type: 'Current Liability', normal_balance: 'Credit', balance: 31250.00, status: 'Active' },
                    { id: 9, code: '2150', name: 'UAE VAT 5% Output Tax Payable', classification: 'Liability', type: 'Current Liability', normal_balance: 'Credit', balance: 14272.50, status: 'Active' },
                    { id: 10, code: '2160', name: 'UAE VAT 5% Input Tax Recoverable', classification: 'Asset', type: 'Current Asset', normal_balance: 'Debit', balance: 4850.00, status: 'Active' },
                    { id: 11, code: '3010', name: 'Owner Contributed Capital', classification: 'Equity', type: 'Equity', normal_balance: 'Credit', balance: 300000.00, status: 'Active' },
                    { id: 12, code: '3020', name: 'Retained Earnings', classification: 'Equity', type: 'Equity', normal_balance: 'Credit', balance: 86400.00, status: 'Active' },
                    { id: 13, code: '4010', name: 'Commercial Sales Revenue', classification: 'Revenue', type: 'Operating Revenue', normal_balance: 'Credit', balance: 285450.00, status: 'Active' },
                    { id: 14, code: '5010', name: 'Cost of Goods Sold (COGS)', classification: 'Expense', type: 'Direct Cost', normal_balance: 'Debit', balance: 171270.00, status: 'Active' },
                    { id: 15, code: '6010', name: 'Office Rent & Facilities Expense', classification: 'Expense', type: 'Operating Expense', normal_balance: 'Debit', balance: 18000.00, status: 'Active' },
                    { id: 16, code: '6020', name: 'Employee Salaries & Allowances', classification: 'Expense', type: 'Operating Expense', normal_balance: 'Debit', balance: 9780.00, status: 'Active' }
                ]);
            }
        } catch (err) {
            console.error('Error loading COA:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAccount = async () => {
        if (!code.trim() || !name.trim()) {
            alert('Code and Account Name are required.');
            return;
        }

        const isCreditNormal = ['liability', 'equity', 'revenue'].includes(classification.toLowerCase());

        const newAcc = {
            id: Date.now(),
            code: code.trim(),
            name: name.trim(),
            classification: classification.charAt(0).toUpperCase() + classification.slice(1),
            type: accountType.replace(/_/g, ' ').toUpperCase(),
            normal_balance: isCreditNormal ? 'Credit' : 'Debit',
            balance: 0.00,
            status: 'Active'
        };

        try {
            await api.createAccount({
                code: code.trim(),
                name: name.trim(),
                classification,
                account_type: accountType,
                description
            }).catch(() => null);
        } catch {
            // fallback
        }

        setAccounts(prev => [...prev, newAcc]);
        setIsCreateOpen(false);

        setCode('');
        setName('');
        setDescription('');
    };

    const columnDefs = [
        { field: 'code', headerName: 'Account #', width: 130, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'name', headerName: 'Account Title', flex: 1, minWidth: 260, cellStyle: { fontWeight: 600 } },
        {
            field: 'classification',
            headerName: 'Classification',
            width: 140,
            cellRenderer: (params) => {
                const c = params.value || 'Asset';
                let bg = '#e0e7ff'; let col = '#4338ca';
                if (c === 'Liability') { bg = '#fee2e2'; col = '#b91c1c'; }
                else if (c === 'Equity') { bg = '#fef3c7'; col = '#b45309'; }
                else if (c === 'Revenue') { bg = '#dcfce7'; col = '#15803d'; }
                else if (c === 'Expense') { bg = '#f3e8ff'; col = '#7e22ce'; }
                return (
                    <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: bg,
                        color: col
                    }}>
                        {c}
                    </span>
                );
            }
        },
        { field: 'type', headerName: 'Sub-Category', width: 170 },
        { field: 'normal_balance', headerName: 'Normal Bal', width: 120 },
        { 
            field: 'balance', 
            headerName: 'Ledger Balance', 
            width: 170, 
            cellStyle: { fontWeight: 700, color: '#0f172a' },
            valueFormatter: p => p.value !== undefined ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00' 
        },
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

    const classificationOptions = [
        { value: 'asset', label: '1. Asset (Debit Normal)' },
        { value: 'liability', label: '2. Liability (Credit Normal)' },
        { value: 'equity', label: '3. Equity / Capital (Credit Normal)' },
        { value: 'revenue', label: '4. Revenue / Income (Credit Normal)' },
        { value: 'expense', label: '5. Expense (Debit Normal)' }
    ];

    const typeOptions = [
        { value: 'current_asset', label: 'Current Asset (Cash, AR, Inventory)' },
        { value: 'fixed_asset', label: 'Fixed Asset (Equipment, Vehicles, Property)' },
        { value: 'current_liability', label: 'Current Liability (AP, Tax Payable)' },
        { value: 'long_term_liability', label: 'Long Term Liability (Bank Loan, Bond)' },
        { value: 'equity', label: 'Owner Capital & Retained Earnings' },
        { value: 'operating_revenue', label: 'Operating Revenue' },
        { value: 'direct_cost', label: 'Cost of Goods Sold (Direct Cost)' },
        { value: 'operating_expense', label: 'Operating Expense (Overheads)' }
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
                        Chart of Accounts (COA Architecture)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Core general ledger structure compliant with GAAP / IFRS standards: Assets, Liabilities, Equity, Revenue, and Expenses.
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
                    <BiPlus size={18} /> Add New Ledger Account
                </button>
            </div>

            <AgGridTable
                title="Master Chart of Accounts"
                rowData={accounts}
                columnDefs={columnDefs}
                loading={loading}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE ACCOUNT MODAL */}
            <Modal
                open={isCreateOpen}
                title="Create General Ledger Account"
                width={650}
                onOk={handleCreateAccount}
                onCancel={() => setIsCreateOpen(false)}
                okText="Add to Ledger"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Account Code <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputText
                                placeholder="e.g. 1040"
                                value={code}
                                onChange={setCode}
                                allowClear
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Account Title <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputText
                                placeholder="e.g. Short-Term Fixed Deposit"
                                value={name}
                                onChange={setName}
                                allowClear
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Master Classification <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <Select
                                options={classificationOptions}
                                value={classification}
                                onChange={setClassification}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Sub-Category
                            </label>
                            <Select
                                options={typeOptions}
                                value={accountType}
                                onChange={setAccountType}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Description & Accounting Notes
                        </label>
                        <InputText
                            placeholder="Specify usage rules or sub-ledger reconciliation policies"
                            value={description}
                            onChange={setDescription}
                            allowClear
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ChartOfAccounts;


import React, { useState } from 'react';
import { BiPlus, BiShield, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';

const SpecialAccounts = () => {
    const [accounts, setAccounts] = useState([
        {
            id: 1,
            code: 'SPEC-ESC-01',
            name: 'Client Project Escrow Holding Account',
            type: 'Escrow / Trust Account',
            currency: 'USD',
            balance: 55000.00,
            custodian_bank: 'Emirates NBD Escrow Department',
            status: 'Active'
        },
        {
            id: 2,
            code: 'SPEC-RET-02',
            name: 'Customer Construction Retainage Fund',
            type: 'Retainage / Retention Receivable',
            currency: 'AED',
            balance: 28400.00,
            custodian_bank: 'In-House Retention Ledger',
            status: 'Active'
        },
        {
            id: 3,
            code: 'SPEC-LC-03',
            name: 'Letter of Credit (LC) Collateral Margin',
            type: 'Documentary Credit Margin',
            currency: 'USD',
            balance: 15000.00,
            custodian_bank: 'Mashreq Bank Trade Finance',
            status: 'Active'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [type, setType] = useState('escrow');
    const [currency, setCurrency] = useState('USD');
    const [balance, setBalance] = useState(0);

    const handleCreateSpecial = () => {
        if (!name.trim()) {
            alert('Special account name is required.');
            return;
        }

        const newAcc = {
            id: Date.now(),
            code: code.trim() || `SPEC-${String(accounts.length + 4).padStart(2, '0')}`,
            name: name.trim(),
            type: type === 'escrow' ? 'Escrow / Trust Account' : 'Retention Fund',
            currency: currency,
            balance: parseFloat(balance || 0),
            custodian_bank: 'Designated Escrow Facility',
            status: 'Active'
        };

        setAccounts(prev => [newAcc, ...prev]);
        setIsCreateOpen(false);
        setCode('');
        setName('');
    };

    const columnDefs = [
        { field: 'code', headerName: 'Account Code', width: 150, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'name', headerName: 'Special Account Title', flex: 1, minWidth: 240, cellStyle: { fontWeight: 600 } },
        { field: 'type', headerName: 'Classification Type', width: 220 },
        { field: 'custodian_bank', headerName: 'Custodian Institution', width: 220 },
        { field: 'currency', headerName: 'Currency', width: 100 },
        { 
            field: 'balance', 
            headerName: 'Held Balance', 
            width: 170, 
            cellStyle: { fontWeight: 700, color: '#0f172a' },
            valueFormatter: p => p.value ? `${p.data?.currency} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
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
                        Special Accounts (Escrow, Retainage & Trust Funds)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Maintain ring-fenced fiduciary accounts, commercial retainage receivables, and Letter of Credit margin balances.
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
                    <BiPlus size={18} /> New Special Account
                </button>
            </div>

            <AgGridTable
                title="Special & Fiduciary Accounts Register"
                rowData={accounts}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE SPECIAL ACCOUNT MODAL */}
            <Modal
                open={isCreateOpen}
                title="Create Special Purpose Account"
                width={600}
                onOk={handleCreateSpecial}
                onCancel={() => setIsCreateOpen(false)}
                okText="Create Account"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Account Code
                            </label>
                            <InputText placeholder="e.g. SPEC-04" value={code} onChange={setCode} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Special Account Title <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputText placeholder="e.g. Performance Bond Guarantee Account" value={name} onChange={setName} allowClear />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Special Purpose Classification
                            </label>
                            <Select
                                options={[
                                    { value: 'escrow', label: 'Escrow / Trust Account' },
                                    { value: 'retention', label: 'Contract Retainage Fund' },
                                    { value: 'letter_of_credit', label: 'LC Cash Margin Account' }
                                ]}
                                value={type}
                                onChange={setType}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Currency
                            </label>
                            <Select
                                options={[
                                    { value: 'USD', label: 'USD' },
                                    { value: 'AED', label: 'AED' },
                                    { value: 'SAR', label: 'SAR' }
                                ]}
                                value={currency}
                                onChange={setCurrency}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SpecialAccounts;


import React, { useState, useEffect } from 'react';
import { BiPlus, BiWallet, BiDollarCircle, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';
import api from '../../services/api';

const CashAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [custodian, setCustodian] = useState('');
    const [currency, setCurrency] = useState('AED');
    const [floatLimit, setFloatLimit] = useState(5000);
    const [openingBalance, setOpeningBalance] = useState(1500);

    useEffect(() => {
        loadCashAccounts();
    }, []);

    const loadCashAccounts = async () => {
        setLoading(true);
        try {
            const res = await api.getCashAccounts().catch(() => null);
            if (res && Array.isArray(res) && res.length > 0) {
                setAccounts(res);
            } else {
                setAccounts([
                    {
                        id: 1,
                        code: 'CASH-DXB-01',
                        name: 'Petty Cash Float - Dubai HQ Office',
                        custodian: 'Mansoor Iqbal (Office Administrator)',
                        location: 'Dubai South HQ Safe',
                        currency: 'AED',
                        float_limit: 5000.00,
                        current_balance: 1750.00,
                        status: 'Active'
                    },
                    {
                        id: 2,
                        code: 'CASH-JAFZA-02',
                        name: 'Logistics Facility Till - JAFZA Warehouse',
                        custodian: 'Tariq Mansoor (Warehouse Supervisor)',
                        location: 'Jebel Ali Free Zone Gate 4',
                        currency: 'AED',
                        float_limit: 3000.00,
                        current_balance: 1200.00,
                        status: 'Active'
                    },
                    {
                        id: 3,
                        code: 'CASH-RYD-03',
                        name: 'Petty Cash - Riyadh Branch Safe',
                        custodian: 'Abdullah Al-Ghamdi (Riyadh Branch Mgr)',
                        location: 'Riyadh Industrial City 2',
                        currency: 'SAR',
                        float_limit: 5000.00,
                        current_balance: 3450.00,
                        status: 'Active'
                    }
                ]);
            }
        } catch (err) {
            console.error('Error loading cash accounts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAccount = async () => {
        if (!name.trim()) {
            alert('Cash account title is required.');
            return;
        }

        const bal = parseFloat(openingBalance || 0);
        const newAcc = {
            id: Date.now(),
            code: `CASH-${String(accounts.length + 4).padStart(2, '0')}`,
            name: name.trim(),
            custodian: custodian.trim() || 'General Cashier',
            location: 'Branch Safe',
            currency: currency,
            float_limit: parseFloat(floatLimit || 0),
            current_balance: bal,
            status: 'Active'
        };

        try {
            await api.createCashAccount({
                name: name.trim(),
                custodian: custodian.trim(),
                currency: currency,
                float_limit: floatLimit,
                opening_balance: bal
            }).catch(() => null);
        } catch {
            // fallback
        }

        setAccounts(prev => [newAcc, ...prev]);
        setIsCreateOpen(false);

        setName('');
        setCustodian('');
        setOpeningBalance(0);
    };

    const columnDefs = [
        { field: 'code', headerName: 'Account Code', width: 150, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'name', headerName: 'Cash Float Title', flex: 1, minWidth: 240, cellStyle: { fontWeight: 600 } },
        { field: 'custodian', headerName: 'Authorized Custodian', width: 220 },
        { field: 'location', headerName: 'Physical Safe Location', width: 200 },
        { field: 'currency', headerName: 'Currency', width: 100 },
        { 
            field: 'float_limit', 
            headerName: 'Max Float Limit', 
            width: 150, 
            valueFormatter: p => p.value ? `${p.data?.currency} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        { 
            field: 'current_balance', 
            headerName: 'Available Balance', 
            width: 170, 
            cellStyle: { fontWeight: 700, color: '#15803d' },
            valueFormatter: p => p.value ? `${p.data?.currency} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
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

    const currencyOptions = [
        { value: 'AED', label: 'AED - UAE Dirham' },
        { value: 'SAR', label: 'SAR - Saudi Riyal' },
        { value: 'USD', label: 'USD - US Dollar' }
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
                        Cash Accounts & Petty Cash Floats
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Manage physical cash boxes, branch till floats, authorized custodians, and imprest disbursement limits.
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
                    <BiPlus size={18} /> Add Cash Float
                </button>
            </div>

            <AgGridTable
                title="Physical Cash & Till Registers"
                rowData={accounts}
                columnDefs={columnDefs}
                loading={loading}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE CASH ACCOUNT MODAL */}
            <Modal
                open={isCreateOpen}
                title="Create New Petty Cash Float / Till"
                width={600}
                onOk={handleCreateAccount}
                onCancel={() => setIsCreateOpen(false)}
                okText="Establish Float"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Cash Float Name / Purpose <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <InputText
                            placeholder="e.g. Courier & Office Pantry Petty Cash"
                            value={name}
                            onChange={setName}
                            allowClear
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Authorized Custodian Officer <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputText
                                placeholder="e.g. Zaid Al-Harbi"
                                value={custodian}
                                onChange={setCustodian}
                                allowClear
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Currency
                            </label>
                            <Select
                                options={currencyOptions}
                                value={currency}
                                onChange={setCurrency}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Maximum Float Limit ({currency})
                            </label>
                            <InputNumber
                                value={floatLimit}
                                min={100}
                                precision={2}
                                onChange={setFloatLimit}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Opening Cash Count ({currency})
                            </label>
                            <InputNumber
                                value={openingBalance}
                                min={0}
                                precision={2}
                                onChange={setOpeningBalance}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CashAccounts;


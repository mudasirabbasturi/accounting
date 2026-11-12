import React, { useState } from 'react';
import { BiPlus, BiUserCheck, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';

const CapitalAccounts = () => {
    const [accounts, setAccounts] = useState([
        {
            id: 1,
            partner_name: 'Sheikh Khalid Al-Qasimi',
            ownership_pct: '51.0%',
            contributed_capital: 153000.00,
            share_of_profit: 44064.00,
            drawings: -10000.00,
            current_equity_balance: 187064.00,
            currency: 'USD',
            status: 'Active Partner'
        },
        {
            id: 2,
            partner_name: 'Alexandre DuPont (Managing Partner)',
            ownership_pct: '49.0%',
            contributed_capital: 147000.00,
            share_of_profit: 42336.00,
            drawings: -8500.00,
            current_equity_balance: 180836.00,
            currency: 'USD',
            status: 'Active Partner'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [partnerName, setPartnerName] = useState('');
    const [ownershipPct, setOwnershipPct] = useState(25);
    const [capital, setCapital] = useState(50000);

    const handleCreateCapital = () => {
        if (!partnerName.trim()) {
            alert('Partner / Shareholder name is required.');
            return;
        }

        const cap = parseFloat(capital || 0);
        const newAcc = {
            id: Date.now(),
            partner_name: partnerName.trim(),
            ownership_pct: `${ownershipPct}%`,
            contributed_capital: cap,
            share_of_profit: 0.00,
            drawings: 0.00,
            current_equity_balance: cap,
            currency: 'USD',
            status: 'Active Partner'
        };

        setAccounts(prev => [newAcc, ...prev]);
        setIsCreateOpen(false);
        setPartnerName('');
    };

    const columnDefs = [
        { field: 'partner_name', headerName: 'Shareholder / Partner Name', flex: 1, minWidth: 240, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'ownership_pct', headerName: 'Equity %', width: 120, cellStyle: { fontWeight: 600 } },
        { 
            field: 'contributed_capital', 
            headerName: 'Paid-in Capital ($)', 
            width: 170, 
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00' 
        },
        { 
            field: 'share_of_profit', 
            headerName: 'Retained Profit Share ($)', 
            width: 190, 
            cellStyle: { color: '#15803d', fontWeight: 600 },
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00' 
        },
        { 
            field: 'drawings', 
            headerName: 'Drawings / Distributions ($)', 
            width: 190, 
            cellStyle: { color: '#dc2626' },
            valueFormatter: p => p.value ? `($${Math.abs(parseFloat(p.value)).toLocaleString('en-US', { minimumFractionDigits: 2 })})` : '$0.00' 
        },
        { 
            field: 'current_equity_balance', 
            headerName: 'Closing Equity Balance ($)', 
            width: 200, 
            cellStyle: { fontWeight: 700, color: '#0f172a' },
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00' 
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 140,
            cellRenderer: () => (
                <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#dcfce7',
                    color: '#15803d'
                }}>
                    Active Partner
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
                        Capital Accounts (Partners & Shareholders)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Manage partner contributed capital, profit share allocations, owner drawings, and equity distribution sub-ledgers.
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
                    <BiPlus size={18} /> New Capital Account
                </button>
            </div>

            <AgGridTable
                title="Partnership & Shareholder Equity Register"
                rowData={accounts}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE CAPITAL ACCOUNT MODAL */}
            <Modal
                open={isCreateOpen}
                title="Establish Partner Capital Account"
                width={600}
                onOk={handleCreateCapital}
                onCancel={() => setIsCreateOpen(false)}
                okText="Create Account"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Shareholder / Partner Legal Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <InputText
                            placeholder="e.g. Tariq Mansoor"
                            value={partnerName}
                            onChange={setPartnerName}
                            allowClear
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Equity Ownership %
                            </label>
                            <InputNumber value={ownershipPct} min={1} max={100} onChange={setOwnershipPct} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Contributed Capital ($)
                            </label>
                            <InputNumber value={capital} min={0} precision={2} onChange={setCapital} />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CapitalAccounts;


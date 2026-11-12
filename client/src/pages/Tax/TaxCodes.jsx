import React, { useState } from 'react';
import { BiPlus, BiShield, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';

const TaxCodes = () => {
    const [taxCodes, setTaxCodes] = useState([
        {
            id: 1,
            code: 'UAE-STD-5',
            name: 'UAE Standard Rate VAT (5%)',
            jurisdiction: 'United Arab Emirates (FTA)',
            rate: '5.0%',
            scope: 'Sales & Purchases',
            tax_account: '2150 - UAE VAT Output / 2160 - Input VAT',
            is_rcm: 'No',
            status: 'Active'
        },
        {
            id: 2,
            code: 'KSA-STD-15',
            name: 'KSA Standard Rate VAT (15%)',
            jurisdiction: 'Saudi Arabia (ZATCA)',
            rate: '15.0%',
            scope: 'Sales & Purchases',
            tax_account: '2170 - KSA VAT Output / 2180 - Input VAT',
            is_rcm: 'No',
            status: 'Active'
        },
        {
            id: 3,
            code: 'UAE-ZERO-0',
            name: 'UAE Zero-Rated Supplies (0%)',
            jurisdiction: 'United Arab Emirates (FTA)',
            rate: '0.0%',
            scope: 'Export Sales & Designated Freezones',
            tax_account: 'N/A (Exempt Reporting)',
            is_rcm: 'No',
            status: 'Active'
        },
        {
            id: 4,
            code: 'UAE-RCM-5',
            name: 'Reverse Charge Mechanism (RCM 5%)',
            jurisdiction: 'United Arab Emirates (FTA)',
            rate: '5.0%',
            scope: 'Imported Services & Cross-Border B2B',
            tax_account: 'Box 3 & Box 10 Self-Accounting',
            is_rcm: 'Yes',
            status: 'Active'
        },
        {
            id: 5,
            code: 'EXEMPT-0',
            name: 'VAT Exempt Supplies',
            jurisdiction: 'GCC Unified Framework',
            rate: '0.0%',
            scope: 'Residential Leases & Financial Margins',
            tax_account: 'N/A',
            is_rcm: 'No',
            status: 'Active'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [rate, setRate] = useState(5);
    const [jurisdiction, setJurisdiction] = useState('uae');
    const [scope, setScope] = useState('both');

    const handleCreateTaxCode = () => {
        if (!code.trim() || !name.trim()) {
            alert('Code and Name are required.');
            return;
        }

        const newTc = {
            id: Date.now(),
            code: code.trim().toUpperCase(),
            name: name.trim(),
            jurisdiction: jurisdiction === 'uae' ? 'United Arab Emirates (FTA)' : 'Saudi Arabia (ZATCA)',
            rate: `${rate.toFixed(1)}%`,
            scope: scope === 'both' ? 'Sales & Purchases' : (scope === 'sales' ? 'Sales Only' : 'Purchases Only'),
            tax_account: 'Automated Tax Liability Account',
            is_rcm: 'No',
            status: 'Active'
        };

        setTaxCodes(prev => [newTc, ...prev]);
        setIsCreateOpen(false);
        setCode('');
        setName('');
    };

    const columnDefs = [
        { field: 'code', headerName: 'Tax Code', width: 150, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'name', headerName: 'Tax Code Description', flex: 1, minWidth: 240, cellStyle: { fontWeight: 600 } },
        { field: 'jurisdiction', headerName: 'Tax Authority / Region', width: 220 },
        { 
            field: 'rate', 
            headerName: 'Tax Rate', 
            width: 120, 
            cellStyle: { fontWeight: 700, color: '#7c3aed' } 
        },
        { field: 'scope', headerName: 'Application Scope', width: 220 },
        { field: 'is_rcm', headerName: 'Reverse Charge (RCM)', width: 180 },
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
                        Tax Codes & Statutory Rates
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Configure regional VAT rates, Reverse Charge Mechanism (RCM) rules, and designated zone zero-rated tax classifications.
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
                    <BiPlus size={18} /> New Tax Code
                </button>
            </div>

            <AgGridTable
                title="Master Tax Codes Register"
                rowData={taxCodes}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE TAX CODE MODAL */}
            <Modal
                open={isCreateOpen}
                title="Add Statutory Tax Code"
                width={600}
                onOk={handleCreateTaxCode}
                onCancel={() => setIsCreateOpen(false)}
                okText="Save Tax Code"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Tax Code <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputText placeholder="e.g. UAE-TOUR-0" value={code} onChange={setCode} allowClear />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Description <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputText placeholder="e.g. Tourist Tax Refund Scheme" value={name} onChange={setName} allowClear />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Tax Rate (%)
                            </label>
                            <InputNumber value={rate} min={0} max={100} precision={2} onChange={setRate} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Jurisdiction
                            </label>
                            <Select
                                options={[
                                    { value: 'uae', label: 'United Arab Emirates (FTA)' },
                                    { value: 'ksa', label: 'Saudi Arabia (ZATCA)' }
                                ]}
                                value={jurisdiction}
                                onChange={setJurisdiction}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Application Scope
                        </label>
                        <Select
                            options={[
                                { value: 'both', label: 'Sales & Purchases' },
                                { value: 'sales', label: 'Sales Only (Output Tax)' },
                                { value: 'purchases', label: 'Purchases Only (Input Tax)' }
                            ]}
                            value={scope}
                            onChange={setScope}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TaxCodes;


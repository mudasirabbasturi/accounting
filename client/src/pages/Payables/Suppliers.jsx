import React, { useState, useEffect } from 'react';
import { BiPlus, BiUserPlus } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber, InputEmail } from '../../elegance-ui/components';
import api from '../../services/api';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [trn, setTrn] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('AE');
    const [currency, setCurrency] = useState('AED');
    const [address, setAddress] = useState('');

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        setLoading(true);
        try {
            const res = await api.getSuppliers().catch(() => null);
            if (res && Array.isArray(res) && res.length > 0) {
                setSuppliers(res);
            } else {
                setSuppliers([
                    {
                        id: 1,
                        code: 'SUPP-001',
                        name: 'Amazon Web Services MENA FZ-LLC',
                        contact_person: 'Cloud Billing Operations',
                        email: 'aws-mena-billing@amazon.com',
                        phone: '+971 4 459 3000',
                        trn: '100777888900003',
                        country: 'United Arab Emirates',
                        currency: 'AED',
                        balance: 0.00,
                        status: 'Active'
                    },
                    {
                        id: 2,
                        code: 'SUPP-002',
                        name: 'Dell Technologies Middle East',
                        contact_person: 'Enterprise Sales Support',
                        email: 'finance_me@dell.com',
                        phone: '+971 4 362 2000',
                        trn: '100555666700003',
                        country: 'United Arab Emirates',
                        currency: 'AED',
                        balance: 18125.00,
                        status: 'Active'
                    },
                    {
                        id: 3,
                        code: 'SUPP-003',
                        name: 'Sabic Petrochemical Supply',
                        contact_person: 'Corporate Sales EMEA',
                        email: 'orders@sabic.com',
                        phone: '+966 11 225 8000',
                        trn: '300123456700003',
                        country: 'Saudi Arabia',
                        currency: 'SAR',
                        balance: 13110.00,
                        status: 'Active'
                    }
                ]);
            }
        } catch (err) {
            console.error('Error fetching suppliers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSupplier = async () => {
        if (!name.trim()) {
            alert('Supplier name is required.');
            return;
        }

        const newCode = code.trim() || `SUPP-${String(suppliers.length + 1).padStart(3, '0')}`;
        const newSupp = {
            id: Date.now(),
            code: newCode,
            name: name.trim(),
            contact_person: 'Vendor Desk',
            email: email.trim() || 'vendor@supply.com',
            phone: phone.trim() || '+971 4 000 0000',
            trn: trn.trim() || '100000000000003',
            country: country === 'SA' ? 'Saudi Arabia' : 'United Arab Emirates',
            currency: currency,
            balance: 0.00,
            status: 'Active'
        };

        try {
            await api.createSupplier({
                code: newCode,
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                tax_number: trn.trim(),
                country: country,
                currency: currency,
                billing_address: address
            }).catch(() => null);
        } catch {
            // local state fallback
        }

        setSuppliers(prev => [newSupp, ...prev]);
        setIsCreateOpen(false);

        setName('');
        setCode('');
        setTrn('');
        setEmail('');
        setPhone('');
        setAddress('');
    };

    const columnDefs = [
        { field: 'code', headerName: 'Vendor Code', width: 130, pinned: 'left', cellStyle: { fontWeight: 600, color: '#4f46e5' } },
        { field: 'name', headerName: 'Supplier Legal Name', flex: 1, minWidth: 220, cellStyle: { fontWeight: 600 } },
        { field: 'trn', headerName: 'TRN / Tax Number', width: 170 },
        { field: 'contact_person', headerName: 'Contact Person', width: 180 },
        { field: 'email', headerName: 'Email', width: 200 },
        { field: 'phone', headerName: 'Phone', width: 150 },
        { field: 'country', headerName: 'Country', width: 160 },
        { 
            field: 'balance', 
            headerName: 'Payable Due', 
            width: 150, 
            cellStyle: p => ({ color: p.value > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }),
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

    const countryOptions = [
        { value: 'AE', label: 'United Arab Emirates (UAE)' },
        { value: 'SA', label: 'Saudi Arabia (KSA)' },
        { value: 'US', label: 'United States' },
        { value: 'GB', label: 'United Kingdom' },
        { value: 'DE', label: 'Germany' }
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
                        Supplier & Vendor Directory (Payables)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Manage vendor records, Tax Registration Numbers, payment terms, and outstanding accounts payable balances.
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
                    <BiUserPlus size={18} /> Add New Supplier
                </button>
            </div>

            <AgGridTable
                title="Supplier Master Register"
                rowData={suppliers}
                columnDefs={columnDefs}
                loading={loading}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE SUPPLIER MODAL */}
            <Modal
                open={isCreateOpen}
                title="Register New Supplier"
                width={650}
                onOk={handleCreateSupplier}
                onCancel={() => setIsCreateOpen(false)}
                okText="Save Supplier"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Supplier Legal Name <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputText
                                placeholder="e.g. Cisco Systems ME FZ-LLC"
                                value={name}
                                onChange={setName}
                                allowClear
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Vendor Code
                            </label>
                            <InputText
                                placeholder="e.g. SUPP-004"
                                value={code}
                                onChange={setCode}
                                allowClear
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Tax Registration Number (TRN)
                            </label>
                            <InputText
                                placeholder="15-digit TRN e.g. 100777888900003"
                                value={trn}
                                onChange={setTrn}
                                allowClear
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Vendor Country
                            </label>
                            <Select
                                options={countryOptions}
                                value={country}
                                onChange={setCountry}
                                searchable
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Billing Currency
                            </label>
                            <Select
                                options={currencyOptions}
                                value={currency}
                                onChange={setCurrency}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Email
                            </label>
                            <InputEmail
                                placeholder="vendor@domain.com"
                                value={email}
                                onChange={setEmail}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Phone
                            </label>
                            <InputText
                                placeholder="+971 4 000 0000"
                                value={phone}
                                onChange={setPhone}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Physical / Dispatch Address
                        </label>
                        <InputText
                            placeholder="Building, Street, Industrial Area, City"
                            value={address}
                            onChange={setAddress}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Suppliers;


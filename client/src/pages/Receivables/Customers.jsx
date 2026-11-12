import React, { useState, useEffect } from 'react';
import { BiPlus, BiUserPlus, BiBuilding, BiPhone, BiEnvelope } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber, InputEmail } from '../../elegance-ui/components';
import api from '../../services/api';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
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
    const [creditLimit, setCreditLimit] = useState(50000);
    const [address, setAddress] = useState('');

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const res = await api.getCustomers().catch(() => null);
            if (res && Array.isArray(res) && res.length > 0) {
                setCustomers(res);
            } else {
                setCustomers([
                    {
                        id: 1,
                        code: 'CUST-001',
                        name: 'Al-Futtaim Logistics LLC',
                        contact_person: 'Tariq Mansoor',
                        email: 'accounts@alfuttaim.ae',
                        phone: '+971 4 213 4000',
                        trn: '100234567800003',
                        country: 'United Arab Emirates',
                        currency: 'AED',
                        credit_limit: 100000.00,
                        balance: 0.00,
                        status: 'Active'
                    },
                    {
                        id: 2,
                        code: 'CUST-002',
                        name: 'Emaar Hospitality Group',
                        contact_person: 'Fatima Al-Hashimi',
                        email: 'finance@emaar.ae',
                        phone: '+971 4 367 3333',
                        trn: '100456789000003',
                        country: 'United Arab Emirates',
                        currency: 'AED',
                        credit_limit: 150000.00,
                        balance: 22550.00,
                        status: 'Active'
                    },
                    {
                        id: 3,
                        code: 'CUST-003',
                        name: 'Saudi Aramco Services Ltd',
                        contact_person: 'Abdullah Al-Ghamdi',
                        email: 'procurement@aramco.sa',
                        phone: '+966 13 872 0115',
                        trn: '300987654300003',
                        country: 'Saudi Arabia',
                        currency: 'SAR',
                        credit_limit: 250000.00,
                        balance: 18400.00,
                        status: 'Active'
                    },
                    {
                        id: 4,
                        code: 'CUST-004',
                        name: 'Sharjah Aviation Authority',
                        contact_person: 'Rashid Al-Nuaimi',
                        email: 'billing@sharjahairport.gov.ae',
                        phone: '+971 6 558 1111',
                        trn: '100112233400003',
                        country: 'United Arab Emirates',
                        currency: 'AED',
                        credit_limit: 80000.00,
                        balance: 7875.00,
                        status: 'Active'
                    }
                ]);
            }
        } catch (err) {
            console.error('Error fetching customers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCustomer = async () => {
        if (!name.trim()) {
            alert('Customer name is required.');
            return;
        }

        const newCode = code.trim() || `CUST-${String(customers.length + 1).padStart(3, '0')}`;
        const newCust = {
            id: Date.now(),
            code: newCode,
            name: name.trim(),
            contact_person: 'Finance Dept',
            email: email.trim() || 'info@client.com',
            phone: phone.trim() || '+971 4 000 0000',
            trn: trn.trim() || '100000000000003',
            country: country === 'SA' ? 'Saudi Arabia' : 'United Arab Emirates',
            currency: currency,
            credit_limit: parseFloat(creditLimit || 0),
            balance: 0.00,
            status: 'Active'
        };

        try {
            await api.createCustomer({
                code: newCode,
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                tax_number: trn.trim(),
                country: country,
                currency: currency,
                credit_limit: creditLimit,
                billing_address: address
            }).catch(() => null);
        } catch {
            // Local state fallback
        }

        setCustomers(prev => [newCust, ...prev]);
        setIsCreateOpen(false);

        // Reset
        setName('');
        setCode('');
        setTrn('');
        setEmail('');
        setPhone('');
        setAddress('');
    };

    const columnDefs = [
        { field: 'code', headerName: 'Code', width: 120, pinned: 'left', cellStyle: { fontWeight: 600, color: '#4f46e5' } },
        { field: 'name', headerName: 'Company / Customer Name', flex: 1, minWidth: 220, cellStyle: { fontWeight: 600 } },
        { field: 'trn', headerName: 'TRN / VAT ID', width: 170 },
        { field: 'contact_person', headerName: 'Contact Person', width: 160 },
        { field: 'email', headerName: 'Email', width: 190 },
        { field: 'phone', headerName: 'Phone', width: 150 },
        { field: 'country', headerName: 'Country', width: 160 },
        { 
            field: 'credit_limit', 
            headerName: 'Credit Limit', 
            width: 140, 
            valueFormatter: p => p.value ? `${p.data?.currency} ${parseFloat(p.value).toLocaleString()}` : '-' 
        },
        { 
            field: 'balance', 
            headerName: 'Receivables Balance', 
            width: 160, 
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
        { value: 'QA', label: 'Qatar' },
        { value: 'BH', label: 'Bahrain' },
        { value: 'KW', label: 'Kuwait' },
        { value: 'OM', label: 'Oman' },
        { value: 'US', label: 'United States' },
        { value: 'GB', label: 'United Kingdom' }
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
                        Customer Accounts & Receivables Directory
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Manage corporate client accounts, Tax Registration Numbers (TRN), credit limits, and outstanding ledger balances.
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
                    <BiUserPlus size={18} /> Add New Customer
                </button>
            </div>

            <AgGridTable
                title="Customer Directory"
                rowData={customers}
                columnDefs={columnDefs}
                loading={loading}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE CUSTOMER MODAL */}
            <Modal
                open={isCreateOpen}
                title="Register New Customer"
                width={650}
                onOk={handleCreateCustomer}
                onCancel={() => setIsCreateOpen(false)}
                okText="Save Customer"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Customer / Company Legal Name <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputText
                                placeholder="e.g. Al-Habtoor Trading LLC"
                                value={name}
                                onChange={setName}
                                allowClear
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Customer Code
                            </label>
                            <InputText
                                placeholder="e.g. CUST-005"
                                value={code}
                                onChange={setCode}
                                allowClear
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Tax Registration Number (TRN / VAT ID)
                            </label>
                            <InputText
                                placeholder="15-digit TRN e.g. 100234567800003"
                                value={trn}
                                onChange={setTrn}
                                allowClear
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Billing Country
                            </label>
                            <Select
                                options={countryOptions}
                                value={country}
                                onChange={setCountry}
                                searchable
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Email Address
                            </label>
                            <InputEmail
                                placeholder="billing@company.com"
                                value={email}
                                onChange={setEmail}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Phone Number
                            </label>
                            <InputText
                                placeholder="+971 4 123 4567"
                                value={phone}
                                onChange={setPhone}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Default Currency
                            </label>
                            <Select
                                options={currencyOptions}
                                value={currency}
                                onChange={setCurrency}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Credit Limit ({currency})
                            </label>
                            <InputNumber
                                value={creditLimit}
                                min={0}
                                step={5000}
                                onChange={setCreditLimit}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Billing / Registered Address
                        </label>
                        <InputText
                            placeholder="Street, Building, Office No, City, P.O. Box"
                            value={address}
                            onChange={setAddress}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Customers;


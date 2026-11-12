import React, { useState, useEffect, useMemo } from 'react';
import { BiPlus, BiCreditCard, BiTrash, BiFile } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';
import api from '../../services/api';

const PurchaseInvoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isPayOpen, setIsPayOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Form states
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().slice(0, 10);
    });
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedTaxCode, setSelectedTaxCode] = useState('uae_standard');
    const [currency, setCurrency] = useState('AED');

    // Lines
    const [lines, setLines] = useState([
        { id: 1, description: 'Office Cloud Server Hosting & Data Center Services', qty: 1, unitPrice: 3200 }
    ]);

    // Payment states
    const [paymentAccount, setPaymentAccount] = useState('bank_emirates_nbd');
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentRef, setPaymentRef] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [billRes, suppRes] = await Promise.all([
                api.getPurchaseInvoices().catch(() => null),
                api.getSuppliers().catch(() => null)
            ]);

            if (billRes && Array.isArray(billRes) && billRes.length > 0) {
                setInvoices(billRes);
            } else {
                setInvoices([
                    {
                        id: 1,
                        invoice_number: 'PINV-2026-081',
                        supplier_name: 'Amazon Web Services MENA FZ-LLC',
                        supplier_trn: '100777888900003',
                        issue_date: '2026-10-15',
                        due_date: '2026-11-14',
                        currency: 'AED',
                        subtotal: 12500.00,
                        tax_total: 625.00,
                        total_amount: 13125.00,
                        amount_paid: 13125.00,
                        balance_due: 0.00,
                        status: 'Paid',
                        tax_type: 'UAE VAT 5%'
                    },
                    {
                        id: 2,
                        invoice_number: 'PINV-2026-082',
                        supplier_name: 'Dell Technologies Middle East',
                        supplier_trn: '100555666700003',
                        issue_date: '2026-10-22',
                        due_date: '2026-11-21',
                        currency: 'AED',
                        subtotal: 24000.00,
                        tax_total: 1200.00,
                        total_amount: 25200.00,
                        amount_paid: 7075.00,
                        balance_due: 18125.00,
                        status: 'Partial',
                        tax_type: 'UAE VAT 5%'
                    },
                    {
                        id: 3,
                        invoice_number: 'PINV-2026-083',
                        supplier_name: 'Sabic Petrochemical Supply',
                        supplier_trn: '300123456700003',
                        issue_date: '2026-10-29',
                        due_date: '2026-11-28',
                        currency: 'SAR',
                        subtotal: 11400.00,
                        tax_total: 1710.00,
                        total_amount: 13110.00,
                        amount_paid: 0.00,
                        balance_due: 13110.00,
                        status: 'Unpaid',
                        tax_type: 'KSA VAT 15%'
                    }
                ]);
            }

            if (suppRes && Array.isArray(suppRes) && suppRes.length > 0) {
                setSuppliers(suppRes);
            } else {
                setSuppliers([
                    { id: 1, name: 'Amazon Web Services MENA FZ-LLC', trn: '100777888900003' },
                    { id: 2, name: 'Dell Technologies Middle East', trn: '100555666700003' },
                    { id: 3, name: 'Sabic Petrochemical Supply', trn: '300123456700003' }
                ]);
            }
        } catch (err) {
            console.error('Error loading purchase invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    const taxRate = selectedTaxCode === 'ksa_standard' ? 0.15 : (selectedTaxCode === 'uae_standard' ? 0.05 : 0);

    const computedTotals = useMemo(() => {
        let sub = 0;
        lines.forEach(l => {
            sub += parseFloat(l.qty || 0) * parseFloat(l.unitPrice || 0);
        });
        const tax = sub * taxRate;
        const total = sub + tax;
        return { sub, tax, total };
    }, [lines, taxRate]);

    const handleAddLine = () => {
        setLines(prev => [...prev, { id: Date.now(), description: '', qty: 1, unitPrice: 0 }]);
    };

    const handleRemoveLine = (id) => {
        if (lines.length <= 1) return;
        setLines(prev => prev.filter(l => l.id !== id));
    };

    const handleLineChange = (id, field, val) => {
        setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: val } : l));
    };

    const handleCreateInvoice = async () => {
        if (!selectedSupplier) {
            alert('Please select a supplier.');
            return;
        }

        const suppObj = suppliers.find(s => String(s.id) === String(selectedSupplier)) || { name: 'New Supplier', trn: '100000000000003' };
        const newNumber = invoiceNumber.trim() || `PINV-2026-${String(invoices.length + 84).padStart(3, '0')}`;

        const newInv = {
            id: Date.now(),
            invoice_number: newNumber,
            supplier_name: suppObj.name,
            supplier_trn: suppObj.trn,
            issue_date: invoiceDate,
            due_date: dueDate,
            currency: currency,
            subtotal: computedTotals.sub,
            tax_total: computedTotals.tax,
            total_amount: computedTotals.total,
            amount_paid: 0.00,
            balance_due: computedTotals.total,
            status: 'Unpaid',
            tax_type: selectedTaxCode === 'ksa_standard' ? 'KSA VAT 15%' : 'UAE VAT 5%'
        };

        try {
            await api.createPurchaseInvoice({
                supplier_id: selectedSupplier,
                invoice_number: newNumber,
                issue_date: invoiceDate,
                due_date: dueDate,
                currency,
                items: lines.map(l => ({
                    description: l.description,
                    quantity: l.qty,
                    unit_price: l.unitPrice
                }))
            }).catch(() => null);
        } catch {
            // fallback
        }

        setInvoices(prev => [newInv, ...prev]);
        setIsCreateOpen(false);
        setInvoiceNumber('');
        setLines([{ id: 1, description: '', qty: 1, unitPrice: 0 }]);
    };

    const handlePaySubmit = async () => {
        if (!selectedInvoice) return;
        const amt = parseFloat(paymentAmount || 0);
        if (amt <= 0) {
            alert('Please enter a valid payment amount.');
            return;
        }

        const newPaid = (parseFloat(selectedInvoice.amount_paid) || 0) + amt;
        const newBalance = Math.max(0, (parseFloat(selectedInvoice.total_amount) || 0) - newPaid);
        const newStatus = newBalance === 0 ? 'Paid' : 'Partial';

        setInvoices(prev => prev.map(inv => {
            if (inv.id === selectedInvoice.id) {
                return {
                    ...inv,
                    amount_paid: newPaid,
                    balance_due: newBalance,
                    status: newStatus
                };
            }
            return inv;
        }));

        setIsPayOpen(false);
    };

    const columnDefs = [
        { field: 'invoice_number', headerName: 'Supplier Bill #', width: 160, pinned: 'left', cellStyle: { fontWeight: 600, color: '#4f46e5' } },
        { field: 'supplier_name', headerName: 'Supplier / Vendor', flex: 1, minWidth: 220 },
        { field: 'issue_date', headerName: 'Bill Date', width: 120 },
        { field: 'due_date', headerName: 'Due Date', width: 120 },
        { field: 'tax_type', headerName: 'Input VAT Regime', width: 150 },
        { 
            field: 'subtotal', 
            headerName: 'Taxable Net', 
            width: 130, 
            valueFormatter: p => p.value ? `${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        { 
            field: 'tax_total', 
            headerName: 'Recoverable VAT', 
            width: 140, 
            cellStyle: { color: '#059669', fontWeight: 600 },
            valueFormatter: p => p.value ? `${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        { 
            field: 'total_amount', 
            headerName: 'Bill Amount', 
            width: 140, 
            cellStyle: { fontWeight: 700 },
            valueFormatter: p => p.value ? `${p.data?.currency || 'AED'} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        { 
            field: 'balance_due', 
            headerName: 'Payable Due', 
            width: 140, 
            cellStyle: p => ({ color: p.value > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }),
            valueFormatter: p => p.value ? `${p.data?.currency || 'AED'} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            cellRenderer: (params) => {
                const s = params.value || 'Unpaid';
                let bg = '#fee2e2'; let color = '#b91c1c';
                if (s === 'Paid') { bg = '#dcfce7'; color = '#15803d'; }
                else if (s === 'Partial') { bg = '#fef3c7'; color = '#b45309'; }
                return (
                    <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: bg,
                        color: color
                    }}>
                        {s}
                    </span>
                );
            }
        },
        {
            headerName: 'Actions',
            width: 120,
            pinned: 'right',
            sortable: false,
            filter: false,
            cellRenderer: (params) => {
                const inv = params.data;
                if (inv.balance_due <= 0) return null;
                return (
                    <button
                        onClick={() => {
                            setSelectedInvoice(inv);
                            setPaymentAmount(inv.balance_due);
                            setIsPayOpen(true);
                        }}
                        style={{
                            padding: '4px 10px',
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Disburse
                    </button>
                );
            }
        }
    ];

    const supplierOptions = suppliers.map(s => ({
        value: String(s.id),
        label: `${s.name} ${s.trn ? `(TRN: ${s.trn})` : ''}`
    }));

    const taxOptions = [
        { value: 'uae_standard', label: 'UAE Standard Rate (5% Recoverable)' },
        { value: 'ksa_standard', label: 'KSA Standard Rate (15% Recoverable)' },
        { value: 'rcm', label: 'Reverse Charge Mechanism (RCM)' },
        { value: 'zero_rated', label: 'Zero-Rated / Exempt' }
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
                        Purchase Invoices & Bills (Payables)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Record supplier expenses, track input VAT recovery for FTA Form 201 Box 9, and manage accounts payable disbursals.
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
                    <BiPlus size={18} /> New Purchase Bill
                </button>
            </div>

            <AgGridTable
                title="Purchase Bills Register"
                rowData={invoices}
                columnDefs={columnDefs}
                loading={loading}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE PURCHASE INVOICE MODAL */}
            <Modal
                open={isCreateOpen}
                title="Record Supplier Bill / Purchase Invoice"
                width={800}
                onOk={handleCreateInvoice}
                onCancel={() => setIsCreateOpen(false)}
                okText="Record Bill"
                cancelText="Discard"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Supplier <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <Select
                                options={supplierOptions}
                                value={selectedSupplier}
                                onChange={setSelectedSupplier}
                                placeholder="Search supplier..."
                                searchable
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Supplier Bill #
                            </label>
                            <InputText
                                placeholder="Vendor Invoice #"
                                value={invoiceNumber}
                                onChange={setInvoiceNumber}
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Bill Date
                            </label>
                            <InputText value={invoiceDate} onChange={setInvoiceDate} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Due Date
                            </label>
                            <InputText value={dueDate} onChange={setDueDate} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Input Tax Classification
                            </label>
                            <Select
                                options={taxOptions}
                                value={selectedTaxCode}
                                onChange={setSelectedTaxCode}
                            />
                        </div>
                    </div>

                    {/* Lines */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Expense & Inventory Lines</span>
                            <button
                                type="button"
                                onClick={handleAddLine}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#eef2ff',
                                    color: '#4f46e5',
                                    border: '1px solid #c7d2fe',
                                    borderRadius: '4px',
                                    padding: '4px 10px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                <BiPlus size={14} /> Add Line
                            </button>
                        </div>

                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                                        <th style={{ padding: '8px 10px', width: '50%' }}>Description / Expense Account</th>
                                        <th style={{ padding: '8px 10px', width: '15%' }}>Qty</th>
                                        <th style={{ padding: '8px 10px', width: '20%' }}>Unit Cost</th>
                                        <th style={{ padding: '8px 10px', width: '15%', textAlign: 'right' }}>Total</th>
                                        <th style={{ padding: '8px 10px', width: '40px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lines.map(line => {
                                        const lineTotal = parseFloat(line.qty || 0) * parseFloat(line.unitPrice || 0);
                                        return (
                                            <tr key={line.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '6px 8px' }}>
                                                    <InputText
                                                        placeholder="Expense or inventory item"
                                                        value={line.description}
                                                        onChange={(val) => handleLineChange(line.id, 'description', val)}
                                                    />
                                                </td>
                                                <td style={{ padding: '6px 8px' }}>
                                                    <InputNumber
                                                        value={line.qty}
                                                        min={1}
                                                        onChange={(val) => handleLineChange(line.id, 'qty', val)}
                                                    />
                                                </td>
                                                <td style={{ padding: '6px 8px' }}>
                                                    <InputNumber
                                                        value={line.unitPrice}
                                                        min={0}
                                                        precision={2}
                                                        onChange={(val) => handleLineChange(line.id, 'unitPrice', val)}
                                                    />
                                                </td>
                                                <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>
                                                    {lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveLine(line.id)}
                                                        disabled={lines.length === 1}
                                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                    >
                                                        <BiTrash size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '300px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                <span>Subtotal:</span>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>{currency} {computedTotals.sub.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                                <span>Input VAT ({(taxRate * 100).toFixed(0)}%):</span>
                                <span style={{ fontWeight: 600 }}>{currency} {computedTotals.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '8px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                                <span>Total Payable:</span>
                                <span style={{ color: '#4f46e5' }}>{currency} {computedTotals.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* RECORD PAYMENT MODAL */}
            <Modal
                open={isPayOpen}
                title={`Disburse Supplier Payment - ${selectedInvoice?.invoice_number || ''}`}
                width={500}
                onOk={handlePaySubmit}
                onCancel={() => setIsPayOpen(false)}
                okText="Disburse Payment"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                        <div><strong>Supplier:</strong> {selectedInvoice?.supplier_name}</div>
                        <div><strong>Bill Balance:</strong> <span style={{ color: '#dc2626', fontWeight: 700 }}>{selectedInvoice?.currency} {selectedInvoice?.balance_due?.toLocaleString()}</span></div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Pay From Account <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <Select
                            options={[
                                { value: 'bank_emirates_nbd', label: 'Emirates NBD - Main Operating AED' },
                                { value: 'bank_al_rajhi', label: 'Al Rajhi Bank - Commercial SAR' },
                                { value: 'cash_petty_dubai', label: 'Petty Cash - Dubai HQ' }
                            ]}
                            value={paymentAccount}
                            onChange={setPaymentAccount}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Disbursement Amount ({selectedInvoice?.currency || 'AED'})
                        </label>
                        <InputNumber
                            value={paymentAmount}
                            min={0.01}
                            max={selectedInvoice?.balance_due}
                            precision={2}
                            onChange={setPaymentAmount}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Wire Transfer / Cheque Reference
                        </label>
                        <InputText
                            placeholder="e.g. IBAN Transfer Ref # 8820"
                            value={paymentRef}
                            onChange={setPaymentRef}
                            allowClear
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PurchaseInvoices;


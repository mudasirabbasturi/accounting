import React, { useState } from 'react';
import { BiPlus, BiFile, BiCheckCircle, BiTrash, BiSend } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';

const SalesQuotes = () => {
    const [quotes, setQuotes] = useState([
        {
            id: 1,
            quote_number: 'QT-2026-0041',
            customer_name: 'Al-Futtaim Logistics LLC',
            quote_date: '2026-10-18',
            expiry_date: '2026-11-17',
            currency: 'AED',
            subtotal: 18500.00,
            tax_total: 925.00,
            total_amount: 19425.00,
            status: 'Accepted'
        },
        {
            id: 2,
            quote_number: 'QT-2026-0042',
            customer_name: 'Emaar Hospitality Group',
            quote_date: '2026-10-22',
            expiry_date: '2026-11-21',
            currency: 'AED',
            subtotal: 45000.00,
            tax_total: 2250.00,
            total_amount: 47250.00,
            status: 'Sent'
        },
        {
            id: 3,
            quote_number: 'QT-2026-0043',
            customer_name: 'Saudi Aramco Services Ltd',
            quote_date: '2026-10-29',
            expiry_date: '2026-11-28',
            currency: 'SAR',
            subtotal: 62000.00,
            tax_total: 9300.00,
            total_amount: 71300.00,
            status: 'Draft'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [customer, setCustomer] = useState('1');
    const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
    const [expiryDate, setExpiryDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 30);
        return d.toISOString().slice(0, 10);
    });
    const [currency, setCurrency] = useState('AED');
    const [taxRate, setTaxRate] = useState(0.05);

    const [lines, setLines] = useState([
        { id: 1, description: 'Supply of Industrial Warehouse Pallets & Stretch Wrap', qty: 200, unitPrice: 45 }
    ]);

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

    const subtotal = lines.reduce((sum, l) => sum + (parseFloat(l.qty || 0) * parseFloat(l.unitPrice || 0)), 0);
    const taxTotal = subtotal * taxRate;
    const total = subtotal + taxTotal;

    const handleCreateQuote = () => {
        const newQt = {
            id: Date.now(),
            quote_number: `QT-2026-${String(quotes.length + 44).padStart(4, '0')}`,
            customer_name: customer === '1' ? 'Al-Futtaim Logistics LLC' : (customer === '2' ? 'Emaar Hospitality Group' : 'Saudi Aramco Services Ltd'),
            quote_date: quoteDate,
            expiry_date: expiryDate,
            currency: currency,
            subtotal: subtotal,
            tax_total: taxTotal,
            total_amount: total,
            status: 'Draft'
        };

        setQuotes(prev => [newQt, ...prev]);
        setIsCreateOpen(false);
    };

    const columnDefs = [
        { field: 'quote_number', headerName: 'Quote #', width: 150, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'customer_name', headerName: 'Customer', flex: 1, minWidth: 220, cellStyle: { fontWeight: 600 } },
        { field: 'quote_date', headerName: 'Quote Date', width: 120 },
        { field: 'expiry_date', headerName: 'Expiry Date', width: 120 },
        { 
            field: 'subtotal', 
            headerName: 'Subtotal', 
            width: 140, 
            valueFormatter: p => p.value ? `${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        { 
            field: 'tax_total', 
            headerName: 'VAT', 
            width: 120, 
            cellStyle: { color: '#7c3aed', fontWeight: 600 },
            valueFormatter: p => p.value ? `${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        { 
            field: 'total_amount', 
            headerName: 'Quote Total', 
            width: 150, 
            cellStyle: { fontWeight: 700, color: '#0f172a' },
            valueFormatter: p => p.value ? `${p.data?.currency} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            cellRenderer: (params) => {
                const s = params.value || 'Draft';
                let bg = '#f1f5f9'; let color = '#475569';
                if (s === 'Accepted') { bg = '#dcfce7'; color = '#15803d'; }
                else if (s === 'Sent') { bg = '#e0e7ff'; color = '#4338ca'; }
                else if (s === 'Rejected') { bg = '#fee2e2'; color = '#b91c1c'; }
                return (
                    <span style={{
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
                        Sales Quotes & Pro-Forma Estimates
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Draft commercial quotations, send pro-forma estimates to clients, and convert accepted quotes into Sales Orders with 1 click.
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
                    <BiPlus size={18} /> New Sales Quote
                </button>
            </div>

            <AgGridTable
                title="Commercial Quotations Register"
                rowData={quotes}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE QUOTE MODAL */}
            <Modal
                open={isCreateOpen}
                title="Create Sales Quotation"
                width={800}
                onOk={handleCreateQuote}
                onCancel={() => setIsCreateOpen(false)}
                okText="Save Quote"
                cancelText="Discard"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Customer <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <Select
                                options={[
                                    { value: '1', label: 'Al-Futtaim Logistics LLC' },
                                    { value: '2', label: 'Emaar Hospitality Group' },
                                    { value: '3', label: 'Saudi Aramco Services Ltd' }
                                ]}
                                value={customer}
                                onChange={setCustomer}
                                searchable
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Currency
                            </label>
                            <Select
                                options={[
                                    { value: 'AED', label: 'AED' },
                                    { value: 'SAR', label: 'SAR' },
                                    { value: 'USD', label: 'USD' }
                                ]}
                                value={currency}
                                onChange={setCurrency}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Tax Code
                            </label>
                            <Select
                                options={[
                                    { value: 0.05, label: 'UAE VAT 5%' },
                                    { value: 0.15, label: 'KSA VAT 15%' },
                                    { value: 0, label: 'Zero-Rated 0%' }
                                ]}
                                value={taxRate}
                                onChange={setTaxRate}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Quote Date
                            </label>
                            <InputText value={quoteDate} onChange={setQuoteDate} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Expiry Date
                            </label>
                            <InputText value={expiryDate} onChange={setExpiryDate} />
                        </div>
                    </div>

                    {/* Lines */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Quote Line Items</span>
                            <button
                                type="button"
                                onClick={handleAddLine}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >
                                <BiPlus size={14} /> Add Line
                            </button>
                        </div>

                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                                        <th style={{ padding: '8px 10px', width: '55%' }}>Description</th>
                                        <th style={{ padding: '8px 10px', width: '15%' }}>Qty</th>
                                        <th style={{ padding: '8px 10px', width: '15%' }}>Unit Price</th>
                                        <th style={{ padding: '8px 10px', width: '15%', textAlign: 'right' }}>Total</th>
                                        <th style={{ padding: '8px 10px', width: '40px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lines.map(line => (
                                        <tr key={line.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '6px 8px' }}>
                                                <InputText
                                                    value={line.description}
                                                    placeholder="Product or service description"
                                                    onChange={val => handleLineChange(line.id, 'description', val)}
                                                />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <InputNumber
                                                    value={line.qty}
                                                    min={1}
                                                    onChange={val => handleLineChange(line.id, 'qty', val)}
                                                />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <InputNumber
                                                    value={line.unitPrice}
                                                    min={0}
                                                    precision={2}
                                                    onChange={val => handleLineChange(line.id, 'unitPrice', val)}
                                                />
                                            </td>
                                            <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>
                                                {(parseFloat(line.qty || 0) * parseFloat(line.unitPrice || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary Totals */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '280px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                <span>Subtotal:</span>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>{currency} {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7c3aed' }}>
                                <span>VAT ({(taxRate * 100).toFixed(0)}%):</span>
                                <span style={{ fontWeight: 600 }}>{currency} {taxTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '6px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                                <span>Total:</span>
                                <span style={{ color: '#4f46e5' }}>{currency} {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SalesQuotes;


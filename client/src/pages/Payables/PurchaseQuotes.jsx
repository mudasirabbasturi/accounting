import React, { useState } from 'react';
import { BiPlus, BiFile, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';

const PurchaseQuotes = () => {
    const [quotes, setQuotes] = useState([
        {
            id: 1,
            quote_number: 'PQ-2026-0012',
            supplier_name: 'Dell Technologies Middle East',
            quote_date: '2026-10-15',
            expiry_date: '2026-11-14',
            currency: 'AED',
            subtotal: 24000.00,
            tax_total: 1200.00,
            total_amount: 25200.00,
            status: 'Accepted'
        },
        {
            id: 2,
            quote_number: 'PQ-2026-0013',
            supplier_name: 'Sabic Petrochemical Supply',
            quote_date: '2026-10-22',
            expiry_date: '2026-11-21',
            currency: 'SAR',
            subtotal: 11400.00,
            tax_total: 1710.00,
            total_amount: 13110.00,
            status: 'Evaluating'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [supplier, setSupplier] = useState('1');
    const [quoteNumber, setQuoteNumber] = useState('');
    const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
    const [amount, setAmount] = useState(15000);

    const handleCreateQuote = () => {
        const amt = parseFloat(amount || 0);
        const newPq = {
            id: Date.now(),
            quote_number: quoteNumber.trim() || `PQ-2026-${String(quotes.length + 14).padStart(4, '0')}`,
            supplier_name: supplier === '1' ? 'Dell Technologies Middle East' : 'Sabic Petrochemical Supply',
            quote_date: quoteDate,
            expiry_date: '2026-11-30',
            currency: 'AED',
            subtotal: amt,
            tax_total: amt * 0.05,
            total_amount: amt * 1.05,
            status: 'Evaluating'
        };

        setQuotes(prev => [newPq, ...prev]);
        setIsCreateOpen(false);
    };

    const columnDefs = [
        { field: 'quote_number', headerName: 'Supplier RFQ / Quote #', width: 180, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'supplier_name', headerName: 'Supplier Name', flex: 1, minWidth: 220, cellStyle: { fontWeight: 600 } },
        { field: 'quote_date', headerName: 'Quote Date', width: 120 },
        { field: 'expiry_date', headerName: 'Valid Until', width: 120 },
        { 
            field: 'subtotal', 
            headerName: 'Taxable Amount', 
            width: 140, 
            valueFormatter: p => p.value ? `${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        { 
            field: 'tax_total', 
            headerName: 'VAT', 
            width: 120, 
            cellStyle: { color: '#059669', fontWeight: 600 },
            valueFormatter: p => p.value ? `${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        { 
            field: 'total_amount', 
            headerName: 'Total Quoted', 
            width: 150, 
            cellStyle: { fontWeight: 700, color: '#0f172a' },
            valueFormatter: p => p.value ? `${p.data?.currency} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            cellRenderer: (params) => {
                const s = params.value || 'Evaluating';
                const isAcc = s === 'Accepted';
                return (
                    <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: isAcc ? '#dcfce7' : '#e0e7ff',
                        color: isAcc ? '#15803d' : '#4338ca'
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
                        Purchase Quotes (Vendor RFQ / Price Offers)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Record vendor price quotes, compare procurement terms, and convert approved quotations directly into Purchase Orders.
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
                    <BiPlus size={18} /> New Purchase Quote
                </button>
            </div>

            <AgGridTable
                title="Vendor Quotations Register"
                rowData={quotes}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE PURCHASE QUOTE MODAL */}
            <Modal
                open={isCreateOpen}
                title="Record Vendor Purchase Quote"
                width={650}
                onOk={handleCreateQuote}
                onCancel={() => setIsCreateOpen(false)}
                okText="Save Quote"
                cancelText="Discard"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Supplier <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <Select
                                options={[
                                    { value: '1', label: 'Dell Technologies Middle East' },
                                    { value: '2', label: 'Sabic Petrochemical Supply' }
                                ]}
                                value={supplier}
                                onChange={setSupplier}
                                searchable
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Vendor Quote #
                            </label>
                            <InputText placeholder="e.g. DELL-Q99" value={quoteNumber} onChange={setQuoteNumber} />
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
                                Quoted Base Amount
                            </label>
                            <InputNumber value={amount} min={1} precision={2} onChange={setAmount} />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PurchaseQuotes;


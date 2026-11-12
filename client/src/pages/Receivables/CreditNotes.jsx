import React, { useState } from 'react';
import { BiPlus, BiFile, BiCheckCircle, BiTrash } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';

const CreditNotes = () => {
    const [creditNotes, setCreditNotes] = useState([
        {
            id: 1,
            credit_note_number: 'CN-2026-001',
            note_date: '2026-10-27',
            customer_name: 'Al-Futtaim Logistics LLC',
            invoice_ref: 'INV-2026-0001',
            reason: 'Returned 5 damaged stretch wrap rolls during delivery',
            amount: 525.00,
            currency: 'AED',
            allocated_amount: 525.00,
            remaining_credit: 0.00,
            status: 'Fully Allocated'
        },
        {
            id: 2,
            credit_note_number: 'CN-2026-002',
            note_date: '2026-10-30',
            customer_name: 'Emaar Hospitality Group',
            invoice_ref: 'INV-2026-0002',
            reason: 'Commercial volume rebate agreed on contract Q3',
            amount: 1575.00,
            currency: 'AED',
            allocated_amount: 0.00,
            remaining_credit: 1575.00,
            status: 'Available'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [customer, setCustomer] = useState('1');
    const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
    const [invoiceRef, setInvoiceRef] = useState('INV-2026-0002');
    const [amount, setAmount] = useState(500);
    const [reason, setReason] = useState('Merchandise return / price revision');

    const handleCreateCreditNote = () => {
        const amt = parseFloat(amount || 0);
        const newCn = {
            id: Date.now(),
            credit_note_number: `CN-2026-${String(creditNotes.length + 3).padStart(3, '0')}`,
            note_date: noteDate,
            customer_name: customer === '1' ? 'Al-Futtaim Logistics LLC' : 'Emaar Hospitality Group',
            invoice_ref: invoiceRef,
            reason: reason.trim(),
            amount: amt,
            currency: 'AED',
            allocated_amount: 0.00,
            remaining_credit: amt,
            status: 'Available'
        };

        setCreditNotes(prev => [newCn, ...prev]);
        setIsCreateOpen(false);
    };

    const columnDefs = [
        { field: 'credit_note_number', headerName: 'Credit Note #', width: 160, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'customer_name', headerName: 'Customer', flex: 1, minWidth: 220, cellStyle: { fontWeight: 600 } },
        { field: 'note_date', headerName: 'Date Issued', width: 120 },
        { field: 'invoice_ref', headerName: 'Against Invoice', width: 150 },
        { field: 'reason', headerName: 'Reason for Adjustment', width: 260 },
        { 
            field: 'amount', 
            headerName: 'Credit Total', 
            width: 140, 
            cellStyle: { fontWeight: 700, color: '#dc2626' },
            valueFormatter: p => p.value ? `${p.data?.currency} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        { 
            field: 'remaining_credit', 
            headerName: 'Available Balance', 
            width: 150, 
            cellStyle: { fontWeight: 700, color: '#0f172a' },
            valueFormatter: p => p.value ? `${p.data?.currency} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        {
            field: 'status',
            headerName: 'Allocation Status',
            width: 140,
            cellRenderer: (params) => {
                const s = params.value || 'Available';
                const isFull = s === 'Fully Allocated';
                return (
                    <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: isFull ? '#dcfce7' : '#fef3c7',
                        color: isFull ? '#15803d' : '#b45309'
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
                        Customer Credit Notes (Sales Adjustments)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Issue credit notes for goods returned, pricing disputes, or commercial rebates, and allocate against unpaid sales invoices.
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
                    <BiPlus size={18} /> Issue Credit Note
                </button>
            </div>

            <AgGridTable
                title="Customer Credit Notes Register"
                rowData={creditNotes}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE CREDIT NOTE MODAL */}
            <Modal
                open={isCreateOpen}
                title="Issue Customer Credit Note"
                width={650}
                onOk={handleCreateCreditNote}
                onCancel={() => setIsCreateOpen(false)}
                okText="Issue Credit Note"
                cancelText="Discard"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Customer <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <Select
                                options={[
                                    { value: '1', label: 'Al-Futtaim Logistics LLC' },
                                    { value: '2', label: 'Emaar Hospitality Group' }
                                ]}
                                value={customer}
                                onChange={setCustomer}
                                searchable
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Original Invoice Ref #
                            </label>
                            <InputText value={invoiceRef} onChange={setInvoiceRef} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Credit Issue Date
                            </label>
                            <InputText value={noteDate} onChange={setNoteDate} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Credit Amount (Inc. VAT) <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputNumber value={amount} min={1} precision={2} onChange={setAmount} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Reason for Credit Note
                        </label>
                        <InputText
                            placeholder="e.g. Returned damaged pallets or billing rate discrepancy"
                            value={reason}
                            onChange={setReason}
                            allowClear
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CreditNotes;


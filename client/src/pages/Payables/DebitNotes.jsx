import React, { useState } from 'react';
import { BiPlus, BiFile, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';

const DebitNotes = () => {
    const [debitNotes, setDebitNotes] = useState([
        {
            id: 1,
            debit_note_number: 'DN-VEND-001',
            note_date: '2026-10-24',
            supplier_name: 'Dell Technologies Middle East',
            bill_ref: 'PINV-2026-082',
            reason: 'Defective memory module returned for warranty credit',
            amount: 850.00,
            currency: 'AED',
            status: 'Applied to Bill'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [supplier, setSupplier] = useState('1');
    const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
    const [billRef, setBillRef] = useState('PINV-2026-082');
    const [amount, setAmount] = useState(850);
    const [reason, setReason] = useState('Defective hardware returned to vendor');

    const handleCreateDebitNote = () => {
        const amt = parseFloat(amount || 0);
        const newDn = {
            id: Date.now(),
            debit_note_number: `DN-VEND-${String(debitNotes.length + 2).padStart(3, '0')}`,
            note_date: noteDate,
            supplier_name: supplier === '1' ? 'Dell Technologies Middle East' : 'Sabic Petrochemical Supply',
            bill_ref: billRef,
            reason: reason.trim(),
            amount: amt,
            currency: 'AED',
            status: 'Available Credit'
        };

        setDebitNotes(prev => [newDn, ...prev]);
        setIsCreateOpen(false);
    };

    const columnDefs = [
        { field: 'debit_note_number', headerName: 'Debit Note #', width: 170, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'supplier_name', headerName: 'Supplier Name', flex: 1, minWidth: 220, cellStyle: { fontWeight: 600 } },
        { field: 'note_date', headerName: 'Date Issued', width: 120 },
        { field: 'bill_ref', headerName: 'Vendor Bill Ref', width: 150 },
        { field: 'reason', headerName: 'Reason for Debit', width: 260 },
        { 
            field: 'amount', 
            headerName: 'Debit Amount', 
            width: 150, 
            cellStyle: { fontWeight: 700, color: '#15803d' },
            valueFormatter: p => p.value ? `${p.data?.currency} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        {
            field: 'status',
            headerName: 'Settlement Status',
            width: 150,
            cellRenderer: (params) => {
                const s = params.value || 'Available Credit';
                const isApp = s.includes('Applied');
                return (
                    <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: isApp ? '#dcfce7' : '#fef3c7',
                        color: isApp ? '#15803d' : '#b45309'
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
                        Supplier Debit Notes (Purchase Returns)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Issue debit claims against vendors for damaged shipments, short delivery, or price overcharges to deduct from bills payable.
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
                    <BiPlus size={18} /> Issue Debit Note
                </button>
            </div>

            <AgGridTable
                title="Supplier Debit Notes Register"
                rowData={debitNotes}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE DEBIT NOTE MODAL */}
            <Modal
                open={isCreateOpen}
                title="Issue Supplier Debit Note"
                width={650}
                onOk={handleCreateDebitNote}
                onCancel={() => setIsCreateOpen(false)}
                okText="Issue Debit Note"
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
                                Vendor Bill Ref
                            </label>
                            <InputText value={billRef} onChange={setBillRef} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Debit Date
                            </label>
                            <InputText value={noteDate} onChange={setNoteDate} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Claim Amount (AED)
                            </label>
                            <InputNumber value={amount} min={1} precision={2} onChange={setAmount} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Reason for Claim
                        </label>
                        <InputText
                            placeholder="e.g. Returned defective goods or billing excess"
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

export default DebitNotes;


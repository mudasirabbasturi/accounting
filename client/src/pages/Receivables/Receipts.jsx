import React, { useState, useEffect } from 'react';
import { BiPlus, BiWallet, BiCheckCircle, BiPrinter } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';
import api from '../../services/api';

const Receipts = () => {
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form fields
    const [receiptNumber, setReceiptNumber] = useState('');
    const [customer, setCustomer] = useState('1');
    const [account, setAccount] = useState('bank_emirates_nbd');
    const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
    const [amount, setAmount] = useState(5000);
    const [paymentMethod, setPaymentMethod] = useState('wire');
    const [reference, setReference] = useState('');
    const [memo, setMemo] = useState('Partial settlement for sales invoice');

    useEffect(() => {
        loadReceipts();
    }, []);

    const loadReceipts = async () => {
        setLoading(true);
        try {
            const res = await api.getReceipts().catch(() => null);
            if (res && Array.isArray(res) && res.length > 0) {
                setReceipts(res);
            } else {
                setReceipts([
                    {
                        id: 1,
                        receipt_number: 'RCT-2026-001',
                        receipt_date: '2026-10-25',
                        customer_name: 'Al-Futtaim Logistics LLC',
                        account_name: 'Emirates NBD - Corporate Operating',
                        payment_method: 'Bank Wire Transfer',
                        reference: 'TXN-998201',
                        amount: 14700.00,
                        currency: 'AED',
                        memo: 'Full settlement of Tax Invoice INV-2026-0001',
                        status: 'Cleared'
                    },
                    {
                        id: 2,
                        receipt_number: 'RCT-2026-002',
                        receipt_date: '2026-10-28',
                        customer_name: 'Emaar Hospitality Group',
                        account_name: 'Emirates NBD - Corporate Operating',
                        payment_method: 'Corporate Cheque',
                        reference: 'CHQ-55201',
                        amount: 10000.00,
                        currency: 'AED',
                        memo: 'First milestone payment for INV-2026-0002',
                        status: 'Cleared'
                    }
                ]);
            }
        } catch (err) {
            console.error('Error loading receipts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReceipt = async () => {
        const amt = parseFloat(amount || 0);
        if (amt <= 0) {
            alert('Amount received must be greater than zero.');
            return;
        }

        const newRct = {
            id: Date.now(),
            receipt_number: receiptNumber.trim() || `RCT-2026-${String(receipts.length + 3).padStart(3, '0')}`,
            receipt_date: receiptDate,
            customer_name: customer === '1' ? 'Al-Futtaim Logistics LLC' : (customer === '2' ? 'Emaar Hospitality Group' : 'Saudi Aramco Services'),
            account_name: account === 'bank_emirates_nbd' ? 'Emirates NBD - Corporate Operating' : 'Al Rajhi Bank SAR Account',
            payment_method: paymentMethod === 'wire' ? 'Bank Wire Transfer' : 'Corporate Cheque',
            reference: reference.trim() || 'REF-AUTO',
            amount: amt,
            currency: 'AED',
            memo: memo.trim() || 'Settlement of outstanding receivables',
            status: 'Cleared'
        };

        try {
            await api.createReceipt({
                receipt_number: newRct.receipt_number,
                customer_id: customer,
                account_id: account,
                receipt_date: receiptDate,
                amount: amt,
                payment_method: paymentMethod,
                reference,
                memo
            }).catch(() => null);
        } catch {
            // fallback
        }

        setReceipts(prev => [newRct, ...prev]);
        setIsCreateOpen(false);
        setReceiptNumber('');
        setReference('');
    };

    const columnDefs = [
        { field: 'receipt_number', headerName: 'Receipt Voucher #', width: 170, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'receipt_date', headerName: 'Date Received', width: 130 },
        { field: 'customer_name', headerName: 'Received From (Customer)', flex: 1, minWidth: 220, cellStyle: { fontWeight: 600 } },
        { field: 'account_name', headerName: 'Deposited To Account', width: 220 },
        { field: 'payment_method', headerName: 'Payment Mode', width: 160 },
        { field: 'reference', headerName: 'Bank Ref / Cheque #', width: 160 },
        { 
            field: 'amount', 
            headerName: 'Amount Received', 
            width: 170, 
            cellStyle: { fontWeight: 700, color: '#15803d' },
            valueFormatter: p => p.value ? `${p.data?.currency} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        { field: 'memo', headerName: 'Remarks / Invoice Ref', width: 240 },
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
                    Cleared
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
                        Customer Receipts (Payment Vouchers)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Record customer payments received into bank and cash accounts, apply invoice settlements, and track cleared funds.
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
                    <BiPlus size={18} /> Record Customer Receipt
                </button>
            </div>

            <AgGridTable
                title="Customer Receipts Register"
                rowData={receipts}
                columnDefs={columnDefs}
                loading={loading}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE RECEIPT MODAL */}
            <Modal
                open={isCreateOpen}
                title="Record Customer Receipt / Inward Payment"
                width={650}
                onOk={handleCreateReceipt}
                onCancel={() => setIsCreateOpen(false)}
                okText="Post Receipt"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Received From Customer <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <Select
                                options={[
                                    { value: '1', label: 'Al-Futtaim Logistics LLC (TRN: 100234567800003)' },
                                    { value: '2', label: 'Emaar Hospitality Group (TRN: 100456789000003)' },
                                    { value: '3', label: 'Saudi Aramco Services Ltd (TRN: 300987654300003)' }
                                ]}
                                value={customer}
                                onChange={setCustomer}
                                searchable
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Receipt Voucher #
                            </label>
                            <InputText
                                placeholder="Auto-generated"
                                value={receiptNumber}
                                onChange={setReceiptNumber}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Deposit Into Account <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <Select
                                options={[
                                    { value: 'bank_emirates_nbd', label: 'Emirates NBD - Corporate Operating (AED)' },
                                    { value: 'bank_al_rajhi', label: 'Al Rajhi Bank - Commercial (SAR)' },
                                    { value: 'bank_mashreq_usd', label: 'Mashreq Bank - USD Global (USD)' },
                                    { value: 'cash_petty_dubai', label: 'Petty Cash - Dubai HQ (AED)' }
                                ]}
                                value={account}
                                onChange={setAccount}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Date Received
                            </label>
                            <InputText value={receiptDate} onChange={setReceiptDate} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Amount Received <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputNumber
                                value={amount}
                                min={1}
                                precision={2}
                                onChange={setAmount}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Payment Method
                            </label>
                            <Select
                                options={[
                                    { value: 'wire', label: 'Bank Wire / TT' },
                                    { value: 'cheque', label: 'Cheque' },
                                    { value: 'credit_card', label: 'Credit Card' },
                                    { value: 'cash', label: 'Cash' }
                                ]}
                                value={paymentMethod}
                                onChange={setPaymentMethod}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Transaction Reference #
                            </label>
                            <InputText
                                placeholder="e.g. Wire Ref # 99201"
                                value={reference}
                                onChange={setReference}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Description / Allocation Notes
                        </label>
                        <InputText
                            placeholder="e.g. Settlement for Tax Invoice INV-2026-0001"
                            value={memo}
                            onChange={setMemo}
                            allowClear
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Receipts;


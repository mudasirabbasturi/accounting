import React, { useState } from 'react';
import { BiPlus, BiBox, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';

const PurchaseOrders = () => {
    const [orders, setOrders] = useState([
        {
            id: 1,
            order_number: 'PO-2026-0034',
            supplier_name: 'Dell Technologies Middle East',
            order_date: '2026-10-18',
            delivery_date: '2026-10-28',
            currency: 'AED',
            subtotal: 24000.00,
            tax_total: 1200.00,
            total_amount: 25200.00,
            receiving_status: '100% Received',
            billing_status: 'Fully Invoiced',
            status: 'Received'
        },
        {
            id: 2,
            order_number: 'PO-2026-0035',
            supplier_name: 'Sabic Petrochemical Supply',
            order_date: '2026-10-25',
            delivery_date: '2026-11-08',
            currency: 'SAR',
            subtotal: 11400.00,
            tax_total: 1710.00,
            total_amount: 13110.00,
            receiving_status: 'Pending Receipt',
            billing_status: 'Billed',
            status: 'Pending'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [supplier, setSupplier] = useState('1');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
    const [deliveryDate, setDeliveryDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 14);
        return d.toISOString().slice(0, 10);
    });
    const [amount, setAmount] = useState(25000);

    const handleCreateOrder = () => {
        const amt = parseFloat(amount || 0);
        const newPo = {
            id: Date.now(),
            order_number: `PO-2026-${String(orders.length + 36).padStart(4, '0')}`,
            supplier_name: supplier === '1' ? 'Dell Technologies Middle East' : 'Sabic Petrochemical Supply',
            order_date: orderDate,
            delivery_date: deliveryDate,
            currency: 'AED',
            subtotal: amt,
            tax_total: amt * 0.05,
            total_amount: amt * 1.05,
            receiving_status: 'Pending Receipt',
            billing_status: 'Unbilled',
            status: 'Pending'
        };

        setOrders(prev => [newPo, ...prev]);
        setIsCreateOpen(false);
    };

    const columnDefs = [
        { field: 'order_number', headerName: 'Purchase Order #', width: 170, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'supplier_name', headerName: 'Supplier Name', flex: 1, minWidth: 220, cellStyle: { fontWeight: 600 } },
        { field: 'order_date', headerName: 'Order Date', width: 120 },
        { field: 'delivery_date', headerName: 'Target Delivery', width: 130 },
        { 
            field: 'total_amount', 
            headerName: 'PO Total', 
            width: 140, 
            cellStyle: { fontWeight: 700, color: '#0f172a' },
            valueFormatter: p => p.value ? `${p.data?.currency} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        { field: 'receiving_status', headerName: 'Receipt Progress', width: 160 },
        { field: 'billing_status', headerName: 'Billing Progress', width: 160 },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            cellRenderer: (params) => {
                const s = params.value || 'Pending';
                const isRec = s === 'Received';
                return (
                    <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: isRec ? '#dcfce7' : '#fef3c7',
                        color: isRec ? '#15803d' : '#b45309'
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
                        Purchase Orders (Procurement)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Issue formal purchase contracts to vendors, track warehouse goods receipts, and reconcile three-way matching against bills.
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
                    <BiPlus size={18} /> New Purchase Order
                </button>
            </div>

            <AgGridTable
                title="Purchase Orders Register"
                rowData={orders}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE PURCHASE ORDER MODAL */}
            <Modal
                open={isCreateOpen}
                title="Issue New Purchase Order"
                width={650}
                onOk={handleCreateOrder}
                onCancel={() => setIsCreateOpen(false)}
                okText="Issue Purchase Order"
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
                                PO Order Amount (AED)
                            </label>
                            <InputNumber value={amount} min={1} precision={2} onChange={setAmount} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                PO Issue Date
                            </label>
                            <InputText value={orderDate} onChange={setOrderDate} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Target Delivery Date
                            </label>
                            <InputText value={deliveryDate} onChange={setDeliveryDate} />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PurchaseOrders;


import React, { useState } from 'react';
import { BiPlus, BiBox, BiCheckCircle, BiTrash } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';

const SalesOrders = () => {
    const [orders, setOrders] = useState([
        {
            id: 1,
            order_number: 'SO-2026-0112',
            customer_name: 'Al-Futtaim Logistics LLC',
            order_date: '2026-10-20',
            delivery_date: '2026-11-05',
            currency: 'AED',
            subtotal: 14000.00,
            tax_total: 700.00,
            total_amount: 14700.00,
            delivery_progress: '100% Delivered',
            invoicing_status: 'Fully Invoiced',
            status: 'Delivered'
        },
        {
            id: 2,
            order_number: 'SO-2026-0113',
            customer_name: 'Emaar Hospitality Group',
            order_date: '2026-10-24',
            delivery_date: '2026-11-10',
            currency: 'AED',
            subtotal: 31000.00,
            tax_total: 1550.00,
            total_amount: 32550.00,
            delivery_progress: '50% Delivered',
            invoicing_status: 'Partially Invoiced',
            status: 'In Progress'
        },
        {
            id: 3,
            order_number: 'SO-2026-0114',
            customer_name: 'Sharjah Aviation Authority',
            order_date: '2026-10-30',
            delivery_date: '2026-11-15',
            currency: 'AED',
            subtotal: 7500.00,
            tax_total: 375.00,
            total_amount: 7875.00,
            delivery_progress: '0% Delivered',
            invoicing_status: 'Not Invoiced',
            status: 'Pending'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [customer, setCustomer] = useState('1');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
    const [deliveryDate, setDeliveryDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 14);
        return d.toISOString().slice(0, 10);
    });
    const [currency, setCurrency] = useState('AED');

    const handleCreateOrder = () => {
        const newSo = {
            id: Date.now(),
            order_number: `SO-2026-${String(orders.length + 115).padStart(4, '0')}`,
            customer_name: customer === '1' ? 'Al-Futtaim Logistics LLC' : (customer === '2' ? 'Emaar Hospitality Group' : 'Sharjah Aviation Authority'),
            order_date: orderDate,
            delivery_date: deliveryDate,
            currency: currency,
            subtotal: 10000.00,
            tax_total: 500.00,
            total_amount: 10500.00,
            delivery_progress: '0% Delivered',
            invoicing_status: 'Not Invoiced',
            status: 'Pending'
        };

        setOrders(prev => [newSo, ...prev]);
        setIsCreateOpen(false);
    };

    const columnDefs = [
        { field: 'order_number', headerName: 'Order #', width: 150, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'customer_name', headerName: 'Customer', flex: 1, minWidth: 220, cellStyle: { fontWeight: 600 } },
        { field: 'order_date', headerName: 'Order Date', width: 120 },
        { field: 'delivery_date', headerName: 'Target Delivery', width: 130 },
        { 
            field: 'total_amount', 
            headerName: 'Order Total', 
            width: 140, 
            cellStyle: { fontWeight: 700, color: '#0f172a' },
            valueFormatter: p => p.value ? `${p.data?.currency} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00' 
        },
        { field: 'delivery_progress', headerName: 'Delivery Progress', width: 160 },
        { field: 'invoicing_status', headerName: 'Invoicing Status', width: 160 },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            cellRenderer: (params) => {
                const s = params.value || 'Pending';
                let bg = '#fef3c7'; let color = '#b45309';
                if (s === 'Delivered') { bg = '#dcfce7'; color = '#15803d'; }
                else if (s === 'In Progress') { bg = '#e0e7ff'; color = '#4338ca'; }
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
                        Sales Orders & Fulfillment
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Track confirmed commercial orders, warehouse fulfillment dispatch rates, and invoiced quantity balances.
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
                    <BiPlus size={18} /> New Sales Order
                </button>
            </div>

            <AgGridTable
                title="Sales Orders Fulfillment Register"
                rowData={orders}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE SALES ORDER MODAL */}
            <Modal
                open={isCreateOpen}
                title="Create Confirmed Sales Order"
                width={650}
                onOk={handleCreateOrder}
                onCancel={() => setIsCreateOpen(false)}
                okText="Confirm Order"
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
                                    { value: '2', label: 'Emaar Hospitality Group' },
                                    { value: '3', label: 'Sharjah Aviation Authority' }
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
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Order Date
                            </label>
                            <InputText value={orderDate} onChange={setOrderDate} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Expected Delivery Date
                            </label>
                            <InputText value={deliveryDate} onChange={setDeliveryDate} />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SalesOrders;


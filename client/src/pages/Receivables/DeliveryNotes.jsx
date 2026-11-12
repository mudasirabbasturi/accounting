import React, { useState } from 'react';
import { BiPlus, BiPackage, BiCheckCircle, BiTrash } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';

const DeliveryNotes = () => {
    const [deliveries, setDeliveries] = useState([
        {
            id: 1,
            delivery_number: 'DN-2026-0081',
            delivery_date: '2026-10-21',
            customer_name: 'Al-Futtaim Logistics LLC',
            order_ref: 'SO-2026-0112',
            warehouse: 'Main Warehouse - Dubai South',
            carrier: 'DHL Global Forwarding',
            tracking_number: 'DHL-DXB-998201',
            status: 'Delivered'
        },
        {
            id: 2,
            delivery_number: 'DN-2026-0082',
            delivery_date: '2026-10-25',
            customer_name: 'Emaar Hospitality Group',
            order_ref: 'SO-2026-0113',
            warehouse: 'Bonded Facility - JAFZA',
            carrier: 'Internal Fleet Truck #4',
            tracking_number: 'FLEET-DXB-04',
            status: 'In Transit'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [customer, setCustomer] = useState('1');
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
    const [orderRef, setOrderRef] = useState('SO-2026-0114');
    const [carrier, setCarrier] = useState('Aramex Express Logistics');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [warehouse, setWarehouse] = useState('wh_dubai_south');

    const handleCreateDelivery = () => {
        const newDn = {
            id: Date.now(),
            delivery_number: `DN-2026-${String(deliveries.length + 83).padStart(4, '0')}`,
            delivery_date: deliveryDate,
            customer_name: customer === '1' ? 'Al-Futtaim Logistics LLC' : 'Emaar Hospitality Group',
            order_ref: orderRef,
            warehouse: warehouse === 'wh_dubai_south' ? 'Main Warehouse - Dubai South' : 'Bonded Facility - JAFZA',
            carrier: carrier,
            tracking_number: trackingNumber || `TRK-${Date.now().toString().slice(-6)}`,
            status: 'In Transit'
        };

        setDeliveries(prev => [newDn, ...prev]);
        setIsCreateOpen(false);
    };

    const columnDefs = [
        { field: 'delivery_number', headerName: 'Delivery Note #', width: 170, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'customer_name', headerName: 'Customer', flex: 1, minWidth: 220, cellStyle: { fontWeight: 600 } },
        { field: 'delivery_date', headerName: 'Dispatch Date', width: 130 },
        { field: 'order_ref', headerName: 'Sales Order Ref', width: 150 },
        { field: 'warehouse', headerName: 'Dispatch Facility', width: 220 },
        { field: 'carrier', headerName: 'Carrier / Courier', width: 180 },
        { field: 'tracking_number', headerName: 'Waybill / Tracking #', width: 180 },
        {
            field: 'status',
            headerName: 'Delivery Status',
            width: 140,
            cellRenderer: (params) => {
                const s = params.value || 'Delivered';
                const isDelivered = s === 'Delivered';
                return (
                    <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: isDelivered ? '#dcfce7' : '#e0e7ff',
                        color: isDelivered ? '#15803d' : '#4338ca'
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
                        Delivery Notes & Packing Slips
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Generate physical proof of dispatch, track carrier consignment waybills, and update perpetual inventory stock deductions.
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
                    <BiPlus size={18} /> New Delivery Note
                </button>
            </div>

            <AgGridTable
                title="Goods Delivery Register"
                rowData={deliveries}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE DELIVERY NOTE MODAL */}
            <Modal
                open={isCreateOpen}
                title="Create Delivery Note / Dispatch Slip"
                width={650}
                onOk={handleCreateDelivery}
                onCancel={() => setIsCreateOpen(false)}
                okText="Dispatch Goods"
                cancelText="Cancel"
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
                                Sales Order Ref
                            </label>
                            <InputText value={orderRef} onChange={setOrderRef} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Dispatch Date
                            </label>
                            <InputText value={deliveryDate} onChange={setDeliveryDate} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Dispatch Origin Facility
                            </label>
                            <Select
                                options={[
                                    { value: 'wh_dubai_south', label: 'Main Warehouse - Dubai South' },
                                    { value: 'wh_jebel_ali', label: 'Bonded Facility - JAFZA' }
                                ]}
                                value={warehouse}
                                onChange={setWarehouse}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Carrier / Courier Fleet
                            </label>
                            <InputText value={carrier} onChange={setCarrier} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Tracking / Airway Bill #
                            </label>
                            <InputText
                                placeholder="e.g. AWB-998201"
                                value={trackingNumber}
                                onChange={setTrackingNumber}
                                allowClear
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DeliveryNotes;


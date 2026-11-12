import React, { useState } from 'react';
import { BiPlus, BiTransfer, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';

const InventoryTransfers = () => {
    const [transfers, setTransfers] = useState([
        {
            id: 1,
            transfer_number: 'ST-2026-0012',
            transfer_date: '2026-10-21',
            from_location: 'Main Warehouse - Dubai South',
            to_location: 'Bonded Facility - JAFZA',
            item_name: 'Heavy Duty Industrial Euro Pallet (1200x800mm)',
            item_code: 'INV-LOG-003',
            quantity: 150.00,
            uom: 'PCS',
            valuation: 4200.00,
            reason: 'Replenishment for export shipment staging',
            status: 'Completed'
        },
        {
            id: 2,
            transfer_number: 'ST-2026-0013',
            transfer_date: '2026-10-28',
            from_location: 'Main Warehouse - Dubai South',
            to_location: 'Distribution Hub - Riyadh Industrial',
            item_name: 'Cisco Catalyst 9200L 48-Port PoE+ Gigabit Switch',
            item_code: 'INV-IT-001',
            quantity: 4.00,
            uom: 'PCS',
            valuation: 8400.00,
            reason: 'Transfer for KSA customer order fulfillment',
            status: 'In Transit'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [fromLoc, setFromLoc] = useState('wh_dubai_south');
    const [toLoc, setToLoc] = useState('wh_jebel_ali');
    const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
    const [item, setItem] = useState('INV-LOG-003');
    const [quantity, setQuantity] = useState(50);
    const [reason, setReason] = useState('Inter-branch stock rebalancing');

    const handleCreateTransfer = () => {
        const qty = parseFloat(quantity || 0);
        const newSt = {
            id: Date.now(),
            transfer_number: `ST-2026-${String(transfers.length + 14).padStart(4, '0')}`,
            transfer_date: transferDate,
            from_location: fromLoc === 'wh_dubai_south' ? 'Main Warehouse - Dubai South' : 'Bonded Facility - JAFZA',
            to_location: toLoc === 'wh_jebel_ali' ? 'Bonded Facility - JAFZA' : 'Distribution Hub - Riyadh',
            item_name: 'Heavy Duty Euro Pallet',
            item_code: item,
            quantity: qty,
            uom: 'PCS',
            valuation: qty * 28.00,
            reason: reason.trim(),
            status: 'Completed'
        };

        setTransfers(prev => [newSt, ...prev]);
        setIsCreateOpen(false);
    };

    const columnDefs = [
        { field: 'transfer_number', headerName: 'Transfer Note #', width: 170, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'transfer_date', headerName: 'Transfer Date', width: 130 },
        { field: 'from_location', headerName: 'Source Facility', width: 220 },
        { field: 'to_location', headerName: 'Destination Facility', width: 220 },
        { field: 'item_name', headerName: 'Item Description', flex: 1, minWidth: 220, cellStyle: { fontWeight: 600 } },
        { 
            field: 'quantity', 
            headerName: 'Qty Transferred', 
            width: 140, 
            cellStyle: { fontWeight: 700 },
            valueFormatter: p => `${parseFloat(p.value).toLocaleString()} ${p.data?.uom}` 
        },
        { 
            field: 'valuation', 
            headerName: 'Stock Value ($)', 
            width: 140, 
            cellStyle: { fontWeight: 700, color: '#0f172a' },
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00' 
        },
        { field: 'reason', headerName: 'Movement Reason', width: 240 },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            cellRenderer: (params) => {
                const isComp = params.value === 'Completed';
                return (
                    <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: isComp ? '#dcfce7' : '#e0e7ff',
                        color: isComp ? '#15803d' : '#4338ca'
                    }}>
                        {params.value}
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
                        Inventory Stock Transfers
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Transfer stock between multiple warehouses, bonded zones, and regional distribution centers with audit trail tracking.
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
                    <BiPlus size={18} /> New Stock Transfer
                </button>
            </div>

            <AgGridTable
                title="Inter-Warehouse Stock Transfers Register"
                rowData={transfers}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE TRANSFER MODAL */}
            <Modal
                open={isCreateOpen}
                title="Execute Stock Transfer Between Facilities"
                width={650}
                onOk={handleCreateTransfer}
                onCancel={() => setIsCreateOpen(false)}
                okText="Transfer Stock"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                From Warehouse <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <Select
                                options={[
                                    { value: 'wh_dubai_south', label: 'Main Warehouse - Dubai South' },
                                    { value: 'wh_jebel_ali', label: 'Bonded Facility - JAFZA' }
                                ]}
                                value={fromLoc}
                                onChange={setFromLoc}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                To Warehouse <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <Select
                                options={[
                                    { value: 'wh_jebel_ali', label: 'Bonded Facility - JAFZA' },
                                    { value: 'wh_riyadh', label: 'Distribution Hub - Riyadh' }
                                ]}
                                value={toLoc}
                                onChange={setToLoc}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Inventory Item <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <Select
                                options={[
                                    { value: 'INV-IT-001', label: 'INV-IT-001: Cisco Catalyst 9200L' },
                                    { value: 'INV-LOG-003', label: 'INV-LOG-003: Euro Pallets' },
                                    { value: 'INV-PKG-004', label: 'INV-PKG-004: Stretch Film Roll' }
                                ]}
                                value={item}
                                onChange={setItem}
                                searchable
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Qty to Transfer
                            </label>
                            <InputNumber value={quantity} min={1} onChange={setQuantity} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Date
                            </label>
                            <InputText value={transferDate} onChange={setTransferDate} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Transfer Reason / Note
                        </label>
                        <InputText value={reason} onChange={setReason} allowClear />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default InventoryTransfers;


import React, { useState } from 'react';
import { BiPlus, BiTrash, BiErrorCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';

const InventoryWriteOffs = () => {
    const [writeOffs, setWriteOffs] = useState([
        {
            id: 1,
            write_off_number: 'WO-2026-0004',
            write_off_date: '2026-10-19',
            warehouse: 'Main Warehouse - Dubai South',
            item_name: 'High-Tensile Machine Stretch Film Roll 23 Micron',
            item_code: 'INV-PKG-004',
            quantity: 2.00,
            uom: 'ROLL',
            valuation_loss: 130.00,
            expense_account: '5040 - Inventory Shrinkage & Loss',
            reason: 'Water damage during warehouse roof maintenance',
            approved_by: 'Fatima Al-Zahra (CFO)',
            status: 'Written Off'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [warehouse, setWarehouse] = useState('wh_dubai_south');
    const [item, setItem] = useState('INV-PKG-004');
    const [quantity, setQuantity] = useState(1);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [reason, setReason] = useState('damaged');

    const handleCreateWriteOff = () => {
        const qty = parseFloat(quantity || 0);
        const newWo = {
            id: Date.now(),
            write_off_number: `WO-2026-${String(writeOffs.length + 5).padStart(4, '0')}`,
            write_off_date: date,
            warehouse: warehouse === 'wh_dubai_south' ? 'Main Warehouse - Dubai South' : 'Bonded Facility - JAFZA',
            item_name: 'High-Tensile Machine Stretch Film Roll',
            item_code: item,
            quantity: qty,
            uom: 'ROLL',
            valuation_loss: qty * 65.00,
            expense_account: '5040 - Inventory Shrinkage & Loss',
            reason: reason === 'damaged' ? 'Physical transit damage' : 'Discrepancy post physical stock count',
            approved_by: 'Current Supervisor',
            status: 'Written Off'
        };

        setWriteOffs(prev => [newWo, ...prev]);
        setIsCreateOpen(false);
    };

    const columnDefs = [
        { field: 'write_off_number', headerName: 'Write-Off Voucher #', width: 180, pinned: 'left', cellStyle: { fontWeight: 700, color: '#dc2626' } },
        { field: 'write_off_date', headerName: 'Date', width: 120 },
        { field: 'warehouse', headerName: 'Warehouse Facility', width: 220 },
        { field: 'item_name', headerName: 'Stock Item', flex: 1, minWidth: 220, cellStyle: { fontWeight: 600 } },
        { 
            field: 'quantity', 
            headerName: 'Qty Written Off', 
            width: 140, 
            cellStyle: { fontWeight: 700, color: '#dc2626' },
            valueFormatter: p => `${parseFloat(p.value).toLocaleString()} ${p.data?.uom}` 
        },
        { 
            field: 'valuation_loss', 
            headerName: 'Loss Valuation ($)', 
            width: 160, 
            cellStyle: { fontWeight: 700, color: '#dc2626' },
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00' 
        },
        { field: 'expense_account', headerName: 'Ledger Charge Account', width: 220 },
        { field: 'reason', headerName: 'Audit Justification', width: 260 },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            cellRenderer: () => (
                <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c'
                }}>
                    Written Off
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
                        Inventory Write-Offs & Stock Adjustments
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Record damaged, expired, stolen, or scrapped inventory and post automatic COGS / shrinkage journal entries.
                    </p>
                </div>

                <button
                    onClick={() => setIsCreateOpen(true)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(220, 38, 38, 0.3)'
                    }}
                >
                    <BiPlus size={18} /> Record Stock Write-Off
                </button>
            </div>

            <AgGridTable
                title="Inventory Write-Offs Register"
                rowData={writeOffs}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE WRITE OFF MODAL */}
            <Modal
                open={isCreateOpen}
                title="Record Inventory Stock Write-Off"
                width={650}
                onOk={handleCreateWriteOff}
                onCancel={() => setIsCreateOpen(false)}
                okText="Post Write-Off"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Warehouse Facility <span style={{ color: '#ef4444' }}>*</span>
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

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Write-Off Date
                            </label>
                            <InputText value={date} onChange={setDate} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Inventory Item to Scrap <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <Select
                                options={[
                                    { value: 'INV-PKG-004', label: 'INV-PKG-004: Stretch Film Roll' },
                                    { value: 'INV-LOG-003', label: 'INV-LOG-003: Euro Pallets' },
                                    { value: 'INV-IT-001', label: 'INV-IT-001: Cisco Catalyst 9200L' }
                                ]}
                                value={item}
                                onChange={setItem}
                                searchable
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Qty to Write Off
                            </label>
                            <InputNumber value={quantity} min={1} onChange={setQuantity} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Primary Reason for Loss
                        </label>
                        <Select
                            options={[
                                { value: 'damaged', label: 'Damaged in transit / handling' },
                                { value: 'expired', label: 'Expired / Obsolete stock' },
                                { value: 'discrepancy', label: 'Physical audit count discrepancy' },
                                { value: 'theft', label: 'Pilferage / Missing in storage' }
                            ]}
                            value={reason}
                            onChange={setReason}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default InventoryWriteOffs;


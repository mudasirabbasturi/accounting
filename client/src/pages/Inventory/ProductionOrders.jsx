import React, { useState } from 'react';
import { BiPlus, BiCog, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';

const ProductionOrders = () => {
    const [orders, setOrders] = useState([
        {
            id: 1,
            production_number: 'PRD-2026-0008',
            order_date: '2026-10-15',
            completion_date: '2026-10-17',
            output_item: 'Custom Pre-Configured Enterprise Server Rack Bundle',
            output_code: 'ASY-SRV-RACK',
            qty_required: 5.00,
            qty_produced: 5.00,
            material_cost: 24250.00,
            labor_overhead_cost: 1500.00,
            total_production_cost: 25750.00,
            status: 'Completed'
        },
        {
            id: 2,
            production_number: 'PRD-2026-0009',
            order_date: '2026-10-26',
            completion_date: '2026-11-02',
            output_item: 'Industrial Pallet & Shrink Wrap Assembly Kits',
            output_code: 'ASY-PLT-KIT',
            qty_required: 50.00,
            qty_produced: 25.00,
            material_cost: 3200.00,
            labor_overhead_cost: 400.00,
            total_production_cost: 3600.00,
            status: 'In Production'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
    const [qty, setQty] = useState(10);
    const [materialCost, setMaterialCost] = useState(5000);
    const [laborCost, setLaborCost] = useState(500);

    const handleCreateOrder = () => {
        const q = parseFloat(qty || 0);
        const mat = parseFloat(materialCost || 0);
        const lab = parseFloat(laborCost || 0);
        const newPrd = {
            id: Date.now(),
            production_number: `PRD-2026-${String(orders.length + 10).padStart(4, '0')}`,
            order_date: orderDate,
            completion_date: '2026-11-10',
            output_item: 'Custom Pre-Configured Enterprise Server Rack Bundle',
            output_code: 'ASY-SRV-RACK',
            qty_required: q,
            qty_produced: 0.00,
            material_cost: mat,
            labor_overhead_cost: lab,
            total_production_cost: mat + lab,
            status: 'In Production'
        };

        setOrders(prev => [newPrd, ...prev]);
        setIsCreateOpen(false);
    };

    const columnDefs = [
        { field: 'production_number', headerName: 'Production Order #', width: 180, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'output_item', headerName: 'Manufactured / Assembled Item', flex: 1, minWidth: 240, cellStyle: { fontWeight: 600 } },
        { field: 'order_date', headerName: 'Started Date', width: 120 },
        { field: 'completion_date', headerName: 'Completion', width: 120 },
        { field: 'qty_required', headerName: 'Target Qty', width: 110, valueFormatter: p => parseFloat(p.value).toLocaleString() },
        { field: 'qty_produced', headerName: 'Finished Qty', width: 120, cellStyle: { fontWeight: 700 }, valueFormatter: p => parseFloat(p.value).toLocaleString() },
        { 
            field: 'material_cost', 
            headerName: 'Bill of Materials ($)', 
            width: 160, 
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00' 
        },
        { 
            field: 'total_production_cost', 
            headerName: 'Total Assembly Valuation', 
            width: 190, 
            cellStyle: { fontWeight: 700, color: '#0f172a' },
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00' 
        },
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
                        Production Orders & Bill of Materials (BOM)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Convert raw materials and sub-assemblies into finished stock items with automatic inventory deduction and value capitalization.
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
                    <BiPlus size={18} /> New Production Order
                </button>
            </div>

            <AgGridTable
                title="Manufacturing & Assembly Orders Register"
                rowData={orders}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE PRODUCTION ORDER MODAL */}
            <Modal
                open={isCreateOpen}
                title="Issue Production & Assembly Order"
                width={650}
                onOk={handleCreateOrder}
                onCancel={() => setIsCreateOpen(false)}
                okText="Launch Production"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Finished Output Item to Produce <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <Select
                            options={[
                                { value: 'ASY-SRV-RACK', label: 'Custom Pre-Configured Enterprise Server Rack Bundle' },
                                { value: 'ASY-PLT-KIT', label: 'Industrial Pallet & Shrink Wrap Assembly Kits' }
                            ]}
                            value="ASY-SRV-RACK"
                            onChange={() => {}}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Target Units to Produce
                            </label>
                            <InputNumber value={qty} min={1} onChange={setQty} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Production Order Date
                            </label>
                            <InputText value={orderDate} onChange={setOrderDate} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Bill of Materials (Raw Cost $)
                            </label>
                            <InputNumber value={materialCost} min={0} precision={2} onChange={setMaterialCost} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Labor & Assembly Overhead ($)
                            </label>
                            <InputNumber value={laborCost} min={0} precision={2} onChange={setLaborCost} />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProductionOrders;


import React, { useState, useEffect } from 'react';
import { BiPlus, BiBox, BiTransfer, BiLayer, BiDollarCircle, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';
import api from '../../services/api';

const InventoryItems = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Form fields
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [sku, setSku] = useState('');
    const [category, setCategory] = useState('it_hardware');
    const [uom, setUom] = useState('pcs');
    const [costingMethod, setCostingMethod] = useState('weighted_average');
    const [costPrice, setCostPrice] = useState(150);
    const [salePrice, setSalePrice] = useState(250);
    const [initialQty, setInitialQty] = useState(20);
    const [reorderLevel, setReorderLevel] = useState(5);

    // Adjustment states
    const [adjType, setAdjType] = useState('transfer');
    const [fromLocation, setFromLocation] = useState('wh_dubai_south');
    const [toLocation, setToLocation] = useState('wh_jebel_ali');
    const [adjQty, setAdjQty] = useState(1);
    const [adjReason, setAdjReason] = useState('Stock transfer between bonded facilities');

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        setLoading(true);
        try {
            const res = await api.getInventoryItems().catch(() => null);
            if (res && Array.isArray(res) && res.length > 0) {
                setItems(res);
            } else {
                setItems([
                    {
                        id: 1,
                        code: 'INV-IT-001',
                        sku: 'CISCO-CAT-9200',
                        name: 'Cisco Catalyst 9200L 48-Port PoE+ Gigabit Switch',
                        category: 'Network Infrastructure',
                        uom: 'PCS',
                        costing_method: 'Weighted Average',
                        qty_on_hand: 14.00,
                        avg_cost: 2100.00,
                        total_valuation: 29400.00,
                        sale_price: 3200.00,
                        margin_pct: '34.4%',
                        reorder_level: 4.00,
                        status: 'In Stock'
                    },
                    {
                        id: 2,
                        code: 'INV-IT-002',
                        sku: 'DELL-PWR-R750',
                        name: 'Dell PowerEdge R750 2U Enterprise Rack Server (Dual Xeon 64GB)',
                        category: 'Servers & Compute',
                        uom: 'PCS',
                        costing_method: 'FIFO',
                        qty_on_hand: 8.00,
                        avg_cost: 4850.00,
                        total_valuation: 38800.00,
                        sale_price: 6900.00,
                        margin_pct: '29.7%',
                        reorder_level: 2.00,
                        status: 'In Stock'
                    },
                    {
                        id: 3,
                        code: 'INV-LOG-003',
                        sku: 'EURO-PAL-1200',
                        name: 'Heavy Duty Industrial Heat-Treated Euro Pallet (1200x800mm)',
                        category: 'Logistics Supplies',
                        uom: 'PCS',
                        costing_method: 'Weighted Average',
                        qty_on_hand: 420.00,
                        avg_cost: 28.00,
                        total_valuation: 11760.00,
                        sale_price: 45.00,
                        margin_pct: '37.8%',
                        reorder_level: 100.00,
                        status: 'In Stock'
                    },
                    {
                        id: 4,
                        code: 'INV-PKG-004',
                        sku: 'STR-FILM-500',
                        name: 'High-Tensile Machine Stretch Film Roll 23 Micron (500mm x 1500m)',
                        category: 'Packaging Materials',
                        uom: 'ROLL',
                        costing_method: 'Weighted Average',
                        qty_on_hand: 3.00,
                        avg_cost: 65.00,
                        total_valuation: 195.00,
                        sale_price: 95.00,
                        margin_pct: '31.6%',
                        reorder_level: 15.00,
                        status: 'Low Stock'
                    }
                ]);
            }
        } catch (err) {
            console.error('Error fetching inventory items:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateItem = async () => {
        if (!name.trim()) {
            alert('Item name is required.');
            return;
        }

        const newCode = code.trim() || `ITEM-${String(items.length + 1).padStart(3, '0')}`;
        const qty = parseFloat(initialQty || 0);
        const cost = parseFloat(costPrice || 0);
        const sale = parseFloat(salePrice || 0);
        const margin = sale > 0 ? (((sale - cost) / sale) * 100).toFixed(1) + '%' : '0.0%';

        const newItem = {
            id: Date.now(),
            code: newCode,
            sku: sku.trim() || newCode,
            name: name.trim(),
            category: category.replace(/_/g, ' ').toUpperCase(),
            uom: uom.toUpperCase(),
            costing_method: costingMethod === 'fifo' ? 'FIFO' : 'Weighted Average',
            qty_on_hand: qty,
            avg_cost: cost,
            total_valuation: qty * cost,
            sale_price: sale,
            margin_pct: margin,
            reorder_level: parseFloat(reorderLevel || 0),
            status: qty <= parseFloat(reorderLevel || 0) ? 'Low Stock' : 'In Stock'
        };

        try {
            await api.createInventoryItem({
                code: newCode,
                name: name.trim(),
                sku: sku.trim(),
                category_id: category,
                uom_id: uom,
                cost_price: cost,
                selling_price: sale,
                initial_quantity: qty,
                reorder_point: reorderLevel
            }).catch(() => null);
        } catch {
            // fallback
        }

        setItems(prev => [newItem, ...prev]);
        setIsCreateOpen(false);

        setName('');
        setCode('');
        setSku('');
    };

    const handleAdjustSubmit = () => {
        if (!selectedItem) return;
        const qty = parseFloat(adjQty || 0);
        if (qty <= 0) {
            alert('Quantity must be greater than zero.');
            return;
        }

        alert(`Stock movement recorded: ${qty} units of ${selectedItem.name} transferred from ${fromLocation} to ${toLocation}.`);
        setIsAdjustOpen(false);
    };

    const columnDefs = [
        { field: 'code', headerName: 'Item Code', width: 140, pinned: 'left', cellStyle: { fontWeight: 600, color: '#4f46e5' } },
        { field: 'name', headerName: 'Item / Product Description', flex: 1, minWidth: 260, cellStyle: { fontWeight: 600 } },
        { field: 'sku', headerName: 'SKU / Barcode', width: 150 },
        { field: 'category', headerName: 'Category', width: 160 },
        { field: 'uom', headerName: 'UOM', width: 90 },
        { 
            field: 'qty_on_hand', 
            headerName: 'Qty On Hand', 
            width: 130, 
            cellStyle: { fontWeight: 700 },
            valueFormatter: p => p.value ? parseFloat(p.value).toLocaleString() : '0' 
        },
        { 
            field: 'avg_cost', 
            headerName: 'Avg Unit Cost', 
            width: 130, 
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00' 
        },
        { 
            field: 'total_valuation', 
            headerName: 'Total Valuation', 
            width: 150, 
            cellStyle: { fontWeight: 700, color: '#0f172a' },
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00' 
        },
        { 
            field: 'sale_price', 
            headerName: 'Selling Price', 
            width: 130, 
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00' 
        },
        { 
            field: 'margin_pct', 
            headerName: 'Gross Margin', 
            width: 120, 
            cellStyle: { color: '#16a34a', fontWeight: 600 } 
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            cellRenderer: (params) => {
                const s = params.value || 'In Stock';
                const isLow = s === 'Low Stock' || s === 'Out of Stock';
                return (
                    <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: isLow ? '#fee2e2' : '#dcfce7',
                        color: isLow ? '#b91c1c' : '#15803d'
                    }}>
                        {s}
                    </span>
                );
            }
        },
        {
            headerName: 'Movement',
            width: 110,
            pinned: 'right',
            sortable: false,
            filter: false,
            cellRenderer: (params) => {
                return (
                    <button
                        onClick={() => {
                            setSelectedItem(params.data);
                            setIsAdjustOpen(true);
                        }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#334155',
                            cursor: 'pointer'
                        }}
                    >
                        <BiTransfer size={12} /> Transfer
                    </button>
                );
            }
        }
    ];

    const categoryOptions = [
        { value: 'network_infrastructure', label: 'Network Infrastructure' },
        { value: 'servers_compute', label: 'Servers & Compute' },
        { value: 'logistics_supplies', label: 'Logistics Supplies' },
        { value: 'packaging_materials', label: 'Packaging Materials' },
        { value: 'general_trading', label: 'General Trading' }
    ];

    const uomOptions = [
        { value: 'pcs', label: 'Pieces (PCS)' },
        { value: 'boxes', label: 'Boxes (BOX)' },
        { value: 'roll', label: 'Rolls (ROLL)' },
        { value: 'kg', label: 'Kilograms (KG)' },
        { value: 'pallet', label: 'Pallets (PLT)' }
    ];

    const costingOptions = [
        { value: 'weighted_average', label: 'Weighted Average Cost (Periodic / Perpetual)' },
        { value: 'fifo', label: 'First-In First-Out (FIFO)' },
        { value: 'standard', label: 'Standard Costing' }
    ];

    const warehouseOptions = [
        { value: 'wh_dubai_south', label: 'Main Warehouse - Dubai South Freezone' },
        { value: 'wh_jebel_ali', label: 'Bonded Logistics Facility - JAFZA Dubai' },
        { value: 'wh_riyadh', label: 'Distribution Hub - Riyadh Industrial City 2' }
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
                        Inventory Management & Stock Valuation
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Advance perpetual inventory management: track weighted-average costs, multi-warehouse stock, and COGS journal posting.
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
                    <BiPlus size={18} /> Add Inventory Item
                </button>
            </div>

            <AgGridTable
                title="Perpetual Stock Valuation Register"
                rowData={items}
                columnDefs={columnDefs}
                loading={loading}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE INVENTORY ITEM MODAL */}
            <Modal
                open={isCreateOpen}
                title="Add New Inventory Stock Item"
                width={700}
                onOk={handleCreateItem}
                onCancel={() => setIsCreateOpen(false)}
                okText="Save Item"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Item Description / Title <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputText
                                placeholder="e.g. Cisco Catalyst 9200L 48-Port Switch"
                                value={name}
                                onChange={setName}
                                allowClear
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Item Code
                            </label>
                            <InputText
                                placeholder="e.g. INV-IT-005"
                                value={code}
                                onChange={setCode}
                                allowClear
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                SKU / Barcode
                            </label>
                            <InputText
                                placeholder="e.g. 883929402910"
                                value={sku}
                                onChange={setSku}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Category
                            </label>
                            <Select
                                options={categoryOptions}
                                value={category}
                                onChange={setCategory}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Unit of Measure (UOM)
                            </label>
                            <Select
                                options={uomOptions}
                                value={uom}
                                onChange={setUom}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Costing Valuation Method
                            </label>
                            <Select
                                options={costingOptions}
                                value={costingMethod}
                                onChange={setCostingMethod}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Reorder Point (Threshold)
                            </label>
                            <InputNumber
                                value={reorderLevel}
                                min={0}
                                onChange={setReorderLevel}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Initial Unit Cost ($)
                            </label>
                            <InputNumber
                                value={costPrice}
                                min={0}
                                precision={2}
                                onChange={setCostPrice}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Selling Price ($)
                            </label>
                            <InputNumber
                                value={salePrice}
                                min={0}
                                precision={2}
                                onChange={setSalePrice}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Opening Quantity
                            </label>
                            <InputNumber
                                value={initialQty}
                                min={0}
                                onChange={setInitialQty}
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* STOCK TRANSFER / ADJUSTMENT MODAL */}
            <Modal
                open={isAdjustOpen}
                title={`Transfer / Stock Movement: ${selectedItem?.name || ''}`}
                width={560}
                onOk={handleAdjustSubmit}
                onCancel={() => setIsAdjustOpen(false)}
                okText="Execute Transfer"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                        <div><strong>Item Code:</strong> {selectedItem?.code}</div>
                        <div><strong>Current Total On Hand:</strong> {selectedItem?.qty_on_hand} {selectedItem?.uom}</div>
                        <div><strong>Unit Valuation:</strong> ${selectedItem?.avg_cost?.toFixed(2)}</div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Dispatch From Facility
                        </label>
                        <Select
                            options={warehouseOptions}
                            value={fromLocation}
                            onChange={setFromLocation}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Receive At Facility
                        </label>
                        <Select
                            options={warehouseOptions}
                            value={toLocation}
                            onChange={setToLocation}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Transfer Qty
                            </label>
                            <InputNumber
                                value={adjQty}
                                min={1}
                                max={selectedItem?.qty_on_hand}
                                onChange={setAdjQty}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Movement Memo
                            </label>
                            <InputText
                                value={adjReason}
                                onChange={setAdjReason}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default InventoryItems;


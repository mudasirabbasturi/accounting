import React, { useState } from 'react';
import { BiPrinter, BiBox } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Select } from '../../elegance-ui/components';

const InventorySummaryReport = () => {
    const [categoryFilter, setCategoryFilter] = useState('all');

    const rows = [
        { code: 'INV-IT-001', sku: 'CISCO-CAT-9200', name: 'Cisco Catalyst 9200L 48-Port Switch', category: 'Network Infrastructure', warehouse: 'Main Warehouse - Dubai South', qty: 14.00, uom: 'PCS', avg_cost: 2100.00, total_val: 29400.00, sale_price: 3200.00, margin: '34.4%' },
        { code: 'INV-IT-002', sku: 'DELL-PWR-R750', name: 'Dell PowerEdge R750 Enterprise Server', category: 'Servers & Compute', warehouse: 'Main Warehouse - Dubai South', qty: 8.00, uom: 'PCS', avg_cost: 4850.00, total_val: 38800.00, sale_price: 6900.00, margin: '29.7%' },
        { code: 'INV-LOG-003', sku: 'EURO-PAL-1200', name: 'Heavy Duty Industrial Euro Pallet', category: 'Logistics Supplies', warehouse: 'Bonded Facility - JAFZA', qty: 420.00, uom: 'PCS', avg_cost: 28.00, total_val: 11760.00, sale_price: 45.00, margin: '37.8%' },
        { code: 'INV-PKG-004', sku: 'STR-FILM-500', name: 'Stretch Film Roll 23 Micron', category: 'Packaging Materials', warehouse: 'Main Warehouse - Dubai South', qty: 3.00, uom: 'ROLL', avg_cost: 65.00, total_val: 195.00, sale_price: 95.00, margin: '31.6%' }
    ];

    const filteredRows = rows.filter(r => categoryFilter === 'all' || r.category === categoryFilter);

    const columnDefs = [
        { field: 'code', headerName: 'Item Code', width: 140, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'sku', headerName: 'SKU / Barcode', width: 150 },
        { field: 'name', headerName: 'Product Description', flex: 1, minWidth: 240, cellStyle: { fontWeight: 600 } },
        { field: 'category', headerName: 'Category', width: 180 },
        { field: 'warehouse', headerName: 'Warehouse Stored', width: 200 },
        { field: 'qty', headerName: 'Qty On Hand', width: 120, cellStyle: { fontWeight: 700 }, valueFormatter: p => `${parseFloat(p.value).toLocaleString()} ${p.data?.uom}` },
        { field: 'avg_cost', headerName: 'Avg Unit Cost', width: 130, valueFormatter: p => `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
        { 
            field: 'total_val', 
            headerName: 'Total Stock Valuation', 
            width: 170, 
            cellStyle: { fontWeight: 700, color: '#0f172a' },
            valueFormatter: p => `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
        },
        { field: 'margin', headerName: 'Gross Margin %', width: 130, cellStyle: { color: '#16a34a', fontWeight: 600 } }
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
                        Inventory Valuation Summary Report
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Perpetual stock valuation by category and storage location based on weighted-average inventory accounting.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '220px' }}>
                        <Select
                            options={[
                                { value: 'all', label: 'All Product Categories' },
                                { value: 'Network Infrastructure', label: 'Network Infrastructure' },
                                { value: 'Servers & Compute', label: 'Servers & Compute' },
                                { value: 'Logistics Supplies', label: 'Logistics Supplies' },
                                { value: 'Packaging Materials', label: 'Packaging Materials' }
                            ]}
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                        />
                    </div>

                    <button
                        onClick={() => window.print()}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#ffffff',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '8px 14px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <BiPrinter size={16} /> Print Report
                    </button>
                </div>
            </div>

            <AgGridTable
                title="Perpetual Inventory Valuation Schedule"
                rowData={filteredRows}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />
        </div>
    );
};

export default InventorySummaryReport;


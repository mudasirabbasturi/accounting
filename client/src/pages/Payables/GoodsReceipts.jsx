import React, { useState } from 'react';
import { BiPlus, BiBox, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText } from '../../elegance-ui/components';

const GoodsReceipts = () => {
    const [receipts, setReceipts] = useState([
        {
            id: 1,
            grn_number: 'GRN-2026-0045',
            receipt_date: '2026-10-22',
            supplier_name: 'Dell Technologies Middle East',
            po_ref: 'PO-2026-0034',
            warehouse: 'Main Warehouse - Dubai South',
            vendor_dn: 'DELL-DN-88192',
            received_by: 'Mansoor Iqbal (Storekeeper)',
            status: 'Inspected & Accepted'
        },
        {
            id: 2,
            grn_number: 'GRN-2026-0046',
            receipt_date: '2026-10-29',
            supplier_name: 'Sabic Petrochemical Supply',
            po_ref: 'PO-2026-0035',
            warehouse: 'Bonded Facility - JAFZA',
            vendor_dn: 'SABIC-DN-1102',
            received_by: 'Tariq Mansoor',
            status: 'Inspected & Accepted'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [supplier, setSupplier] = useState('1');
    const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
    const [poRef, setPoRef] = useState('PO-2026-0036');
    const [warehouse, setWarehouse] = useState('wh_dubai_south');
    const [vendorDn, setVendorDn] = useState('');

    const handleCreateReceipt = () => {
        const newGrn = {
            id: Date.now(),
            grn_number: `GRN-2026-${String(receipts.length + 47).padStart(4, '0')}`,
            receipt_date: receiptDate,
            supplier_name: supplier === '1' ? 'Dell Technologies Middle East' : 'Sabic Petrochemical Supply',
            po_ref: poRef,
            warehouse: warehouse === 'wh_dubai_south' ? 'Main Warehouse - Dubai South' : 'Bonded Facility - JAFZA',
            vendor_dn: vendorDn || 'N/A',
            received_by: 'Current Storekeeper',
            status: 'Inspected & Accepted'
        };

        setReceipts(prev => [newGrn, ...prev]);
        setIsCreateOpen(false);
    };

    const columnDefs = [
        { field: 'grn_number', headerName: 'Goods Receipt Note (GRN) #', width: 220, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'supplier_name', headerName: 'Supplier Name', flex: 1, minWidth: 220, cellStyle: { fontWeight: 600 } },
        { field: 'receipt_date', headerName: 'Received Date', width: 130 },
        { field: 'po_ref', headerName: 'Purchase Order Ref', width: 170 },
        { field: 'warehouse', headerName: 'Receiving Warehouse', width: 220 },
        { field: 'vendor_dn', headerName: 'Supplier Delivery Note #', width: 190 },
        { field: 'received_by', headerName: 'Inspected By', width: 180 },
        {
            field: 'status',
            headerName: 'Quality Status',
            width: 170,
            cellRenderer: () => (
                <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#dcfce7',
                    color: '#15803d'
                }}>
                    Inspected & Accepted
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
                        Goods Receipts Notes (GRN Intake)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Document physical receipt of merchandise into warehouses, verify quality inspection, and increase inventory valuation stock.
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
                    <BiPlus size={18} /> New Goods Receipt
                </button>
            </div>

            <AgGridTable
                title="Goods Receipts (GRN) Register"
                rowData={receipts}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE GRN MODAL */}
            <Modal
                open={isCreateOpen}
                title="Log Goods Receipt Note (GRN)"
                width={650}
                onOk={handleCreateReceipt}
                onCancel={() => setIsCreateOpen(false)}
                okText="Accept Shipment"
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
                                Purchase Order Ref
                            </label>
                            <InputText value={poRef} onChange={setPoRef} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Receiving Warehouse
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
                                Date Received
                            </label>
                            <InputText value={receiptDate} onChange={setReceiptDate} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Supplier Delivery Note (Challan) #
                        </label>
                        <InputText
                            placeholder="e.g. DELL-DN-9921"
                            value={vendorDn}
                            onChange={setVendorDn}
                            allowClear
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default GoodsReceipts;


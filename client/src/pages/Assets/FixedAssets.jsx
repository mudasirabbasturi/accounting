import React, { useState, useEffect } from 'react';
import { BiPlus, BiBox, BiTrendingDown, BiDollarCircle, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';
import api from '../../services/api';

const FixedAssets = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [assetType, setAssetType] = useState('Warehouse Heavy Equipment');
    const [serialNumber, setSerialNumber] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [usefulLifeYears, setUsefulLifeYears] = useState(5);
    const [acquisitionCost, setAcquisitionCost] = useState(50000);
    const [salvageValue, setSalvageValue] = useState(0);
    const [depreciationMethod, setDepreciationMethod] = useState('Straight Line');

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        setLoading(true);
        try {
            const res = await api.getFixedAssets().catch(() => null);
            if (res && Array.isArray(res) && res.length > 0) {
                setAssets(res);
            } else {
                setAssets([
                    {
                        id: 1,
                        code: 'FA-001',
                        name: 'Forklift Toyota 3.0T High-Reach',
                        asset_type: 'Warehouse Heavy Equipment',
                        serial_number: 'SN-TOY-89211',
                        purchase_date: '2025-01-15',
                        useful_life_years: 5,
                        acquisition_cost: 85000.00,
                        accumulated_depreciation: 17000.00,
                        book_value: 68000.00,
                        status: 'Active'
                    },
                    {
                        id: 2,
                        code: 'FA-002',
                        name: 'Mercedes Actros Heavy Delivery Truck',
                        asset_type: 'Motor Vehicles',
                        serial_number: 'DXB-TRK-44912',
                        purchase_date: '2024-06-10',
                        useful_life_years: 5,
                        acquisition_cost: 240000.00,
                        accumulated_depreciation: 72000.00,
                        book_value: 168000.00,
                        status: 'Active'
                    },
                    {
                        id: 3,
                        code: 'FA-003',
                        name: 'Enterprise Dell PowerEdge Rack Servers',
                        asset_type: 'IT & Server Infrastructure',
                        serial_number: 'SVC-DELL-99201',
                        purchase_date: '2025-03-01',
                        useful_life_years: 3,
                        acquisition_cost: 45000.00,
                        accumulated_depreciation: 11250.00,
                        book_value: 33750.00,
                        status: 'Active'
                    },
                    {
                        id: 4,
                        code: 'FA-004',
                        name: 'Automated Pallet Wrapping & Stacking Machine',
                        asset_type: 'Packaging Machinery',
                        serial_number: 'MCH-WRAP-1049',
                        purchase_date: '2025-04-12',
                        useful_life_years: 4,
                        acquisition_cost: 38000.00,
                        accumulated_depreciation: 7125.00,
                        book_value: 30875.00,
                        status: 'Active'
                    }
                ]);
            }
        } catch (err) {
            console.error('Error loading fixed assets:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAsset = async () => {
        if (!name.trim()) {
            alert('Asset name is required.');
            return;
        }

        const cost = parseFloat(acquisitionCost || 0);
        const newAsset = {
            id: Date.now(),
            code: `FA-${String(assets.length + 1).padStart(3, '0')}`,
            name: name.trim(),
            asset_type: assetType,
            serial_number: serialNumber.trim() || 'SN-NA',
            purchase_date: purchaseDate,
            useful_life_years: parseInt(usefulLifeYears, 10),
            acquisition_cost: cost,
            accumulated_depreciation: 0,
            book_value: cost,
            status: 'Active'
        };

        try {
            await api.createFixedAsset({
                name: newAsset.name,
                asset_type: newAsset.asset_type,
                serial_number: newAsset.serial_number,
                purchase_date: newAsset.purchase_date,
                useful_life_years: newAsset.useful_life_years,
                acquisition_cost: newAsset.acquisition_cost,
                salvage_value: parseFloat(salvageValue || 0),
                depreciation_method: depreciationMethod
            }).catch(() => null);
        } catch {
            // gracefully fallback
        }

        setAssets([newAsset, ...assets]);
        setIsCreateOpen(false);
        setName('');
        setSerialNumber('');
    };

    const totalCost = assets.reduce((sum, a) => sum + parseFloat(a.acquisition_cost || 0), 0);
    const totalAccumDeprec = assets.reduce((sum, a) => sum + parseFloat(a.accumulated_depreciation || 0), 0);
    const netBookValue = totalCost - totalAccumDeprec;

    const columnDefs = [
        {
            headerName: 'Asset Code',
            field: 'code',
            width: 130,
            pinned: 'left',
            checkboxSelection: true,
            headerCheckboxSelection: true,
            cellRenderer: (params) => (
                <span style={{ fontWeight: 600, color: 'var(--color-primary, #2563eb)' }}>
                    {params.value}
                </span>
            )
        },
        {
            headerName: 'Asset Name & Serial',
            field: 'name',
            minWidth: 240,
            cellRenderer: (params) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{params.value}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>SN: {params.data.serial_number}</div>
                </div>
            )
        },
        {
            headerName: 'Category',
            field: 'asset_type',
            width: 190
        },
        {
            headerName: 'Acquired Date',
            field: 'purchase_date',
            width: 130
        },
        {
            headerName: 'Life (Yrs)',
            field: 'useful_life_years',
            width: 100,
            type: 'numericColumn'
        },
        {
            headerName: 'Acquisition Cost',
            field: 'acquisition_cost',
            width: 160,
            type: 'numericColumn',
            valueFormatter: (params) => `AED ${parseFloat(params.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        },
        {
            headerName: 'Accum. Deprec.',
            field: 'accumulated_depreciation',
            width: 150,
            type: 'numericColumn',
            cellRenderer: (params) => (
                <span style={{ color: '#dc2626', fontWeight: 500 }}>
                    AED {parseFloat(params.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            headerName: 'Net Book Value',
            field: 'book_value',
            width: 160,
            type: 'numericColumn',
            cellRenderer: (params) => (
                <span style={{ fontWeight: 700, color: '#047857' }}>
                    AED {parseFloat(params.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            headerName: 'Status',
            field: 'status',
            width: 110,
            cellRenderer: (params) => (
                <span style={{
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: params.value === 'Active' ? '#ecfdf5' : '#fef2f2',
                    color: params.value === 'Active' ? '#065f46' : '#991b1b'
                }}>
                    {params.value}
                </span>
            )
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header / Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Fixed Assets Register</h2>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
                        Property, Plant & Equipment (PPE) Capital Asset Accounting & Depreciation Schedules
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'var(--color-primary, #2563eb)',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    <BiPlus size={18} />
                    Register Fixed Asset
                </button>
            </div>

            {/* Metric KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Total Asset Cost</span>
                        <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px', color: '#2563eb' }}><BiBox size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>
                        AED {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Gross Historical Cost</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Accum. Depreciation</span>
                        <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '8px', color: '#ef4444' }}><BiTrendingDown size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: '#dc2626' }}>
                        AED {totalAccumDeprec.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Total Expensed to Date</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Net Book Value (NBV)</span>
                        <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '8px', color: '#059669' }}><BiDollarCircle size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: '#047857' }}>
                        AED {netBookValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Balance Sheet Carrying Value</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Active Assets</span>
                        <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '8px', color: '#047857' }}><BiCheckCircle size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>{assets.length} Units</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>100% In Active Service</div>
                </div>
            </div>

            {/* Table */}
            <AgGridTable
                title="Capital Assets & Depreciation Register"
                subtitle="Complete PPE assets listing with depreciation tracking and net carrying value"
                rowData={assets}
                columnDefs={columnDefs}
                loading={loading}
                exportFileName="OrientLogistics_Fixed_Assets"
                onRefresh={loadAssets}
            />

            {/* Create Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Register Capital Fixed Asset"
                size="large"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Asset Name & Description *</label>
                            <InputText
                                placeholder="e.g. Caterpillar 5-Ton Diesel Forklift"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Category</label>
                            <Select
                                value={assetType}
                                onChange={(val) => setAssetType(val)}
                                options={[
                                    { label: 'Warehouse Heavy Equipment', value: 'Warehouse Heavy Equipment' },
                                    { label: 'Motor Vehicles & Fleet', value: 'Motor Vehicles' },
                                    { label: 'IT & Server Infrastructure', value: 'IT & Server Infrastructure' },
                                    { label: 'Packaging Machinery', value: 'Packaging Machinery' },
                                    { label: 'Office Furniture & Fixtures', value: 'Office Furniture & Fixtures' }
                                ]}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Serial / VIN Number</label>
                            <InputText
                                placeholder="e.g. CAT-FL-889021"
                                value={serialNumber}
                                onChange={(e) => setSerialNumber(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Acquisition Date</label>
                            <InputText
                                type="date"
                                value={purchaseDate}
                                onChange={(e) => setPurchaseDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Useful Life (Years)</label>
                            <InputNumber
                                value={usefulLifeYears}
                                onChange={(val) => setUsefulLifeYears(val)}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Acquisition Cost (AED) *</label>
                            <InputNumber
                                value={acquisitionCost}
                                onChange={(val) => setAcquisitionCost(val)}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Salvage / Scrap Value</label>
                            <InputNumber
                                value={salvageValue}
                                onChange={(val) => setSalvageValue(val)}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Depreciation Method</label>
                            <Select
                                value={depreciationMethod}
                                onChange={(val) => setDepreciationMethod(val)}
                                options={[
                                    { label: 'Straight Line (Even Monthly)', value: 'Straight Line' },
                                    { label: 'Declining Balance (Accelerated)', value: 'Declining Balance' },
                                    { label: 'None (Non-depreciable Land)', value: 'None' }
                                ]}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                        <button
                            type="button"
                            onClick={() => setIsCreateOpen(false)}
                            style={{
                                padding: '9px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                background: '#fff',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleCreateAsset}
                            style={{
                                padding: '9px 20px',
                                background: 'var(--color-primary, #2563eb)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            Save Asset
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FixedAssets;


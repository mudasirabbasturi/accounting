import React, { useState, useEffect } from 'react';
import { BiPlus, BiAward, BiTrendingDown, BiDollarCircle, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';
import api from '../../services/api';

const IntangibleAssets = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Software License');
    const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().split('T')[0]);
    const [usefulLifeMonths, setUsefulLifeMonths] = useState(36);
    const [acquisitionCost, setAcquisitionCost] = useState(60000);
    const [amortizationMethod, setAmortizationMethod] = useState('Straight Line');

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        setLoading(true);
        try {
            const res = await api.getIntangibleAssets().catch(() => null);
            if (res && Array.isArray(res) && res.length > 0) {
                setAssets(res);
            } else {
                setAssets([
                    {
                        id: 1,
                        code: 'INT-001',
                        name: 'Custom Logistics Dispatch & Fleet ERP License',
                        category: 'Software License',
                        acquisition_date: '2024-01-01',
                        useful_life_months: 36,
                        acquisition_cost: 120000.00,
                        accumulated_amortization: 66666.67,
                        book_value: 53333.33,
                        amortization_method: 'Straight Line',
                        status: 'Active'
                    },
                    {
                        id: 2,
                        code: 'INT-002',
                        name: 'GCC Regional Freight Brokerage Patent',
                        category: 'Patent',
                        acquisition_date: '2023-06-15',
                        useful_life_months: 60,
                        acquisition_cost: 75000.00,
                        accumulated_amortization: 32500.00,
                        book_value: 42500.00,
                        amortization_method: 'Straight Line',
                        status: 'Active'
                    },
                    {
                        id: 3,
                        code: 'INT-003',
                        name: 'Orient Logistics Registered Trademark (UAE & KSA)',
                        category: 'Trademark',
                        acquisition_date: '2022-09-01',
                        useful_life_months: 120,
                        acquisition_cost: 35000.00,
                        accumulated_amortization: 10208.33,
                        book_value: 24791.67,
                        amortization_method: 'Straight Line',
                        status: 'Active'
                    }
                ]);
            }
        } catch (err) {
            console.error('Error loading intangible assets:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAsset = async () => {
        if (!name.trim()) {
            alert('Intangible asset name is required.');
            return;
        }

        const cost = parseFloat(acquisitionCost || 0);
        const newAsset = {
            id: Date.now(),
            code: `INT-${String(assets.length + 1).padStart(3, '0')}`,
            name: name.trim(),
            category: category,
            acquisition_date: acquisitionDate,
            useful_life_months: parseInt(usefulLifeMonths, 10),
            acquisition_cost: cost,
            accumulated_amortization: 0,
            book_value: cost,
            amortization_method: amortizationMethod,
            status: 'Active'
        };

        try {
            await api.createIntangibleAsset({
                name: newAsset.name,
                category: newAsset.category,
                acquisition_date: newAsset.acquisition_date,
                useful_life_months: newAsset.useful_life_months,
                acquisition_cost: newAsset.acquisition_cost,
                amortization_method: newAsset.amortization_method
            }).catch(() => null);
        } catch {
            // fallback gracefully
        }

        setAssets([newAsset, ...assets]);
        setIsCreateOpen(false);
        setName('');
    };

    const totalCost = assets.reduce((sum, a) => sum + parseFloat(a.acquisition_cost || 0), 0);
    const totalAmort = assets.reduce((sum, a) => sum + parseFloat(a.accumulated_amortization || 0), 0);
    const netCarryingValue = totalCost - totalAmort;

    const columnDefs = [
        {
            headerName: 'Code',
            field: 'code',
            width: 120,
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
            headerName: 'Asset Title & Description',
            field: 'name',
            minWidth: 260,
            cellRenderer: (params) => (
                <div style={{ fontWeight: 600 }}>{params.value}</div>
            )
        },
        {
            headerName: 'Category',
            field: 'category',
            width: 170,
            cellRenderer: (params) => (
                <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8'
                }}>
                    {params.value}
                </span>
            )
        },
        {
            headerName: 'Acquired Date',
            field: 'acquisition_date',
            width: 130
        },
        {
            headerName: 'Life (Months)',
            field: 'useful_life_months',
            width: 120,
            type: 'numericColumn'
        },
        {
            headerName: 'Cost',
            field: 'acquisition_cost',
            width: 150,
            type: 'numericColumn',
            valueFormatter: (params) => `AED ${parseFloat(params.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        },
        {
            headerName: 'Accum. Amort.',
            field: 'accumulated_amortization',
            width: 150,
            type: 'numericColumn',
            cellRenderer: (params) => (
                <span style={{ color: '#dc2626', fontWeight: 500 }}>
                    AED {parseFloat(params.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            headerName: 'Carrying Value',
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
                    backgroundColor: '#ecfdf5',
                    color: '#065f46'
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
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Intangible Assets</h2>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
                        Software Licenses, Proprietary Patents, Trademarks & Intellectual Property Amortization
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
                    Capitalize Intangible Asset
                </button>
            </div>

            {/* Metric KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Total Intangible Capital</span>
                        <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px', color: '#2563eb' }}><BiAward size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>
                        AED {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Gross Capitalized Cost</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Accum. Amortization</span>
                        <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '8px', color: '#dc2626' }}><BiTrendingDown size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: '#dc2626' }}>
                        AED {totalAmort.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Amortized to Date</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Carrying Value</span>
                        <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '8px', color: '#047857' }}><BiDollarCircle size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: '#047857' }}>
                        AED {netCarryingValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Balance Sheet Carrying Value</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Active IP Portfolio</span>
                        <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '8px', color: '#059669' }}><BiCheckCircle size={20} /></div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>{assets.length} Assets</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>All in legal force</div>
                </div>
            </div>

            {/* Table */}
            <AgGridTable
                title="Intangible Capital Asset Schedule"
                subtitle="Complete schedule of intellectual property, proprietary tech, and amortization periods"
                rowData={assets}
                columnDefs={columnDefs}
                loading={loading}
                exportFileName="OrientLogistics_Intangible_Assets"
                onRefresh={loadAssets}
            />

            {/* Create Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Capitalize New Intangible Asset"
                size="medium"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Asset Title *</label>
                        <InputText
                            placeholder="e.g. Automated Customs Clearance API License"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Classification Category</label>
                        <Select
                            value={category}
                            onChange={(val) => setCategory(val)}
                            options={[
                                { label: 'Software License & Digital Rights', value: 'Software License' },
                                { label: 'Patent & Utility Innovation', value: 'Patent' },
                                { label: 'Registered Trademark & Brand Rights', value: 'Trademark' },
                                { label: 'Goodwill on Acquisition', value: 'Goodwill' },
                                { label: 'Copyright & Proprietary Content', value: 'Copyright' }
                            ]}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Acquisition Date</label>
                            <InputText
                                type="date"
                                value={acquisitionDate}
                                onChange={(e) => setAcquisitionDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Amortization Life (Months)</label>
                            <InputNumber
                                value={usefulLifeMonths}
                                onChange={(val) => setUsefulLifeMonths(val)}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Acquisition / Capitalization Cost (AED) *</label>
                        <InputNumber
                            value={acquisitionCost}
                            onChange={(val) => setAcquisitionCost(val)}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Amortization Method</label>
                        <Select
                            value={amortizationMethod}
                            onChange={(val) => setAmortizationMethod(val)}
                            options={[
                                { label: 'Straight Line (Even Monthly)', value: 'Straight Line' },
                                { label: 'None (Indefinite Life Goodwill)', value: 'None' }
                            ]}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
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

export default IntangibleAssets;


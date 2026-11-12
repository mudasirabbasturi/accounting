import React, { useState } from 'react';
import { BiPlus, BiBuilding, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText } from '../../elegance-ui/components';

const InventoryLocations = () => {
    const [locations, setLocations] = useState([
        {
            id: 1,
            code: 'WH-DXB-01',
            name: 'Main Logistics Center - Dubai South',
            type: 'Primary Distribution Hub',
            city: 'Dubai (DWC Freezone)',
            country: 'United Arab Emirates',
            total_skus: 42,
            total_valuation: 68200.00,
            supervisor: 'Mansoor Iqbal',
            status: 'Operational'
        },
        {
            id: 2,
            code: 'WH-JAFZA-02',
            name: 'Bonded Warehouse Facility - Jebel Ali',
            type: 'Customs Bonded Freezone',
            city: 'Dubai (JAFZA)',
            country: 'United Arab Emirates',
            total_skus: 18,
            total_valuation: 24100.00,
            supervisor: 'Tariq Mansoor',
            status: 'Operational'
        },
        {
            id: 3,
            code: 'WH-RYD-03',
            name: 'KSA Regional Fulfillment Center - Riyadh',
            type: 'Domestic Logistics Center',
            city: 'Riyadh (2nd Industrial City)',
            country: 'Saudi Arabia',
            total_skus: 14,
            total_valuation: 18450.00,
            supervisor: 'Abdullah Al-Ghamdi',
            status: 'Operational'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [type, setType] = useState('hub');
    const [city, setCity] = useState('');
    const [supervisor, setSupervisor] = useState('');

    const handleCreateLocation = () => {
        if (!name.trim()) {
            alert('Warehouse facility name is required.');
            return;
        }

        const newLoc = {
            id: Date.now(),
            code: code.trim() || `WH-LOC-${String(locations.length + 4).padStart(2, '0')}`,
            name: name.trim(),
            type: type === 'hub' ? 'Primary Distribution Hub' : 'Customs Bonded Facility',
            city: city.trim() || 'Dubai',
            country: 'United Arab Emirates',
            total_skus: 0,
            total_valuation: 0.00,
            supervisor: supervisor.trim() || 'Store Manager',
            status: 'Operational'
        };

        setLocations(prev => [newLoc, ...prev]);
        setIsCreateOpen(false);
        setCode('');
        setName('');
        setCity('');
    };

    const columnDefs = [
        { field: 'code', headerName: 'Location Code', width: 150, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'name', headerName: 'Warehouse / Facility Name', flex: 1, minWidth: 240, cellStyle: { fontWeight: 600 } },
        { field: 'type', headerName: 'Facility Type', width: 200 },
        { field: 'city', headerName: 'City / Free Zone', width: 170 },
        { field: 'country', headerName: 'Country', width: 160 },
        { field: 'total_skus', headerName: 'Active SKUs', width: 120, valueFormatter: p => parseFloat(p.value).toLocaleString() },
        { 
            field: 'total_valuation', 
            headerName: 'Total Stock Valuation ($)', 
            width: 190, 
            cellStyle: { fontWeight: 700, color: '#0f172a' },
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00' 
        },
        { field: 'supervisor', headerName: 'Warehouse Supervisor', width: 180 },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            cellRenderer: () => (
                <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#dcfce7',
                    color: '#15803d'
                }}>
                    Operational
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
                        Warehouse Locations & Storage Facilities
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Manage multi-location inventory storage, customs bonded freezones, and regional logistics hubs.
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
                    <BiPlus size={18} /> Add Warehouse Location
                </button>
            </div>

            <AgGridTable
                title="Warehouse Locations Register"
                rowData={locations}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE LOCATION MODAL */}
            <Modal
                open={isCreateOpen}
                title="Register Warehouse / Logistics Facility"
                width={600}
                onOk={handleCreateLocation}
                onCancel={() => setIsCreateOpen(false)}
                okText="Register Location"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Facility Code
                            </label>
                            <InputText placeholder="e.g. WH-DXB-04" value={code} onChange={setCode} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Warehouse Name <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputText placeholder="e.g. Sharjah Airport Cold Storage" value={name} onChange={setName} allowClear />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Facility Type
                            </label>
                            <Select
                                options={[
                                    { value: 'hub', label: 'Primary Distribution Hub' },
                                    { value: 'bonded', label: 'Customs Bonded Freezone' },
                                    { value: 'retail', label: 'Storefront / Retail Safe' }
                                ]}
                                value={type}
                                onChange={setType}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                City / Freezone
                            </label>
                            <InputText placeholder="e.g. Sharjah SAIF-Zone" value={city} onChange={setCity} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Designated Supervisor / Manager
                        </label>
                        <InputText placeholder="e.g. Rashid Al-Nuaimi" value={supervisor} onChange={setSupervisor} allowClear />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default InventoryLocations;


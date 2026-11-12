import React, { useState } from 'react';
import { BiPlus, BiBriefcase, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';

const ProjectsList = () => {
    const [projects, setProjects] = useState([
        {
            id: 1,
            code: 'PRJ-2026-01',
            name: 'Dubai South Automated Fulfillment Facility Phase 1',
            customer_name: 'Al-Futtaim Logistics LLC',
            budget: 250000.00,
            revenue_billed: 185000.00,
            costs_incurred: 110000.00,
            gross_margin: '40.5%',
            currency: 'AED',
            status: 'Active'
        },
        {
            id: 2,
            code: 'PRJ-2026-02',
            name: 'Hospitality ERP Implementation & Network Upgrade',
            customer_name: 'Emaar Hospitality Group',
            budget: 120000.00,
            revenue_billed: 45000.00,
            costs_incurred: 22000.00,
            gross_margin: '51.1%',
            currency: 'AED',
            status: 'Active'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [budget, setBudget] = useState(100000);

    const handleCreateProject = () => {
        if (!name.trim()) {
            alert('Project name is required.');
            return;
        }

        const newPrj = {
            id: Date.now(),
            code: code.trim() || `PRJ-2026-${String(projects.length + 3).padStart(2, '0')}`,
            name: name.trim(),
            customer_name: 'Enterprise Client',
            budget: parseFloat(budget || 0),
            revenue_billed: 0.00,
            costs_incurred: 0.00,
            gross_margin: '0.0%',
            currency: 'AED',
            status: 'Active'
        };

        setProjects(prev => [newPrj, ...prev]);
        setIsCreateOpen(false);
        setCode('');
        setName('');
    };

    const columnDefs = [
        { field: 'code', headerName: 'Project Code', width: 140, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'name', headerName: 'Project Title', flex: 1, minWidth: 260, cellStyle: { fontWeight: 600 } },
        { field: 'customer_name', headerName: 'Client / Sponsor', width: 220 },
        { 
            field: 'budget', 
            headerName: 'Target Budget', 
            width: 150, 
            valueFormatter: p => `${p.data?.currency} ${parseFloat(p.value).toLocaleString()}` 
        },
        { 
            field: 'revenue_billed', 
            headerName: 'Billed Revenue', 
            width: 150, 
            cellStyle: { fontWeight: 600, color: '#15803d' },
            valueFormatter: p => `${p.data?.currency} ${parseFloat(p.value).toLocaleString()}` 
        },
        { 
            field: 'costs_incurred', 
            headerName: 'Project Costs', 
            width: 150, 
            cellStyle: { color: '#dc2626' },
            valueFormatter: p => `${p.data?.currency} ${parseFloat(p.value).toLocaleString()}` 
        },
        { field: 'gross_margin', headerName: 'Profit Margin', width: 130, cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            cellRenderer: () => (
                <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#dcfce7',
                    color: '#15803d'
                }}>
                    Active
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
                        Commercial Projects & Job Costing
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Track revenue, direct labor, sub-contractor bills, and profitability margins across client engagements.
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
                    <BiPlus size={18} /> New Project
                </button>
            </div>

            <AgGridTable
                title="Projects Register"
                rowData={projects}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE PROJECT MODAL */}
            <Modal
                open={isCreateOpen}
                title="Create Commercial Project"
                width={600}
                onOk={handleCreateProject}
                onCancel={() => setIsCreateOpen(false)}
                okText="Create Project"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Project Code
                            </label>
                            <InputText placeholder="e.g. PRJ-2026-03" value={code} onChange={setCode} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Project Name <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputText placeholder="e.g. Riyadh Warehouse Automated Sorter" value={name} onChange={setName} allowClear />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Target Budget (AED)
                        </label>
                        <InputNumber value={budget} min={0} step={10000} onChange={setBudget} />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProjectsList;


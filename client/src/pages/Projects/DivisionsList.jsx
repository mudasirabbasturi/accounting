import React, { useState } from 'react';
import { BiPlus, BiBuilding, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';

const DivisionsList = () => {
    const [divisions, setDivisions] = useState([
        {
            id: 1,
            code: 'DIV-OPS-01',
            name: 'Supply Chain & Freight Logistics Operations',
            manager: 'Tariq Mansoor (VP Operations)',
            budget: 650000.00,
            actual_expense: 412500.00,
            variance: 237500.00,
            currency: 'AED',
            status: 'Active'
        },
        {
            id: 2,
            code: 'DIV-IT-02',
            name: 'Enterprise IT, Cloud Infrastructure & Systems',
            manager: 'Zaid Al-Harbi (Head of IT)',
            budget: 280000.00,
            actual_expense: 148200.00,
            variance: 131800.00,
            currency: 'AED',
            status: 'Active'
        },
        {
            id: 3,
            code: 'DIV-FIN-03',
            name: 'Corporate Finance, Tax & Compliance',
            manager: 'Fatima Al-Zahra (CFO)',
            budget: 220000.00,
            actual_expense: 114500.00,
            variance: 105500.00,
            currency: 'AED',
            status: 'Active'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [manager, setManager] = useState('');
    const [budget, setBudget] = useState(200000);

    const handleCreateDivision = () => {
        if (!name.trim()) {
            alert('Division title is required.');
            return;
        }

        const newDiv = {
            id: Date.now(),
            code: code.trim() || `DIV-GEN-${String(divisions.length + 4).padStart(2, '0')}`,
            name: name.trim(),
            manager: manager.trim() || 'Division Head',
            budget: parseFloat(budget || 0),
            actual_expense: 0.00,
            variance: parseFloat(budget || 0),
            currency: 'AED',
            status: 'Active'
        };

        setDivisions(prev => [newDiv, ...prev]);
        setIsCreateOpen(false);
        setCode('');
        setName('');
        setManager('');
    };

    const columnDefs = [
        { field: 'code', headerName: 'Cost Center Code', width: 170, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'name', headerName: 'Division / Department Title', flex: 1, minWidth: 260, cellStyle: { fontWeight: 600 } },
        { field: 'manager', headerName: 'Department Head', width: 220 },
        { 
            field: 'budget', 
            headerName: 'Annual Budget', 
            width: 170, 
            valueFormatter: p => `${p.data?.currency} ${parseFloat(p.value).toLocaleString()}` 
        },
        { 
            field: 'actual_expense', 
            headerName: 'YTD Actual Expense', 
            width: 170, 
            cellStyle: { color: '#dc2626', fontWeight: 600 },
            valueFormatter: p => `${p.data?.currency} ${parseFloat(p.value).toLocaleString()}` 
        },
        { 
            field: 'variance', 
            headerName: 'Remaining Budget', 
            width: 170, 
            cellStyle: { color: '#15803d', fontWeight: 700 },
            valueFormatter: p => `${p.data?.currency} ${parseFloat(p.value).toLocaleString()}` 
        },
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
                        Divisions & Cost Centers (Segmental Reporting)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Track department-level operating expenditure against allocated budgetary ceilings for management reporting.
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
                    <BiPlus size={18} /> New Division / Cost Center
                </button>
            </div>

            <AgGridTable
                title="Departmental Cost Centers Register"
                rowData={divisions}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE DIVISION MODAL */}
            <Modal
                open={isCreateOpen}
                title="Create Department / Cost Center"
                width={600}
                onOk={handleCreateDivision}
                onCancel={() => setIsCreateOpen(false)}
                okText="Create Division"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Cost Center Code
                            </label>
                            <InputText placeholder="e.g. DIV-MKT-04" value={code} onChange={setCode} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Department Title <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputText placeholder="e.g. Global Marketing & Brand Development" value={name} onChange={setName} allowClear />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Designated Lead / Manager
                            </label>
                            <InputText placeholder="e.g. Sarah Jenkins" value={manager} onChange={setManager} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Annual Budget (AED)
                            </label>
                            <InputNumber value={budget} min={0} step={25000} onChange={setBudget} />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DivisionsList;


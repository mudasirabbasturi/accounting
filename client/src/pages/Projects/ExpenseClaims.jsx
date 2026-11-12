import React, { useState } from 'react';
import { BiPlus, BiFile, BiCheckCircle } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { Modal, Select, InputText, InputNumber } from '../../elegance-ui/components';

const ExpenseClaims = () => {
    const [claims, setClaims] = useState([
        {
            id: 1,
            claim_number: 'EXP-2026-0031',
            claim_date: '2026-10-23',
            employee_name: 'Zaid Al-Harbi',
            department: 'Enterprise IT',
            category: 'Data Center Site Travel & Fuel',
            amount: 850.00,
            vat_amount: 42.50,
            currency: 'AED',
            receipt_attached: 'Yes (PDF Invoice)',
            status: 'Approved'
        },
        {
            id: 2,
            claim_number: 'EXP-2026-0032',
            claim_date: '2026-10-27',
            employee_name: 'Mansoor Iqbal',
            department: 'Logistics Operations',
            category: 'Warehouse Facility Consumables',
            amount: 420.00,
            vat_amount: 21.00,
            currency: 'AED',
            receipt_attached: 'Yes (Receipt JPG)',
            status: 'Reimbursed'
        },
        {
            id: 3,
            claim_number: 'EXP-2026-0033',
            claim_date: '2026-10-30',
            employee_name: 'Fatima Al-Hashimi',
            department: 'Corporate Accounts',
            category: 'Client Hospitality & Dinner',
            amount: 1250.00,
            vat_amount: 62.50,
            currency: 'AED',
            receipt_attached: 'Yes (Invoice)',
            status: 'Pending Approval'
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [employee, setEmployee] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [category, setCategory] = useState('travel');
    const [amount, setAmount] = useState(350);
    const [description, setDescription] = useState('');

    const handleCreateClaim = () => {
        if (!employee.trim()) {
            alert('Employee name is required.');
            return;
        }

        const amt = parseFloat(amount || 0);
        const newClaim = {
            id: Date.now(),
            claim_number: `EXP-2026-${String(claims.length + 34).padStart(4, '0')}`,
            claim_date: date,
            employee_name: employee.trim(),
            department: 'Corporate Staff',
            category: category === 'travel' ? 'Business Travel & Transport' : 'Client Engagement',
            amount: amt,
            vat_amount: amt * 0.05,
            currency: 'AED',
            receipt_attached: 'Pending Upload',
            status: 'Pending Approval'
        };

        setClaims(prev => [newClaim, ...prev]);
        setIsCreateOpen(false);
        setEmployee('');
        setDescription('');
    };

    const columnDefs = [
        { field: 'claim_number', headerName: 'Claim #', width: 160, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'claim_date', headerName: 'Claim Date', width: 120 },
        { field: 'employee_name', headerName: 'Claimant (Employee)', width: 180, cellStyle: { fontWeight: 600 } },
        { field: 'department', headerName: 'Department', width: 170 },
        { field: 'category', headerName: 'Expense Category', flex: 1, minWidth: 220 },
        { 
            field: 'amount', 
            headerName: 'Claim Total', 
            width: 140, 
            cellStyle: { fontWeight: 700, color: '#0f172a' },
            valueFormatter: p => `${p.data?.currency} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
        },
        { 
            field: 'vat_amount', 
            headerName: 'Input VAT', 
            width: 120, 
            cellStyle: { color: '#059669', fontWeight: 600 },
            valueFormatter: p => `${p.data?.currency} ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
        },
        { field: 'receipt_attached', headerName: 'Voucher Proof', width: 160 },
        {
            field: 'status',
            headerName: 'Audit Status',
            width: 150,
            cellRenderer: (params) => {
                const s = params.value || 'Pending';
                let bg = '#fef3c7'; let color = '#b45309';
                if (s === 'Reimbursed') { bg = '#dcfce7'; color = '#15803d'; }
                else if (s === 'Approved') { bg = '#e0e7ff'; color = '#4338ca'; }
                return (
                    <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: bg,
                        color: color
                    }}>
                        {s}
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
                        Employee Expense Claims
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Reimburse out-of-pocket staff travel, client dining, and operational expenses with automatic input VAT tracking.
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
                    <BiPlus size={18} /> Submit Expense Claim
                </button>
            </div>

            <AgGridTable
                title="Employee Expense Claims Register"
                rowData={claims}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />

            {/* CREATE EXPENSE CLAIM MODAL */}
            <Modal
                open={isCreateOpen}
                title="Submit Employee Expense Claim"
                width={650}
                onOk={handleCreateClaim}
                onCancel={() => setIsCreateOpen(false)}
                okText="Submit Claim"
                cancelText="Cancel"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Employee Name <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputText placeholder="e.g. Zaid Al-Harbi" value={employee} onChange={setEmployee} allowClear />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Expense Date
                            </label>
                            <InputText value={date} onChange={setDate} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Expense Category
                            </label>
                            <Select
                                options={[
                                    { value: 'travel', label: 'Business Travel, Taxi & Fuel' },
                                    { value: 'hospitality', label: 'Client Entertainment & Meals' },
                                    { value: 'consumables', label: 'Office & Warehouse Supplies' },
                                    { value: 'telecom', label: 'Mobile & Internet Reimbursement' }
                                ]}
                                value={category}
                                onChange={setCategory}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Amount Claimed (AED Inc. VAT) <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <InputNumber value={amount} min={1} precision={2} onChange={setAmount} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Business Justification
                        </label>
                        <InputText
                            placeholder="State client meeting purpose or job site visited"
                            value={description}
                            onChange={setDescription}
                            allowClear
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ExpenseClaims;


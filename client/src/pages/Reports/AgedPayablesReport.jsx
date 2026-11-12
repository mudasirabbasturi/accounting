import React, { useState } from 'react';
import { BiPrinter, BiTimeFive } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { InputText } from '../../elegance-ui/components';

const AgedPayablesReport = () => {
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));

    const rows = [
        {
            supplier_code: 'SUPP-001',
            supplier_name: 'Amazon Web Services MENA FZ-LLC',
            current: 0.00,
            days_1_30: 0.00,
            days_31_60: 0.00,
            days_61_90: 0.00,
            days_90_plus: 0.00,
            total_due: 0.00,
            currency: 'AED'
        },
        {
            supplier_code: 'SUPP-002',
            supplier_name: 'Dell Technologies Middle East',
            current: 18125.00,
            days_1_30: 0.00,
            days_31_60: 0.00,
            days_61_90: 0.00,
            days_90_plus: 0.00,
            total_due: 18125.00,
            currency: 'AED'
        },
        {
            supplier_code: 'SUPP-003',
            supplier_name: 'Sabic Petrochemical Supply',
            current: 13110.00,
            days_1_30: 0.00,
            days_31_60: 0.00,
            days_61_90: 0.00,
            days_90_plus: 0.00,
            total_due: 13110.00,
            currency: 'SAR'
        }
    ];

    const columnDefs = [
        { field: 'supplier_code', headerName: 'Supplier #', width: 130, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'supplier_name', headerName: 'Supplier Legal Name', flex: 1, minWidth: 240, cellStyle: { fontWeight: 600 } },
        { 
            field: 'current', 
            headerName: 'Current (Not Due)', 
            width: 150, 
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-' 
        },
        { 
            field: 'days_1_30', 
            headerName: '1 - 30 Days Due', 
            width: 150, 
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-' 
        },
        { 
            field: 'days_31_60', 
            headerName: '31 - 60 Days Overdue', 
            width: 160, 
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-' 
        },
        { 
            field: 'days_61_90', 
            headerName: '61 - 90 Days Overdue', 
            width: 160, 
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-' 
        },
        { 
            field: 'days_90_plus', 
            headerName: '90+ Days Overdue', 
            width: 150, 
            cellStyle: { fontWeight: 700, color: '#dc2626' },
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-' 
        },
        { 
            field: 'total_due', 
            headerName: 'Total Payable', 
            width: 170, 
            pinned: 'right',
            cellStyle: { fontWeight: 700, color: '#0f172a' },
            valueFormatter: p => `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
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
                        Aged Payables (Vendor Creditors Aging)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Track upcoming vendor payment maturities and overdue liabilities to optimize working capital treasury outflows.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '160px' }}>
                        <InputText value={asOfDate} onChange={setAsOfDate} placeholder="As of date" />
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
                        <BiPrinter size={16} /> Print Aging Report
                    </button>
                </div>
            </div>

            <AgGridTable
                title={`Aged Payables Schedule as of ${asOfDate}`}
                rowData={rows}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />
        </div>
    );
};

export default AgedPayablesReport;


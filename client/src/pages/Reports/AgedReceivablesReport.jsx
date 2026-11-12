import React, { useState } from 'react';
import { BiPrinter, BiTimeFive } from 'react-icons/bi';
import AgGridTable from '../../components/Datatable/AgGridTable';
import { InputText } from '../../elegance-ui/components';

const AgedReceivablesReport = () => {
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));

    const rows = [
        {
            customer_code: 'CUST-001',
            customer_name: 'Al-Futtaim Logistics LLC',
            current: 0.00,
            days_1_30: 0.00,
            days_31_60: 0.00,
            days_61_90: 0.00,
            days_90_plus: 0.00,
            total_due: 0.00,
            currency: 'AED'
        },
        {
            customer_code: 'CUST-002',
            customer_name: 'Emaar Hospitality Group',
            current: 10000.00,
            days_1_30: 12550.00,
            days_31_60: 0.00,
            days_61_90: 0.00,
            days_90_plus: 0.00,
            total_due: 22550.00,
            currency: 'AED'
        },
        {
            customer_code: 'CUST-003',
            customer_name: 'Saudi Aramco Services Ltd',
            current: 18400.00,
            days_1_30: 0.00,
            days_31_60: 0.00,
            days_61_90: 0.00,
            days_90_plus: 0.00,
            total_due: 18400.00,
            currency: 'SAR'
        },
        {
            customer_code: 'CUST-004',
            customer_name: 'Sharjah Aviation Authority',
            current: 7875.00,
            days_1_30: 0.00,
            days_31_60: 0.00,
            days_61_90: 0.00,
            days_90_plus: 0.00,
            total_due: 7875.00,
            currency: 'AED'
        }
    ];

    const columnDefs = [
        { field: 'customer_code', headerName: 'Customer #', width: 130, pinned: 'left', cellStyle: { fontWeight: 700, color: '#4f46e5' } },
        { field: 'customer_name', headerName: 'Customer Legal Name', flex: 1, minWidth: 240, cellStyle: { fontWeight: 600 } },
        { 
            field: 'current', 
            headerName: 'Current (Not Due)', 
            width: 150, 
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-' 
        },
        { 
            field: 'days_1_30', 
            headerName: '1 - 30 Days Overdue', 
            width: 160, 
            cellStyle: p => ({ color: p.value > 0 ? '#d97706' : '#64748b', fontWeight: p.value > 0 ? 600 : 400 }),
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-' 
        },
        { 
            field: 'days_31_60', 
            headerName: '31 - 60 Days Overdue', 
            width: 160, 
            cellStyle: p => ({ color: p.value > 0 ? '#ea580c' : '#64748b' }),
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-' 
        },
        { 
            field: 'days_61_90', 
            headerName: '61 - 90 Days Overdue', 
            width: 160, 
            cellStyle: p => ({ color: p.value > 0 ? '#dc2626' : '#64748b' }),
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-' 
        },
        { 
            field: 'days_90_plus', 
            headerName: '90+ Days Overdue', 
            width: 150, 
            cellStyle: p => ({ color: p.value > 0 ? '#991b1b' : '#64748b', fontWeight: 700 }),
            valueFormatter: p => p.value ? `$${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-' 
        },
        { 
            field: 'total_due', 
            headerName: 'Total Receivable', 
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
                        Aged Receivables (Customer Debtors Aging)
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Detailed aging brackets of unpaid customer invoices assessing credit collection risk and cash flow projections.
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
                title={`Aged Receivables Schedule as of ${asOfDate}`}
                rowData={rows}
                columnDefs={columnDefs}
                height="650px"
                enableSearch={true}
                enableExport={true}
            />
        </div>
    );
};

export default AgedReceivablesReport;


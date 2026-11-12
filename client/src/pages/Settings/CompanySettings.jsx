import React, { useState, useEffect } from 'react';
import { BiBuildingHouse, BiCheckShield, BiSave, BiGlobe, BiPhone, BiEnvelope } from 'react-icons/bi';
import { Select, InputText } from '../../elegance-ui/components';
import api from '../../services/api';

const CompanySettings = () => {
    const [loading, setLoading] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');

    // Company Settings Form State
    const [companyName, setCompanyName] = useState('Orient Logistics & Solutions LLC');
    const [legalNameAr, setLegalNameAr] = useState('اورينت للحلول اللوجستية ش.ذ.م.م');
    const [taxCountry, setTaxCountry] = useState('UAE');
    const [trn, setTrn] = useState('100234567800003');
    const [crNumber, setCrNumber] = useState('CR-987654-DXB');
    const [baseCurrency, setBaseCurrency] = useState('AED');
    const [financialYearStart, setFinancialYearStart] = useState('01-01');
    const [defaultEmirate, setDefaultEmirate] = useState('Dubai');
    const [zatcaEnv, setZatcaEnv] = useState('Sandbox');
    const [address, setAddress] = useState('Plot 45, Al Quoz Industrial Area 3, Dubai, UAE');
    const [phone, setPhone] = useState('+971 4 345 6789');
    const [email, setEmail] = useState('finance@orientlogistics.ae');
    const [website, setWebsite] = useState('https://www.orientlogistics.ae');

    useEffect(() => {
        loadCompanySettings();
    }, []);

    const loadCompanySettings = async () => {
        setLoading(true);
        try {
            const res = await api.getCompanySettings().catch(() => null);
            if (res && res.company_name) {
                setCompanyName(res.company_name || '');
                setLegalNameAr(res.legal_name_ar || '');
                setTaxCountry(res.tax_country || 'UAE');
                setTrn(res.tax_registration_number || '');
                setCrNumber(res.commercial_registration_no || '');
                setBaseCurrency(res.base_currency || 'AED');
                setFinancialYearStart(res.financial_year_start || '01-01');
                setDefaultEmirate(res.default_emirate || 'Dubai');
                setZatcaEnv(res.zatca_environment || 'Sandbox');
                setAddress(res.address || '');
                setPhone(res.phone || '');
                setEmail(res.email || '');
                setWebsite(res.website || '');
            }
        } catch (err) {
            console.error('Error loading company settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.updateCompanySettings({
                company_name: companyName,
                legal_name_ar: legalNameAr,
                tax_country: taxCountry,
                tax_registration_number: trn,
                commercial_registration_no: crNumber,
                base_currency: baseCurrency,
                financial_year_start: financialYearStart,
                default_emirate: defaultEmirate,
                zatca_environment: zatcaEnv,
                address,
                phone,
                email,
                website
            }).catch(() => null);

            setSavedMsg('Company profile and tax localization saved successfully!');
            setTimeout(() => setSavedMsg(''), 4000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Company Information & Tax Localization</h2>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
                        Manage corporate identity, VAT TRN, ZATCA e-invoicing configuration and fiscal base currency
                    </p>
                </div>
            </div>

            {savedMsg && (
                <div style={{
                    padding: '12px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#ecfdf5',
                    color: '#065f46',
                    border: '1px solid #a7f3d0',
                    fontSize: '14px',
                    fontWeight: 600
                }}>
                    ✓ {savedMsg}
                </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Legal Entity & Registration */}
                <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                        <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px', color: '#2563eb' }}><BiBuildingHouse size={20} /></div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Legal Entity & Corporate Identity</h3>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Primary trade license credentials and Arabic legal name</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Company Legal Name (English) *</label>
                            <InputText
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Legal Name (Arabic) *</label>
                            <InputText
                                dir="rtl"
                                value={legalNameAr}
                                onChange={(e) => setLegalNameAr(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Commercial Registration (CR / Trade License) *</label>
                            <InputText
                                value={crNumber}
                                onChange={(e) => setCrNumber(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Tax Jurisdiction Jurisdiction</label>
                            <Select
                                value={taxCountry}
                                onChange={(val) => setTaxCountry(val)}
                                options={[
                                    { label: 'United Arab Emirates (UAE FTA)', value: 'UAE' },
                                    { label: 'Kingdom of Saudi Arabia (KSA ZATCA)', value: 'KSA' },
                                    { label: 'Global / Multi-Jurisdiction', value: 'GLOBAL' }
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Tax & Regional Compliance */}
                <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                        <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '8px', color: '#059669' }}><BiCheckShield size={20} /></div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>VAT & ZATCA e-Invoicing Compliance</h3>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>FTA Form 201 Emirate allocation and Phase 2 Fatoora Cryptographic Stamp parameters</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Tax Registration Number (TRN) (15-Digits) *</label>
                            <InputText
                                value={trn}
                                onChange={(e) => setTrn(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>UAE VAT Default Reporting Emirate</label>
                            <Select
                                value={defaultEmirate}
                                onChange={(val) => setDefaultEmirate(val)}
                                options={[
                                    { label: 'Dubai (Box 1a)', value: 'Dubai' },
                                    { label: 'Abu Dhabi (Box 1a)', value: 'Abu Dhabi' },
                                    { label: 'Sharjah (Box 1a)', value: 'Sharjah' },
                                    { label: 'Ajman (Box 1a)', value: 'Ajman' },
                                    { label: 'Ras Al Khaimah (Box 1a)', value: 'Ras Al Khaimah' },
                                    { label: 'Fujairah (Box 1a)', value: 'Fujairah' },
                                    { label: 'Umm Al Quwain (Box 1a)', value: 'Umm Al Quwain' }
                                ]}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>KSA ZATCA Fatoora Environment</label>
                            <Select
                                value={zatcaEnv}
                                onChange={(val) => setZatcaEnv(val)}
                                options={[
                                    { label: 'Sandbox (Testing & Validation)', value: 'Sandbox' },
                                    { label: 'Simulation (Pre-compliance clearance)', value: 'Simulation' },
                                    { label: 'Production (Live ZATCA Portal)', value: 'Production' }
                                ]}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Base Accounting Currency</label>
                            <Select
                                value={baseCurrency}
                                onChange={(val) => setBaseCurrency(val)}
                                options={[
                                    { label: 'AED - UAE Dirham', value: 'AED' },
                                    { label: 'SAR - Saudi Riyal', value: 'SAR' },
                                    { label: 'USD - United States Dollar', value: 'USD' },
                                    { label: 'EUR - Euro', value: 'EUR' }
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Contact & Address */}
                <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                        <div style={{ background: '#f5f3ff', padding: '8px', borderRadius: '8px', color: '#7c3aed' }}><BiGlobe size={20} /></div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Corporate Location & Invoicing Header</h3>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Appears on all printed invoices, purchase orders, and vouchers</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Registered Office Address</label>
                            <InputText
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Official Telephone</label>
                            <InputText
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Accounts Email</label>
                            <InputText
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Official Website</label>
                            <InputText
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Submit button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'var(--color-primary, #2563eb)',
                            color: '#fff',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <BiSave size={20} />
                        Save Corporate Profile
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanySettings;


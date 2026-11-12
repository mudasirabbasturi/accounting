-- =====================================================================
-- Seed Data for Enterprise Accounting, Inventory, UAE FTA & KSA Modules
-- =====================================================================

-- 1. Roles
INSERT INTO `roles` (`id`, `name`, `slug`, `description`) VALUES
(1, 'System Administrator', 'admin', 'Full unrestricted administrative access'),
(2, 'Senior Accountant', 'accountant', 'Access to general ledger, journals, bank reconciliations, tax returns and reports'),
(3, 'Financial Auditor', 'auditor', 'Read-only access to all financial records, tax audits and logs'),
(4, 'Inventory Manager', 'inventory_manager', 'Manage inventory items, UOM, batches, serials, transfers, write-offs and production'),
(5, 'Sales Officer', 'sales_officer', 'Manage customers, sales quotes, orders, delivery notes, invoices and credit allocations'),
(6, 'Purchasing Officer', 'purchasing_officer', 'Manage suppliers, purchase orders, goods receipts, purchase invoices and debit allocations');

-- 2. Permissions
INSERT INTO `permissions` (`name`, `slug`, `module`) VALUES
('Manage Accounts', 'accounts.manage', 'Accounting'),
('View Accounts', 'accounts.view', 'Accounting'),
('Manage Journals', 'journal.manage', 'Accounting'),
('View Journals', 'journal.view', 'Accounting'),
('View Financial Reports', 'reports.view', 'Reports'),
('Manage Inventory Items', 'inventory.manage', 'Inventory'),
('View Inventory', 'inventory.view', 'Inventory'),
('Adjust Inventory Stock', 'inventory.adjust', 'Inventory'),
('Manage Sales Cycle', 'sales.manage', 'Sales'),
('View Sales Cycle', 'sales.view', 'Sales'),
('Manage Purchases', 'purchases.manage', 'Purchasing'),
('View Purchases', 'purchases.view', 'Purchasing'),
('Manage Banking & Cash', 'banking.manage', 'Banking'),
('View Banking & Cash', 'banking.view', 'Banking'),
('Manage Fixed Assets', 'assets.manage', 'Fixed Assets'),
('Manage Tax & VAT Returns', 'tax.manage', 'Taxation'),
('View Tax Returns', 'tax.view', 'Taxation'),
('Manage Settings', 'settings.manage', 'System'),
('Manage Users & Roles', 'users.manage', 'System'),
('AI Financial Queries', 'ai.query', 'AI');

-- Assign Permissions to Admin
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, `id` FROM `permissions`;

-- Assign Permissions to Accountant
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 2, `id` FROM `permissions` WHERE `slug` IN (
    'accounts.manage', 'accounts.view', 'journal.manage', 'journal.view',
    'reports.view', 'banking.manage', 'banking.view', 'sales.view', 'purchases.view',
    'inventory.view', 'assets.manage', 'tax.manage', 'tax.view', 'ai.query'
);

-- 3. Default Admin User (username: admin, password: admin123)
-- BCrypt password hash for admin123
INSERT INTO `users` (`id`, `role_id`, `username`, `email`, `password_hash`, `full_name`, `phone`, `is_active`) VALUES
(1, 1, 'admin', 'admin@enterprise.local', '$2y$10$Wq9Hk42D0G8J6Z689BwNbe12p5UvY4gC/d3KzX4r2h8L1jQyM5V6W', 'System Administrator', '+971 4 123 4567', 1);

-- 4. Company Settings (UAE / KSA Ready)
INSERT INTO `company_settings` (`id`, `company_name`, `legal_name_ar`, `tax_country`, `tax_registration_number`, `commercial_registration_no`, `base_currency`, `financial_year_start`, `default_emirate`, `zatca_environment`, `address`, `phone`, `email`) VALUES
(1, 'Orient Logistics & Solutions LLC', 'أورينت للحلول اللوجستية والتجارة ش.ذ.م.م', 'UAE', '100234567800003', 'CR-987654-DXB', 'AED', '01-01', 'Dubai', 'Sandbox', 'Plot 45, Al Quoz Industrial Area 3, Dubai, UAE', '+971 4 345 6789', 'finance@orientlogistics.ae');

-- 5. Standard Currencies
INSERT INTO `currencies` (`code`, `name`, `symbol`, `decimal_places`, `is_base`, `is_active`) VALUES
('AED', 'UAE Dirham', 'AED', 2, 1, 1),
('SAR', 'Saudi Riyal', 'SAR', 2, 0, 1),
('USD', 'US Dollar', '$', 2, 0, 1),
('EUR', 'Euro', '€', 2, 0, 1),
('GBP', 'British Pound', '£', 2, 0, 1);

-- Standard Pegged Exchange Rates (to AED)
INSERT INTO `currency_exchange_rates` (`currency_code`, `rate_date`, `exchange_rate`, `source`) VALUES
('USD', CURRENT_DATE(), 3.67250000, 'UAE Central Bank Official Peg'),
('SAR', CURRENT_DATE(), 0.97900000, 'UAE Central Bank Fixed FX'),
('EUR', CURRENT_DATE(), 3.98500000, 'Market Rate'),
('GBP', CURRENT_DATE(), 4.65200000, 'Market Rate');

-- 6. Standard Units of Measure (UOM)
INSERT INTO `units_of_measure` (`id`, `code`, `name`, `symbol`, `is_base_unit`, `base_unit_id`, `conversion_factor`, `is_active`) VALUES
(1, 'PCS', 'Pieces', 'pcs', 1, NULL, 1.0000, 1),
(2, 'BOX', 'Box of 10', 'box', 0, 1, 10.0000, 1),
(3, 'CTN', 'Carton of 100', 'ctn', 0, 1, 100.0000, 1),
(4, 'KG', 'Kilograms', 'kg', 1, NULL, 1.0000, 1),
(5, 'TON', 'Metric Ton', 'ton', 0, 4, 1000.0000, 1),
(6, 'MTR', 'Meter', 'm', 1, NULL, 1.0000, 1);

-- 7. Divisions (Emirates & Designated Free Zones)
INSERT INTO `divisions` (`id`, `code`, `name`, `emirate`, `is_designated_zone`, `description`, `is_active`) VALUES
(1, 'DIV-DXB', 'Dubai HQ & Mainland Commercial', 'Dubai', 0, 'Dubai Mainland Standard Rated Territory', 1),
(2, 'DIV-AUH', 'Abu Dhabi Regional Branch', 'Abu Dhabi', 0, 'Abu Dhabi Mainland Operations', 1),
(3, 'DIV-SHJ', 'Sharjah Distribution Hub', 'Sharjah', 0, 'Northern Emirates Operations', 1),
(4, 'DIV-DAFZ', 'Dubai Airport Freezone (DAFZA)', 'Dubai', 1, 'Designated Zone for VAT purposes', 1);

-- 8. Warehouses & Storage Hubs
INSERT INTO `inventory_locations` (`id`, `code`, `name`, `emirate`, `is_designated_zone`, `address`, `is_default`, `is_active`) VALUES
(1, 'WH-DXB-MAIN', 'Al Quoz Central Distribution Center', 'Dubai', 0, 'Street 18, Al Quoz 3, Dubai', 1, 1),
(2, 'WH-JAFZA', 'Jebel Ali Free Zone Warehouse', 'Dubai', 1, 'Gate 4, JAFZA South, Dubai', 0, 1),
(3, 'WH-AUH', 'Mussafah Logistics Depot', 'Abu Dhabi', 0, 'Sector M-14, Mussafah, Abu Dhabi', 0, 1);

-- 9. Standard Chart of Accounts (IFRS Compliant with GCC VAT Structure)
INSERT INTO `accounts` (`id`, `code`, `name`, `account_type`, `sub_type`, `normal_balance`, `is_control_account`, `control_type`, `currency`, `opening_balance`, `current_balance`, `is_active`) VALUES
-- Assets (1000 - 1999)
(1, '1010', 'Cash on Hand', 'Asset', 'Cash & Cash Equivalents', 'Debit', 1, 'BANK', 'AED', 0, 0, 1),
(2, '1020', 'Emirates NBD Operating Account (AED)', 'Asset', 'Cash & Cash Equivalents', 'Debit', 1, 'BANK', 'AED', 0, 0, 1),
(3, '1025', 'Al Rajhi Corporate Bank (SAR)', 'Asset', 'Cash & Cash Equivalents', 'Debit', 1, 'BANK', 'SAR', 0, 0, 1),
(4, '1030', 'Petty Cash Custody', 'Asset', 'Cash & Cash Equivalents', 'Debit', 1, 'BANK', 'AED', 0, 0, 1),
(5, '1200', 'Accounts Receivable (Trade Debtors)', 'Asset', 'Current Assets', 'Debit', 1, 'AR', 'AED', 0, 0, 1),
(6, '1210', 'Customer Advance Deposits', 'Asset', 'Current Assets', 'Debit', 0, 'NONE', 'AED', 0, 0, 1),
(7, '1300', 'Inventory on Hand (Finished Goods)', 'Asset', 'Current Assets', 'Debit', 1, 'INVENTORY', 'AED', 0, 0, 1),
(8, '1310', 'Goods in Transit', 'Asset', 'Current Assets', 'Debit', 0, 'NONE', 'AED', 0, 0, 1),
(9, '1400', 'Input VAT Recoverable (Purchase Tax)', 'Asset', 'Current Assets', 'Debit', 1, 'INPUT_TAX', 'AED', 0, 0, 1),
(10, '1410', 'Prepaid Rent & Expenses', 'Asset', 'Current Assets', 'Debit', 0, 'NONE', 'AED', 0, 0, 1),
(11, '1500', 'Office & Computer Equipment', 'Asset', 'Fixed Assets', 'Debit', 0, 'NONE', 'AED', 0, 0, 1),
(12, '1510', 'Accumulated Depreciation - Equipment', 'Asset', 'Contra Asset', 'Credit', 0, 'NONE', 'AED', 0, 0, 1),

-- Liabilities (2000 - 2999)
(13, '2010', 'Accounts Payable (Trade Creditors)', 'Liability', 'Current Liabilities', 'Credit', 1, 'AP', 'AED', 0, 0, 1),
(14, '2020', 'Output VAT Payable (Sales Tax)', 'Liability', 'Current Liabilities', 'Credit', 1, 'OUTPUT_TAX', 'AED', 0, 0, 1),
(15, '2025', 'Reverse Charge VAT Payable (RCM Imports)', 'Liability', 'Current Liabilities', 'Credit', 1, 'RCM_TAX', 'AED', 0, 0, 1),
(16, '2030', 'Accrued Payroll & Gratuity Benefits', 'Liability', 'Current Liabilities', 'Credit', 0, 'NONE', 'AED', 0, 0, 1),
(17, '2500', 'Long-Term Bank Facility', 'Liability', 'Long-Term Liabilities', 'Credit', 0, 'NONE', 'AED', 0, 0, 1),

-- Equity (3000 - 3999)
(18, '3010', 'Share Capital / Owner Equity', 'Equity', 'Equity', 'Credit', 0, 'NONE', 'AED', 0, 0, 1),
(19, '3020', 'Retained Earnings', 'Equity', 'Retained Earnings', 'Credit', 1, 'RETAINED_EARNINGS', 'AED', 0, 0, 1),
(20, '3030', 'Owner Drawings', 'Equity', 'Contra Equity', 'Debit', 0, 'NONE', 'AED', 0, 0, 1),

-- Revenue (4000 - 4999)
(21, '4010', 'Standard Rated Sales Revenue (5%)', 'Revenue', 'Operating Revenue', 'Credit', 0, 'NONE', 'AED', 0, 0, 1),
(22, '4020', 'Zero-Rated Export Revenue (0%)', 'Revenue', 'Operating Revenue', 'Credit', 0, 'NONE', 'AED', 0, 0, 1),
(23, '4030', 'Exempt & Out-of-Scope Revenue', 'Revenue', 'Operating Revenue', 'Credit', 0, 'NONE', 'AED', 0, 0, 1),
(24, '4040', 'Freight, Handling & Logistics Services', 'Revenue', 'Operating Revenue', 'Credit', 0, 'NONE', 'AED', 0, 0, 1),
(25, '4090', 'Foreign Exchange Gains (Realized)', 'Revenue', 'Other Income', 'Credit', 0, 'NONE', 'AED', 0, 0, 1),

-- Expenses (5000 - 6999)
(26, '5010', 'Cost of Goods Sold (COGS)', 'Expense', 'Cost of Sales', 'Debit', 0, 'NONE', 'AED', 0, 0, 1),
(27, '5020', 'Inventory Shrinkage & Write-Off Expense', 'Expense', 'Cost of Sales', 'Debit', 0, 'NONE', 'AED', 0, 0, 1),
(28, '6010', 'Employee Salaries & Allowances', 'Expense', 'Operating Expenses', 'Debit', 0, 'NONE', 'AED', 0, 0, 1),
(29, '6020', 'Warehouse Rent & Maintenance', 'Expense', 'Operating Expenses', 'Debit', 0, 'NONE', 'AED', 0, 0, 1),
(30, '6030', 'Utilities, Internet & Telecom', 'Expense', 'Operating Expenses', 'Debit', 0, 'NONE', 'AED', 0, 0, 1),
(31, '6040', 'Depreciation Expense', 'Expense', 'Operating Expenses', 'Debit', 0, 'NONE', 'AED', 0, 0, 1),
(32, '6050', 'Foreign Exchange Losses (Realized)', 'Expense', 'Operating Expenses', 'Debit', 0, 'NONE', 'AED', 0, 0, 1),
(33, '6060', 'Bank & Electronic Payment Charges', 'Expense', 'Operating Expenses', 'Debit', 0, 'NONE', 'AED', 0, 0, 1);

-- 10. Multi-Country Tax Codes (UAE FTA 5% & KSA ZATCA 15%)
INSERT INTO `tax_codes` (`id`, `code`, `name`, `jurisdiction`, `tax_type`, `rate`, `sales_tax_account_id`, `purchase_tax_account_id`, `rcm_tax_account_id`, `is_compound`, `description`, `is_active`) VALUES
(1, 'UAE-VAT-5', 'UAE Standard VAT 5%', 'UAE', 'Standard', 0.050000, 14, 9, NULL, 0, 'Standard 5% VAT under UAE Federal Decree-Law No. 8', 1),
(2, 'UAE-ZERO', 'UAE Zero-Rated (0%)', 'UAE', 'ZeroRated', 0.000000, 14, 9, NULL, 0, 'Exports and qualifying goods under UAE VAT law', 1),
(3, 'UAE-EXEMPT', 'UAE Exempt Supplies (0%)', 'UAE', 'Exempt', 0.000000, NULL, NULL, NULL, 0, 'Exempt financial services and residential rent', 1),
(4, 'UAE-OUT-SCOPE', 'UAE Out of Scope', 'UAE', 'OutOfScope', 0.000000, NULL, NULL, NULL, 0, 'Supplies between designated zones or outside the state', 1),
(5, 'UAE-RCM-5', 'UAE Reverse Charge Mechanism 5%', 'UAE', 'ReverseCharge', 0.050000, 15, 9, 15, 0, 'Imports of services and goods subject to RCM (Form 201 Box 3 & 10)', 1),
(6, 'KSA-VAT-15', 'KSA Standard VAT 15%', 'KSA', 'Standard', 0.150000, 14, 9, NULL, 0, 'Standard 15% VAT under ZATCA regulations', 1),
(7, 'KSA-ZERO', 'KSA Zero-Rated (0%)', 'KSA', 'ZeroRated', 0.000000, 14, 9, NULL, 0, 'Exports and qualified international transport under ZATCA', 1);

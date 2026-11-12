-- =====================================================================
-- Full Enterprise Double-Entry Accounting & Inventory Database Schema
-- Parity with Manager.io, QuickBooks, and Peachtree
-- Includes:
--   1. Full Line-Item Tables (Quotes, Orders, Deliveries, Invoices, Credits)
--   2. High Precision DECIMAL(19,4) & DECIMAL(18,8)
--   3. Units of Measure (UOM), Batches, and Serials
--   4. Credit Note & Prepayment Allocations (Customer & Supplier)
--   5. Full Multi-Country VAT Engine:
--      * UAE FTA VAT Return Form 201 (7 Emirates breakdown, RCM, Designated Zones)
--      * KSA ZATCA Fatoora (Phase 1 & 2 E-Invoicing, TLV QR Code, Hash Chaining)
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. Authentication, Roles, Permissions & Audit
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `user_tokens`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `slug` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `permissions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `module` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `role_permissions` (
    `role_id` INT NOT NULL,
    `permission_id` INT NOT NULL,
    PRIMARY KEY (`role_id`, `permission_id`),
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_id` INT NOT NULL,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_tokens` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `token` VARCHAR(64) NOT NULL UNIQUE,
    `name` VARCHAR(100) DEFAULT 'api_token',
    `last_used_at` TIMESTAMP NULL,
    `expires_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `action` VARCHAR(100) NOT NULL,
    `table_name` VARCHAR(100) NOT NULL,
    `record_id` INT NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `ip_address` VARCHAR(50) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Company Settings, Currencies & Fiscal Periods
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS `company_settings`;
CREATE TABLE `company_settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_name` VARCHAR(200) NOT NULL,
    `legal_name_ar` VARCHAR(200) NULL,                     -- Arabic Legal Name for UAE/KSA
    `tax_country` ENUM('UAE', 'KSA', 'GLOBAL') NOT NULL DEFAULT 'UAE',
    `tax_registration_number` VARCHAR(50) NULL,             -- TRN (15 digits)
    `commercial_registration_no` VARCHAR(50) NULL,          -- CR Number
    `base_currency` VARCHAR(10) NOT NULL DEFAULT 'AED',
    `financial_year_start` VARCHAR(10) NOT NULL DEFAULT '01-01',
    `default_emirate` ENUM('Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah') DEFAULT 'Dubai',
    `zatca_environment` ENUM('Sandbox', 'Simulation', 'Production') DEFAULT 'Sandbox',
    `address` TEXT NULL,
    `phone` VARCHAR(50) NULL,
    `email` VARCHAR(100) NULL,
    `website` VARCHAR(150) NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `currencies`;
CREATE TABLE `currencies` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(10) NOT NULL UNIQUE,                    -- AED, SAR, USD, EUR, GBP
    `name` VARCHAR(100) NOT NULL,
    `symbol` VARCHAR(10) NOT NULL,
    `decimal_places` INT NOT NULL DEFAULT 2,
    `is_base` TINYINT(1) NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `currency_exchange_rates`;
CREATE TABLE `currency_exchange_rates` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `currency_code` VARCHAR(10) NOT NULL,
    `rate_date` DATE NOT NULL,
    `exchange_rate` DECIMAL(18,8) NOT NULL,                 -- Rate to Base Currency
    `source` VARCHAR(100) DEFAULT 'Central Bank',
    UNIQUE KEY `curr_date_unique` (`currency_code`, `rate_date`),
    FOREIGN KEY (`currency_code`) REFERENCES `currencies`(`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `fiscal_periods`;
CREATE TABLE `fiscal_periods` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `period_name` VARCHAR(50) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `is_closed` TINYINT(1) NOT NULL DEFAULT 0,
    `closing_date` DATE NULL,
    `closed_by` INT NULL,
    FOREIGN KEY (`closed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `units_of_measure`;
CREATE TABLE `units_of_measure` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(20) NOT NULL UNIQUE,                    -- PCS, KG, MTR, BOX, CARTON
    `name` VARCHAR(100) NOT NULL,
    `symbol` VARCHAR(10) NOT NULL,
    `is_base_unit` TINYINT(1) NOT NULL DEFAULT 1,
    `base_unit_id` INT NULL,
    `conversion_factor` DECIMAL(19,4) NOT NULL DEFAULT 1.0000,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (`base_unit_id`) REFERENCES `units_of_measure`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Divisions, Projects & Multi-Country Tax Engine
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS `divisions`;
CREATE TABLE `divisions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(20) NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `emirate` ENUM('Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah') NULL,
    `is_designated_zone` TINYINT(1) NOT NULL DEFAULT 0,    -- UAE Designated Free Zone (VAT out-of-scope)
    `description` TEXT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(30) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `customer_id` INT NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `status` ENUM('Active', 'Completed', 'On Hold', 'Cancelled') DEFAULT 'Active',
    `budget` DECIMAL(19,4) DEFAULT 0.0000,
    `estimated_revenue` DECIMAL(19,4) DEFAULT 0.0000,
    `currency` VARCHAR(10) DEFAULT 'AED',
    `notes` TEXT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Chart of Accounts (Core Double-Entry Foundation)
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS `accounts`;
CREATE TABLE `accounts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(30) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `account_type` ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense') NOT NULL,
    `sub_type` VARCHAR(50) NOT NULL,
    `normal_balance` ENUM('Debit', 'Credit') NOT NULL,
    `parent_id` INT NULL,
    `is_control_account` TINYINT(1) DEFAULT 0,
    `control_type` ENUM('NONE', 'AR', 'AP', 'INVENTORY', 'BANK', 'RETAINED_EARNINGS', 'OUTPUT_TAX', 'INPUT_TAX', 'RCM_TAX', 'WITHHOLDING_TAX') DEFAULT 'NONE',
    `currency` VARCHAR(10) DEFAULT 'AED',
    `bank_name` VARCHAR(100) NULL,
    `branch_name` VARCHAR(100) NULL,
    `account_number` VARCHAR(50) NULL,
    `iban` VARCHAR(50) NULL,
    `swift_code` VARCHAR(30) NULL,
    `opening_balance` DECIMAL(19,4) DEFAULT 0.0000,
    `current_balance` DECIMAL(19,4) DEFAULT 0.0000,
    `is_active` TINYINT(1) DEFAULT 1,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`parent_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key back to projects for customer
ALTER TABLE `projects` ADD CONSTRAINT `fk_project_customer` FOREIGN KEY (`customer_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- 5. Multi-Country Tax Engine (UAE FTA 5% & KSA ZATCA 15%)
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS `tax_code_components`;
DROP TABLE IF EXISTS `tax_codes`;
CREATE TABLE `tax_codes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(30) NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `jurisdiction` ENUM('UAE', 'KSA', 'GLOBAL') NOT NULL DEFAULT 'UAE',
    `tax_type` ENUM('Standard', 'ZeroRated', 'Exempt', 'OutOfScope', 'ReverseCharge') NOT NULL DEFAULT 'Standard',
    `rate` DECIMAL(9,6) NOT NULL DEFAULT 0.050000,          -- 5% (UAE) or 15% (KSA)
    `sales_tax_account_id` INT NULL,                       -- Output VAT (Liability)
    `purchase_tax_account_id` INT NULL,                    -- Input VAT Recoverable (Asset)
    `rcm_tax_account_id` INT NULL,                         -- Reverse Charge Liability
    `is_compound` TINYINT(1) NOT NULL DEFAULT 0,
    `description` VARCHAR(255) NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`sales_tax_account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`purchase_tax_account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`rcm_tax_account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tax_code_components` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tax_code_id` INT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `rate` DECIMAL(9,6) NOT NULL,
    `account_id` INT NOT NULL,
    `is_compound_on_prior` TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (`tax_code_id`) REFERENCES `tax_codes`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. General Ledger & Journal Entries
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS `journal_entry_lines`;
DROP TABLE IF EXISTS `journal_entries`;

CREATE TABLE `journal_entries` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `entry_number` VARCHAR(50) NOT NULL UNIQUE,
    `entry_date` DATE NOT NULL,
    `reference` VARCHAR(100) NULL,
    `narration` TEXT NULL,
    `source_type` ENUM('MANUAL', 'SALES_INVOICE', 'PURCHASE_INVOICE', 'PAYMENT', 'RECEIPT', 'INVENTORY_WRITE_OFF', 'DEPRECIATION', 'TRANSFER', 'PRODUCTION', 'CREDIT_NOTE', 'DEBIT_NOTE', 'PREPAYMENT') DEFAULT 'MANUAL',
    `source_id` INT NULL,
    `currency` VARCHAR(10) DEFAULT 'AED',
    `exchange_rate` DECIMAL(18,8) DEFAULT 1.00000000,
    `total_debit` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `total_credit` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `status` ENUM('Draft', 'Posted', 'Void') DEFAULT 'Posted',
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_je_date` (`entry_date`),
    KEY `idx_je_source` (`source_type`, `source_id`),
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `journal_entry_lines` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `journal_entry_id` INT NOT NULL,
    `account_id` INT NOT NULL,
    `division_id` INT NULL,
    `project_id` INT NULL,
    `description` VARCHAR(255) NULL,
    `debit` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `credit` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `foreign_amount` DECIMAL(19,4) NULL,
    `currency` VARCHAR(10) NULL,
    `entity_type` VARCHAR(50) NULL,
    `entity_id` INT NULL,
    FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`),
    FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. Customers & Suppliers (CRM & Vendor Registers)
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS `customer_addresses`;
DROP TABLE IF EXISTS `customers`;

CREATE TABLE `customers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(30) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `name_ar` VARCHAR(150) NULL,                           -- Arabic Name for KSA ZATCA & UAE FTA
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(30) NULL,
    `mobile` VARCHAR(30) NULL,
    `website` VARCHAR(150) NULL,
    `tax_number` VARCHAR(50) NULL,                         -- 15-digit TRN
    `emirate` ENUM('Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah') DEFAULT 'Dubai',
    `country` VARCHAR(50) DEFAULT 'United Arab Emirates',
    `is_designated_zone` TINYINT(1) DEFAULT 0,
    `credit_limit` DECIMAL(19,4) DEFAULT 0.0000,
    `payment_terms` VARCHAR(50) DEFAULT 'Net 30',
    `currency` VARCHAR(10) DEFAULT 'AED',
    `control_account_id` INT NULL,
    `division_id` INT NULL,
    `accounts_receivable` DECIMAL(19,4) DEFAULT 0.0000,
    `is_active` TINYINT(1) DEFAULT 1,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`control_account_id`) REFERENCES `accounts`(`id`),
    FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customer_addresses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT NOT NULL,
    `type` ENUM('billing', 'delivery') DEFAULT 'billing',
    `address1` VARCHAR(255) NOT NULL,
    `address2` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `postal_code` VARCHAR(30) NULL,
    `country` VARCHAR(100) NULL,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `supplier_addresses`;
DROP TABLE IF EXISTS `suppliers`;

CREATE TABLE `suppliers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(30) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `name_ar` VARCHAR(150) NULL,                           -- Arabic Name
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(30) NULL,
    `mobile` VARCHAR(30) NULL,
    `website` VARCHAR(150) NULL,
    `tax_number` VARCHAR(50) NULL,                         -- 15-digit TRN
    `emirate` ENUM('Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah') DEFAULT 'Dubai',
    `country` VARCHAR(50) DEFAULT 'United Arab Emirates',
    `is_designated_zone` TINYINT(1) DEFAULT 0,
    `credit_limit` DECIMAL(19,4) DEFAULT 0.0000,
    `payment_terms` VARCHAR(50) DEFAULT 'Net 30',
    `currency` VARCHAR(10) DEFAULT 'AED',
    `control_account_id` INT NULL,
    `division_id` INT NULL,
    `accounts_payable` DECIMAL(19,4) DEFAULT 0.0000,
    `is_active` TINYINT(1) DEFAULT 1,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`control_account_id`) REFERENCES `accounts`(`id`),
    FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `supplier_addresses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `supplier_id` INT NOT NULL,
    `address1` VARCHAR(255) NOT NULL,
    `address2` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `postal_code` VARCHAR(30) NULL,
    `country` VARCHAR(100) NULL,
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. Advanced Flexible Inventory Management (UOM, Batches & Serials)
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS `inventory_locations`;
CREATE TABLE `inventory_locations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(30) NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `emirate` ENUM('Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah') DEFAULT 'Dubai',
    `is_designated_zone` TINYINT(1) DEFAULT 0,
    `address` TEXT NULL,
    `is_default` TINYINT(1) DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inventory_items`;
CREATE TABLE `inventory_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `item_code` VARCHAR(50) NOT NULL UNIQUE,
    `item_name` VARCHAR(200) NOT NULL,
    `item_name_ar` VARCHAR(200) NULL,                      -- Arabic Item Name
    `description` TEXT NULL,
    `valuation_method` ENUM('AVERAGE_COST', 'FIFO') DEFAULT 'AVERAGE_COST',
    `uom_id` INT NULL,
    `unit_name` VARCHAR(30) DEFAULT 'Unit',
    `sales_price` DECIMAL(19,4) DEFAULT 0.0000,
    `purchase_price` DECIMAL(19,4) DEFAULT 0.0000,
    `tax_code_id` INT NULL,
    `qty_owned` DECIMAL(19,4) DEFAULT 0.0000,
    `qty_on_hand` DECIMAL(19,4) DEFAULT 0.0000,
    `qty_reserved` DECIMAL(19,4) DEFAULT 0.0000,
    `qty_available` DECIMAL(19,4) DEFAULT 0.0000,
    `qty_to_deliver` DECIMAL(19,4) DEFAULT 0.0000,
    `qty_to_receive` DECIMAL(19,4) DEFAULT 0.0000,
    `qty_desired` DECIMAL(19,4) DEFAULT 0.0000,
    `average_cost` DECIMAL(19,4) DEFAULT 0.0000,
    `total_cost` DECIMAL(19,4) DEFAULT 0.0000,
    `track_batches` TINYINT(1) DEFAULT 0,
    `track_serials` TINYINT(1) DEFAULT 0,
    `control_account_id` INT NULL,
    `cogs_account_id` INT NULL,
    `sales_account_id` INT NULL,
    `division_id` INT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`uom_id`) REFERENCES `units_of_measure`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`tax_code_id`) REFERENCES `tax_codes`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`control_account_id`) REFERENCES `accounts`(`id`),
    FOREIGN KEY (`cogs_account_id`) REFERENCES `accounts`(`id`),
    FOREIGN KEY (`sales_account_id`) REFERENCES `accounts`(`id`),
    FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inventory_batches`;
CREATE TABLE `inventory_batches` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `inventory_item_id` INT NOT NULL,
    `batch_number` VARCHAR(50) NOT NULL,
    `inventory_location_id` INT NOT NULL,
    `manufacturing_date` DATE NULL,
    `expiry_date` DATE NULL,
    `quantity_on_hand` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `unit_cost` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `status` ENUM('Available', 'Expired', 'Quarantined') DEFAULT 'Available',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `item_batch_loc` (`inventory_item_id`, `batch_number`, `inventory_location_id`),
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`inventory_location_id`) REFERENCES `inventory_locations`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inventory_serials`;
CREATE TABLE `inventory_serials` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `inventory_item_id` INT NOT NULL,
    `serial_number` VARCHAR(100) NOT NULL,
    `batch_id` INT NULL,
    `inventory_location_id` INT NOT NULL,
    `status` ENUM('In Stock', 'Delivered', 'Returned', 'Damaged') DEFAULT 'In Stock',
    `warranty_expiry` DATE NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `item_serial_unique` (`inventory_item_id`, `serial_number`),
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`inventory_location_id`) REFERENCES `inventory_locations`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inventory_location_stock`;
CREATE TABLE `inventory_location_stock` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `inventory_item_id` INT NOT NULL,
    `inventory_location_id` INT NOT NULL,
    `qty_on_hand` DECIMAL(19,4) DEFAULT 0.0000,
    `qty_reserved` DECIMAL(19,4) DEFAULT 0.0000,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `item_loc_unique` (`inventory_item_id`, `inventory_location_id`),
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`inventory_location_id`) REFERENCES `inventory_locations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inventory_transactions`;
CREATE TABLE `inventory_transactions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `transaction_date` DATE NOT NULL,
    `inventory_item_id` INT NOT NULL,
    `inventory_location_id` INT NOT NULL,
    `batch_id` INT NULL,
    `transaction_type` ENUM('GOODS_RECEIPT', 'DELIVERY_NOTE', 'TRANSFER_IN', 'TRANSFER_OUT', 'WRITE_OFF', 'PRODUCTION_IN', 'PRODUCTION_OUT', 'SALES_RETURN', 'PURCHASE_RETURN', 'MANUAL_ADJUSTMENT') NOT NULL,
    `reference_type` VARCHAR(50) NULL,
    `reference_id` INT NULL,
    `qty_change` DECIMAL(19,4) NOT NULL,
    `unit_cost` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `total_cost` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `balance_after` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `notes` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`),
    FOREIGN KEY (`inventory_location_id`) REFERENCES `inventory_locations`(`id`),
    FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inventory_transfer_items`;
DROP TABLE IF EXISTS `inventory_transfers`;
CREATE TABLE `inventory_transfers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `transfer_date` DATE NOT NULL,
    `reference` VARCHAR(50) NOT NULL UNIQUE,
    `from_location_id` INT NOT NULL,
    `to_location_id` INT NOT NULL,
    `description` TEXT NULL,
    `total_quantity` DECIMAL(19,4) DEFAULT 0.0000,
    `status` ENUM('Pending', 'Completed', 'Cancelled') DEFAULT 'Completed',
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`from_location_id`) REFERENCES `inventory_locations`(`id`),
    FOREIGN KEY (`to_location_id`) REFERENCES `inventory_locations`(`id`),
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory_transfer_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `transfer_id` INT NOT NULL,
    `inventory_item_id` INT NOT NULL,
    `batch_id` INT NULL,
    `quantity` DECIMAL(19,4) NOT NULL,
    `unit_cost` DECIMAL(19,4) NOT NULL,
    `description` VARCHAR(255) NULL,
    FOREIGN KEY (`transfer_id`) REFERENCES `inventory_transfers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`),
    FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inventory_write_off_items`;
DROP TABLE IF EXISTS `inventory_write_offs`;
CREATE TABLE `inventory_write_offs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `write_off_date` DATE NOT NULL,
    `reference` VARCHAR(50) NOT NULL UNIQUE,
    `inventory_location_id` INT NOT NULL,
    `expense_account_id` INT NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `total_quantity` DECIMAL(19,4) DEFAULT 0.0000,
    `total_cost` DECIMAL(19,4) DEFAULT 0.0000,
    `journal_entry_id` INT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`inventory_location_id`) REFERENCES `inventory_locations`(`id`),
    FOREIGN KEY (`expense_account_id`) REFERENCES `accounts`(`id`),
    FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory_write_off_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `write_off_id` INT NOT NULL,
    `inventory_item_id` INT NOT NULL,
    `batch_id` INT NULL,
    `quantity` DECIMAL(19,4) NOT NULL,
    `unit_cost` DECIMAL(19,4) NOT NULL,
    `total_cost` DECIMAL(19,4) NOT NULL,
    `description` VARCHAR(255) NULL,
    FOREIGN KEY (`write_off_id`) REFERENCES `inventory_write_offs`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`),
    FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `production_order_materials`;
DROP TABLE IF EXISTS `production_orders`;
CREATE TABLE `production_orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_date` DATE NOT NULL,
    `reference` VARCHAR(50) NOT NULL UNIQUE,
    `inventory_location_id` INT NOT NULL,
    `finished_item_id` INT NOT NULL,
    `finished_quantity` DECIMAL(19,4) NOT NULL,
    `total_cost` DECIMAL(19,4) DEFAULT 0.0000,
    `unit_cost` DECIMAL(19,4) DEFAULT 0.0000,
    `status` ENUM('Draft', 'In Production', 'Completed', 'Cancelled') DEFAULT 'Draft',
    `description` TEXT NULL,
    `journal_entry_id` INT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`inventory_location_id`) REFERENCES `inventory_locations`(`id`),
    FOREIGN KEY (`finished_item_id`) REFERENCES `inventory_items`(`id`),
    FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `production_order_materials` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `production_order_id` INT NOT NULL,
    `inventory_item_id` INT NOT NULL,
    `required_quantity` DECIMAL(19,4) NOT NULL,
    `allocated_quantity` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `unit_cost` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `total_cost` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    FOREIGN KEY (`production_order_id`) REFERENCES `production_orders`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. Sales Workflow (Quotes -> Orders -> Delivery Notes -> Invoices -> Credit Notes)
--    Full Match with claude.sql + UAE/KSA VAT & ZATCA E-Invoicing
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS `sales_quote_items`;
DROP TABLE IF EXISTS `sales_quotes`;
CREATE TABLE `sales_quotes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `quote_number` VARCHAR(50) NOT NULL UNIQUE,
    `quote_date` DATE NOT NULL,
    `expiry_date` DATE NULL,
    `customer_id` INT NOT NULL,
    `division_id` INT NULL,
    `project_id` INT NULL,
    `currency` VARCHAR(10) DEFAULT 'AED',
    `exchange_rate` DECIMAL(18,8) DEFAULT 1.00000000,
    `prices_include_tax` TINYINT(1) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(19,4) DEFAULT 0.0000,
    `discount_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `tax_total` DECIMAL(19,4) DEFAULT 0.0000,
    `total_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `status` ENUM('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired') DEFAULT 'Draft',
    `terms_conditions` TEXT NULL,
    `notes` TEXT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_sq_customer` (`customer_id`, `quote_date`),
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`),
    FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sales_quote_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `sales_quote_id` INT NOT NULL,
    `line_number` INT NOT NULL DEFAULT 1,
    `inventory_item_id` INT NULL,
    `account_id` INT NULL,
    `description` VARCHAR(255) NOT NULL,
    `quantity` DECIMAL(19,4) NOT NULL DEFAULT 1.0000,
    `uom_id` INT NULL,
    `unit_price` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `discount_rate` DECIMAL(9,6) DEFAULT 0.000000,
    `discount_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `tax_code_id` INT NULL,
    `tax_rate` DECIMAL(9,6) DEFAULT 0.000000,
    `tax_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `line_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    FOREIGN KEY (`sales_quote_id`) REFERENCES `sales_quotes`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`uom_id`) REFERENCES `units_of_measure`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`tax_code_id`) REFERENCES `tax_codes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sales_order_items`;
DROP TABLE IF EXISTS `sales_orders`;
CREATE TABLE `sales_orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_number` VARCHAR(50) NOT NULL UNIQUE,
    `order_date` DATE NOT NULL,
    `delivery_date` DATE NULL,
    `customer_id` INT NOT NULL,
    `sales_quote_id` INT NULL,
    `division_id` INT NULL,
    `project_id` INT NULL,
    `currency` VARCHAR(10) DEFAULT 'AED',
    `exchange_rate` DECIMAL(18,8) DEFAULT 1.00000000,
    `prices_include_tax` TINYINT(1) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(19,4) DEFAULT 0.0000,
    `discount_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `tax_total` DECIMAL(19,4) DEFAULT 0.0000,
    `total_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `status` ENUM('Pending', 'In Progress', 'Delivered', 'Invoiced', 'Cancelled') DEFAULT 'Pending',
    `notes` TEXT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_so_customer` (`customer_id`, `order_date`),
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`),
    FOREIGN KEY (`sales_quote_id`) REFERENCES `sales_quotes`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sales_order_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `sales_order_id` INT NOT NULL,
    `line_number` INT NOT NULL DEFAULT 1,
    `sales_quote_item_id` INT NULL,
    `inventory_item_id` INT NULL,
    `account_id` INT NULL,
    `description` VARCHAR(255) NOT NULL,
    `quantity` DECIMAL(19,4) NOT NULL DEFAULT 1.0000,
    `qty_delivered` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `qty_invoiced` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `uom_id` INT NULL,
    `unit_price` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `discount_rate` DECIMAL(9,6) DEFAULT 0.000000,
    `discount_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `tax_code_id` INT NULL,
    `tax_rate` DECIMAL(9,6) DEFAULT 0.000000,
    `tax_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `line_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sales_quote_item_id`) REFERENCES `sales_quote_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`uom_id`) REFERENCES `units_of_measure`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`tax_code_id`) REFERENCES `tax_codes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `delivery_note_items`;
DROP TABLE IF EXISTS `delivery_notes`;
CREATE TABLE `delivery_notes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `delivery_number` VARCHAR(50) NOT NULL UNIQUE,
    `delivery_date` DATE NOT NULL,
    `customer_id` INT NOT NULL,
    `sales_order_id` INT NULL,
    `inventory_location_id` INT NOT NULL,
    `carrier` VARCHAR(100) NULL,
    `tracking_number` VARCHAR(100) NULL,
    `delivery_status` ENUM('Pending', 'In Transit', 'Delivered', 'Cancelled') DEFAULT 'Delivered',
    `journal_entry_id` INT NULL,                           -- COGS entry when perpetual inventory is used
    `notes` TEXT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`),
    FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`inventory_location_id`) REFERENCES `inventory_locations`(`id`),
    FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `delivery_note_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `delivery_note_id` INT NOT NULL,
    `sales_order_item_id` INT NULL,
    `inventory_item_id` INT NOT NULL,
    `quantity` DECIMAL(19,4) NOT NULL,
    `unit_cost` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `batch_id` INT NULL,
    `serial_id` INT NULL,
    `batch_number` VARCHAR(50) NULL,
    `serial_number` VARCHAR(50) NULL,
    FOREIGN KEY (`delivery_note_id`) REFERENCES `delivery_notes`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sales_order_item_id`) REFERENCES `sales_order_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`),
    FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`serial_id`) REFERENCES `inventory_serials`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `customer_credit_allocations`;
DROP TABLE IF EXISTS `sales_invoice_items`;
DROP TABLE IF EXISTS `sales_invoices`;
CREATE TABLE `sales_invoices` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `invoice_number` VARCHAR(50) NOT NULL UNIQUE,
    `invoice_type` ENUM('Tax Invoice', 'Simplified Tax Invoice') NOT NULL DEFAULT 'Tax Invoice',
    `issue_date` DATE NOT NULL,
    `supply_date` DATE NULL,                               -- UAE/KSA supply date
    `due_date` DATE NOT NULL,
    `customer_id` INT NOT NULL,
    `customer_trn` VARCHAR(50) NULL,                       -- 15-digit TRN
    `sales_order_id` INT NULL,
    `division_id` INT NULL,
    `project_id` INT NULL,
    `currency` VARCHAR(10) DEFAULT 'AED',
    `exchange_rate` DECIMAL(18,8) DEFAULT 1.00000000,
    `prices_include_tax` TINYINT(1) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `discount_amount` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `tax_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `tax_total_aed` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,  -- Mandatory UAE FTA requirement
    `withholding_tax_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `total_amount` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `amount_paid` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `balance_due` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `cost_of_sales` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `status` ENUM('Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Void') DEFAULT 'Draft',
    `journal_entry_id` INT NULL,
    
    -- UAE FTA Specifics
    `emirate` ENUM('Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah') DEFAULT 'Dubai',
    `is_reverse_charge` TINYINT(1) NOT NULL DEFAULT 0,     -- Recipient accounts for VAT
    `is_designated_zone` TINYINT(1) NOT NULL DEFAULT 0,    -- Out of scope of UAE VAT
    
    -- KSA ZATCA Fatoora (Phase 1 & Phase 2)
    `zatca_uuid` VARCHAR(100) NULL,
    `zatca_invoice_counter` INT NULL,                      -- ICV
    `zatca_previous_hash` VARCHAR(150) NULL,               -- PIH for chaining
    `zatca_invoice_hash` VARCHAR(150) NULL,                -- SHA-256
    `zatca_qr_code` TEXT NULL,                             -- Base64 TLV QR Code
    `zatca_cryptographic_stamp` TEXT NULL,
    `zatca_status` ENUM('PENDING', 'REPORTED', 'CLEARED', 'REJECTED') DEFAULT 'PENDING',
    
    `terms_conditions` TEXT NULL,
    `notes` TEXT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_si_customer` (`customer_id`, `issue_date`),
    KEY `idx_si_status_due` (`status`, `due_date`),
    CONSTRAINT `chk_si_amounts` CHECK (`total_amount` >= 0 AND `amount_paid` >= 0),
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`),
    FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sales_invoice_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `sales_invoice_id` INT NOT NULL,
    `line_number` INT NOT NULL DEFAULT 1,
    `sales_order_item_id` INT NULL,
    `delivery_note_item_id` INT NULL,
    `inventory_item_id` INT NULL,
    `account_id` INT NULL,
    `description` VARCHAR(255) NOT NULL,
    `quantity` DECIMAL(19,4) NOT NULL DEFAULT 1.0000,
    `uom_id` INT NULL,
    `unit_price` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `discount_rate` DECIMAL(9,6) DEFAULT 0.000000,
    `discount_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `tax_code_id` INT NULL,
    `tax_rate` DECIMAL(9,6) DEFAULT 0.000000,
    `tax_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `unit_cost` DECIMAL(19,4) DEFAULT 0.0000,
    `batch_id` INT NULL,
    `serial_id` INT NULL,
    `division_id` INT NULL,
    `project_id` INT NULL,
    `line_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    FOREIGN KEY (`sales_invoice_id`) REFERENCES `sales_invoices`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sales_order_item_id`) REFERENCES `sales_order_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`delivery_note_item_id`) REFERENCES `delivery_note_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`uom_id`) REFERENCES `units_of_measure`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`tax_code_id`) REFERENCES `tax_codes`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`serial_id`) REFERENCES `inventory_serials`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `credit_note_items`;
DROP TABLE IF EXISTS `credit_notes`;
CREATE TABLE `credit_notes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `credit_number` VARCHAR(50) NOT NULL UNIQUE,
    `note_date` DATE NOT NULL,
    `customer_id` INT NOT NULL,
    `sales_invoice_id` INT NULL,
    `division_id` INT NULL,
    `project_id` INT NULL,
    `inventory_location_id` INT NULL,                      -- Where returned goods go back
    `currency` VARCHAR(10) DEFAULT 'AED',
    `exchange_rate` DECIMAL(18,8) DEFAULT 1.00000000,
    `prices_include_tax` TINYINT(1) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(19,4) DEFAULT 0.0000,
    `tax_total` DECIMAL(19,4) DEFAULT 0.0000,
    `total_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `amount_allocated` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `status` ENUM('Draft', 'Approved', 'Refunded', 'Void') DEFAULT 'Draft',
    `journal_entry_id` INT NULL,
    `reason` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`),
    FOREIGN KEY (`sales_invoice_id`) REFERENCES `sales_invoices`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`inventory_location_id`) REFERENCES `inventory_locations`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `credit_note_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `credit_note_id` INT NOT NULL,
    `line_number` INT NOT NULL DEFAULT 1,
    `sales_invoice_item_id` INT NULL,
    `inventory_item_id` INT NULL,
    `account_id` INT NULL,
    `description` VARCHAR(255) NOT NULL,
    `quantity` DECIMAL(19,4) NOT NULL DEFAULT 1.0000,
    `unit_price` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `discount_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `tax_code_id` INT NULL,
    `tax_rate` DECIMAL(9,6) DEFAULT 0.000000,
    `tax_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `unit_cost` DECIMAL(19,4) DEFAULT 0.0000,
    `return_to_stock` TINYINT(1) NOT NULL DEFAULT 0,
    `batch_id` INT NULL,
    `line_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    FOREIGN KEY (`credit_note_id`) REFERENCES `credit_notes`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sales_invoice_item_id`) REFERENCES `sales_invoice_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`tax_code_id`) REFERENCES `tax_codes`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Applies a customer credit note against one or more open sales invoices
CREATE TABLE `customer_credit_allocations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `credit_note_id` INT NOT NULL,
    `sales_invoice_id` INT NOT NULL,
    `allocation_date` DATE NOT NULL,
    `amount` DECIMAL(19,4) NOT NULL,                       -- in invoice currency
    `exchange_gain_loss` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `journal_entry_id` INT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `chk_cca_amount` CHECK (`amount` > 0),
    FOREIGN KEY (`credit_note_id`) REFERENCES `credit_notes`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sales_invoice_id`) REFERENCES `sales_invoices`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. Procurement Workflow (Quotes -> Orders -> Goods Receipts -> Invoices -> Debit Notes)
--     Matching Itemized Architecture
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS `purchase_quote_items`;
DROP TABLE IF EXISTS `purchase_quotes`;
CREATE TABLE `purchase_quotes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `quote_number` VARCHAR(50) NOT NULL UNIQUE,
    `quote_date` DATE NOT NULL,
    `supplier_id` INT NOT NULL,
    `currency` VARCHAR(10) DEFAULT 'AED',
    `exchange_rate` DECIMAL(18,8) DEFAULT 1.00000000,
    `prices_include_tax` TINYINT(1) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(19,4) DEFAULT 0.0000,
    `tax_total` DECIMAL(19,4) DEFAULT 0.0000,
    `total_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `status` ENUM('Draft', 'Received', 'Accepted', 'Rejected') DEFAULT 'Draft',
    `notes` TEXT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `purchase_quote_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `purchase_quote_id` INT NOT NULL,
    `line_number` INT NOT NULL DEFAULT 1,
    `inventory_item_id` INT NULL,
    `account_id` INT NULL,
    `description` VARCHAR(255) NOT NULL,
    `quantity` DECIMAL(19,4) NOT NULL DEFAULT 1.0000,
    `uom_id` INT NULL,
    `unit_cost` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `tax_code_id` INT NULL,
    `tax_rate` DECIMAL(9,6) DEFAULT 0.000000,
    `tax_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `line_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    FOREIGN KEY (`purchase_quote_id`) REFERENCES `purchase_quotes`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`uom_id`) REFERENCES `units_of_measure`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`tax_code_id`) REFERENCES `tax_codes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `purchase_order_items`;
DROP TABLE IF EXISTS `purchase_orders`;
CREATE TABLE `purchase_orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_number` VARCHAR(50) NOT NULL UNIQUE,
    `order_date` DATE NOT NULL,
    `supplier_id` INT NOT NULL,
    `purchase_quote_id` INT NULL,
    `currency` VARCHAR(10) DEFAULT 'AED',
    `exchange_rate` DECIMAL(18,8) DEFAULT 1.00000000,
    `prices_include_tax` TINYINT(1) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(19,4) DEFAULT 0.0000,
    `tax_total` DECIMAL(19,4) DEFAULT 0.0000,
    `total_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `status` ENUM('Draft', 'Sent', 'Partially Received', 'Received', 'Invoiced', 'Cancelled') DEFAULT 'Draft',
    `notes` TEXT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),
    FOREIGN KEY (`purchase_quote_id`) REFERENCES `purchase_quotes`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `purchase_order_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `purchase_order_id` INT NOT NULL,
    `line_number` INT NOT NULL DEFAULT 1,
    `purchase_quote_item_id` INT NULL,
    `inventory_item_id` INT NULL,
    `account_id` INT NULL,
    `description` VARCHAR(255) NOT NULL,
    `quantity` DECIMAL(19,4) NOT NULL DEFAULT 1.0000,
    `qty_received` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `qty_invoiced` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `uom_id` INT NULL,
    `unit_cost` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `tax_code_id` INT NULL,
    `tax_rate` DECIMAL(9,6) DEFAULT 0.000000,
    `tax_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `line_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`purchase_quote_item_id`) REFERENCES `purchase_quote_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`uom_id`) REFERENCES `units_of_measure`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`tax_code_id`) REFERENCES `tax_codes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `goods_receipt_items`;
DROP TABLE IF EXISTS `goods_receipts`;
CREATE TABLE `goods_receipts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `receipt_number` VARCHAR(50) NOT NULL UNIQUE,
    `receipt_date` DATE NOT NULL,
    `supplier_id` INT NOT NULL,
    `purchase_order_id` INT NULL,
    `inventory_location_id` INT NOT NULL,
    `receipt_status` ENUM('Received', 'Inspected', 'Rejected') DEFAULT 'Received',
    `notes` TEXT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),
    FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`inventory_location_id`) REFERENCES `inventory_locations`(`id`),
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `goods_receipt_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `goods_receipt_id` INT NOT NULL,
    `purchase_order_item_id` INT NULL,
    `inventory_item_id` INT NOT NULL,
    `quantity` DECIMAL(19,4) NOT NULL,
    `unit_cost` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `batch_id` INT NULL,
    `serial_id` INT NULL,
    `batch_number` VARCHAR(50) NULL,
    `serial_number` VARCHAR(50) NULL,
    FOREIGN KEY (`goods_receipt_id`) REFERENCES `goods_receipts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`purchase_order_item_id`) REFERENCES `purchase_order_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`),
    FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`serial_id`) REFERENCES `inventory_serials`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `supplier_debit_allocations`;
DROP TABLE IF EXISTS `purchase_invoice_items`;
DROP TABLE IF EXISTS `purchase_invoices`;
CREATE TABLE `purchase_invoices` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `invoice_number` VARCHAR(50) NOT NULL UNIQUE,
    `supplier_invoice_number` VARCHAR(50) NULL,
    `issue_date` DATE NOT NULL,
    `supply_date` DATE NULL,
    `due_date` DATE NOT NULL,
    `supplier_id` INT NOT NULL,
    `supplier_trn` VARCHAR(50) NULL,
    `purchase_order_id` INT NULL,
    `division_id` INT NULL,
    `project_id` INT NULL,
    `currency` VARCHAR(10) DEFAULT 'AED',
    `exchange_rate` DECIMAL(18,8) DEFAULT 1.00000000,
    `prices_include_tax` TINYINT(1) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `tax_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `tax_total_aed` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `total_amount` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `amount_paid` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `balance_due` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `status` ENUM('Draft', 'Received', 'Partially Paid', 'Paid', 'Overdue', 'Void') DEFAULT 'Draft',
    `journal_entry_id` INT NULL,
    `is_reverse_charge` TINYINT(1) NOT NULL DEFAULT 0,     -- Import RCM (UAE Box 3 & 10)
    `is_import` TINYINT(1) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),
    FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `purchase_invoice_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `purchase_invoice_id` INT NOT NULL,
    `line_number` INT NOT NULL DEFAULT 1,
    `purchase_order_item_id` INT NULL,
    `goods_receipt_item_id` INT NULL,
    `inventory_item_id` INT NULL,
    `account_id` INT NULL,
    `description` VARCHAR(255) NOT NULL,
    `quantity` DECIMAL(19,4) NOT NULL DEFAULT 1.0000,
    `uom_id` INT NULL,
    `unit_cost` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `tax_code_id` INT NULL,
    `tax_rate` DECIMAL(9,6) DEFAULT 0.000000,
    `tax_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `batch_id` INT NULL,
    `division_id` INT NULL,
    `project_id` INT NULL,
    `line_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`purchase_order_item_id`) REFERENCES `purchase_order_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`goods_receipt_item_id`) REFERENCES `goods_receipt_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`uom_id`) REFERENCES `units_of_measure`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`tax_code_id`) REFERENCES `tax_codes`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `debit_note_items`;
DROP TABLE IF EXISTS `debit_notes`;
CREATE TABLE `debit_notes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `debit_number` VARCHAR(50) NOT NULL UNIQUE,
    `note_date` DATE NOT NULL,
    `supplier_id` INT NOT NULL,
    `purchase_invoice_id` INT NULL,
    `division_id` INT NULL,
    `project_id` INT NULL,
    `inventory_location_id` INT NULL,
    `currency` VARCHAR(10) DEFAULT 'AED',
    `exchange_rate` DECIMAL(18,8) DEFAULT 1.00000000,
    `prices_include_tax` TINYINT(1) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(19,4) DEFAULT 0.0000,
    `tax_total` DECIMAL(19,4) DEFAULT 0.0000,
    `total_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `amount_allocated` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `status` ENUM('Draft', 'Approved', 'Refunded', 'Void') DEFAULT 'Draft',
    `journal_entry_id` INT NULL,
    `reason` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),
    FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`inventory_location_id`) REFERENCES `inventory_locations`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `debit_note_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `debit_note_id` INT NOT NULL,
    `line_number` INT NOT NULL DEFAULT 1,
    `purchase_invoice_item_id` INT NULL,
    `inventory_item_id` INT NULL,
    `account_id` INT NULL,
    `description` VARCHAR(255) NOT NULL,
    `quantity` DECIMAL(19,4) NOT NULL DEFAULT 1.0000,
    `unit_cost` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `tax_code_id` INT NULL,
    `tax_rate` DECIMAL(9,6) DEFAULT 0.000000,
    `tax_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `return_from_stock` TINYINT(1) NOT NULL DEFAULT 0,
    `batch_id` INT NULL,
    `line_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    FOREIGN KEY (`debit_note_id`) REFERENCES `debit_notes`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`purchase_invoice_item_id`) REFERENCES `purchase_invoice_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`tax_code_id`) REFERENCES `tax_codes`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Applies a supplier debit note against one or more open purchase invoices
CREATE TABLE `supplier_debit_allocations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `debit_note_id` INT NOT NULL,
    `purchase_invoice_id` INT NOT NULL,
    `allocation_date` DATE NOT NULL,
    `amount` DECIMAL(19,4) NOT NULL,
    `exchange_gain_loss` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `journal_entry_id` INT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `chk_sda_amount` CHECK (`amount` > 0),
    FOREIGN KEY (`debit_note_id`) REFERENCES `debit_notes`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. Cash, Banking, Payments & Receipts (with Prepayments & Taxes)
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS `payment_lines`;
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `payment_number` VARCHAR(50) NOT NULL UNIQUE,
    `payment_date` DATE NOT NULL,
    `cleared_date` DATE NULL,
    `account_id` INT NOT NULL,
    `payee_type` ENUM('Supplier', 'Customer', 'Employee', 'TaxAuthority', 'Other') DEFAULT 'Supplier',
    `payee_id` INT NULL,
    `payee_name` VARCHAR(150) NULL,
    `payment_method` VARCHAR(50) DEFAULT 'Bank Transfer',
    `reference` VARCHAR(100) NULL,
    `currency` VARCHAR(10) DEFAULT 'AED',
    `exchange_rate` DECIMAL(18,8) DEFAULT 1.00000000,
    `total_amount` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `is_cleared` TINYINT(1) DEFAULT 1,
    `journal_entry_id` INT NULL,
    `notes` TEXT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`),
    FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payment_lines` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `payment_id` INT NOT NULL,
    `account_id` INT NULL,
    `purchase_invoice_id` INT NULL,
    `description` VARCHAR(255) NULL,
    `tax_code_id` INT NULL,
    `tax_rate` DECIMAL(9,6) DEFAULT 0.000000,
    `tax_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `amount` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`tax_code_id`) REFERENCES `tax_codes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `receipt_lines`;
DROP TABLE IF EXISTS `receipts`;
CREATE TABLE `receipts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `receipt_number` VARCHAR(50) NOT NULL UNIQUE,
    `receipt_date` DATE NOT NULL,
    `cleared_date` DATE NULL,
    `account_id` INT NOT NULL,
    `payer_type` ENUM('Customer', 'Supplier', 'Other') DEFAULT 'Customer',
    `payer_id` INT NULL,
    `payer_name` VARCHAR(150) NULL,
    `payment_method` VARCHAR(50) DEFAULT 'Bank Transfer',
    `reference` VARCHAR(100) NULL,
    `currency` VARCHAR(10) DEFAULT 'AED',
    `exchange_rate` DECIMAL(18,8) DEFAULT 1.00000000,
    `total_amount` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `is_cleared` TINYINT(1) DEFAULT 1,
    `journal_entry_id` INT NULL,
    `notes` TEXT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`),
    FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `receipt_lines` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `receipt_id` INT NOT NULL,
    `account_id` INT NULL,
    `sales_invoice_id` INT NULL,
    `description` VARCHAR(255) NULL,
    `tax_code_id` INT NULL,
    `tax_rate` DECIMAL(9,6) DEFAULT 0.000000,
    `tax_amount` DECIMAL(19,4) DEFAULT 0.0000,
    `amount` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    FOREIGN KEY (`receipt_id`) REFERENCES `receipts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`sales_invoice_id`) REFERENCES `sales_invoices`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`tax_code_id`) REFERENCES `tax_codes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inter_account_transfers`;
CREATE TABLE `inter_account_transfers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `transfer_date` DATE NOT NULL,
    `reference` VARCHAR(50) NOT NULL UNIQUE,
    `from_account_id` INT NOT NULL,
    `to_account_id` INT NOT NULL,
    `amount` DECIMAL(19,4) NOT NULL,
    `description` TEXT NULL,
    `journal_entry_id` INT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`from_account_id`) REFERENCES `accounts`(`id`),
    FOREIGN KEY (`to_account_id`) REFERENCES `accounts`(`id`),
    FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `bank_reconciliation_items`;
DROP TABLE IF EXISTS `bank_reconciliations`;
CREATE TABLE `bank_reconciliations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `reconciliation_date` DATE NOT NULL,
    `account_id` INT NOT NULL,
    `statement_start_date` DATE NOT NULL,
    `statement_end_date` DATE NOT NULL,
    `statement_balance` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `book_balance` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `discrepancy` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `status` ENUM('Draft', 'Reconciled', 'Discrepancy') DEFAULT 'Draft',
    `notes` TEXT NULL,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`),
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bank_reconciliation_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `bank_reconciliation_id` INT NOT NULL,
    `transaction_type` ENUM('Payment', 'Receipt', 'Transfer') NOT NULL,
    `transaction_id` INT NOT NULL,
    `transaction_date` DATE NOT NULL,
    `reference` VARCHAR(100) NULL,
    `description` VARCHAR(255) NULL,
    `amount` DECIMAL(19,4) NOT NULL,
    `cleared` TINYINT(1) DEFAULT 0,
    FOREIGN KEY (`bank_reconciliation_id`) REFERENCES `bank_reconciliations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. Fixed Assets & Depreciation Register
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS `depreciation_entries`;
DROP TABLE IF EXISTS `fixed_assets`;
CREATE TABLE `fixed_assets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(30) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `asset_type` VARCHAR(100) NULL,
    `serial_number` VARCHAR(100) NULL,
    `purchase_date` DATE NOT NULL,
    `service_start_date` DATE NULL,
    `disposal_date` DATE NULL,
    `depreciation_method` ENUM('Straight Line', 'Declining Balance', 'None') DEFAULT 'Straight Line',
    `depreciation_rate` DECIMAL(9,6) DEFAULT 0.000000,
    `useful_life_years` INT DEFAULT 5,
    `salvage_value` DECIMAL(19,4) DEFAULT 0.0000,
    `acquisition_cost` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `accumulated_depreciation` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `book_value` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `asset_account_id` INT NOT NULL,
    `accum_deprec_account_id` INT NOT NULL,
    `deprec_expense_account_id` INT NOT NULL,
    `status` ENUM('Active', 'Disposed', 'Fully Depreciated') DEFAULT 'Active',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`asset_account_id`) REFERENCES `accounts`(`id`),
    FOREIGN KEY (`accum_deprec_account_id`) REFERENCES `accounts`(`id`),
    FOREIGN KEY (`deprec_expense_account_id`) REFERENCES `accounts`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `depreciation_entries` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `entry_date` DATE NOT NULL,
    `fixed_asset_id` INT NOT NULL,
    `amount` DECIMAL(19,4) NOT NULL,
    `journal_entry_id` INT NULL,
    `notes` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`fixed_asset_id`) REFERENCES `fixed_assets`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

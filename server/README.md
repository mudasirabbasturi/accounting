# Enterprise Double-Entry Accounting & Inventory Management Server
## Parity with Peachtree, QuickBooks & Manager.io with UAE FTA & KSA ZATCA Modules

A high-precision, enterprise-grade accounting and inventory management engine built in modern PHP 8.2+ with MySQL (`accounts` database).

---

## 🏛️ Built-in Core Accounting Principles

1. **The Fundamental Accounting Equation**:
   $$\text{Assets} = \text{Liabilities} + \text{Equity}$$
   Verified continuously and reflected in `/api/reports/balance-sheet`.

2. **The Double-Entry Rule**:
   $$\sum \text{Debits} = \sum \text{Credits}$$
   Every transaction (sales invoices, purchase invoices, receipts, payments, depreciation, write-offs, credit/debit notes) generates balanced journal entries. Any unbalanced entry is strictly rejected with a `422` error.

3. **Accrual Basis & Revenue Recognition**:
   Revenue is recognized upon issuing sales invoices regardless of payment timing, with automatic debit to Accounts Receivable and credit to Sales Revenue.

4. **The Expense Matching Principle**:
   When inventory is sold, Cost of Goods Sold (COGS) is calculated based on current inventory valuation and matched against sales revenue in the same period, simultaneously relieving inventory on hand.

5. **Conservatism & Prudence**:
   Inventory shrinkage, write-offs, and fixed asset depreciation are booked as expenses against accumulated depreciation/inventory assets to avoid overstating company net worth.

---

## 🌍 Regional Compliance: UAE FTA & KSA ZATCA

### 1. UAE Federal Tax Authority (FTA) Module
- **Standard 5% VAT** calculation with tax-inclusive and tax-exclusive pricing.
- **15-digit TRN validation** for customers and suppliers.
- **Form 201 VAT Return Generator** (`/api/tax/uae-vat-return`):
  - **Box 1 (a-g)**: Standard rated supplies broken down by the **7 Emirates** (Abu Dhabi, Dubai, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, Fujairah).
  - **Box 2**: Tourist tax refunds.
  - **Box 3 & Box 10**: Reverse Charge Mechanism (RCM) imports.
  - **Box 4 & Box 5**: Zero-rated and exempt supplies.
  - **Box 9**: Standard rated expenses (Input VAT recoverable).
  - **Box 12**: Net VAT due to Federal Tax Authority.
- **Designated Free Zones**: Support for out-of-scope transactions in DAFZA, JAFZA, etc.

### 2. KSA ZATCA Fatoora Module (Phase 1 & Phase 2 E-Invoicing)
- **Standard 15% VAT** calculation and KSA ZATCA Tax Return generation (`/api/tax/ksa-vat-return`).
- **Cryptographic TLV Base64 QR Code Generator** (`/api/tax/zatca-qr`):
  - Tag 1: Seller's Legal Name (UTF-8)
  - Tag 2: 15-digit VAT Registration Number
  - Tag 3: Timestamp (ISO 8601)
  - Tag 4: Invoice Total (inclusive of VAT)
  - Tag 5: Total VAT Amount
  - Tag 6 & 7: Invoice Hash & Digital Signature (Phase 2)
- **Invoice Hash Chaining**: Stores `zatca_previous_hash` and `zatca_invoice_counter` (ICV).

---

## 📦 System Architecture & 65-Table Schema

```
accounting/server/
├── .env                              # MySQL DB 'accounts' & App Configuration
├── router.php                        # Built-in PHP server router (php -S localhost:8000)
├── composer.json                     # PSR-4 autoloader specification
├── verify_server.php                 # 25-point comprehensive verification suite
├── test_http.php                     # HTTP client testing live API endpoints
├── public/
│   ├── .htaccess                     # Apache mod_rewrite
│   └── index.php                     # Front-controller
├── core/
│   ├── App.php                       # Kernel & built-in PSR-4 autoloader
│   ├── Database.php                  # PDO singleton with transactions & query helpers
│   ├── Router.php                    # Route matcher with grouping & middleware pipeline
│   ├── Request.php                   # JSON parser, Bearer token extractor, query/body inputs
│   ├── Response.php                  # JSON response helper with CORS headers
│   ├── Auth.php                      # BCrypt password hashing & Bearer token management
│   ├── Validator.php                 # Input validation helper (required, numeric, in, etc.)
│   ├── Controller.php                # Base controller with shortcut responses
│   └── DotEnv.php                    # Environment file loader
├── app/
│   ├── Middleware/
│   │   ├── AuthMiddleware.php        # Bearer token verification
│   │   └── RbacMiddleware.php        # Role & permission authorization
│   ├── Services/
│   │   ├── AccountingEngine.php      # Double-entry posting & reporting
│   │   ├── InventoryEngine.php       # Average costing, batches, serials & warehouse stock
│   │   ├── TaxEngine.php             # UAE VAT 201, KSA ZATCA Return & TLV QR Generator
│   │   └── AiFinancialAssistant.php  # Natural language financial queries & audit scanner
│   └── Controllers/
│       ├── AuthController.php        # Login, profile, users & roles
│       ├── SettingsController.php    # Company settings, currencies, UOMs, exchange rates
│       ├── AccountController.php     # Chart of Accounts & control accounts
│       ├── JournalController.php     # Double-entry general ledger journal entries
│       ├── CustomerController.php    # Customers & accounts receivable statements
│       ├── SupplierController.php    # Suppliers & accounts payable statements
│       ├── InventoryController.php   # Items, warehouses, transfers, write-offs, production orders
│       ├── SalesController.php       # Quotes, orders, delivery notes, sales invoices, credit allocations
│       ├── PurchaseController.php    # Quotes, orders, goods receipts, purchase invoices
│       ├── PaymentController.php     # Cash/Bank disbursements (money out)
│       ├── ReceiptController.php     # Cash/Bank receipts (money in) & bank transfers
│       ├── BankReconciliationController.php # Statement vs book balance reconciliation
│       ├── FixedAssetController.php  # Asset register & monthly/annual depreciation runs
│       ├── TaxController.php         # Tax codes, UAE VAT 201, KSA ZATCA & QR codes
│       ├── ProjectController.php     # Job-costing projects, divisions & cost centers
│       ├── ReportController.php      # Trial Balance, P&L, Balance Sheet, Aged Debtor/Creditors
│       └── AiController.php          # AI query, anomaly scan, CFO health report, explain transaction
├── database/
│   ├── schema.sql                    # 65-table high-precision schema (DECIMAL 19,4)
│   ├── seed.sql                      # GCC Chart of Accounts, UAE 5%, KSA 15%, UOM, Currencies
│   └── migrate.php                   # CLI migration tool
└── routes/
    └── api.php                       # All RESTful API endpoints organized with RBAC
```

---

## 🚀 Quick Start & Usage

### 1. Database Migration
```bash
php database/migrate.php
```
*Creates 65 relational tables in MySQL `accounts` database with seed master data.*

### 2. Start the Server
```bash
php -S localhost:8000 router.php
# Or:
php -S localhost:8000 -t public
```

### 3. Run Self-Verification Suites
```bash
php verify_server.php
php test_http.php
```
*Current test status: **25 Passed, 0 Failed**, validating all accounting rules, inventory batch tracking, UAE VAT Form 201, KSA ZATCA QR codes, and HTTP API endpoints.*

---

## 🔑 Default Credentials

- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `System Administrator` (Full unrestricted permissions)

---

## 📡 RESTful API Reference

All protected endpoints require the header:
`Authorization: Bearer <token>`

### 1. Authentication & System Settings
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login with username/email & password |
| `GET` | `/api/auth/profile` | Current user & permissions |
| `GET` | `/api/settings/company` | Company settings (TRN, country, currency) |
| `POST` | `/api/settings/company` | Update company settings |
| `GET` | `/api/settings/currencies` | Currencies list (AED, SAR, USD, EUR, GBP) |
| `GET` | `/api/settings/uoms` | Units of measure (PCS, BOX, CTN, KG, TON, MTR) |

### 2. UAE FTA & KSA ZATCA Tax Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tax/codes` | List tax codes |
| `POST` | `/api/tax/codes` | Create custom tax code |
| `GET` | `/api/tax/uae-vat-return` | **UAE FTA VAT Return Form 201** with 7 Emirates breakdown |
| `GET` | `/api/tax/ksa-vat-return` | **KSA ZATCA VAT Return Form** |
| `POST` | `/api/tax/zatca-qr` | Generate ZATCA Phase 1 & 2 Base64 TLV QR Code |

### 3. Sales Cycle (Itemized Line Tables + Credit Allocations)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/sales/quotes` | List sales quotes |
| `POST` | `/api/sales/quotes` | Create sales quote with itemized lines |
| `GET` | `/api/sales/orders` | List sales orders |
| `POST` | `/api/sales/orders` | Create sales order with itemized lines |
| `GET` | `/api/sales/delivery-notes` | List delivery notes |
| `POST` | `/api/sales/delivery-notes` | Issue delivery note (relieves stock, tracks batches & serials) |
| `GET` | `/api/sales/invoices` | List sales invoices |
| `POST` | `/api/sales/invoices` | Create invoice (generates ZATCA QR code & posts to GL) |
| `GET` | `/api/sales/credit-notes` | List credit notes |
| `POST` | `/api/sales/credit-notes` | Create credit note (re-enters stock if return-to-stock enabled) |
| `POST` | `/api/sales/credit-notes/{id}/allocate` | Allocate credit note against open sales invoices |

### 4. Purchasing Cycle (Itemized Line Tables)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/purchases/quotes` | List purchase quotes |
| `POST` | `/api/purchases/quotes` | Create purchase quote with itemized lines |
| `GET` | `/api/purchases/orders` | List purchase orders |
| `POST` | `/api/purchases/orders` | Create purchase order with itemized lines |
| `GET` | `/api/purchases/goods-receipts` | List goods receipts |
| `POST` | `/api/purchases/goods-receipts` | Receive goods (creates batches and serials) |
| `GET` | `/api/purchases/invoices` | List purchase invoices |
| `POST` | `/api/purchases/invoices` | Record invoice (supports Reverse Charge Mechanism RCM) |

### 5. Financial Reports & AI Assistant
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reports/trial-balance` | Trial balance verifying Total Debits == Total Credits |
| `GET` | `/api/reports/profit-and-loss` | Income statement (Revenue, COGS, Expenses, Net Profit) |
| `GET` | `/api/reports/balance-sheet` | Balance sheet ($Assets = Liabilities + Equity$) |
| `POST` | `/api/ai/query` | Natural language queries ("What is our UAE VAT 201 summary?", "What is our net profit?") |
| `GET` | `/api/ai/anomalies` | Internal audit scanner (checks unbalanced entries, invalid TRNs, negative stock) |
| `GET` | `/api/ai/health` | Executive CFO health report (Current Ratio, Working Capital, Net Margin) |

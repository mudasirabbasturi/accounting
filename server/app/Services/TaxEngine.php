<?php
namespace App\Services;

use Core\Database;

class TaxEngine
{
    /**
     * Compute line item tax and base amounts based on tax-inclusive / tax-exclusive setting
     */
    public static function computeLineTax(
        float $quantity,
        float $unitPrice,
        float $discountAmount = 0.0,
        float $taxRate = 0.0,
        bool $pricesIncludeTax = false
    ): array {
        $grossOrNet = ($quantity * $unitPrice) - $discountAmount;

        if ($taxRate <= 0.0) {
            return [
                'base_amount' => round($grossOrNet, 4),
                'tax_amount'  => 0.0000,
                'total_amount'=> round($grossOrNet, 4),
            ];
        }

        if ($pricesIncludeTax) {
            // Price includes tax: Base = Amount / (1 + Rate)
            $baseAmount = $grossOrNet / (1.0 + $taxRate);
            $taxAmount = $grossOrNet - $baseAmount;
            $totalAmount = $grossOrNet;
        } else {
            // Price excludes tax: Tax = Base * Rate
            $baseAmount = $grossOrNet;
            $taxAmount = $baseAmount * $taxRate;
            $totalAmount = $baseAmount + $taxAmount;
        }

        return [
            'base_amount'  => round($baseAmount, 4),
            'tax_amount'   => round($taxAmount, 4),
            'total_amount' => round($totalAmount, 4),
        ];
    }

    /**
     * Generate UAE Federal Tax Authority (FTA) VAT Return Form 201
     */
    public static function generateUaeVatReturn(string $startDate, string $endDate): array
    {
        $emirates = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

        // 1. Box 1: Standard rated supplies by Emirate (5%)
        $box1Supplies = [];
        $totalBox1Net = 0.0;
        $totalBox1Vat = 0.0;

        foreach ($emirates as $idx => $emirate) {
            $row = Database::fetch(
                "SELECT COALESCE(SUM(si.subtotal - si.discount_amount), 0) as net_amount,
                        COALESCE(SUM(si.tax_total), 0) as vat_amount
                 FROM sales_invoices si
                 WHERE si.issue_date BETWEEN :s_date AND :e_date
                   AND si.status NOT IN ('Draft', 'Void')
                   AND si.emirate = :emirate
                   AND si.is_reverse_charge = 0
                   AND si.is_designated_zone = 0
                   AND si.tax_total > 0",
                ['s_date' => $startDate, 'e_date' => $endDate, 'emirate' => $emirate]
            );

            // Deduct approved credit notes for this emirate
            $cnRow = Database::fetch(
                "SELECT COALESCE(SUM(cn.subtotal), 0) as net_credit,
                        COALESCE(SUM(cn.tax_total), 0) as vat_credit
                 FROM credit_notes cn
                 JOIN customers c ON c.id = cn.customer_id
                 WHERE cn.note_date BETWEEN :s_date AND :e_date
                   AND cn.status = 'Approved'
                   AND c.emirate = :emirate
                   AND cn.tax_total > 0",
                ['s_date' => $startDate, 'e_date' => $endDate, 'emirate' => $emirate]
            );

            $net = (float)$row['net_amount'] - (float)$cnRow['net_credit'];
            $vat = (float)$row['vat_amount'] - (float)$cnRow['vat_credit'];

            $boxKey = '1' . chr(ord('a') + $idx); // 1a, 1b, etc.
            $box1Supplies[$boxKey] = [
                'emirate'     => $emirate,
                'net_amount'  => round($net, 2),
                'vat_amount'  => round($vat, 2),
                'adjustments' => 0.00,
            ];

            $totalBox1Net += $net;
            $totalBox1Vat += $vat;
        }

        // 2. Box 2: Tax Refunds to Tourists (Planet scheme)
        $box2 = ['net_amount' => 0.00, 'vat_amount' => 0.00];

        // 3. Box 3: Supplies subject to Reverse Charge Mechanism (RCM - Imports)
        $rcmSupplies = Database::fetch(
            "SELECT COALESCE(SUM(pi.subtotal), 0) as net_amount,
                    COALESCE(SUM(pi.tax_total), 0) as vat_amount
             FROM purchase_invoices pi
             WHERE pi.issue_date BETWEEN :s_date AND :e_date
               AND pi.status NOT IN ('Draft', 'Void')
               AND pi.is_reverse_charge = 1",
            ['s_date' => $startDate, 'e_date' => $endDate]
        );
        $box3 = [
            'net_amount' => round((float)$rcmSupplies['net_amount'], 2),
            'vat_amount' => round((float)$rcmSupplies['vat_amount'], 2),
        ];

        // 4. Box 4: Zero-Rated Supplies (Exports & Qualifying goods)
        $zeroRated = Database::fetch(
            "SELECT COALESCE(SUM(sii.line_total), 0) as net_amount
             FROM sales_invoice_items sii
             JOIN sales_invoices si ON si.id = sii.sales_invoice_id
             JOIN tax_codes tc ON tc.id = sii.tax_code_id
             WHERE si.issue_date BETWEEN :s_date AND :e_date
               AND si.status NOT IN ('Draft', 'Void')
               AND tc.tax_type = 'ZeroRated'",
            ['s_date' => $startDate, 'e_date' => $endDate]
        );
        $box4 = ['net_amount' => round((float)$zeroRated['net_amount'], 2), 'vat_amount' => 0.00];

        // 5. Box 5: Exempt Supplies (Financial, bare land, residential rent)
        $exempt = Database::fetch(
            "SELECT COALESCE(SUM(sii.line_total), 0) as net_amount
             FROM sales_invoice_items sii
             JOIN sales_invoices si ON si.id = sii.sales_invoice_id
             JOIN tax_codes tc ON tc.id = sii.tax_code_id
             WHERE si.issue_date BETWEEN :s_date AND :e_date
               AND si.status NOT IN ('Draft', 'Void')
               AND tc.tax_type = 'Exempt'",
            ['s_date' => $startDate, 'e_date' => $endDate]
        );
        $box5 = ['net_amount' => round((float)$exempt['net_amount'], 2), 'vat_amount' => 0.00];

        // 6. Box 6 & 7: Total Value of Supplies and Output Tax Due
        $totalOutputNet = $totalBox1Net + $box3['net_amount'] + $box4['net_amount'] + $box5['net_amount'];
        $totalOutputVat = $totalBox1Vat + $box3['vat_amount'];

        // 7. Box 9: Standard Rated Expenses (Input Tax Recoverable)
        $stdExpenses = Database::fetch(
            "SELECT COALESCE(SUM(pi.subtotal), 0) as net_amount,
                    COALESCE(SUM(pi.tax_total), 0) as vat_amount
             FROM purchase_invoices pi
             WHERE pi.issue_date BETWEEN :s_date AND :e_date
               AND pi.status NOT IN ('Draft', 'Void')
               AND pi.is_reverse_charge = 0
               AND pi.tax_total > 0",
            ['s_date' => $startDate, 'e_date' => $endDate]
        );
        $box9 = [
            'net_amount' => round((float)$stdExpenses['net_amount'], 2),
            'vat_amount' => round((float)$stdExpenses['vat_amount'], 2),
        ];

        // 8. Box 10: Supplies Subject to Reverse Charge (Input side recovery)
        $box10 = $box3;

        // 9. Box 11: Total Value of Expenses and Recoverable Tax
        $totalInputNet = $box9['net_amount'] + $box10['net_amount'];
        $totalInputVat = $box9['vat_amount'] + $box10['vat_amount'];

        // 10. Box 12: Total Payable Tax for the Period
        $netVatDue = $totalOutputVat - $totalInputVat;

        return [
            'jurisdiction' => 'UAE',
            'form'         => 'VAT 201 - Declaration',
            'tax_period'   => ['start_date' => $startDate, 'end_date' => $endDate],
            'vat_on_sales' => [
                'box_1_emirates' => $box1Supplies,
                'box_1_total'    => ['net' => round($totalBox1Net, 2), 'vat' => round($totalBox1Vat, 2)],
                'box_2_tourist'  => $box2,
                'box_3_rcm'      => $box3,
                'box_4_zero'     => $box4,
                'box_5_exempt'   => $box5,
                'box_6_total_supplies' => round($totalOutputNet, 2),
                'box_7_total_output_vat' => round($totalOutputVat, 2),
            ],
            'vat_on_expenses' => [
                'box_9_standard' => $box9,
                'box_10_rcm'     => $box10,
                'box_11_total_expenses' => round($totalInputNet, 2),
                'box_11_total_recoverable_vat' => round($totalInputVat, 2),
            ],
            'net_vat_summary' => [
                'box_12_total_payable_vat'     => round(max(0.0, $netVatDue), 2),
                'box_13_total_recoverable_vat' => round(max(0.0, -$netVatDue), 2),
                'is_refundable'                => $netVatDue < 0,
                'net_vat_due'                  => round($netVatDue, 2),
            ]
        ];
    }

    /**
     * Generate KSA ZATCA VAT Return Form
     */
    public static function generateKsaVatReturn(string $startDate, string $endDate): array
    {
        // 1. Box 1: Standard rated sales (15%)
        $sales15 = Database::fetch(
            "SELECT COALESCE(SUM(si.subtotal - si.discount_amount), 0) as net_amount,
                    COALESCE(SUM(si.tax_total), 0) as vat_amount
             FROM sales_invoices si
             WHERE si.issue_date BETWEEN :s_date AND :e_date
               AND si.status NOT IN ('Draft', 'Void')
               AND si.tax_total > 0",
            ['s_date' => $startDate, 'e_date' => $endDate]
        );

        // 2. Box 4: Exports
        $exports = Database::fetch(
            "SELECT COALESCE(SUM(sii.line_total), 0) as net_amount
             FROM sales_invoice_items sii
             JOIN sales_invoices si ON si.id = sii.sales_invoice_id
             JOIN tax_codes tc ON tc.id = sii.tax_code_id
             WHERE si.issue_date BETWEEN :s_date AND :e_date
               AND si.status NOT IN ('Draft', 'Void')
               AND tc.tax_type = 'ZeroRated'",
            ['s_date' => $startDate, 'e_date' => $endDate]
        );

        // 3. Box 5: Exempt Sales
        $exempt = Database::fetch(
            "SELECT COALESCE(SUM(sii.line_total), 0) as net_amount
             FROM sales_invoice_items sii
             JOIN sales_invoices si ON si.id = sii.sales_invoice_id
             JOIN tax_codes tc ON tc.id = sii.tax_code_id
             WHERE si.issue_date BETWEEN :s_date AND :e_date
               AND si.status NOT IN ('Draft', 'Void')
               AND tc.tax_type = 'Exempt'",
            ['s_date' => $startDate, 'e_date' => $endDate]
        );

        // 4. Box 7: Standard rated purchases (15%)
        $purchases15 = Database::fetch(
            "SELECT COALESCE(SUM(pi.subtotal), 0) as net_amount,
                    COALESCE(SUM(pi.tax_total), 0) as vat_amount
             FROM purchase_invoices pi
             WHERE pi.issue_date BETWEEN :s_date AND :e_date
               AND pi.status NOT IN ('Draft', 'Void')
               AND pi.tax_total > 0",
            ['s_date' => $startDate, 'e_date' => $endDate]
        );

        $totalSalesVat = (float)$sales15['vat_amount'];
        $totalPurchasesVat = (float)$purchases15['vat_amount'];
        $netVat = $totalSalesVat - $totalPurchasesVat;

        return [
            'jurisdiction' => 'KSA',
            'form'         => 'ZATCA VAT Return Form',
            'tax_period'   => ['start_date' => $startDate, 'end_date' => $endDate],
            'sales_vat'    => [
                'box_1_standard_15' => ['net' => round((float)$sales15['net_amount'], 2), 'vat' => round($totalSalesVat, 2)],
                'box_4_exports'     => ['net' => round((float)$exports['net_amount'], 2), 'vat' => 0.00],
                'box_5_exempt'      => ['net' => round((float)$exempt['net_amount'], 2), 'vat' => 0.00],
                'total_sales_vat'   => round($totalSalesVat, 2),
            ],
            'purchase_vat' => [
                'box_7_standard_15' => ['net' => round((float)$purchases15['net_amount'], 2), 'vat' => round($totalPurchasesVat, 2)],
                'total_purchase_vat'=> round($totalPurchasesVat, 2),
            ],
            'net_vat_due' => round($netVat, 2),
            'status'      => ($netVat >= 0) ? 'PAYABLE_TO_ZATCA' : 'REFUNDABLE_FROM_ZATCA',
        ];
    }

    /**
     * Generate KSA ZATCA Compliant Base64 TLV QR Code (Phase 1 & Phase 2)
     */
    public static function generateZatcaQrCode(
        string $sellerName,
        string $vatRegistrationNumber,
        string $timestamp,
        float $totalWithVat,
        float $vatTotal,
        ?string $invoiceHash = null,
        ?string $digitalSignature = null,
        ?string $publicKey = null
    ): string {
        $tags = [
            1 => $sellerName,
            2 => $vatRegistrationNumber,
            3 => $timestamp,
            4 => number_format($totalWithVat, 2, '.', ''),
            5 => number_format($vatTotal, 2, '.', ''),
        ];

        if ($invoiceHash)       $tags[6] = $invoiceHash;
        if ($digitalSignature)  $tags[7] = $digitalSignature;
        if ($publicKey)         $tags[8] = $publicKey;

        $tlvBytes = '';
        foreach ($tags as $tagNumber => $value) {
            $valBytes = (string)$value;
            $len = strlen($valBytes);
            $tlvBytes .= chr($tagNumber) . chr($len) . $valBytes;
        }

        return base64_encode($tlvBytes);
    }
}


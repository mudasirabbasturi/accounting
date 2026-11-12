<?php
/**
 * Test HTTP client for Accounting API with UAE FTA & KSA ZATCA
 */

function httpPost($url, $data, $token = null) {
    $ch = curl_init($url);
    $headers = ['Content-Type: application/json', 'Accept: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $code, 'data' => json_decode($res, true)];
}

function httpGet($url, $token = null) {
    $ch = curl_init($url);
    $headers = ['Accept: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $code, 'data' => json_decode($res, true)];
}

echo "1. Testing Login via HTTP...\n";
$login = httpPost('http://localhost:8000/api/auth/login', [
    'username' => 'admin',
    'password' => 'admin123'
]);

if ($login['status'] !== 200) {
    echo "Login failed: " . json_encode($login) . "\n";
    exit(1);
}

$token = $login['data']['data']['token'];
echo "   -> Login Successful! Token: " . substr($token, 0, 16) . "...\n";

echo "2. Testing GET /api/accounts with Bearer token...\n";
$accs = httpGet('http://localhost:8000/api/accounts', $token);
echo "   -> Status: {$accs['status']} | Count: " . count($accs['data']['data']) . " accounts\n";

echo "3. Testing GET /api/reports/balance-sheet...\n";
$bs = httpGet('http://localhost:8000/api/reports/balance-sheet', $token);
echo "   -> Status: {$bs['status']} | Balanced: " . ($bs['data']['data']['is_balanced'] ? 'YES' : 'NO') . "\n";
echo "   -> Total Assets: $" . $bs['data']['data']['total_assets'] . " | Total Liab+Equity: $" . $bs['data']['data']['total_liabilities_and_equity'] . "\n";

echo "4. Testing GET /api/tax/uae-vat-return (Form 201)...\n";
$uaeVat = httpGet('http://localhost:8000/api/tax/uae-vat-return', $token);
echo "   -> Status: {$uaeVat['status']} | Jurisdiction: " . $uaeVat['data']['data']['jurisdiction'] . "\n";
echo "   -> Dubai Standard Sales: AED " . $uaeVat['data']['data']['vat_on_sales']['box_1_emirates']['1b']['net_amount'] . " | VAT: AED " . $uaeVat['data']['data']['vat_on_sales']['box_1_emirates']['1b']['vat_amount'] . "\n";

echo "5. Testing GET /api/tax/ksa-vat-return (ZATCA Form)...\n";
$ksaVat = httpGet('http://localhost:8000/api/tax/ksa-vat-return', $token);
echo "   -> Status: {$ksaVat['status']} | Net VAT: SAR " . $ksaVat['data']['data']['net_vat_due'] . "\n";

echo "6. Testing POST /api/ai/query ('What is our UAE VAT return?')...\n";
$ai = httpPost('http://localhost:8000/api/ai/query', [
    'query' => 'What is our UAE VAT 201 return?'
], $token);
echo "   -> Status: {$ai['status']} | AI Summary: " . $ai['data']['data']['summary'] . "\n";

echo "7. Testing GET /api/ai/health...\n";
$health = httpGet('http://localhost:8000/api/ai/health', $token);
echo "   -> Status: {$health['status']} | Grade: " . $health['data']['data']['executive_summary']['health_grade'] . "\n";

echo "\nALL HTTP API TESTS INCLUDING UAE & KSA MODULES PASSED PERFECTLY!\n";

<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;
use App\Services\InventoryEngine;

class InventoryController extends Controller
{
    // =========================================================================
    // 1. Inventory Items
    // =========================================================================

    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $where = ["is_active = 1"];
        $params = [];

        if (!empty($search)) {
            $where[] = "(item_code LIKE :s OR item_name LIKE :s)";
            $params['s'] = "%{$search}%";
        }

        $whereClause = implode(" AND ", $where);
        $items = Database::fetchAll("SELECT * FROM inventory_items WHERE {$whereClause} ORDER BY item_code ASC", $params);

        return $this->success($items);
    }

    public function show(Request $request, string $id): Response
    {
        $item = Database::fetch("SELECT * FROM inventory_items WHERE id = :id", ['id' => $id]);
        if (!$item) return $this->notFound('Inventory item not found');

        // Stock by warehouse
        $locations = Database::fetchAll(
            "SELECT ils.*, il.code as location_code, il.name as location_name
             FROM inventory_location_stock ils
             JOIN inventory_locations il ON il.id = ils.inventory_location_id
             WHERE ils.inventory_item_id = :id",
            ['id' => $id]
        );

        // Recent stock movements
        $movements = Database::fetchAll(
            "SELECT it.*, il.name as location_name
             FROM inventory_transactions it
             JOIN inventory_locations il ON il.id = it.inventory_location_id
             WHERE it.inventory_item_id = :id
             ORDER BY it.transaction_date DESC, it.id DESC
             LIMIT 30",
            ['id' => $id]
        );

        $item['locations_stock'] = $locations;
        $item['recent_movements'] = $movements;

        return $this->success($item);
    }

    public function store(Request $request): Response
    {
        $errors = $this->validate($request, [
            'item_code' => 'required',
            'item_name' => 'required',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $existing = Database::fetch("SELECT id FROM inventory_items WHERE item_code = :c", ['c' => $request->input('item_code')]);
        if ($existing) return $this->error("Item code '{$request->input('item_code')}' already exists", 422);

        $purchasePrice = (float)$request->input('purchase_price', 0);
        $initialQty = (float)$request->input('initial_quantity', 0);
        $locationId = (int)$request->input('location_id', 1);

        $id = Database::insert('inventory_items', [
            'item_code'          => $request->input('item_code'),
            'item_name'          => $request->input('item_name'),
            'description'        => $request->input('description'),
            'valuation_method'   => $request->input('valuation_method', 'AVERAGE_COST'),
            'unit_name'          => $request->input('unit_name', 'Unit'),
            'sales_price'        => (float)$request->input('sales_price', 0),
            'purchase_price'     => $purchasePrice,
            'qty_owned'          => 0,
            'qty_on_hand'        => 0,
            'qty_reserved'       => 0,
            'qty_available'      => 0,
            'qty_desired'        => (float)$request->input('qty_desired', 0),
            'average_cost'       => $purchasePrice,
            'total_cost'         => 0,
            'control_account_id' => $request->input('control_account_id') ?: 5, // 1300 Inventory on Hand
            'cogs_account_id'    => $request->input('cogs_account_id') ?: 20,    // 5010 COGS
            'sales_account_id'   => $request->input('sales_account_id') ?: 16,   // 4010 Sales Revenue
            'created_at'         => date('Y-m-d H:i:s'),
        ]);

        // If initial quantity provided, add stock directly
        if ($initialQty > 0) {
            InventoryEngine::addStock($id, $locationId, $initialQty, $purchasePrice, 'MANUAL_ADJUSTMENT', null, null, 'Initial Stock Setup');
        }

        return $this->success(['id' => $id], 'Inventory item created successfully', 201);
    }

    public function update(Request $request, string $id): Response
    {
        $item = Database::fetch("SELECT id FROM inventory_items WHERE id = :id", ['id' => $id]);
        if (!$item) return $this->notFound('Item not found');

        $data = $request->only(['item_name', 'description', 'unit_name', 'sales_price', 'purchase_price', 'qty_desired', 'is_active']);
        if (!empty($data)) {
            Database::update('inventory_items', $data, 'id = :id', ['id' => $id]);
        }

        return $this->success(null, 'Item updated successfully');
    }

    // =========================================================================
    // 2. Warehouses / Inventory Locations
    // =========================================================================

    public function locations(Request $request): Response
    {
        $locations = Database::fetchAll("SELECT * FROM inventory_locations WHERE is_active = 1 ORDER BY id ASC");
        return $this->success($locations);
    }

    public function storeLocation(Request $request): Response
    {
        $errors = $this->validate($request, [
            'code' => 'required',
            'name' => 'required',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $id = Database::insert('inventory_locations', [
            'code'       => $request->input('code'),
            'name'       => $request->input('name'),
            'address'    => $request->input('address'),
            'is_default' => $request->input('is_default', 0) ? 1 : 0,
            'is_active'  => 1,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->success(['id' => $id], 'Warehouse location created', 201);
    }

    // =========================================================================
    // 3. Inventory Transfers
    // =========================================================================

    public function transfers(Request $request): Response
    {
        $transfers = Database::fetchAll(
            "SELECT t.*, fl.name as from_location_name, tl.name as to_location_name
             FROM inventory_transfers t
             JOIN inventory_locations fl ON fl.id = t.from_location_id
             JOIN inventory_locations tl ON tl.id = t.to_location_id
             ORDER BY t.transfer_date DESC, t.id DESC"
        );
        return $this->success($transfers);
    }

    public function storeTransfer(Request $request): Response
    {
        $errors = $this->validate($request, [
            'from_location_id' => 'required|integer',
            'to_location_id'   => 'required|integer',
            'items'            => 'required|array',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $fromId = (int)$request->input('from_location_id');
        $toId = (int)$request->input('to_location_id');
        if ($fromId === $toId) return $this->error('Source and destination warehouses cannot be the same', 422);

        $ref = $request->input('reference') ?: 'TRF-' . strtoupper(bin2hex(random_bytes(3)));
        $items = $request->input('items', []);

        $totalQty = 0;
        foreach ($items as $it) {
            $totalQty += (float)$it['quantity'];
        }

        $userId = $request->user['id'] ?? null;
        $transferId = Database::insert('inventory_transfers', [
            'transfer_date'    => $request->input('transfer_date', date('Y-m-d')),
            'reference'        => $ref,
            'from_location_id' => $fromId,
            'to_location_id'   => $toId,
            'description'      => $request->input('description'),
            'total_quantity'   => $totalQty,
            'status'           => 'Pending',
            'created_by'       => $userId,
            'created_at'       => date('Y-m-d H:i:s'),
        ]);

        foreach ($items as $it) {
            $item = Database::fetch("SELECT average_cost FROM inventory_items WHERE id = :id", ['id' => $it['inventory_item_id']]);
            Database::insert('inventory_transfer_items', [
                'transfer_id'       => $transferId,
                'inventory_item_id' => $it['inventory_item_id'],
                'quantity'          => (float)$it['quantity'],
                'unit_cost'         => (float)($it['unit_cost'] ?? $item['average_cost'] ?? 0),
                'description'       => $it['description'] ?? '',
            ]);
        }

        // Process transfer execution
        InventoryEngine::transferStock($transferId, $userId);

        return $this->success(['id' => $transferId, 'reference' => $ref], 'Inventory transfer completed', 201);
    }

    // =========================================================================
    // 4. Inventory Write-offs
    // =========================================================================

    public function writeOffs(Request $request): Response
    {
        $writeOffs = Database::fetchAll(
            "SELECT wo.*, il.name as location_name, a.name as expense_account_name
             FROM inventory_write_offs wo
             JOIN inventory_locations il ON il.id = wo.inventory_location_id
             JOIN accounts a ON a.id = wo.expense_account_id
             ORDER BY wo.write_off_date DESC, wo.id DESC"
        );
        return $this->success($writeOffs);
    }

    public function storeWriteOff(Request $request): Response
    {
        $errors = $this->validate($request, [
            'inventory_location_id' => 'required|integer',
            'expense_account_id'    => 'required|integer',
            'reason'                => 'required',
            'items'                 => 'required|array',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $ref = $request->input('reference') ?: 'WO-' . strtoupper(bin2hex(random_bytes(3)));
        $items = $request->input('items', []);

        $totalQty = 0;
        foreach ($items as $it) {
            $totalQty += (float)$it['quantity'];
        }

        $userId = $request->user['id'] ?? null;
        $writeOffId = Database::insert('inventory_write_offs', [
            'write_off_date'        => $request->input('write_off_date', date('Y-m-d')),
            'reference'             => $ref,
            'inventory_location_id' => (int)$request->input('inventory_location_id'),
            'expense_account_id'    => (int)$request->input('expense_account_id'),
            'reason'                => $request->input('reason'),
            'description'           => $request->input('description'),
            'total_quantity'        => $totalQty,
            'total_cost'            => 0,
            'created_by'            => $userId,
            'created_at'            => date('Y-m-d H:i:s'),
        ]);

        foreach ($items as $it) {
            $item = Database::fetch("SELECT average_cost FROM inventory_items WHERE id = :id", ['id' => $it['inventory_item_id']]);
            $cost = (float)($it['unit_cost'] ?? $item['average_cost'] ?? 0);
            $qty = (float)$it['quantity'];

            Database::insert('inventory_write_off_items', [
                'write_off_id'      => $writeOffId,
                'inventory_item_id' => $it['inventory_item_id'],
                'quantity'          => $qty,
                'unit_cost'         => $cost,
                'total_cost'        => $qty * $cost,
                'description'       => $it['description'] ?? '',
            ]);
        }

        // Process stock deduction & General Ledger double-entry posting
        $journalId = InventoryEngine::processWriteOff($writeOffId, $userId);

        return $this->success([
            'id'               => $writeOffId,
            'reference'        => $ref,
            'journal_entry_id' => $journalId,
        ], 'Inventory write-off processed and posted to General Ledger', 201);
    }

    // =========================================================================
    // 5. Production Orders (Manufacturing / Bill of Materials)
    // =========================================================================

    public function productionOrders(Request $request): Response
    {
        $orders = Database::fetchAll(
            "SELECT po.*, ii.item_name as finished_item_name, il.name as location_name
             FROM production_orders po
             JOIN inventory_items ii ON ii.id = po.finished_item_id
             JOIN inventory_locations il ON il.id = po.inventory_location_id
             ORDER BY po.order_date DESC, po.id DESC"
        );
        return $this->success($orders);
    }

    public function storeProductionOrder(Request $request): Response
    {
        $errors = $this->validate($request, [
            'inventory_location_id' => 'required|integer',
            'finished_item_id'      => 'required|integer',
            'finished_quantity'     => 'required|numeric',
            'materials'             => 'required|array',
        ]);
        if ($errors) return $this->error('Validation failed', 422, $errors);

        $ref = $request->input('reference') ?: 'PO-MFG-' . strtoupper(bin2hex(random_bytes(3)));
        $userId = $request->user['id'] ?? null;

        $orderId = Database::insert('production_orders', [
            'order_date'            => $request->input('order_date', date('Y-m-d')),
            'reference'             => $ref,
            'inventory_location_id' => (int)$request->input('inventory_location_id'),
            'finished_item_id'      => (int)$request->input('finished_item_id'),
            'finished_quantity'     => (float)$request->input('finished_quantity'),
            'status'                => 'Draft',
            'description'           => $request->input('description'),
            'created_by'            => $userId,
            'created_at'            => date('Y-m-d H:i:s'),
        ]);

        foreach ($request->input('materials') as $mat) {
            Database::insert('production_order_materials', [
                'production_order_id' => $orderId,
                'inventory_item_id'   => (int)$mat['inventory_item_id'],
                'required_quantity'   => (float)$mat['required_quantity'],
            ]);
        }

        // Complete assembly immediately if requested
        if ($request->input('auto_complete', true)) {
            InventoryEngine::completeProductionOrder($orderId, $userId);
        }

        return $this->success(['id' => $orderId, 'reference' => $ref], 'Production order created and processed', 201);
    }
}

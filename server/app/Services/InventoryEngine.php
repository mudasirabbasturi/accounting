<?php
namespace App\Services;

use Core\Database;

class InventoryEngine
{
    /**
     * Add inventory stock (e.g. from Goods Receipt, Purchase, or Return)
     */
    public static function addStock(
        int $itemId,
        int $locationId,
        float $quantity,
        float $unitCost,
        string $transactionType = 'GOODS_RECEIPT',
        ?string $referenceType = null,
        ?int $referenceId = null,
        string $notes = '',
        ?int $batchId = null,
        ?string $batchNumber = null,
        ?string $serialNumber = null
    ): void {
        Database::transaction(function () use ($itemId, $locationId, $quantity, $unitCost, $transactionType, $referenceType, $referenceId, $notes, $batchId, $batchNumber, $serialNumber) {
            $item = Database::fetch("SELECT * FROM inventory_items WHERE id = :id FOR UPDATE", ['id' => $itemId]);
            if (!$item) throw new \Exception("Inventory item #{$itemId} not found");

            $currentQty = (float)$item['qty_on_hand'];
            $currentAvgCost = (float)$item['average_cost'];

            // Weighted Average Cost Calculation
            $newTotalQty = $currentQty + $quantity;
            $newAvgCost = ($newTotalQty > 0)
                ? (($currentQty * $currentAvgCost) + ($quantity * $unitCost)) / $newTotalQty
                : $unitCost;

            $newTotalCost = $newTotalQty * $newAvgCost;

            // 1. Update overall inventory item
            Database::update('inventory_items', [
                'qty_on_hand'   => $newTotalQty,
                'qty_owned'     => (float)$item['qty_owned'] + $quantity,
                'qty_available' => $newTotalQty - (float)$item['qty_reserved'],
                'average_cost'  => $newAvgCost,
                'total_cost'    => $newTotalCost,
            ], 'id = :id', ['id' => $itemId]);

            // 2. Update location stock
            self::updateLocationStock($itemId, $locationId, $quantity, 0);

            // 3. Handle Batch tracking if enabled or batch provided
            $resolvedBatchId = $batchId;
            if ($batchNumber) {
                $batch = Database::fetch(
                    "SELECT id FROM inventory_batches WHERE inventory_item_id = :item_id AND batch_number = :batch AND inventory_location_id = :loc_id",
                    ['item_id' => $itemId, 'batch' => $batchNumber, 'loc_id' => $locationId]
                );
                if ($batch) {
                    $resolvedBatchId = (int)$batch['id'];
                    Database::query(
                        "UPDATE inventory_batches SET quantity_on_hand = quantity_on_hand + :qty WHERE id = :id",
                        ['qty' => $quantity, 'id' => $resolvedBatchId]
                    );
                } else {
                    $resolvedBatchId = Database::insert('inventory_batches', [
                        'inventory_item_id'     => $itemId,
                        'batch_number'          => $batchNumber,
                        'inventory_location_id' => $locationId,
                        'quantity_on_hand'      => $quantity,
                        'unit_cost'             => $unitCost,
                        'status'                => 'Available',
                        'created_at'            => date('Y-m-d H:i:s'),
                    ]);
                }
            }

            // 4. Handle Serial Number tracking
            if ($serialNumber) {
                Database::insert('inventory_serials', [
                    'inventory_item_id'     => $itemId,
                    'serial_number'         => $serialNumber,
                    'batch_id'              => $resolvedBatchId,
                    'inventory_location_id' => $locationId,
                    'status'                => 'In Stock',
                    'created_at'            => date('Y-m-d H:i:s'),
                ]);
            }

            // 5. Record transaction log
            Database::insert('inventory_transactions', [
                'transaction_date'      => date('Y-m-d'),
                'inventory_item_id'     => $itemId,
                'inventory_location_id' => $locationId,
                'batch_id'              => $resolvedBatchId,
                'transaction_type'      => $transactionType,
                'reference_type'        => $referenceType,
                'reference_id'          => $referenceId,
                'qty_change'            => $quantity,
                'unit_cost'             => $unitCost,
                'total_cost'            => $quantity * $unitCost,
                'balance_after'         => $newTotalQty,
                'notes'                 => $notes,
            ]);
        });
    }

    /**
     * Deduct inventory stock (e.g. from Delivery Note, Sales, or Write-off)
     */
    public static function deductStock(
        int $itemId,
        int $locationId,
        float $quantity,
        string $transactionType = 'DELIVERY_NOTE',
        ?string $referenceType = null,
        ?int $referenceId = null,
        string $notes = '',
        ?int $batchId = null,
        ?string $serialNumber = null
    ): float {
        return Database::transaction(function () use ($itemId, $locationId, $quantity, $transactionType, $referenceType, $referenceId, $notes, $batchId, $serialNumber) {
            $item = Database::fetch("SELECT * FROM inventory_items WHERE id = :id FOR UPDATE", ['id' => $itemId]);
            if (!$item) throw new \Exception("Inventory item #{$itemId} not found");

            $currentQty = (float)$item['qty_on_hand'];
            $unitCost = (float)$item['average_cost'];

            $newTotalQty = max(0.0, $currentQty - $quantity);
            $newTotalCost = $newTotalQty * $unitCost;

            // 1. Update overall inventory item
            Database::update('inventory_items', [
                'qty_on_hand'   => $newTotalQty,
                'qty_owned'     => max(0.0, (float)$item['qty_owned'] - $quantity),
                'qty_available' => max(0.0, $newTotalQty - (float)$item['qty_reserved']),
                'total_cost'    => $newTotalCost,
            ], 'id = :id', ['id' => $itemId]);

            // 2. Update location stock
            self::updateLocationStock($itemId, $locationId, -$quantity, 0);

            // 3. Update Batch stock if specified
            if ($batchId) {
                Database::query(
                    "UPDATE inventory_batches SET quantity_on_hand = GREATEST(0, quantity_on_hand - :qty) WHERE id = :id",
                    ['qty' => $quantity, 'id' => $batchId]
                );
            }

            // 4. Update Serial status if specified
            if ($serialNumber) {
                Database::update('inventory_serials', ['status' => 'Delivered'], 'serial_number = :sn', ['sn' => $serialNumber]);
            }

            // 5. Record transaction log
            Database::insert('inventory_transactions', [
                'transaction_date'      => date('Y-m-d'),
                'inventory_item_id'     => $itemId,
                'inventory_location_id' => $locationId,
                'batch_id'              => $batchId,
                'transaction_type'      => $transactionType,
                'reference_type'        => $referenceType,
                'reference_id'          => $referenceId,
                'qty_change'            => -$quantity,
                'unit_cost'             => $unitCost,
                'total_cost'            => $quantity * $unitCost,
                'balance_after'         => $newTotalQty,
                'notes'                 => $notes,
            ]);

            return $unitCost;
        });
    }

    /**
     * Helper to upsert location-level stock counts
     */
    public static function updateLocationStock(int $itemId, int $locationId, float $qtyOnHandChange, float $qtyReservedChange): void
    {
        $existing = Database::fetch(
            "SELECT id, qty_on_hand, qty_reserved FROM inventory_location_stock
             WHERE inventory_item_id = :item_id AND inventory_location_id = :loc_id",
            ['item_id' => $itemId, 'loc_id' => $locationId]
        );

        if ($existing) {
            Database::update('inventory_location_stock', [
                'qty_on_hand'  => max(0.0, (float)$existing['qty_on_hand'] + $qtyOnHandChange),
                'qty_reserved' => max(0.0, (float)$existing['qty_reserved'] + $qtyReservedChange),
            ], 'id = :id', ['id' => $existing['id']]);
        } else {
            Database::insert('inventory_location_stock', [
                'inventory_item_id'     => $itemId,
                'inventory_location_id' => $locationId,
                'qty_on_hand'           => max(0.0, $qtyOnHandChange),
                'qty_reserved'          => max(0.0, $qtyReservedChange),
            ]);
        }
    }

    /**
     * Inter-warehouse stock transfer
     */
    public static function transferStock(int $transferId, ?int $userId = null): void
    {
        $transfer = Database::fetch("SELECT * FROM inventory_transfers WHERE id = :id", ['id' => $transferId]);
        if (!$transfer) throw new \Exception("Transfer not found");

        $items = Database::fetchAll("SELECT * FROM inventory_transfer_items WHERE transfer_id = :id", ['id' => $transferId]);

        Database::transaction(function () use ($transfer, $items, $transferId) {
            foreach ($items as $item) {
                $qty = (float)$item['quantity'];
                $cost = (float)$item['unit_cost'];

                self::updateLocationStock($item['inventory_item_id'], $transfer['from_location_id'], -$qty, 0);
                self::updateLocationStock($item['inventory_item_id'], $transfer['to_location_id'], $qty, 0);

                Database::insert('inventory_transactions', [
                    'transaction_date'      => $transfer['transfer_date'],
                    'inventory_item_id'     => $item['inventory_item_id'],
                    'inventory_location_id' => $transfer['from_location_id'],
                    'transaction_type'      => 'TRANSFER_OUT',
                    'reference_type'        => 'INVENTORY_TRANSFER',
                    'reference_id'          => $transferId,
                    'qty_change'            => -$qty,
                    'unit_cost'             => $cost,
                    'total_cost'            => $qty * $cost,
                    'balance_after'         => 0,
                    'notes'                 => "Transfer to Location #{$transfer['to_location_id']}",
                ]);

                Database::insert('inventory_transactions', [
                    'transaction_date'      => $transfer['transfer_date'],
                    'inventory_item_id'     => $item['inventory_item_id'],
                    'inventory_location_id' => $transfer['to_location_id'],
                    'transaction_type'      => 'TRANSFER_IN',
                    'reference_type'        => 'INVENTORY_TRANSFER',
                    'reference_id'          => $transferId,
                    'qty_change'            => $qty,
                    'unit_cost'             => $cost,
                    'total_cost'            => $qty * $cost,
                    'balance_after'         => 0,
                    'notes'                 => "Transfer from Location #{$transfer['from_location_id']}",
                ]);
            }

            Database::update('inventory_transfers', ['status' => 'Completed'], 'id = :id', ['id' => $transferId]);
        });
    }

    /**
     * Process Inventory Write-off with double-entry general ledger posting
     */
    public static function processWriteOff(int $writeOffId, ?int $userId = null): int
    {
        $writeOff = Database::fetch("SELECT * FROM inventory_write_offs WHERE id = :id", ['id' => $writeOffId]);
        if (!$writeOff) throw new \Exception("Inventory write-off record not found");

        $items = Database::fetchAll("SELECT * FROM inventory_write_off_items WHERE write_off_id = :id", ['id' => $writeOffId]);

        $totalCost = 0.0;
        foreach ($items as $item) {
            $qty = (float)$item['quantity'];
            $cost = self::deductStock(
                $item['inventory_item_id'],
                $writeOff['inventory_location_id'],
                $qty,
                'WRITE_OFF',
                'INVENTORY_WRITE_OFF',
                $writeOffId,
                $writeOff['reason']
            );
            $totalCost += ($qty * $cost);
        }

        // Post Journal Entry: DR 5020 Inventory Shrinkage Expense, CR 1300 Inventory on Hand
        $expenseAccountId = $writeOff['expense_account_id'] ?: 27;
        $invAccount = Database::fetch("SELECT id FROM accounts WHERE control_type = 'INVENTORY' LIMIT 1");
        $invAccountId = $invAccount ? $invAccount['id'] : 7;

        $journalId = AccountingEngine::postJournalEntry([
            'entry_number' => 'JE-WO-' . $writeOff['reference'],
            'entry_date'   => $writeOff['write_off_date'],
            'reference'    => $writeOff['reference'],
            'narration'    => "Inventory write-off: {$writeOff['reason']}",
            'source_type'  => 'INVENTORY_WRITE_OFF',
            'source_id'    => $writeOffId,
        ], [
            [
                'account_id'  => $expenseAccountId,
                'description' => "Inventory Loss: {$writeOff['reason']}",
                'debit'       => $totalCost,
                'credit'      => 0,
            ],
            [
                'account_id'  => $invAccountId,
                'description' => "Inventory write-down",
                'debit'       => 0,
                'credit'      => $totalCost,
            ]
        ], $userId);

        Database::update('inventory_write_offs', [
            'total_cost'       => $totalCost,
            'journal_entry_id' => $journalId,
        ], 'id = :id', ['id' => $writeOffId]);

        return $journalId;
    }
}

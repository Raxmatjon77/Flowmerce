import { Selectable } from 'kysely';
import {
  InventoryItem,
  Sku,
  Quantity,
  Reservation,
} from '@inventory/domain';
import { InventoryItemTable, ReservationTable } from '../tables/inventory.table';

export class InventoryItemMapper {
  static toDomain(row: Selectable<InventoryItemTable>): InventoryItem {
    return InventoryItem.reconstitute(row.id, {
      sku: Sku.create(row.sku),
      productName: row.product_name,
      totalQuantity: Quantity.create(row.total_quantity),
      reservedQuantity: Quantity.create(row.reserved_quantity),
    });
  }

  static toPersistence(
    entity: InventoryItem,
  ): Omit<InventoryItemTable, 'created_at' | 'updated_at'> {
    return {
      id: entity.id,
      sku: entity.sku.value,
      product_name: entity.productName,
      total_quantity: entity.totalQuantity.value,
      reserved_quantity: entity.reservedQuantity.value,
    };
  }
}

export class ReservationMapper {
  static toDomain(row: Selectable<ReservationTable>): Reservation {
    return Reservation.reconstitute(row.id, {
      inventoryItemId: row.inventory_item_id,
      orderId: row.order_id,
      quantity: row.quantity,
      expiresAt: new Date(row.expires_at),
      released: row.released,
    });
  }

  static toPersistence(
    entity: Reservation,
  ): Omit<ReservationTable, 'created_at'> {
    return {
      id: entity.id,
      inventory_item_id: entity.inventoryItemId,
      order_id: entity.orderId,
      quantity: entity.quantity,
      expires_at: entity.expiresAt,
      released: entity.released,
    };
  }
}

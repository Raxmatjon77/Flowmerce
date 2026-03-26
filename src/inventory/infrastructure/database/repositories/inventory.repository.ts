import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import {
  IInventoryRepository,
  InventoryItem,
  Sku,
  Quantity,
} from '@inventory/domain';
import {
  InventoryDatabase,
  KYSELY_INVENTORY_DB,
} from '../tables/inventory.table';
import { InventoryItemMapper } from '../mappers/inventory.mapper';

@Injectable()
export class KyselyInventoryRepository implements IInventoryRepository {
  constructor(
    @Inject(KYSELY_INVENTORY_DB)
    private readonly db: Kysely<InventoryDatabase>,
  ) {}

  async save(item: InventoryItem): Promise<void> {
    const record = InventoryItemMapper.toPersistence(item);

    await this.db
      .insertInto('inventory_items')
      .values(record)
      .onConflict((oc) =>
        oc.column('id').doUpdateSet({
          sku: record.sku,
          product_name: record.product_name,
          total_quantity: record.total_quantity,
          reserved_quantity: record.reserved_quantity,
          updated_at: new Date(),
        }),
      )
      .execute();
  }

  async findById(id: string): Promise<InventoryItem | null> {
    const row = await this.db
      .selectFrom('inventory_items')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!row) return null;

    return InventoryItemMapper.toDomain(row);
  }

  async findBySku(sku: Sku): Promise<InventoryItem | null> {
    const row = await this.db
      .selectFrom('inventory_items')
      .selectAll()
      .where('sku', '=', sku.value)
      .executeTakeFirst();

    if (!row) return null;

    return InventoryItemMapper.toDomain(row);
  }

  async updateQuantities(
    id: string,
    totalQuantity: Quantity,
    reservedQuantity: Quantity,
  ): Promise<void> {
    await this.db
      .updateTable('inventory_items')
      .set({
        total_quantity: totalQuantity.value,
        reserved_quantity: reservedQuantity.value,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .execute();
  }
}

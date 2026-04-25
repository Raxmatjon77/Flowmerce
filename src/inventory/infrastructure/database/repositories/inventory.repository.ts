import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import {
  IInventoryRepository,
  InventoryFindAllParams,
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
          unit_price: record.unit_price,
          updated_at: new Date(),
        }),
      )
      .execute();
  }

  async findAll(): Promise<InventoryItem[]> {
    const rows = await this.db
      .selectFrom('inventory_items')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    return rows.map(InventoryItemMapper.toDomain);
  }

  async findAllPaginated(
    params: InventoryFindAllParams,
  ): Promise<{ items: InventoryItem[]; total: number }> {
    const limit = params.limit ?? 20;
    const page = params.page ?? 1;
    const offset = (page - 1) * limit;

    const [rows, countRow] = await Promise.all([
      this.db
        .selectFrom('inventory_items')
        .selectAll()
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset)
        .execute(),
      this.db
        .selectFrom('inventory_items')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .executeTakeFirstOrThrow(),
    ]);

    return {
      items: rows.map(InventoryItemMapper.toDomain),
      total: Number(countRow.count),
    };
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

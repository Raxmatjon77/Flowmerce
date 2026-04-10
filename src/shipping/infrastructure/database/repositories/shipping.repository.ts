import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import {
  IShipmentRepository,
  Shipment,
  ShipmentStatus,
} from '@shipping/domain';
import {
  ShippingDatabase,
  KYSELY_SHIPPING_DB,
} from '../tables/shipping.table';
import { ShipmentMapper } from '../mappers/shipping.mapper';

@Injectable()
export class KyselyShipmentRepository implements IShipmentRepository {
  constructor(
    @Inject(KYSELY_SHIPPING_DB)
    private readonly db: Kysely<ShippingDatabase>,
  ) {}

  async save(shipment: Shipment): Promise<void> {
    const record = ShipmentMapper.toPersistence(shipment);

    await this.db
      .insertInto('shipments')
      .values(record)
      .onConflict((oc) =>
        oc.column('id').doUpdateSet({
          order_id: record.order_id,
          tracking_number: record.tracking_number,
          carrier_name: record.carrier_name,
          carrier_code: record.carrier_code,
          status: record.status,
          shipping_street: record.shipping_street,
          shipping_city: record.shipping_city,
          shipping_state: record.shipping_state,
          shipping_zip: record.shipping_zip,
          shipping_country: record.shipping_country,
          estimated_delivery: record.estimated_delivery,
          updated_at: new Date(),
        }),
      )
      .execute();
  }

  async findAll(): Promise<Shipment[]> {
    const rows = await this.db
      .selectFrom('shipments')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    return rows.map(ShipmentMapper.toDomain);
  }

  async findById(id: string): Promise<Shipment | null> {
    const row = await this.db
      .selectFrom('shipments')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!row) return null;

    return ShipmentMapper.toDomain(row);
  }

  async findByOrderId(orderId: string): Promise<Shipment | null> {
    const row = await this.db
      .selectFrom('shipments')
      .selectAll()
      .where('order_id', '=', orderId)
      .executeTakeFirst();

    if (!row) return null;

    return ShipmentMapper.toDomain(row);
  }

  async updateStatus(id: string, status: ShipmentStatus): Promise<void> {
    await this.db
      .updateTable('shipments')
      .set({
        status: status.value,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .execute();
  }
}

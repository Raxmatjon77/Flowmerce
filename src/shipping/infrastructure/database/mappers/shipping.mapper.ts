import { Selectable } from 'kysely';
import {
  Shipment,
  TrackingNumber,
  Carrier,
  ShipmentStatus,
  ShipmentStatusEnum,
} from '@shipping/domain';
import { ShipmentTable } from '../tables/shipping.table';

export class ShipmentMapper {
  static toDomain(row: Selectable<ShipmentTable>): Shipment {
    return Shipment.reconstitute(row.id, {
      orderId: row.order_id,
      trackingNumber: row.tracking_number
        ? TrackingNumber.create(row.tracking_number)
        : null,
      carrier:
        row.carrier_name && row.carrier_code
          ? Carrier.create(row.carrier_name, row.carrier_code)
          : null,
      status: ShipmentStatus.create(row.status as ShipmentStatusEnum),
      shippingAddress: {
        street: row.shipping_street,
        city: row.shipping_city,
        state: row.shipping_state,
        zip: row.shipping_zip,
        country: row.shipping_country,
      },
      estimatedDelivery: row.estimated_delivery
        ? new Date(row.estimated_delivery)
        : null,
    });
  }

  static toPersistence(
    entity: Shipment,
  ): Omit<ShipmentTable, 'created_at' | 'updated_at'> {
    return {
      id: entity.id,
      order_id: entity.orderId,
      tracking_number: entity.trackingNumber?.value ?? null,
      carrier_name: entity.carrier?.name ?? null,
      carrier_code: entity.carrier?.code ?? null,
      status: entity.status.value,
      shipping_street: entity.shippingAddress.street,
      shipping_city: entity.shippingAddress.city,
      shipping_state: entity.shippingAddress.state,
      shipping_zip: entity.shippingAddress.zip,
      shipping_country: entity.shippingAddress.country,
      estimated_delivery: entity.estimatedDelivery,
    };
  }
}

import { DomainEvent } from '@shared/domain';

export class ShipmentDeliveredEvent extends DomainEvent {
  constructor(
    public readonly shipmentId: string,
    public readonly orderId: string,
    public readonly deliveredAt: Date,
  ) {
    super(shipmentId, 'shipment.delivered');
  }

  toPrimitives(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      shipmentId: this.shipmentId,
      orderId: this.orderId,
      deliveredAt: this.deliveredAt.toISOString(),
    };
  }
}

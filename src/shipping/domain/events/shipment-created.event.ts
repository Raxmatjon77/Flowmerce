import { DomainEvent } from '@shared/domain';

export class ShipmentCreatedEvent extends DomainEvent {
  constructor(
    public readonly shipmentId: string,
    public readonly orderId: string,
  ) {
    super(shipmentId, 'shipment.created');
  }

  toPrimitives(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      shipmentId: this.shipmentId,
      orderId: this.orderId,
    };
  }
}

import { DomainEvent } from '@shared/domain';
import { ShippingEventType } from '@shared/infrastructure/kafka';

export class ShipmentDeliveredEvent extends DomainEvent {
  constructor(
    public readonly shipmentId: string,
    public readonly orderId: string,
    public readonly deliveredAt: Date,
  ) {
    super(shipmentId, ShippingEventType.DELIVERED);
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

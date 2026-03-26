import { DomainEvent } from '@shared/domain';

export class InventoryReleasedEvent extends DomainEvent {
  constructor(
    public readonly inventoryItemId: string,
    public readonly orderId: string,
    public readonly quantity: number,
  ) {
    super(inventoryItemId, 'inventory.released');
  }

  toPrimitives(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      inventoryItemId: this.inventoryItemId,
      orderId: this.orderId,
      quantity: this.quantity,
    };
  }
}

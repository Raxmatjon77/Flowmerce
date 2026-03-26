import { DomainEvent } from '@shared/domain';

export class InventoryDeductedEvent extends DomainEvent {
  constructor(
    public readonly inventoryItemId: string,
    public readonly quantity: number,
  ) {
    super(inventoryItemId, 'inventory.deducted');
  }

  toPrimitives(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      inventoryItemId: this.inventoryItemId,
      quantity: this.quantity,
    };
  }
}

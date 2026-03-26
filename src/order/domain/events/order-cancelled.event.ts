import { DomainEvent } from '../../../shared/domain/domain-event.base';

export class OrderCancelledEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly customerId: string,
  ) {
    super(aggregateId, 'OrderCancelled');
  }

  toPrimitives(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      eventType: this.eventType,
      customerId: this.customerId,
    };
  }
}

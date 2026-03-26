import { DomainEvent } from '../../../shared/domain/domain-event.base';

export class OrderCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
    public readonly currency: string,
  ) {
    super(aggregateId, 'OrderCreated');
  }

  toPrimitives(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      eventType: this.eventType,
      customerId: this.customerId,
      totalAmount: this.totalAmount,
      currency: this.currency,
    };
  }
}

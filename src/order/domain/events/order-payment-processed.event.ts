import { DomainEvent } from '../../../shared/domain/domain-event.base';

export class OrderPaymentProcessedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly amount: number,
    public readonly currency: string,
  ) {
    super(aggregateId, 'OrderPaymentProcessed');
  }

  toPrimitives(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      eventType: this.eventType,
      amount: this.amount,
      currency: this.currency,
    };
  }
}

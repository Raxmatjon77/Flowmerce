import { DomainEvent } from '../../../shared/domain/domain-event.base';

export class PaymentProcessedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly orderId: string,
    public readonly transactionId: string,
    public readonly amount: number,
    public readonly currency: string,
  ) {
    super(aggregateId, 'PaymentProcessed');
  }

  toPrimitives(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      eventType: this.eventType,
      orderId: this.orderId,
      transactionId: this.transactionId,
      amount: this.amount,
      currency: this.currency,
    };
  }
}

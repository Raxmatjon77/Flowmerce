import { DomainEvent } from '../../../shared/domain/domain-event.base';

export class PaymentRefundedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly orderId: string,
    public readonly amount: number,
    public readonly currency: string,
  ) {
    super(aggregateId, 'PaymentRefunded');
  }

  toPrimitives(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      eventType: this.eventType,
      orderId: this.orderId,
      amount: this.amount,
      currency: this.currency,
    };
  }
}

import { DomainEvent } from '../../../shared/domain/domain-event.base';

export class PaymentFailedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly orderId: string,
    public readonly reason: string,
  ) {
    super(aggregateId, 'PaymentFailed');
  }

  toPrimitives(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      eventType: this.eventType,
      orderId: this.orderId,
      reason: this.reason,
    };
  }
}

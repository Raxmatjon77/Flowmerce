import { DomainEvent } from '../../../shared/domain/domain-event.base';

export class OrderInventoryReservedEvent extends DomainEvent {
  constructor(aggregateId: string) {
    super(aggregateId, 'OrderInventoryReserved');
  }

  toPrimitives(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      eventType: this.eventType,
    };
  }
}

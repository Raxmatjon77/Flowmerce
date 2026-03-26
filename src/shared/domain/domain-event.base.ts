import { v4 as uuidv4 } from 'uuid';

export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string,
  ) {
    this.eventId = uuidv4();
    this.occurredOn = new Date();
  }

  abstract toPrimitives(): Record<string, unknown>;
}

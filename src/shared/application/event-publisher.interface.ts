import { DomainEvent } from '@shared/domain';

export const EVENT_PUBLISHER = Symbol('IEventPublisher');

export interface IEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}

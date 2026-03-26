import { DomainEvent } from '@shared/domain';

export class NotificationSentEvent extends DomainEvent {
  constructor(
    public readonly notificationId: string,
    public readonly recipientId: string,
    public readonly channel: string,
    public readonly type: string,
  ) {
    super(notificationId, 'notification.sent');
  }

  toPrimitives(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      notificationId: this.notificationId,
      recipientId: this.recipientId,
      channel: this.channel,
      type: this.type,
    };
  }
}

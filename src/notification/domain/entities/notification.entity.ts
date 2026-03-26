import { AggregateRoot } from '@shared/domain';
import { NotificationChannel } from '../value-objects/notification-channel.value-object';
import { NotificationType } from '../value-objects/notification-type.value-object';
import { NotificationStatus } from '../value-objects/notification-status.value-object';
import { NotificationAlreadySentError } from '../errors/notification-domain.errors';
import { NotificationSentEvent } from '../events/notification-sent.event';

export interface NotificationProps {
  recipientId: string;
  channel: NotificationChannel;
  type: NotificationType;
  status: NotificationStatus;
  subject: string;
  body: string;
  metadata: Record<string, unknown>;
  failureReason?: string;
}

export class Notification extends AggregateRoot {
  private _recipientId: string;
  private _channel: NotificationChannel;
  private _type: NotificationType;
  private _status: NotificationStatus;
  private _subject: string;
  private _body: string;
  private _metadata: Record<string, unknown>;
  private _failureReason?: string;

  private constructor(id: string, props: NotificationProps) {
    super(id);
    this._recipientId = props.recipientId;
    this._channel = props.channel;
    this._type = props.type;
    this._status = props.status;
    this._subject = props.subject;
    this._body = props.body;
    this._metadata = { ...props.metadata };
    this._failureReason = props.failureReason;
  }

  static create(
    id: string,
    recipientId: string,
    channel: NotificationChannel,
    type: NotificationType,
    subject: string,
    body: string,
    metadata: Record<string, unknown> = {},
  ): Notification {
    return new Notification(id, {
      recipientId,
      channel,
      type,
      status: NotificationStatus.PENDING,
      subject,
      body,
      metadata,
    });
  }

  static reconstitute(id: string, props: NotificationProps): Notification {
    return new Notification(id, props);
  }

  get recipientId(): string {
    return this._recipientId;
  }

  get channel(): NotificationChannel {
    return this._channel;
  }

  get type(): NotificationType {
    return this._type;
  }

  get status(): NotificationStatus {
    return this._status;
  }

  get subject(): string {
    return this._subject;
  }

  get body(): string {
    return this._body;
  }

  get metadata(): Readonly<Record<string, unknown>> {
    return this._metadata;
  }

  get failureReason(): string | undefined {
    return this._failureReason;
  }

  markSent(): void {
    if (this._status === NotificationStatus.SENT) {
      throw new NotificationAlreadySentError(this.id);
    }

    this._status = NotificationStatus.SENT;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new NotificationSentEvent(
        this.id,
        this._recipientId,
        this._channel,
        this._type,
      ),
    );
  }

  markFailed(reason: string): void {
    if (this._status === NotificationStatus.SENT) {
      throw new NotificationAlreadySentError(this.id);
    }

    this._status = NotificationStatus.FAILED;
    this._failureReason = reason;
    this._updatedAt = new Date();
  }
}

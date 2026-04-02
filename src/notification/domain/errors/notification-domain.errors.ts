import { DomainError } from '../../../shared/domain/domain-error.base';
import { ERROR_CODES } from '../../../shared/domain/error-codes';

export class NotificationNotFoundError extends DomainError {
  readonly code = ERROR_CODES.NOTIFICATION_NOT_FOUND;
  readonly httpStatus = 404;

  constructor(public readonly identifier: string) {
    super(`Notification not found: ${identifier}`);
  }
}

export class NotificationAlreadySentError extends DomainError {
  readonly code = ERROR_CODES.NOTIFICATION_ALREADY_SENT;
  readonly httpStatus = 409;

  constructor(public readonly notificationId: string) {
    super(`Notification ${notificationId} has already been sent`);
  }
}

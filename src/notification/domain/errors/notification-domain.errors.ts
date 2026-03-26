export class NotificationNotFoundError extends Error {
  constructor(public readonly identifier: string) {
    super(`Notification not found: ${identifier}`);
    this.name = 'NotificationNotFoundError';
  }
}

export class NotificationAlreadySentError extends Error {
  constructor(public readonly notificationId: string) {
    super(`Notification ${notificationId} has already been sent`);
    this.name = 'NotificationAlreadySentError';
  }
}

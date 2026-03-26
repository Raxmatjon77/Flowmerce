import { Injectable, Logger } from '@nestjs/common';
import {
  INotificationSender,
  NotificationSendResult,
} from '@notification/application/ports/notification-sender.port';

@Injectable()
export class MockNotificationSender implements INotificationSender {
  private readonly logger = new Logger(MockNotificationSender.name);

  async send(
    channel: string,
    recipient: string,
    subject: string,
    body: string,
  ): Promise<NotificationSendResult> {
    this.logger.log(
      `[MOCK] Sending ${channel} notification to ${recipient}`,
    );
    this.logger.log(`[MOCK] Subject: ${subject}`);
    this.logger.log(`[MOCK] Body: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`);

    return { success: true };
  }
}

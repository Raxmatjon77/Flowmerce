import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  Inject,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SendNotificationUseCase } from '@notification/application/use-cases/send-notification/send-notification.use-case';
import { GetNotificationsUseCase } from '@notification/application/use-cases/get-notifications/get-notifications.use-case';
import { NOTIFICATION_USE_CASE_TOKENS } from '@notification/application/injection-tokens';
import { NotificationResponseDto } from '@notification/application/dtos/notification-response.dto';
import { SendNotificationRequest } from '../dto/send-notification.request';

@Controller('api/v1/notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    @Inject(NOTIFICATION_USE_CASE_TOKENS.SEND)
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    @Inject(NOTIFICATION_USE_CASE_TOKENS.GET)
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async sendNotification(
    @Body() request: SendNotificationRequest,
  ): Promise<NotificationResponseDto> {
    this.logger.log(
      `Sending ${request.channel} notification to ${request.recipientId}`,
    );

    return this.sendNotificationUseCase.execute({
      recipientId: request.recipientId,
      channel: request.channel,
      type: request.type,
      subject: request.subject,
      body: request.body,
      metadata: request.metadata,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getNotifications(
    @Query('recipientId') recipientId: string,
  ): Promise<NotificationResponseDto[]> {
    this.logger.log(`Getting notifications for recipient ${recipientId}`);
    return this.getNotificationsUseCase.execute({ recipientId });
  }
}

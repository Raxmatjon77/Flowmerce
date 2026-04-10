import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsObject,
} from 'class-validator';
import { NotificationChannel, NotificationType } from '@notification/domain';

export class SendNotificationRequest {
  @IsString()
  @IsNotEmpty()
  recipientId!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(NotificationChannel))
  channel!: NotificationChannel;

  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(NotificationType))
  type!: NotificationType;

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsObject,
} from 'class-validator';

export class SendNotificationRequest {
  @IsString()
  @IsNotEmpty()
  recipientId!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['EMAIL', 'SMS', 'PUSH'])
  channel!: 'EMAIL' | 'SMS' | 'PUSH';

  @IsString()
  @IsNotEmpty()
  @IsIn([
    'ORDER_CONFIRMED',
    'ORDER_SHIPPED',
    'ORDER_DELIVERED',
    'PAYMENT_FAILED',
    'PAYMENT_REFUNDED',
  ])
  type!:
    | 'ORDER_CONFIRMED'
    | 'ORDER_SHIPPED'
    | 'ORDER_DELIVERED'
    | 'PAYMENT_FAILED'
    | 'PAYMENT_REFUNDED';

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

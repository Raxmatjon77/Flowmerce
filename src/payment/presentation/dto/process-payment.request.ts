import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';

export class PaymentMethodRequest {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsNotEmpty()
  last4Digits!: string;

  @IsNumber()
  @Min(1)
  @Max(12)
  expiryMonth!: number;

  @IsNumber()
  @Min(2024)
  expiryYear!: number;
}

export class ProcessPaymentRequest {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsOptional()
  currency: string = 'USD';

  @ValidateNested()
  @Type(() => PaymentMethodRequest)
  method!: PaymentMethodRequest;
}

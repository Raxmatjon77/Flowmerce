import { Type, Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsPositive,
  ValidateNested,
  ArrayMinSize,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateOrderItemRequest {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @IsPositive()
  unitPrice!: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value || 'USD')
  currency: string = 'USD';
}

export class CreateOrderShippingAddressRequest {
  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsNotEmpty()
  zipCode!: string;

  @IsString()
  @IsNotEmpty()
  country!: string;
}

export class CreateOrderRequest {
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemRequest)
  items!: CreateOrderItemRequest[];

  @ValidateNested()
  @Type(() => CreateOrderShippingAddressRequest)
  shippingAddress!: CreateOrderShippingAddressRequest;
}

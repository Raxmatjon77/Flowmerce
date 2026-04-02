import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  Min,
} from 'class-validator';

export class ReserveInventoryItemRequest {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity!: number;
}

export class ReserveInventoryRequest {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReserveInventoryItemRequest)
  items!: ReserveInventoryItemRequest[];
}

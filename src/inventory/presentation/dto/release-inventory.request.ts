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

export class ReleaseInventoryItemRequest {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity!: number;
}

export class ReleaseInventoryRequest {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReleaseInventoryItemRequest)
  items!: ReleaseInventoryItemRequest[];
}

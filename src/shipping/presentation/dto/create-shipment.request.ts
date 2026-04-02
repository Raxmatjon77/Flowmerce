import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';

export class ShipmentAddressRequest {
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

export class CreateShipmentRequest {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ValidateNested()
  @Type(() => ShipmentAddressRequest)
  address!: ShipmentAddressRequest;
}

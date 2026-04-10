import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ShipmentStatusEnum } from '@shipping/domain';

export class UpdateShipmentStatusRequest {
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(ShipmentStatusEnum))
  status!: ShipmentStatusEnum;
}

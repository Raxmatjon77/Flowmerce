import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateShipmentStatusRequest {
  @IsString()
  @IsNotEmpty()
  @IsIn(['PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'])
  status!: string;
}

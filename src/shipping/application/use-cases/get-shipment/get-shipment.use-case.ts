import { IUseCase } from '@shared/application';
import {
  IShipmentRepository,
  ShipmentNotFoundError,
} from '@shipping/domain';
import { ShipmentResponseDto } from '../../dtos/shipment-response.dto';

export interface GetShipmentInput {
  orderId: string;
}

export class GetShipmentUseCase
  implements IUseCase<GetShipmentInput, ShipmentResponseDto>
{
  constructor(
    private readonly shipmentRepository: IShipmentRepository,
  ) {}

  async execute(input: GetShipmentInput): Promise<ShipmentResponseDto> {
    const shipment = await this.shipmentRepository.findByOrderId(input.orderId);

    if (!shipment) {
      throw new ShipmentNotFoundError(input.orderId);
    }

    return {
      id: shipment.id,
      orderId: shipment.orderId,
      status: shipment.status.value,
      trackingNumber: shipment.trackingNumber?.value ?? null,
      carrier: shipment.carrier?.name ?? null,
      estimatedDelivery: shipment.estimatedDelivery,
      createdAt: shipment.createdAt,
    };
  }
}

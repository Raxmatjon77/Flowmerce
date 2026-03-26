import { IUseCase, IEventPublisher } from '@shared/application';
import {
  IShipmentRepository,
  ShipmentNotFoundError,
  ShipmentStatusEnum,
} from '@shipping/domain';

export interface UpdateShipmentStatusInput {
  shipmentId: string;
  status: string;
}

export class UpdateShipmentStatusUseCase
  implements IUseCase<UpdateShipmentStatusInput, void>
{
  constructor(
    private readonly shipmentRepository: IShipmentRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: UpdateShipmentStatusInput): Promise<void> {
    const shipment = await this.shipmentRepository.findById(input.shipmentId);

    if (!shipment) {
      throw new ShipmentNotFoundError(input.shipmentId);
    }

    switch (input.status) {
      case ShipmentStatusEnum.PICKED_UP:
        shipment.pickUp();
        break;
      case ShipmentStatusEnum.IN_TRANSIT:
        shipment.inTransit();
        break;
      case ShipmentStatusEnum.DELIVERED:
        shipment.deliver();
        break;
      case ShipmentStatusEnum.RETURNED:
        shipment.returnShipment();
        break;
      default:
        throw new Error(`Unknown shipment status: ${input.status}`);
    }

    await this.shipmentRepository.updateStatus(
      shipment.id,
      shipment.status,
    );

    const events = shipment.clearDomainEvents();
    await this.eventPublisher.publishAll(events);
  }
}

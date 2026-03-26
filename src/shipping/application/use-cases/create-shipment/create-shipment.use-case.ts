import { randomUUID } from 'crypto';
import { IUseCase, IEventPublisher } from '@shared/application';
import {
  Shipment,
  IShipmentRepository,
  TrackingNumber,
  Carrier,
  ShippingAddress,
} from '@shipping/domain';
import { CreateShipmentDto } from '../../dtos/create-shipment.dto';
import { ShipmentResponseDto } from '../../dtos/shipment-response.dto';
import { ICarrierService } from '../../ports/carrier-service.port';

export class CreateShipmentUseCase
  implements IUseCase<CreateShipmentDto, ShipmentResponseDto>
{
  constructor(
    private readonly shipmentRepository: IShipmentRepository,
    private readonly carrierService: ICarrierService,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: CreateShipmentDto): Promise<ShipmentResponseDto> {
    const shippingAddress: ShippingAddress = {
      street: input.address.street,
      city: input.address.city,
      state: input.address.state,
      zip: input.address.zipCode,
      country: input.address.country,
    };

    const shipment = Shipment.create(
      randomUUID(),
      input.orderId,
      shippingAddress,
    );

    // Request pickup from external carrier
    const pickupResult = await this.carrierService.requestPickup(
      input.orderId,
      input.address,
    );

    const trackingNumber = TrackingNumber.create(pickupResult.trackingNumber);
    const carrier = Carrier.create(pickupResult.carrier, pickupResult.carrier);

    shipment.assignCarrier(
      carrier,
      trackingNumber,
      pickupResult.estimatedDelivery,
    );

    await this.shipmentRepository.save(shipment);

    const events = shipment.clearDomainEvents();
    await this.eventPublisher.publishAll(events);

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

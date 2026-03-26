import { Injectable } from '@nestjs/common';
import {
  IShippingServicePort,
  ShippingAddress,
  ShipmentResult,
} from '@order/application/ports/shipping-service.port';
import { CreateShipmentUseCase } from '@shipping/application/use-cases/create-shipment/create-shipment.use-case';

@Injectable()
export class ShippingServiceAdapter implements IShippingServicePort {
  constructor(
    private readonly createShipmentUseCase: CreateShipmentUseCase,
  ) {}

  async createShipment(
    orderId: string,
    address: ShippingAddress,
  ): Promise<ShipmentResult> {
    const response = await this.createShipmentUseCase.execute({
      orderId,
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
      },
    });

    return {
      shipmentId: response.id,
      trackingNumber: response.trackingNumber ?? '',
      estimatedDelivery: response.estimatedDelivery
        ? new Date(response.estimatedDelivery)
        : new Date(),
    };
  }
}

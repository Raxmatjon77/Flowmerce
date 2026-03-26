import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  ICarrierService,
  CarrierPickupResult,
} from '@shipping/application/ports/carrier-service.port';

@Injectable()
export class MockCarrierService implements ICarrierService {
  private readonly logger = new Logger(MockCarrierService.name);

  async requestPickup(
    orderId: string,
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    },
  ): Promise<CarrierPickupResult> {
    this.logger.log(
      `[MOCK] Requesting carrier pickup for order ${orderId} to ${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`,
    );

    const trackingNumber = `TRK-${uuidv4().substring(0, 8).toUpperCase()}`;

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const result: CarrierPickupResult = {
      trackingNumber,
      carrier: 'MockExpress',
      estimatedDelivery,
    };

    this.logger.log(
      `[MOCK] Carrier pickup scheduled for order ${orderId}. Tracking: ${trackingNumber}`,
    );

    return result;
  }
}

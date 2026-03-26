export const CARRIER_SERVICE = Symbol('ICarrierService');

export interface CarrierPickupResult {
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: Date;
}

export interface ICarrierService {
  requestPickup(
    orderId: string,
    address: { street: string; city: string; state: string; zipCode: string; country: string },
  ): Promise<CarrierPickupResult>;
}

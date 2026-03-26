export const SHIPPING_SERVICE_PORT = Symbol('IShippingServicePort');

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ShipmentResult {
  shipmentId: string;
  trackingNumber: string;
  estimatedDelivery: Date;
}

export interface IShippingServicePort {
  createShipment(
    orderId: string,
    address: ShippingAddress,
  ): Promise<ShipmentResult>;
}

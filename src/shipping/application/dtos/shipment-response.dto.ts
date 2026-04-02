export class ShipmentResponseDto {
  id: string;
  orderId: string;
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  estimatedDelivery: Date | null;
  createdAt: Date;
}

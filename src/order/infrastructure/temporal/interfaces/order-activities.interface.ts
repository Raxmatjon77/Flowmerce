/**
 * Temporal activity interface for order processing workflow.
 *
 * Defines the contract for all side-effect operations the workflow can invoke.
 * Activities are the only place where I/O (DB, HTTP, Kafka) is allowed.
 *
 * This interface is imported as a `type` by the workflow for proxyActivities<T>(),
 * and implemented by OrderActivitiesImpl in the infrastructure layer.
 */
export interface OrderActivities {
  reserveInventory(
    orderId: string,
    items: Array<{ sku: string; quantity: number }>,
  ): Promise<void>;

  releaseInventory(
    orderId: string,
    items: Array<{ sku: string; quantity: number }>,
  ): Promise<void>;

  processPayment(
    orderId: string,
    amount: number,
    currency: string,
    method: PaymentMethodInput,
  ): Promise<string>;

  refundPayment(paymentId: string): Promise<void>;

  confirmOrder(orderId: string): Promise<void>;

  cancelOrder(orderId: string): Promise<void>;

  updateOrderStatus(orderId: string, status: string): Promise<void>;

  createShipment(orderId: string, address: ShippingAddressInput): Promise<void>;

  notifyUser(
    recipientId: string,
    type: string,
    data: Record<string, unknown>,
  ): Promise<void>;
}

export interface PaymentMethodInput {
  type: string;
  last4Digits: string;
  expiryMonth: number;
  expiryYear: number;
}

export interface ShippingAddressInput {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

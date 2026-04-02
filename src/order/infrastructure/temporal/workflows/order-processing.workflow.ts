import {
  proxyActivities,
  defineSignal,
  setHandler,
  condition,
  ApplicationFailure,
} from '@temporalio/workflow';

import type { OrderActivities } from '../activities/order.activities';

// Signal name constant
export const CONFIRM_ORDER_SIGNAL = 'confirmOrder';
export const confirmOrderSignal = defineSignal(CONFIRM_ORDER_SIGNAL);

// Status constants used in workflow (cannot import from outside workflow sandbox)
const STATUS = {
  INVENTORY_RESERVED: 'INVENTORY_RESERVED',
  PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
  SHIPPED: 'SHIPPED',
} as const;

const NOTIFICATION_TYPE = {
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
} as const;

const CONFIRMATION_TIMEOUT = '24h';

export interface OrderProcessingInput {
  orderId: string;
  customerId: string;
  items: Array<{ sku: string; quantity: number }>;
  paymentDetails: {
    amount: number;
    currency: string;
    method: {
      type: string;
      last4Digits: string;
      expiryMonth: number;
      expiryYear: number;
    };
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

const activities = proxyActivities<OrderActivities>({
  startToCloseTimeout: '30s',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1s',
    backoffCoefficient: 2,
  },
});

export async function orderProcessingWorkflow(
  input: OrderProcessingInput,
): Promise<void> {
  const compensations: Array<() => Promise<void>> = [];

  let confirmed = false;
  setHandler(confirmOrderSignal, () => {
    confirmed = true;
  });

  try {
    // Step 1: Reserve inventory
    await activities.reserveInventory(input.orderId, input.items);
    compensations.push(() =>
      activities.releaseInventory(input.orderId, input.items),
    );
    await activities.updateOrderStatus(input.orderId, STATUS.INVENTORY_RESERVED);

    // Step 2: Process payment
    const paymentId = await activities.processPayment(
      input.orderId,
      input.paymentDetails.amount,
      input.paymentDetails.currency,
      input.paymentDetails.method,
    );
    compensations.push(() => activities.refundPayment(paymentId));
    await activities.updateOrderStatus(input.orderId, STATUS.PAYMENT_PROCESSED);

    // Step 3: Wait for external confirmation signal
    const wasConfirmed = await condition(() => confirmed, CONFIRMATION_TIMEOUT);
    if (!wasConfirmed) {
      throw ApplicationFailure.nonRetryable(
        'Order confirmation timed out after 24 hours',
      );
    }
    await activities.confirmOrder(input.orderId);

    // Step 4: Create shipment
    await activities.createShipment(input.orderId, input.shippingAddress);
    await activities.updateOrderStatus(input.orderId, STATUS.SHIPPED);

    // Step 5: Notify user
    await activities.notifyUser(input.customerId, NOTIFICATION_TYPE.ORDER_CONFIRMED, {
      orderId: input.orderId,
    });
  } catch (error) {
    // Execute compensations in LIFO order
    for (const compensation of compensations.reverse()) {
      try {
        await compensation();
      } catch (_compensationError) {
        // Log but don't throw — best effort compensation
      }
    }

    // Cancel the order
    try {
      await activities.cancelOrder(input.orderId);
      await activities.notifyUser(input.customerId, NOTIFICATION_TYPE.ORDER_CANCELLED, {
        orderId: input.orderId,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch {
      // Best effort
    }

    throw error;
  }
}

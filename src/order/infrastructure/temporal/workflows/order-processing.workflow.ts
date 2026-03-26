import {
  proxyActivities,
  defineSignal,
  setHandler,
  condition,
  ApplicationFailure,
} from '@temporalio/workflow';

import type { OrderActivities } from '../activities/order.activities';

// Define the confirmation signal
export const confirmOrderSignal = defineSignal('confirmOrder');

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
  // Compensation stack (LIFO)
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
    await activities.updateOrderStatus(input.orderId, 'INVENTORY_RESERVED');

    // Step 2: Process payment
    const paymentId = await activities.processPayment(
      input.orderId,
      input.paymentDetails.amount,
      input.paymentDetails.currency,
      input.paymentDetails.method,
    );
    compensations.push(() => activities.refundPayment(paymentId));
    await activities.updateOrderStatus(input.orderId, 'PAYMENT_PROCESSED');

    // Step 3: Wait for external confirmation signal (24h timeout)
    const wasConfirmed = await condition(() => confirmed, '24h');
    if (!wasConfirmed) {
      throw ApplicationFailure.nonRetryable(
        'Order confirmation timed out after 24 hours',
      );
    }
    await activities.confirmOrder(input.orderId);

    // Step 4: Create shipment
    await activities.createShipment(input.orderId, input.shippingAddress);
    await activities.updateOrderStatus(input.orderId, 'SHIPPED');

    // Step 5: Notify user
    await activities.notifyUser(input.customerId, 'ORDER_CONFIRMED', {
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
      await activities.notifyUser(input.customerId, 'ORDER_CANCELLED', {
        orderId: input.orderId,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch {
      // Best effort
    }

    throw error;
  }
}

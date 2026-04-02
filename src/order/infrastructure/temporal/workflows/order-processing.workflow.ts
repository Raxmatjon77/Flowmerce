import {
  proxyActivities,
  defineSignal,
  setHandler,
  condition,
  ApplicationFailure,
} from '@temporalio/workflow';

import type { OrderActivities } from '../interfaces/order-activities.interface';
import type { OrderProcessingInput } from './workflow.interfaces';
import {
  CONFIRM_ORDER_SIGNAL,
  WORKFLOW_ORDER_STATUS,
  WORKFLOW_NOTIFICATION_TYPE,
  WORKFLOW_TIMEOUTS,
  WORKFLOW_RETRY_POLICY,
} from './workflow.constants';

// Re-export for external consumers
export { CONFIRM_ORDER_SIGNAL } from './workflow.constants';
export type { OrderProcessingInput } from './workflow.interfaces';

export const confirmOrderSignal = defineSignal(CONFIRM_ORDER_SIGNAL);

const activities = proxyActivities<OrderActivities>({
  startToCloseTimeout: WORKFLOW_TIMEOUTS.ACTIVITY_START_TO_CLOSE,
  retry: {
    maximumAttempts: WORKFLOW_RETRY_POLICY.MAXIMUM_ATTEMPTS,
    initialInterval: WORKFLOW_RETRY_POLICY.INITIAL_INTERVAL,
    backoffCoefficient: WORKFLOW_RETRY_POLICY.BACKOFF_COEFFICIENT,
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
    await activities.updateOrderStatus(input.orderId, WORKFLOW_ORDER_STATUS.INVENTORY_RESERVED);

    // Step 2: Process payment
    const paymentId = await activities.processPayment(
      input.orderId,
      input.paymentDetails.amount,
      input.paymentDetails.currency,
      input.paymentDetails.method,
    );
    compensations.push(() => activities.refundPayment(paymentId));
    await activities.updateOrderStatus(input.orderId, WORKFLOW_ORDER_STATUS.PAYMENT_PROCESSED);

    // Step 3: Wait for external confirmation signal
    const wasConfirmed = await condition(() => confirmed, WORKFLOW_TIMEOUTS.CONFIRMATION_WAIT);
    if (!wasConfirmed) {
      throw ApplicationFailure.nonRetryable(
        'Order confirmation timed out after 24 hours',
      );
    }
    await activities.confirmOrder(input.orderId);

    // Step 4: Create shipment
    await activities.createShipment(input.orderId, input.shippingAddress);
    await activities.updateOrderStatus(input.orderId, WORKFLOW_ORDER_STATUS.SHIPPED);

    // Step 5: Notify user
    await activities.notifyUser(input.customerId, WORKFLOW_NOTIFICATION_TYPE.ORDER_CONFIRMED, {
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
      await activities.notifyUser(input.customerId, WORKFLOW_NOTIFICATION_TYPE.ORDER_CANCELLED, {
        orderId: input.orderId,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch {
      // Best effort
    }

    throw error;
  }
}

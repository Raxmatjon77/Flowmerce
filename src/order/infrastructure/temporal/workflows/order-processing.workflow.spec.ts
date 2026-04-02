import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker, Runtime, DefaultLogger } from '@temporalio/worker';
import { WorkflowFailedError } from '@temporalio/client';
import {
  orderProcessingWorkflow,
  OrderProcessingInput,
  CONFIRM_ORDER_SIGNAL,
} from './order-processing.workflow';

// Increase timeout for Temporal test server startup
jest.setTimeout(60_000);

const TEST_INPUT: OrderProcessingInput = {
  orderId: 'order-1',
  customerId: 'cust-1',
  items: [{ sku: 'SKU-A', quantity: 2 }],
  paymentDetails: {
    amount: 100,
    currency: 'USD',
    method: {
      type: 'credit_card',
      last4Digits: '4242',
      expiryMonth: 12,
      expiryYear: 2027,
    },
  },
  shippingAddress: {
    street: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
    country: 'US',
  },
};

describe('orderProcessingWorkflow', () => {
  let testEnv: TestWorkflowEnvironment;

  beforeAll(async () => {
    Runtime.install({
      logger: new DefaultLogger('WARN'),
    });
    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
  });

  afterAll(async () => {
    await testEnv?.teardown();
  });

  async function runWithActivities(
    activityOverrides: Record<string, (...args: any[]) => any>,
    opts?: {
      sendSignal?: boolean;
      signalDelayMs?: number;
    },
  ) {
    const taskQueue = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('./order-processing.workflow'),
      activities: activityOverrides,
    });

    const handle = await testEnv.client.workflow.start(orderProcessingWorkflow, {
      workflowId: `test-wf-${Date.now()}`,
      taskQueue,
      args: [TEST_INPUT],
    });

    if (opts?.sendSignal) {
      // Small delay to let workflow reach the signal wait point
      if (opts.signalDelayMs) {
        await new Promise((r) => setTimeout(r, opts.signalDelayMs));
      }
      await handle.signal(CONFIRM_ORDER_SIGNAL);
    }

    const result = worker.runUntil(handle.result());
    return result;
  }

  it('happy path: reserves inventory, processes payment, confirms, ships, notifies', async () => {
    const calls: string[] = [];

    const mockActivities = {
      reserveInventory: async () => { calls.push('reserveInventory'); },
      releaseInventory: async () => { calls.push('releaseInventory'); },
      processPayment: async () => { calls.push('processPayment'); return 'pay-123'; },
      refundPayment: async () => { calls.push('refundPayment'); },
      confirmOrder: async () => { calls.push('confirmOrder'); },
      cancelOrder: async () => { calls.push('cancelOrder'); },
      updateOrderStatus: async () => { calls.push('updateOrderStatus'); },
      createShipment: async () => { calls.push('createShipment'); },
      notifyUser: async () => { calls.push('notifyUser'); },
    };

    await runWithActivities(mockActivities, { sendSignal: true, signalDelayMs: 500 });

    // Verify the happy path order of operations
    expect(calls).toEqual([
      'reserveInventory',
      'updateOrderStatus',    // INVENTORY_RESERVED
      'processPayment',
      'updateOrderStatus',    // PAYMENT_PROCESSED
      'confirmOrder',
      'createShipment',
      'updateOrderStatus',    // SHIPPED
      'notifyUser',
    ]);
  });

  it('payment failure triggers compensation: releaseInventory is called', async () => {
    const calls: string[] = [];

    const mockActivities = {
      reserveInventory: async () => { calls.push('reserveInventory'); },
      releaseInventory: async () => { calls.push('releaseInventory'); },
      processPayment: async () => {
        calls.push('processPayment');
        throw new Error('Insufficient funds');
      },
      refundPayment: async () => { calls.push('refundPayment'); },
      confirmOrder: async () => { calls.push('confirmOrder'); },
      cancelOrder: async () => { calls.push('cancelOrder'); },
      updateOrderStatus: async () => { calls.push('updateOrderStatus'); },
      createShipment: async () => { calls.push('createShipment'); },
      notifyUser: async () => { calls.push('notifyUser'); },
    };

    await expect(runWithActivities(mockActivities)).rejects.toThrow();

    // After payment failure, compensation should release inventory
    expect(calls).toContain('reserveInventory');
    expect(calls).toContain('processPayment');
    expect(calls).toContain('releaseInventory');
    expect(calls).toContain('cancelOrder');
    // No refund since payment never succeeded
    expect(calls).not.toContain('refundPayment');
  });

  it('inventory failure: no compensation needed, order cancelled', async () => {
    const calls: string[] = [];

    const mockActivities = {
      reserveInventory: async () => {
        calls.push('reserveInventory');
        throw new Error('Out of stock');
      },
      releaseInventory: async () => { calls.push('releaseInventory'); },
      processPayment: async () => { calls.push('processPayment'); return 'pay-123'; },
      refundPayment: async () => { calls.push('refundPayment'); },
      confirmOrder: async () => { calls.push('confirmOrder'); },
      cancelOrder: async () => { calls.push('cancelOrder'); },
      updateOrderStatus: async () => { calls.push('updateOrderStatus'); },
      createShipment: async () => { calls.push('createShipment'); },
      notifyUser: async () => { calls.push('notifyUser'); },
    };

    await expect(runWithActivities(mockActivities)).rejects.toThrow();

    // No compensation activities should run (no successful steps to compensate)
    expect(calls).toContain('reserveInventory');
    expect(calls).not.toContain('releaseInventory');
    expect(calls).not.toContain('refundPayment');
    expect(calls).toContain('cancelOrder');
    // Payment should never have been attempted
    expect(calls).not.toContain('processPayment');
  });

  it('confirmation timeout: workflow fails after timeout if signal not received', async () => {
    const calls: string[] = [];

    const mockActivities = {
      reserveInventory: async () => { calls.push('reserveInventory'); },
      releaseInventory: async () => { calls.push('releaseInventory'); },
      processPayment: async () => { calls.push('processPayment'); return 'pay-123'; },
      refundPayment: async () => { calls.push('refundPayment'); },
      confirmOrder: async () => { calls.push('confirmOrder'); },
      cancelOrder: async () => { calls.push('cancelOrder'); },
      updateOrderStatus: async () => { calls.push('updateOrderStatus'); },
      createShipment: async () => { calls.push('createShipment'); },
      notifyUser: async () => { calls.push('notifyUser'); },
    };

    // Do NOT send the signal -- the workflow should time out
    await expect(runWithActivities(mockActivities)).rejects.toThrow();

    // Compensation should have run (both refund and release)
    expect(calls).toContain('releaseInventory');
    expect(calls).toContain('refundPayment');
    expect(calls).toContain('cancelOrder');
    // confirmOrder should never have been called
    expect(calls).not.toContain('confirmOrder');
  });
});

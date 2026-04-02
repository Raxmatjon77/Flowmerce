import { OrderActivitiesImpl } from './order-activities.impl';
import { IInventoryServicePort } from '@order/application/ports/inventory-service.port';
import { IPaymentServicePort, PaymentResult } from '@order/application/ports/payment-service.port';
import { IShippingServicePort } from '@order/application/ports/shipping-service.port';
import { INotificationServicePort } from '@order/application/ports/notification-service.port';
import { IOrderRepository, Order, OrderItem, OrderStatus, OrderStatusEnum, Money, ShippingAddress } from '@order/domain';

function createMockOrder(
  id: string,
  status: OrderStatus = OrderStatus.pending(),
): Order {
  const item = OrderItem.create('item-1', {
    orderId: id,
    productId: 'prod-1',
    productName: 'Widget',
    quantity: 2,
    unitPrice: Money.create(25, 'USD'),
  });

  const address = ShippingAddress.create(
    '123 Main St',
    'Springfield',
    'IL',
    '62701',
    'US',
  );

  return Order.reconstitute(
    id,
    {
      customerId: 'cust-1',
      items: [item],
      status,
      shippingAddress: address,
      totalAmount: Money.create(50, 'USD'),
    },
    new Date(),
    new Date(),
  );
}

describe('OrderActivitiesImpl', () => {
  let activities: OrderActivitiesImpl;
  let inventoryService: jest.Mocked<IInventoryServicePort>;
  let paymentService: jest.Mocked<IPaymentServicePort>;
  let shippingService: jest.Mocked<IShippingServicePort>;
  let notificationService: jest.Mocked<INotificationServicePort>;
  let orderRepository: jest.Mocked<IOrderRepository>;

  beforeEach(() => {
    inventoryService = {
      reserveInventory: jest.fn().mockResolvedValue(undefined),
      releaseInventory: jest.fn().mockResolvedValue(undefined),
    };

    paymentService = {
      processPayment: jest.fn(),
      refundPayment: jest.fn().mockResolvedValue(undefined),
    };

    shippingService = {
      createShipment: jest.fn().mockResolvedValue({
        shipmentId: 'ship-1',
        trackingNumber: 'TRK-123',
        estimatedDelivery: new Date(),
      }),
    };

    notificationService = {
      sendNotification: jest.fn().mockResolvedValue(undefined),
    };

    orderRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };

    activities = new OrderActivitiesImpl(
      inventoryService,
      paymentService,
      shippingService,
      notificationService,
      orderRepository,
    );
  });

  describe('reserveInventory', () => {
    it('should call inventoryService.reserveInventory with mapped items', async () => {
      const items = [
        { sku: 'SKU-A', quantity: 3 },
        { sku: 'SKU-B', quantity: 1 },
      ];

      await activities.reserveInventory('order-1', items);

      expect(inventoryService.reserveInventory).toHaveBeenCalledWith('order-1', [
        { productId: 'SKU-A', quantity: 3 },
        { productId: 'SKU-B', quantity: 1 },
      ]);
    });
  });

  describe('releaseInventory', () => {
    it('should call inventoryService.releaseInventory with mapped items', async () => {
      const items = [{ sku: 'SKU-A', quantity: 2 }];

      await activities.releaseInventory('order-1', items);

      expect(inventoryService.releaseInventory).toHaveBeenCalledWith('order-1', [
        { productId: 'SKU-A', quantity: 2 },
      ]);
    });
  });

  describe('processPayment', () => {
    const method = {
      type: 'credit_card',
      last4Digits: '4242',
      expiryMonth: 12,
      expiryYear: 2027,
    };

    it('should return paymentId on success', async () => {
      const result: PaymentResult = {
        paymentId: 'pay-123',
        transactionId: 'txn-456',
        success: true,
      };
      paymentService.processPayment.mockResolvedValue(result);

      const paymentId = await activities.processPayment('order-1', 100, 'USD', method);

      expect(paymentId).toBe('pay-123');
      expect(paymentService.processPayment).toHaveBeenCalledWith('order-1', 100, 'USD', method);
    });

    it('should throw when payment fails', async () => {
      const result: PaymentResult = {
        paymentId: '',
        transactionId: '',
        success: false,
        failureReason: 'Insufficient funds',
      };
      paymentService.processPayment.mockResolvedValue(result);

      await expect(
        activities.processPayment('order-1', 100, 'USD', method),
      ).rejects.toThrow('Insufficient funds');
    });

    it('should throw default message when no failureReason', async () => {
      const result: PaymentResult = {
        paymentId: '',
        transactionId: '',
        success: false,
      };
      paymentService.processPayment.mockResolvedValue(result);

      await expect(
        activities.processPayment('order-1', 100, 'USD', method),
      ).rejects.toThrow('Payment processing failed');
    });
  });

  describe('refundPayment', () => {
    it('should call paymentService.refundPayment', async () => {
      await activities.refundPayment('pay-123');
      expect(paymentService.refundPayment).toHaveBeenCalledWith('pay-123');
    });
  });

  describe('confirmOrder', () => {
    it('should fetch order, confirm, and save', async () => {
      const order = createMockOrder('order-1', OrderStatus.paymentProcessed());
      orderRepository.findById.mockResolvedValue(order);

      await activities.confirmOrder('order-1');

      expect(orderRepository.findById).toHaveBeenCalledWith('order-1');
      expect(order.status.value).toBe(OrderStatusEnum.CONFIRMED);
      expect(orderRepository.save).toHaveBeenCalledWith(order);
    });

    it('should throw when order not found', async () => {
      orderRepository.findById.mockResolvedValue(null);

      await expect(activities.confirmOrder('order-999')).rejects.toThrow(
        'Order order-999 not found',
      );
    });
  });

  describe('cancelOrder', () => {
    it('should fetch order, cancel, and save', async () => {
      const order = createMockOrder('order-1', OrderStatus.pending());
      orderRepository.findById.mockResolvedValue(order);

      await activities.cancelOrder('order-1');

      expect(order.status.value).toBe(OrderStatusEnum.CANCELLED);
      expect(orderRepository.save).toHaveBeenCalledWith(order);
    });
  });

  describe('updateOrderStatus', () => {
    it('should transition to INVENTORY_RESERVED', async () => {
      const order = createMockOrder('order-1', OrderStatus.pending());
      orderRepository.findById.mockResolvedValue(order);

      await activities.updateOrderStatus('order-1', 'INVENTORY_RESERVED');

      expect(order.status.value).toBe(OrderStatusEnum.INVENTORY_RESERVED);
      expect(orderRepository.save).toHaveBeenCalledWith(order);
    });

    it('should transition to PAYMENT_PROCESSED', async () => {
      const order = createMockOrder('order-1', OrderStatus.inventoryReserved());
      orderRepository.findById.mockResolvedValue(order);

      await activities.updateOrderStatus('order-1', 'PAYMENT_PROCESSED');

      expect(order.status.value).toBe(OrderStatusEnum.PAYMENT_PROCESSED);
    });

    it('should transition to SHIPPED', async () => {
      const order = createMockOrder('order-1', OrderStatus.confirmed());
      orderRepository.findById.mockResolvedValue(order);

      await activities.updateOrderStatus('order-1', 'SHIPPED');

      expect(order.status.value).toBe(OrderStatusEnum.SHIPPED);
    });

    it('should throw for unknown status', async () => {
      const order = createMockOrder('order-1');
      orderRepository.findById.mockResolvedValue(order);

      await expect(
        activities.updateOrderStatus('order-1', 'INVALID_STATUS'),
      ).rejects.toThrow('Unknown status transition: INVALID_STATUS');
    });
  });

  describe('createShipment', () => {
    it('should call shippingService.createShipment', async () => {
      const address = {
        street: '456 Oak Ave',
        city: 'Portland',
        state: 'OR',
        zipCode: '97201',
        country: 'US',
      };

      await activities.createShipment('order-1', address);

      expect(shippingService.createShipment).toHaveBeenCalledWith('order-1', address);
    });
  });

  describe('notifyUser', () => {
    it('should call notificationService.sendNotification', async () => {
      const data = { orderId: 'order-1' };

      await activities.notifyUser('cust-1', 'ORDER_CONFIRMED', data);

      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        'cust-1',
        'ORDER_CONFIRMED',
        data,
      );
    });
  });
});

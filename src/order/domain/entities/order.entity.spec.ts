import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Money } from '../value-objects/money.value-object';
import { ShippingAddress } from '../value-objects/shipping-address.value-object';
import { OrderCreatedEvent } from '../events/order-created.event';
import { OrderInventoryReservedEvent } from '../events/order-inventory-reserved.event';
import { OrderPaymentProcessedEvent } from '../events/order-payment-processed.event';
import { OrderConfirmedEvent } from '../events/order-confirmed.event';
import { OrderCancelledEvent } from '../events/order-cancelled.event';
import { OrderShippedEvent } from '../events/order-shipped.event';
import {
  InvalidOrderTransitionError,
  InvalidOrderError,
} from '../errors/order-domain.errors';
import { OrderStatusEnum } from '../value-objects/order-status.value-object';

function createValidItems(): OrderItem[] {
  return [
    OrderItem.create('item-1', {
      orderId: 'order-1',
      productId: 'prod-1',
      productName: 'Widget A',
      quantity: 2,
      unitPrice: Money.create(10, 'USD'),
    }),
    OrderItem.create('item-2', {
      orderId: 'order-1',
      productId: 'prod-2',
      productName: 'Widget B',
      quantity: 1,
      unitPrice: Money.create(25, 'USD'),
    }),
  ];
}

function createValidAddress(): ShippingAddress {
  return ShippingAddress.create(
    '123 Main St',
    'Springfield',
    'IL',
    '62701',
    'US',
  );
}

function createOrder(): Order {
  return Order.create(
    'order-1',
    'customer-123',
    createValidItems(),
    createValidAddress(),
    'USD',
  );
}

describe('Order', () => {
  describe('create()', () => {
    it('should create an order with correct properties', () => {
      const order = createOrder();

      expect(order.id).toBe('order-1');
      expect(order.customerId).toBe('customer-123');
      expect(order.items).toHaveLength(2);
      expect(order.status.value).toBe(OrderStatusEnum.PENDING);
      expect(order.shippingAddress.street).toBe('123 Main St');
    });

    it('should generate an OrderCreatedEvent', () => {
      const order = createOrder();
      const events = order.domainEvents;

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(OrderCreatedEvent);

      const event = events[0] as OrderCreatedEvent;
      expect(event.aggregateId).toBe('order-1');
      expect(event.customerId).toBe('customer-123');
      expect(event.currency).toBe('USD');
    });

    it('should calculate totalAmount correctly from items', () => {
      const order = createOrder();

      // 2 * 10 + 1 * 25 = 45
      expect(order.totalAmount.amount).toBe(45);
      expect(order.totalAmount.currency).toBe('USD');
    });

    it('should throw InvalidOrderError for empty customerId', () => {
      expect(() =>
        Order.create(
          'order-1',
          '',
          createValidItems(),
          createValidAddress(),
          'USD',
        ),
      ).toThrow(InvalidOrderError);
    });

    it('should throw InvalidOrderError for whitespace-only customerId', () => {
      expect(() =>
        Order.create(
          'order-1',
          '   ',
          createValidItems(),
          createValidAddress(),
          'USD',
        ),
      ).toThrow('Customer ID must not be empty');
    });

    it('should throw InvalidOrderError for empty items array', () => {
      expect(() =>
        Order.create(
          'order-1',
          'customer-123',
          [],
          createValidAddress(),
          'USD',
        ),
      ).toThrow(InvalidOrderError);
    });

    it('should throw InvalidOrderError with correct message for empty items', () => {
      expect(() =>
        Order.create(
          'order-1',
          'customer-123',
          [],
          createValidAddress(),
          'USD',
        ),
      ).toThrow('Order must contain at least one item');
    });
  });

  describe('state transitions - happy path', () => {
    it('should transition through full lifecycle: PENDING -> INVENTORY_RESERVED -> PAYMENT_PROCESSED -> CONFIRMED -> SHIPPED -> DELIVERED', () => {
      const order = createOrder();
      order.clearDomainEvents();

      order.reserveInventory();
      expect(order.status.value).toBe(OrderStatusEnum.INVENTORY_RESERVED);

      order.processPayment();
      expect(order.status.value).toBe(OrderStatusEnum.PAYMENT_PROCESSED);

      order.confirm();
      expect(order.status.value).toBe(OrderStatusEnum.CONFIRMED);

      order.ship();
      expect(order.status.value).toBe(OrderStatusEnum.SHIPPED);

      order.deliver();
      expect(order.status.value).toBe(OrderStatusEnum.DELIVERED);
    });
  });

  describe('state transitions - cancel', () => {
    it('should allow cancelling from PENDING', () => {
      const order = createOrder();

      order.cancel();

      expect(order.status.value).toBe(OrderStatusEnum.CANCELLED);
    });

    it('should allow cancelling from INVENTORY_RESERVED', () => {
      const order = createOrder();
      order.reserveInventory();

      order.cancel();

      expect(order.status.value).toBe(OrderStatusEnum.CANCELLED);
    });
  });

  describe('invalid state transitions', () => {
    it('should throw InvalidOrderTransitionError for PENDING -> CONFIRMED', () => {
      const order = createOrder();

      expect(() => order.confirm()).toThrow(InvalidOrderTransitionError);
    });

    it('should throw InvalidOrderTransitionError for PENDING -> SHIPPED', () => {
      const order = createOrder();

      expect(() => order.ship()).toThrow(InvalidOrderTransitionError);
    });

    it('should throw for any transition from DELIVERED', () => {
      const order = createOrder();
      order.reserveInventory();
      order.processPayment();
      order.confirm();
      order.ship();
      order.deliver();

      expect(() => order.cancel()).toThrow(InvalidOrderTransitionError);
      expect(() => order.reserveInventory()).toThrow(
        InvalidOrderTransitionError,
      );
      expect(() => order.confirm()).toThrow(InvalidOrderTransitionError);
      expect(() => order.ship()).toThrow(InvalidOrderTransitionError);
    });

    it('should throw for any transition from CANCELLED', () => {
      const order = createOrder();
      order.cancel();

      expect(() => order.reserveInventory()).toThrow(
        InvalidOrderTransitionError,
      );
      expect(() => order.processPayment()).toThrow(
        InvalidOrderTransitionError,
      );
      expect(() => order.confirm()).toThrow(InvalidOrderTransitionError);
      expect(() => order.ship()).toThrow(InvalidOrderTransitionError);
      expect(() => order.deliver()).toThrow(InvalidOrderTransitionError);
    });

    it('should include current and target status in error message', () => {
      const order = createOrder();

      expect(() => order.confirm()).toThrow(
        "Invalid order status transition from 'PENDING' to 'CONFIRMED'",
      );
    });
  });

  describe('domain events per transition', () => {
    it('should add OrderInventoryReservedEvent on reserveInventory()', () => {
      const order = createOrder();
      order.clearDomainEvents();

      order.reserveInventory();

      const events = order.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(OrderInventoryReservedEvent);
      expect(events[0].aggregateId).toBe('order-1');
    });

    it('should add OrderPaymentProcessedEvent on processPayment()', () => {
      const order = createOrder();
      order.reserveInventory();
      order.clearDomainEvents();

      order.processPayment();

      const events = order.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(OrderPaymentProcessedEvent);

      const event = events[0] as OrderPaymentProcessedEvent;
      expect(event.amount).toBe(45);
      expect(event.currency).toBe('USD');
    });

    it('should add OrderConfirmedEvent on confirm()', () => {
      const order = createOrder();
      order.reserveInventory();
      order.processPayment();
      order.clearDomainEvents();

      order.confirm();

      const events = order.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(OrderConfirmedEvent);
    });

    it('should add OrderShippedEvent on ship()', () => {
      const order = createOrder();
      order.reserveInventory();
      order.processPayment();
      order.confirm();
      order.clearDomainEvents();

      order.ship();

      const events = order.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(OrderShippedEvent);
    });

    it('should add OrderCancelledEvent on cancel()', () => {
      const order = createOrder();
      order.clearDomainEvents();

      order.cancel();

      const events = order.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(OrderCancelledEvent);

      const event = events[0] as OrderCancelledEvent;
      expect(event.customerId).toBe('customer-123');
    });

    it('should not add domain event on deliver()', () => {
      const order = createOrder();
      order.reserveInventory();
      order.processPayment();
      order.confirm();
      order.ship();
      order.clearDomainEvents();

      order.deliver();

      expect(order.domainEvents).toHaveLength(0);
    });
  });

  describe('clearDomainEvents()', () => {
    it('should return all accumulated events', () => {
      const order = createOrder();
      order.reserveInventory();

      const events = order.clearDomainEvents();

      expect(events).toHaveLength(2);
      expect(events[0]).toBeInstanceOf(OrderCreatedEvent);
      expect(events[1]).toBeInstanceOf(OrderInventoryReservedEvent);
    });

    it('should empty the domain events list after clearing', () => {
      const order = createOrder();
      order.clearDomainEvents();

      expect(order.domainEvents).toHaveLength(0);
    });

    it('should return empty array when no events exist', () => {
      const order = createOrder();
      order.clearDomainEvents();

      const events = order.clearDomainEvents();

      expect(events).toHaveLength(0);
    });
  });
});

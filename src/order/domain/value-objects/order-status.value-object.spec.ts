import {
  OrderStatus,
  OrderStatusEnum,
} from './order-status.value-object';

describe('OrderStatus', () => {
  describe('static factory methods', () => {
    it('should create PENDING status', () => {
      const status = OrderStatus.pending();
      expect(status.value).toBe(OrderStatusEnum.PENDING);
    });

    it('should create INVENTORY_RESERVED status', () => {
      const status = OrderStatus.inventoryReserved();
      expect(status.value).toBe(OrderStatusEnum.INVENTORY_RESERVED);
    });

    it('should create PAYMENT_PROCESSED status', () => {
      const status = OrderStatus.paymentProcessed();
      expect(status.value).toBe(OrderStatusEnum.PAYMENT_PROCESSED);
    });

    it('should create CONFIRMED status', () => {
      const status = OrderStatus.confirmed();
      expect(status.value).toBe(OrderStatusEnum.CONFIRMED);
    });

    it('should create SHIPPED status', () => {
      const status = OrderStatus.shipped();
      expect(status.value).toBe(OrderStatusEnum.SHIPPED);
    });

    it('should create DELIVERED status', () => {
      const status = OrderStatus.delivered();
      expect(status.value).toBe(OrderStatusEnum.DELIVERED);
    });

    it('should create CANCELLED status', () => {
      const status = OrderStatus.cancelled();
      expect(status.value).toBe(OrderStatusEnum.CANCELLED);
    });
  });

  describe('fromString()', () => {
    it('should create status from valid string', () => {
      const status = OrderStatus.fromString('PENDING');
      expect(status.value).toBe(OrderStatusEnum.PENDING);
    });

    it('should create status from each valid enum value', () => {
      const values = [
        'PENDING',
        'INVENTORY_RESERVED',
        'PAYMENT_PROCESSED',
        'CONFIRMED',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
      ];

      for (const val of values) {
        const status = OrderStatus.fromString(val);
        expect(status.value).toBe(val);
      }
    });

    it('should throw for invalid string', () => {
      expect(() => OrderStatus.fromString('INVALID')).toThrow(
        'Invalid order status: INVALID',
      );
    });

    it('should throw for lowercase string', () => {
      expect(() => OrderStatus.fromString('pending')).toThrow(
        'Invalid order status: pending',
      );
    });
  });

  describe('canTransitionTo()', () => {
    it('should allow PENDING -> INVENTORY_RESERVED', () => {
      expect(
        OrderStatus.pending().canTransitionTo(OrderStatus.inventoryReserved()),
      ).toBe(true);
    });

    it('should allow PENDING -> CANCELLED', () => {
      expect(
        OrderStatus.pending().canTransitionTo(OrderStatus.cancelled()),
      ).toBe(true);
    });

    it('should allow INVENTORY_RESERVED -> PAYMENT_PROCESSED', () => {
      expect(
        OrderStatus.inventoryReserved().canTransitionTo(
          OrderStatus.paymentProcessed(),
        ),
      ).toBe(true);
    });

    it('should allow INVENTORY_RESERVED -> CANCELLED', () => {
      expect(
        OrderStatus.inventoryReserved().canTransitionTo(
          OrderStatus.cancelled(),
        ),
      ).toBe(true);
    });

    it('should allow PAYMENT_PROCESSED -> CONFIRMED', () => {
      expect(
        OrderStatus.paymentProcessed().canTransitionTo(
          OrderStatus.confirmed(),
        ),
      ).toBe(true);
    });

    it('should allow CONFIRMED -> SHIPPED', () => {
      expect(
        OrderStatus.confirmed().canTransitionTo(OrderStatus.shipped()),
      ).toBe(true);
    });

    it('should allow SHIPPED -> DELIVERED', () => {
      expect(
        OrderStatus.shipped().canTransitionTo(OrderStatus.delivered()),
      ).toBe(true);
    });

    it('should not allow PENDING -> CONFIRMED', () => {
      expect(
        OrderStatus.pending().canTransitionTo(OrderStatus.confirmed()),
      ).toBe(false);
    });

    it('should not allow PENDING -> SHIPPED', () => {
      expect(
        OrderStatus.pending().canTransitionTo(OrderStatus.shipped()),
      ).toBe(false);
    });

    it('should not allow DELIVERED -> any status', () => {
      const delivered = OrderStatus.delivered();
      expect(delivered.canTransitionTo(OrderStatus.pending())).toBe(false);
      expect(delivered.canTransitionTo(OrderStatus.cancelled())).toBe(false);
      expect(delivered.canTransitionTo(OrderStatus.shipped())).toBe(false);
      expect(delivered.canTransitionTo(OrderStatus.confirmed())).toBe(false);
    });

    it('should not allow CANCELLED -> any status', () => {
      const cancelled = OrderStatus.cancelled();
      expect(cancelled.canTransitionTo(OrderStatus.pending())).toBe(false);
      expect(cancelled.canTransitionTo(OrderStatus.inventoryReserved())).toBe(
        false,
      );
      expect(cancelled.canTransitionTo(OrderStatus.confirmed())).toBe(false);
      expect(cancelled.canTransitionTo(OrderStatus.shipped())).toBe(false);
    });

    it('should not allow PAYMENT_PROCESSED -> CANCELLED', () => {
      expect(
        OrderStatus.paymentProcessed().canTransitionTo(
          OrderStatus.cancelled(),
        ),
      ).toBe(false);
    });

    it('should not allow backward transitions', () => {
      expect(
        OrderStatus.confirmed().canTransitionTo(OrderStatus.pending()),
      ).toBe(false);
      expect(
        OrderStatus.shipped().canTransitionTo(OrderStatus.confirmed()),
      ).toBe(false);
    });
  });

  describe('equals()', () => {
    it('should return true for same status', () => {
      expect(OrderStatus.pending().equals(OrderStatus.pending())).toBe(true);
    });

    it('should return false for different statuses', () => {
      expect(OrderStatus.pending().equals(OrderStatus.confirmed())).toBe(
        false,
      );
    });
  });

  describe('toString()', () => {
    it('should return the enum value string', () => {
      expect(OrderStatus.pending().toString()).toBe('PENDING');
      expect(OrderStatus.inventoryReserved().toString()).toBe(
        'INVENTORY_RESERVED',
      );
      expect(OrderStatus.cancelled().toString()).toBe('CANCELLED');
    });
  });
});

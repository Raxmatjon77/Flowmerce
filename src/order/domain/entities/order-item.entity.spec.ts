import { OrderItem, OrderItemProps } from './order-item.entity';
import { Money } from '../value-objects/money.value-object';

describe('OrderItem', () => {
  const validProps: OrderItemProps = {
    orderId: 'order-123',
    productId: 'product-456',
    productName: 'Widget',
    quantity: 3,
    unitPrice: Money.create(10.99, 'USD'),
  };

  describe('create()', () => {
    it('should create an OrderItem with correct properties', () => {
      const item = OrderItem.create('item-1', validProps);

      expect(item.id).toBe('item-1');
      expect(item.orderId).toBe('order-123');
      expect(item.productId).toBe('product-456');
      expect(item.productName).toBe('Widget');
      expect(item.quantity).toBe(3);
      expect(item.unitPrice.amount).toBe(10.99);
      expect(item.unitPrice.currency).toBe('USD');
    });

    it('should calculate totalPrice as unitPrice * quantity', () => {
      const item = OrderItem.create('item-1', validProps);

      expect(item.totalPrice.amount).toBe(32.97);
      expect(item.totalPrice.currency).toBe('USD');
    });

    it('should calculate totalPrice correctly for quantity of 1', () => {
      const item = OrderItem.create('item-1', {
        ...validProps,
        quantity: 1,
      });

      expect(item.totalPrice.amount).toBe(10.99);
    });
  });

  describe('validation', () => {
    it('should throw for empty productId', () => {
      expect(() =>
        OrderItem.create('item-1', { ...validProps, productId: '' }),
      ).toThrow('Product ID must not be empty');
    });

    it('should throw for whitespace-only productId', () => {
      expect(() =>
        OrderItem.create('item-1', { ...validProps, productId: '   ' }),
      ).toThrow('Product ID must not be empty');
    });

    it('should throw for empty productName', () => {
      expect(() =>
        OrderItem.create('item-1', { ...validProps, productName: '' }),
      ).toThrow('Product name must not be empty');
    });

    it('should throw for whitespace-only productName', () => {
      expect(() =>
        OrderItem.create('item-1', { ...validProps, productName: '   ' }),
      ).toThrow('Product name must not be empty');
    });

    it('should throw for quantity of 0', () => {
      expect(() =>
        OrderItem.create('item-1', { ...validProps, quantity: 0 }),
      ).toThrow('Quantity must be positive: 0');
    });

    it('should throw for negative quantity', () => {
      expect(() =>
        OrderItem.create('item-1', { ...validProps, quantity: -1 }),
      ).toThrow('Quantity must be positive: -1');
    });

    it('should throw for non-integer quantity', () => {
      expect(() =>
        OrderItem.create('item-1', { ...validProps, quantity: 2.5 }),
      ).toThrow('Quantity must be an integer: 2.5');
    });
  });
});

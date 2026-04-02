import { OrderCreatedEvent } from './order-created.event';

describe('OrderCreatedEvent', () => {
  it('should create with correct fields', () => {
    const event = new OrderCreatedEvent('order-123', 'customer-456', 99.99, 'USD');

    expect(event.aggregateId).toBe('order-123');
    expect(event.customerId).toBe('customer-456');
    expect(event.totalAmount).toBe(99.99);
    expect(event.currency).toBe('USD');
    expect(event.eventType).toBe('OrderCreated');
  });

  it('should have a unique eventId (UUID format)', () => {
    const event1 = new OrderCreatedEvent('order-1', 'cust-1', 10, 'USD');
    const event2 = new OrderCreatedEvent('order-2', 'cust-2', 20, 'USD');

    expect(event1.eventId).toBeDefined();
    expect(event2.eventId).toBeDefined();
    expect(event1.eventId).not.toBe(event2.eventId);

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(event1.eventId).toMatch(uuidRegex);
  });

  it('should have an occurredOn date', () => {
    const before = new Date();
    const event = new OrderCreatedEvent('order-123', 'cust-1', 50, 'USD');
    const after = new Date();

    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  describe('toPrimitives()', () => {
    it('should return expected structure', () => {
      const event = new OrderCreatedEvent(
        'order-123',
        'customer-456',
        99.99,
        'USD',
      );

      const primitives = event.toPrimitives();

      expect(primitives).toEqual({
        eventId: event.eventId,
        occurredOn: event.occurredOn.toISOString(),
        aggregateId: 'order-123',
        eventType: 'OrderCreated',
        customerId: 'customer-456',
        totalAmount: 99.99,
        currency: 'USD',
      });
    });
  });
});

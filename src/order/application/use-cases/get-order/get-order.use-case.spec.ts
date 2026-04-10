import { GetOrderUseCase } from './get-order.use-case';
import {
  IOrderRepository,
  Order,
  OrderItem,
  Money,
  ShippingAddress,
  OrderNotFoundError,
} from '@order/domain';

describe('GetOrderUseCase', () => {
  let useCase: GetOrderUseCase;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;

  beforeEach(() => {
    mockOrderRepository = {
      save: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      updateStatus: jest.fn(),
    };

    useCase = new GetOrderUseCase(mockOrderRepository);
  });

  it('should return the order when found', async () => {
    const orderId = 'order-123';
    const items = [
      OrderItem.create('item-1', {
        orderId,
        productId: 'prod-1',
        productName: 'Widget',
        quantity: 2,
        unitPrice: Money.create(10, 'USD'),
      }),
    ];
    const shippingAddress = ShippingAddress.create(
      '123 Main St',
      'Springfield',
      'IL',
      '62701',
      'US',
    );
    const order = Order.create(orderId, 'cust-1', items, shippingAddress, 'USD');
    // Clear events so they don't interfere
    order.clearDomainEvents();

    mockOrderRepository.findById.mockResolvedValue(order);

    const result = await useCase.execute({ orderId });

    expect(result.id).toBe(orderId);
    expect(result.customerId).toBe('cust-1');
    expect(result.status).toBe('PENDING');
    expect(result.items).toHaveLength(1);
    expect(result.totalAmount).toBe(20);
    expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
  });

  it('should throw OrderNotFoundError when order does not exist', async () => {
    mockOrderRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ orderId: 'nonexistent-id' }),
    ).rejects.toThrow(OrderNotFoundError);
  });
});

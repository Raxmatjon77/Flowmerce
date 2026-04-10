import { UpdateOrderStatusUseCase } from './update-order-status.use-case';
import {
  IOrderRepository,
  Order,
  OrderItem,
  Money,
  ShippingAddress,
  OrderStatus,
  OrderStatusEnum,
  OrderNotFoundError,
} from '@order/domain';
import { IEventPublisher } from '@shared/application';

describe('UpdateOrderStatusUseCase', () => {
  let useCase: UpdateOrderStatusUseCase;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockEventPublisher: jest.Mocked<IEventPublisher>;

  beforeEach(() => {
    mockOrderRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      updateStatus: jest.fn(),
    };

    mockEventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishAll: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new UpdateOrderStatusUseCase(mockOrderRepository, mockEventPublisher);
  });

  function createOrderWithStatus(
    orderId: string,
    status: OrderStatus,
  ): Order {
    const items = [
      OrderItem.create('item-1', {
        orderId,
        productId: 'prod-1',
        productName: 'Widget',
        quantity: 1,
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
    return Order.reconstitute(
      orderId,
      {
        customerId: 'cust-1',
        items,
        status,
        shippingAddress,
        totalAmount: Money.create(10, 'USD'),
      },
      new Date(),
      new Date(),
    );
  }

  it('should update status to INVENTORY_RESERVED', async () => {
    const order = createOrderWithStatus('order-1', OrderStatus.pending());
    mockOrderRepository.findById.mockResolvedValue(order);

    const result = await useCase.execute({
      orderId: 'order-1',
      status: OrderStatusEnum.INVENTORY_RESERVED,
    });

    expect(result.orderId).toBe('order-1');
    expect(result.status).toBe('INVENTORY_RESERVED');
    expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
    expect(mockEventPublisher.publishAll).toHaveBeenCalledTimes(1);
  });

  it('should update status to PAYMENT_PROCESSED', async () => {
    const order = createOrderWithStatus(
      'order-1',
      OrderStatus.inventoryReserved(),
    );
    mockOrderRepository.findById.mockResolvedValue(order);

    const result = await useCase.execute({
      orderId: 'order-1',
      status: OrderStatusEnum.PAYMENT_PROCESSED,
    });

    expect(result.status).toBe('PAYMENT_PROCESSED');
    expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
    expect(mockEventPublisher.publishAll).toHaveBeenCalledTimes(1);
  });

  it('should update status to SHIPPED', async () => {
    const order = createOrderWithStatus('order-1', OrderStatus.confirmed());
    mockOrderRepository.findById.mockResolvedValue(order);

    const result = await useCase.execute({
      orderId: 'order-1',
      status: OrderStatusEnum.SHIPPED,
    });

    expect(result.status).toBe('SHIPPED');
    expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should update status to DELIVERED', async () => {
    const order = createOrderWithStatus('order-1', OrderStatus.shipped());
    mockOrderRepository.findById.mockResolvedValue(order);

    const result = await useCase.execute({
      orderId: 'order-1',
      status: OrderStatusEnum.DELIVERED,
    });

    expect(result.status).toBe('DELIVERED');
    expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw OrderNotFoundError when order does not exist', async () => {
    mockOrderRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        orderId: 'nonexistent',
        status: OrderStatusEnum.INVENTORY_RESERVED,
      }),
    ).rejects.toThrow(OrderNotFoundError);

    expect(mockOrderRepository.save).not.toHaveBeenCalled();
  });

  it('should throw an error on unsupported status', async () => {
    const order = createOrderWithStatus('order-1', OrderStatus.pending());
    mockOrderRepository.findById.mockResolvedValue(order);

    await expect(
      useCase.execute({
        orderId: 'order-1',
        status: 'UNKNOWN_STATUS' as OrderStatusEnum,
      }),
    ).rejects.toThrow('Unsupported status transition');
  });
});

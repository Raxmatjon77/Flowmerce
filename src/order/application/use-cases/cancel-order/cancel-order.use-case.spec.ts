import { CancelOrderUseCase } from './cancel-order.use-case';
import {
  IOrderRepository,
  Order,
  OrderItem,
  Money,
  ShippingAddress,
  OrderNotFoundError,
} from '@order/domain';
import { IEventPublisher } from '@shared/application';
import { IOrderWorkflowOrchestrator } from '../../ports/workflow-orchestrator.port';

describe('CancelOrderUseCase', () => {
  let useCase: CancelOrderUseCase;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockEventPublisher: jest.Mocked<IEventPublisher>;
  let mockWorkflowOrchestrator: jest.Mocked<IOrderWorkflowOrchestrator>;

  beforeEach(() => {
    mockOrderRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      updateStatus: jest.fn(),
    };

    mockEventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishAll: jest.fn().mockResolvedValue(undefined),
    };

    mockWorkflowOrchestrator = {
      startOrderProcessing: jest.fn(),
      confirmOrder: jest.fn(),
      cancelOrderWorkflow: jest.fn().mockResolvedValue(undefined),
      getWorkflowStatus: jest.fn(),
    };

    useCase = new CancelOrderUseCase(
      mockOrderRepository,
      mockEventPublisher,
      mockWorkflowOrchestrator,
    );
  });

  function createTestOrder(orderId: string): Order {
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
    const order = Order.create(orderId, 'cust-1', items, shippingAddress, 'USD');
    order.clearDomainEvents();
    return order;
  }

  it('should cancel the order, save it, and publish domain events', async () => {
    const orderId = 'order-123';
    const order = createTestOrder(orderId);
    mockOrderRepository.findById.mockResolvedValue(order);

    const result = await useCase.execute({ orderId });

    expect(mockWorkflowOrchestrator.cancelOrderWorkflow).toHaveBeenCalledWith(orderId);
    expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
    const savedOrder = mockOrderRepository.save.mock.calls[0][0];
    expect(savedOrder.status.toString()).toBe('CANCELLED');

    expect(mockEventPublisher.publishAll).toHaveBeenCalledTimes(1);
    const publishedEvents = mockEventPublisher.publishAll.mock.calls[0][0];
    expect(publishedEvents.length).toBeGreaterThanOrEqual(1);

    expect(result.message).toContain(orderId);
  });

  it('should throw OrderNotFoundError when order does not exist', async () => {
    mockOrderRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ orderId: 'nonexistent-id' }),
    ).rejects.toThrow(OrderNotFoundError);

    expect(mockWorkflowOrchestrator.cancelOrderWorkflow).not.toHaveBeenCalled();
    expect(mockOrderRepository.save).not.toHaveBeenCalled();
    expect(mockEventPublisher.publishAll).not.toHaveBeenCalled();
  });
});

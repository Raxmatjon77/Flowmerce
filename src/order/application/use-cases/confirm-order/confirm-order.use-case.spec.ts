import { ConfirmOrderUseCase } from './confirm-order.use-case';
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

describe('ConfirmOrderUseCase', () => {
  let useCase: ConfirmOrderUseCase;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockEventPublisher: jest.Mocked<IEventPublisher>;
  let mockWorkflowOrchestrator: jest.Mocked<IOrderWorkflowOrchestrator>;

  beforeEach(() => {
    mockOrderRepository = {
      save: jest.fn(),
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
      confirmOrder: jest.fn().mockResolvedValue(undefined),
      cancelOrderWorkflow: jest.fn(),
      getWorkflowStatus: jest.fn(),
    };

    useCase = new ConfirmOrderUseCase(
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

  it('should send confirmation signal via orchestrator', async () => {
    const orderId = 'order-123';
    const order = createTestOrder(orderId);
    mockOrderRepository.findById.mockResolvedValue(order);

    const result = await useCase.execute({ orderId });

    expect(mockWorkflowOrchestrator.confirmOrder).toHaveBeenCalledWith(orderId);
    expect(result.message).toContain(orderId);
  });

  it('should throw OrderNotFoundError when order does not exist', async () => {
    mockOrderRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ orderId: 'nonexistent-id' }),
    ).rejects.toThrow(OrderNotFoundError);

    expect(mockWorkflowOrchestrator.confirmOrder).not.toHaveBeenCalled();
  });
});

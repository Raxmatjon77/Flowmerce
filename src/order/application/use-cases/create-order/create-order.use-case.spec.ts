import { CreateOrderUseCase } from './create-order.use-case';
import { IOrderRepository } from '@order/domain';
import { IEventPublisher } from '@shared/application';
import { IOrderWorkflowOrchestrator } from '../../ports/workflow-orchestrator.port';
import { CreateOrderDto } from '../../dtos/create-order.dto';

jest.mock('uuid', () => ({
  v4: jest
    .fn()
    .mockReturnValueOnce('order-id-1')
    .mockReturnValueOnce('item-id-1')
    .mockReturnValueOnce('item-id-2'),
}));

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockEventPublisher: jest.Mocked<IEventPublisher>;
  let mockWorkflowOrchestrator: jest.Mocked<IOrderWorkflowOrchestrator>;

  const validInput: CreateOrderDto = {
    customerId: 'customer-123',
    items: [
      {
        productId: 'prod-1',
        productName: 'Widget A',
        quantity: 2,
        unitPrice: 10.0,
        currency: 'USD',
      },
      {
        productId: 'prod-2',
        productName: 'Widget B',
        quantity: 1,
        unitPrice: 25.5,
        currency: 'USD',
      },
    ],
    shippingAddress: {
      street: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      country: 'US',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Re-setup uuid mock for each test
    const { v4 } = require('uuid');
    v4.mockReset()
      .mockReturnValueOnce('order-id-1')
      .mockReturnValueOnce('item-id-1')
      .mockReturnValueOnce('item-id-2');

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

    mockWorkflowOrchestrator = {
      startOrderProcessing: jest.fn().mockResolvedValue(undefined),
      confirmOrder: jest.fn(),
      cancelOrderWorkflow: jest.fn(),
      getWorkflowStatus: jest.fn(),
    };

    useCase = new CreateOrderUseCase(
      mockOrderRepository,
      mockEventPublisher,
      mockWorkflowOrchestrator,
    );
  });

  it('should create an order and return a proper OrderResponseDto', async () => {
    const result = await useCase.execute(validInput);

    expect(result.id).toBe('order-id-1');
    expect(result.customerId).toBe('customer-123');
    expect(result.status).toBe('PENDING');
    expect(result.items).toHaveLength(2);
    expect(result.totalAmount).toBe(45.5);
    expect(result.currency).toBe('USD');
    expect(result.shippingAddress).toEqual({
      street: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      country: 'US',
    });
  });

  it('should save the order to the repository', async () => {
    await useCase.execute(validInput);

    expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
    const savedOrder = mockOrderRepository.save.mock.calls[0][0];
    expect(savedOrder.id).toBe('order-id-1');
    expect(savedOrder.customerId).toBe('customer-123');
    expect(savedOrder.items).toHaveLength(2);
  });

  it('should publish domain events via eventPublisher.publishAll()', async () => {
    await useCase.execute(validInput);

    expect(mockEventPublisher.publishAll).toHaveBeenCalledTimes(1);
    const publishedEvents = mockEventPublisher.publishAll.mock.calls[0][0];
    expect(publishedEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('should start the order processing workflow with correct input', async () => {
    await useCase.execute(validInput);

    expect(mockWorkflowOrchestrator.startOrderProcessing).toHaveBeenCalledTimes(1);
    const workflowInput =
      mockWorkflowOrchestrator.startOrderProcessing.mock.calls[0][0];

    expect(workflowInput.orderId).toBe('order-id-1');
    expect(workflowInput.customerId).toBe('customer-123');
    expect(workflowInput.items).toEqual([
      { sku: 'prod-1', quantity: 2 },
      { sku: 'prod-2', quantity: 1 },
    ]);
    expect(workflowInput.paymentDetails.amount).toBe(45.5);
    expect(workflowInput.paymentDetails.currency).toBe('USD');
    expect(workflowInput.shippingAddress).toEqual(validInput.shippingAddress);
  });

  it('should return items with correct prices in the response', async () => {
    const result = await useCase.execute(validInput);

    expect(result.items[0].productId).toBe('prod-1');
    expect(result.items[0].unitPrice).toBe(10.0);
    expect(result.items[0].totalPrice).toBe(20.0);
    expect(result.items[0].quantity).toBe(2);

    expect(result.items[1].productId).toBe('prod-2');
    expect(result.items[1].unitPrice).toBe(25.5);
    expect(result.items[1].totalPrice).toBe(25.5);
    expect(result.items[1].quantity).toBe(1);
  });
});

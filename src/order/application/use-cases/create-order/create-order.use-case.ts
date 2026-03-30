import { v4 as uuidv4 } from 'uuid';
import { IUseCase } from '@shared/application';
import { IEventPublisher } from '@shared/application';
import {
  Order,
  OrderItem,
  Money,
  ShippingAddress,
  IOrderRepository,
} from '@order/domain';
import { IOrderWorkflowOrchestrator } from '../../ports/workflow-orchestrator.port';
import { CreateOrderDto } from '../../dtos/create-order.dto';
import { OrderResponseDto } from '../../dtos/order-response.dto';
import { toOrderResponseDto } from '../order-response.mapper';

export class CreateOrderUseCase
  implements IUseCase<CreateOrderDto, OrderResponseDto>
{
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly workflowOrchestrator: IOrderWorkflowOrchestrator,
  ) {}

  async execute(input: CreateOrderDto): Promise<OrderResponseDto> {
    const orderId = uuidv4();
    const currency = input.items[0]?.currency || 'USD';

    // Create domain entities
    const orderItems = input.items.map((item) =>
      OrderItem.create(uuidv4(), {
        orderId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Money.create(item.unitPrice, item.currency || currency),
      }),
    );

    const shippingAddress = ShippingAddress.create(
      input.shippingAddress.street,
      input.shippingAddress.city,
      input.shippingAddress.state,
      input.shippingAddress.zipCode,
      input.shippingAddress.country,
    );

    const order = Order.create(
      orderId,
      input.customerId,
      orderItems,
      shippingAddress,
      currency,
    );

    // Persist order
    await this.orderRepository.save(order);

    // Publish domain events
    const domainEvents = order.clearDomainEvents();
    await this.eventPublisher.publishAll(domainEvents);

    // Start workflow orchestration
    await this.workflowOrchestrator.startOrderProcessing({
      orderId,
      customerId: input.customerId,
      items: input.items.map((item) => ({
        sku: item.productId,
        quantity: item.quantity,
      })),
      paymentDetails: {
        amount: order.totalAmount.amount,
        currency,
        method: {
          type: 'CREDIT_CARD',
          last4Digits: '0000',
          expiryMonth: 12,
          expiryYear: 2027,
        },
      },
      shippingAddress: input.shippingAddress,
    });

    return toOrderResponseDto(order);
  }
}

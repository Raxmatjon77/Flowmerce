import { IUseCase, IEventPublisher } from '@shared/application';
import { IOrderRepository, OrderNotFoundError, OrderStatusEnum } from '@order/domain';

export interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatusEnum;
}

export interface UpdateOrderStatusOutput {
  orderId: string;
  status: string;
}

export class UpdateOrderStatusUseCase
  implements IUseCase<UpdateOrderStatusInput, UpdateOrderStatusOutput>
{
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: UpdateOrderStatusInput): Promise<UpdateOrderStatusOutput> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    // Idempotency / out-of-order protection:
    // Kafka events can arrive late or be duplicated; in those cases we should not throw,
    // otherwise the consumer will retry/DLQ and spam errors.
    if (order.status.value === input.status) {
      return { orderId: order.id, status: order.status.toString() };
    }

    switch (input.status) {
      case OrderStatusEnum.INVENTORY_RESERVED:
        try {
          order.reserveInventory();
        } catch {
          return { orderId: order.id, status: order.status.toString() };
        }
        break;
      case OrderStatusEnum.PAYMENT_PROCESSED:
        try {
          order.processPayment();
        } catch {
          return { orderId: order.id, status: order.status.toString() };
        }
        break;
      case OrderStatusEnum.SHIPPED:
        try {
          order.ship();
        } catch {
          return { orderId: order.id, status: order.status.toString() };
        }
        break;
      case OrderStatusEnum.DELIVERED:
        try {
          order.deliver();
        } catch {
          return { orderId: order.id, status: order.status.toString() };
        }
        break;
      default:
        throw new Error(`Unsupported status transition: ${input.status}`);
    }

    await this.orderRepository.save(order);

    const domainEvents = order.clearDomainEvents();
    await this.eventPublisher.publishAll(domainEvents);

    return {
      orderId: order.id,
      status: order.status.toString(),
    };
  }
}

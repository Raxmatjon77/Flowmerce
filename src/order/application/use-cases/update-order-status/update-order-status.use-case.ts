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

    switch (input.status) {
      case OrderStatusEnum.INVENTORY_RESERVED:
        order.reserveInventory();
        break;
      case OrderStatusEnum.PAYMENT_PROCESSED:
        order.processPayment();
        break;
      case OrderStatusEnum.SHIPPED:
        order.ship();
        break;
      case OrderStatusEnum.DELIVERED:
        order.deliver();
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

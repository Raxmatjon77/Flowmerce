import { IUseCase } from '@shared/application';
import { IEventPublisher } from '@shared/application';
import { IOrderRepository, OrderNotFoundError } from '@order/domain';

export interface CancelOrderInput {
  orderId: string;
}

export class CancelOrderUseCase
  implements IUseCase<CancelOrderInput, void>
{
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: CancelOrderInput): Promise<void> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    order.cancel();

    await this.orderRepository.save(order);

    const domainEvents = order.clearDomainEvents();
    await this.eventPublisher.publishAll(domainEvents);
  }
}

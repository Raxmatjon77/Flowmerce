import { IUseCase } from '@shared/application';
import { IEventPublisher } from '@shared/application';
import { IOrderRepository, OrderNotFoundError } from '@order/domain';

export interface ConfirmOrderInput {
  orderId: string;
}

export class ConfirmOrderUseCase
  implements IUseCase<ConfirmOrderInput, void>
{
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: ConfirmOrderInput): Promise<void> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    order.confirm();

    await this.orderRepository.save(order);

    const domainEvents = order.clearDomainEvents();
    await this.eventPublisher.publishAll(domainEvents);
  }
}

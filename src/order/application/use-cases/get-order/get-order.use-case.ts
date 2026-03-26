import { IUseCase } from '@shared/application';
import { IOrderRepository, OrderNotFoundError } from '@order/domain';
import { OrderResponseDto } from '../../dtos/order-response.dto';
import { toOrderResponseDto } from '../order-response.mapper';

export interface GetOrderInput {
  orderId: string;
}

export class GetOrderUseCase
  implements IUseCase<GetOrderInput, OrderResponseDto>
{
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(input: GetOrderInput): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    return toOrderResponseDto(order);
  }
}

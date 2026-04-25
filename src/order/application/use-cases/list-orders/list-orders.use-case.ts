import { IUseCase } from '@shared/application';
import { IOrderRepository } from '@order/domain';
import { OrderResponseDto } from '../../dtos/order-response.dto';
import { toOrderResponseDto } from '../order-response.mapper';
import { Role } from '../../../../shared/infrastructure/auth/auth.constants';

export interface ListOrdersInput {
  customerId?: string;
  status?: string;
  limit?: number;
  page?: number;
  callerRole: Role;
  callerId: string;
}

export interface ListOrdersOutput {
  data: OrderResponseDto[];
  meta: { total: number; limit: number };
}

export class ListOrdersUseCase
  implements IUseCase<ListOrdersInput, ListOrdersOutput>
{
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(input: ListOrdersInput): Promise<ListOrdersOutput> {
    // Customers can only see their own orders
    const resolvedCustomerId =
      input.callerRole === Role.CUSTOMER ? input.callerId : input.customerId;

    const limit = input.limit ?? 20;
    const page = input.page ?? 1;

    const findAllPaginated = this.orderRepository.findAllPaginated?.bind(
      this.orderRepository,
    );

    if (!findAllPaginated) {
      throw new Error('Repository does not support paginated listing');
    }

    const { orders, total } = await findAllPaginated({
      customerId: resolvedCustomerId,
      status: input.status,
      limit,
      page,
    });

    return {
      data: orders.map(toOrderResponseDto),
      meta: { total, limit },
    };
  }
}

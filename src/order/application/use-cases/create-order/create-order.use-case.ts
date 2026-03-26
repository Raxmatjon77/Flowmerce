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
import { CreateOrderDto } from '../../dtos/create-order.dto';
import { OrderResponseDto } from '../../dtos/order-response.dto';
import { toOrderResponseDto } from '../order-response.mapper';

export class CreateOrderUseCase
  implements IUseCase<CreateOrderDto, OrderResponseDto>
{
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: CreateOrderDto): Promise<OrderResponseDto> {
    const orderId = uuidv4();

    const currency = input.items[0].currency;

    const orderItems = input.items.map((item) =>
      OrderItem.create(uuidv4(), {
        orderId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Money.create(item.unitPrice, item.currency),
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

    await this.orderRepository.save(order);

    const domainEvents = order.clearDomainEvents();
    await this.eventPublisher.publishAll(domainEvents);

    return toOrderResponseDto(order);
  }
}

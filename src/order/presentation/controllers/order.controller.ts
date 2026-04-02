import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Inject,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Idempotent, IdempotencyGuard, IdempotencyInterceptor } from '@shared/infrastructure/idempotency';
import { CreateOrderUseCase } from '@order/application/use-cases/create-order/create-order.use-case';
import { GetOrderUseCase } from '@order/application/use-cases/get-order/get-order.use-case';
import { ConfirmOrderUseCase } from '@order/application/use-cases/confirm-order/confirm-order.use-case';
import { CancelOrderUseCase } from '@order/application/use-cases/cancel-order/cancel-order.use-case';
import { ORDER_USE_CASE_TOKENS } from '@order/application/injection-tokens';
import { OrderResponseDto } from '@order/application/dtos/order-response.dto';
import { CreateOrderRequest } from '../dto/create-order.request';

@Controller('api/v1/orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(
    @Inject(ORDER_USE_CASE_TOKENS.CREATE)
    private readonly createOrderUseCase: CreateOrderUseCase,
    @Inject(ORDER_USE_CASE_TOKENS.GET)
    private readonly getOrderUseCase: GetOrderUseCase,
    @Inject(ORDER_USE_CASE_TOKENS.CONFIRM)
    private readonly confirmOrderUseCase: ConfirmOrderUseCase,
    @Inject(ORDER_USE_CASE_TOKENS.CANCEL)
    private readonly cancelOrderUseCase: CancelOrderUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Idempotent()
  @UseGuards(IdempotencyGuard)
  @UseInterceptors(IdempotencyInterceptor)
  async createOrder(
    @Body() request: CreateOrderRequest,
  ): Promise<OrderResponseDto> {
    this.logger.log(`Creating order for customer ${request.customerId}`);

    return this.createOrderUseCase.execute({
      customerId: request.customerId,
      items: request.items,
      shippingAddress: request.shippingAddress,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getOrder(@Param('id') id: string): Promise<OrderResponseDto> {
    this.logger.log(`Getting order ${id}`);
    return this.getOrderUseCase.execute({ orderId: id });
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmOrder(@Param('id') id: string): Promise<{ message: string }> {
    this.logger.log(`Confirming order ${id}`);
    return this.confirmOrderUseCase.execute({ orderId: id });
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(@Param('id') id: string): Promise<{ message: string }> {
    this.logger.log(`Cancelling order ${id}`);
    return this.cancelOrderUseCase.execute({ orderId: id });
  }
}

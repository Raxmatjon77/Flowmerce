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
} from '@nestjs/common';
import { Client } from '@temporalio/client';
import { TEMPORAL_CLIENT } from '@shared/infrastructure/temporal/temporal.module';
import { CreateOrderUseCase } from '@order/application/use-cases/create-order/create-order.use-case';
import { GetOrderUseCase } from '@order/application/use-cases/get-order/get-order.use-case';
import { CancelOrderUseCase } from '@order/application/use-cases/cancel-order/cancel-order.use-case';
import { OrderResponseDto } from '@order/application/dtos/order-response.dto';
import { CreateOrderRequest } from '../dto/create-order.request';
import {
  orderProcessingWorkflow,
  confirmOrderSignal,
} from '@order/infrastructure/temporal/workflows/order-processing.workflow';

@Controller('api/v1/orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(
    @Inject('CreateOrderUseCase')
    private readonly createOrderUseCase: CreateOrderUseCase,
    @Inject('GetOrderUseCase')
    private readonly getOrderUseCase: GetOrderUseCase,
    @Inject('CancelOrderUseCase')
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    @Inject(TEMPORAL_CLIENT)
    private readonly temporalClient: Client,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Body() request: CreateOrderRequest,
  ): Promise<OrderResponseDto> {
    this.logger.log(
      `Creating order for customer ${request.customerId} with ${request.items.length} items`,
    );

    const orderResponse = await this.createOrderUseCase.execute({
      customerId: request.customerId,
      items: request.items,
      shippingAddress: request.shippingAddress,
    });

    // Start the Temporal order processing workflow
    try {
      await this.temporalClient.workflow.start(orderProcessingWorkflow, {
        workflowId: `order-processing-${orderResponse.id}`,
        taskQueue: 'order-processing',
        args: [
          {
            orderId: orderResponse.id,
            customerId: request.customerId,
            items: request.items.map((item) => ({
              sku: item.productId,
              quantity: item.quantity,
            })),
            paymentDetails: {
              amount: orderResponse.totalAmount,
              currency: orderResponse.currency,
              method: {
                type: 'CREDIT_CARD',
                last4Digits: '0000',
                expiryMonth: 12,
                expiryYear: 2027,
              },
            },
            shippingAddress: request.shippingAddress,
          },
        ],
      });

      this.logger.log(
        `Temporal workflow started for order ${orderResponse.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to start Temporal workflow for order ${orderResponse.id}: ${error}`,
      );
      // Order was already created in DB — workflow start failure is non-fatal
      // A recovery mechanism can re-trigger the workflow later
    }

    return orderResponse;
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

    const handle = this.temporalClient.workflow.getHandle(
      `order-processing-${id}`,
    );
    await handle.signal(confirmOrderSignal);

    return { message: `Order ${id} confirmation signal sent` };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(@Param('id') id: string): Promise<{ message: string }> {
    this.logger.log(`Cancelling order ${id}`);
    await this.cancelOrderUseCase.execute({ orderId: id });
    return { message: `Order ${id} has been cancelled` };
  }
}

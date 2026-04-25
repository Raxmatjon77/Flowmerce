import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  Req,
  Inject,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Roles, Role } from '@shared/infrastructure/auth';
import { Idempotent, IdempotencyGuard, IdempotencyInterceptor } from '@shared/infrastructure/idempotency';
import { CreateOrderUseCase } from '@order/application/use-cases/create-order/create-order.use-case';
import { GetOrderUseCase } from '@order/application/use-cases/get-order/get-order.use-case';
import { ConfirmOrderUseCase } from '@order/application/use-cases/confirm-order/confirm-order.use-case';
import { CancelOrderUseCase } from '@order/application/use-cases/cancel-order/cancel-order.use-case';
import { ListOrdersUseCase, ListOrdersOutput } from '@order/application/use-cases/list-orders/list-orders.use-case';
import { ORDER_USE_CASE_TOKENS } from '@order/application/injection-tokens';
import { OrderResponseDto } from '@order/application/dtos/order-response.dto';
import { CreateOrderRequest } from '../dto/create-order.request';

@ApiTags('Orders')
@ApiBearerAuth()
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
    @Inject(ORDER_USE_CASE_TOKENS.LIST)
    private readonly listOrdersUseCase: ListOrdersUseCase,
  ) {}

  @Get()
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List orders (customers see only their own)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Page size' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiResponse({ status: 200, description: 'Orders list returned' })
  async listOrders(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Req() req?: any,
  ): Promise<ListOrdersOutput> {
    const callerId: string = req.user.sub;
    const callerRole: Role = req.user.role;

    this.logger.log(`Listing orders for caller ${callerId} with role ${callerRole}`);

    return this.listOrdersUseCase.execute({
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      callerRole,
      callerId,
    });
  }

  @Post()
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @Idempotent()
  @UseGuards(IdempotencyGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
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
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param('id') id: string): Promise<OrderResponseDto> {
    this.logger.log(`Getting order ${id}`);
    return this.getOrderUseCase.execute({ orderId: id });
  }

  @Post(':id/confirm')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order confirmed' })
  async confirmOrder(@Param('id') id: string): Promise<{ message: string }> {
    this.logger.log(`Confirming order ${id}`);
    return this.confirmOrderUseCase.execute({ orderId: id });
  }

  @Post(':id/cancel')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 403, description: 'Forbidden: customers can only cancel their own orders' })
  async cancelOrder(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<{ message: string }> {
    this.logger.log(`Cancelling order ${id}`);
    return this.cancelOrderUseCase.execute({
      orderId: id,
      requesterId: req.user.sub,
      requesterRole: req.user.role,
    });
  }
}

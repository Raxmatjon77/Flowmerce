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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Roles, Role } from '@shared/infrastructure/auth';
import { ProcessPaymentUseCase } from '@payment/application/use-cases/process-payment/process-payment.use-case';
import { RefundPaymentUseCase } from '@payment/application/use-cases/refund-payment/refund-payment.use-case';
import { GetPaymentUseCase } from '@payment/application/use-cases/get-payment/get-payment.use-case';
import { PAYMENT_USE_CASE_TOKENS } from '@payment/application/injection-tokens';
import { PaymentResponseDto } from '@payment/application/dtos/payment-response.dto';
import { ProcessPaymentRequest } from '../dto/process-payment.request';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('api/v1/payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    @Inject(PAYMENT_USE_CASE_TOKENS.PROCESS)
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
    @Inject(PAYMENT_USE_CASE_TOKENS.REFUND)
    private readonly refundPaymentUseCase: RefundPaymentUseCase,
    @Inject(PAYMENT_USE_CASE_TOKENS.GET)
    private readonly getPaymentUseCase: GetPaymentUseCase,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.SERVICE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Process a payment' })
  @ApiResponse({ status: 201, description: 'Payment processed', type: PaymentResponseDto })
  async processPayment(
    @Body() request: ProcessPaymentRequest,
  ): Promise<PaymentResponseDto> {
    this.logger.log(`Processing payment for order ${request.orderId}`);

    return this.processPaymentUseCase.execute({
      orderId: request.orderId,
      amount: request.amount,
      currency: request.currency,
      method: {
        type: request.method.type,
        last4Digits: request.method.last4Digits,
        expiryMonth: request.method.expiryMonth,
        expiryYear: request.method.expiryYear,
      },
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SERVICE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved', type: PaymentResponseDto })
  async getPayment(@Param('id') id: string): Promise<PaymentResponseDto> {
    this.logger.log(`Getting payment for order ${id}`);
    return this.getPaymentUseCase.execute({ orderId: id });
  }

  @Post(':id/refund')
  @Roles(Role.ADMIN, Role.SERVICE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Refund initiated' })
  async refundPayment(@Param('id') id: string): Promise<{ message: string }> {
    this.logger.log(`Refunding payment ${id}`);
    await this.refundPaymentUseCase.execute({ paymentId: id });
    return { message: `Payment ${id} refund initiated` };
  }
}

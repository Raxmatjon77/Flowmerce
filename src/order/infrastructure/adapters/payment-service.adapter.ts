import { Injectable } from '@nestjs/common';
import {
  IPaymentServicePort,
  PaymentResult,
} from '@order/application/ports/payment-service.port';
import { ProcessPaymentUseCase } from '@payment/application/use-cases/process-payment/process-payment.use-case';
import { RefundPaymentUseCase } from '@payment/application/use-cases/refund-payment/refund-payment.use-case';
import { PaymentStatusEnum } from '@payment/domain';

@Injectable()
export class PaymentServiceAdapter implements IPaymentServicePort {
  constructor(
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
    private readonly refundPaymentUseCase: RefundPaymentUseCase,
  ) {}

  async processPayment(
    orderId: string,
    amount: number,
    currency: string,
    method: {
      type: string;
      last4Digits: string;
      expiryMonth: number;
      expiryYear: number;
    },
  ): Promise<PaymentResult> {
    const response = await this.processPaymentUseCase.execute({
      orderId,
      amount,
      currency,
      method,
    });

    const isSuccess = response.status === PaymentStatusEnum.COMPLETED;

    return {
      paymentId: response.id,
      transactionId: response.transactionId ?? '',
      success: isSuccess,
      failureReason: isSuccess ? undefined : `Payment status: ${response.status}`,
    };
  }

  async refundPayment(paymentId: string): Promise<void> {
    await this.refundPaymentUseCase.execute({ paymentId });
  }
}

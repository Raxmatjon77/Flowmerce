import { Payment } from '@payment/domain';
import { PaymentResponseDto } from '../dtos/payment-response.dto';

export function toPaymentResponseDto(payment: Payment): PaymentResponseDto {
  return {
    id: payment.id,
    orderId: payment.orderId,
    amount: payment.amount.amount,
    currency: payment.amount.currency,
    status: payment.status.toString(),
    transactionId: payment.transactionId,
    createdAt: payment.createdAt,
  };
}

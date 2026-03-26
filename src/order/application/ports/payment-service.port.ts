export const PAYMENT_SERVICE_PORT = Symbol('IPaymentServicePort');

export interface PaymentResult {
  paymentId: string;
  transactionId: string;
  success: boolean;
  failureReason?: string;
}

export interface IPaymentServicePort {
  processPayment(
    orderId: string,
    amount: number,
    currency: string,
    method: { type: string; last4Digits: string; expiryMonth: number; expiryYear: number },
  ): Promise<PaymentResult>;

  refundPayment(paymentId: string): Promise<void>;
}

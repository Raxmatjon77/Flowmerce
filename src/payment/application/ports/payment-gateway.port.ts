export const PAYMENT_GATEWAY = Symbol('IPaymentGateway');

export interface PaymentGatewayMethod {
  type: string;
  last4Digits: string;
  expiryMonth: number;
  expiryYear: number;
}

export interface PaymentGatewayResult {
  transactionId: string;
  success: boolean;
  failureReason?: string;
}

export interface IPaymentGateway {
  charge(
    amount: number,
    currency: string,
    method: PaymentGatewayMethod,
  ): Promise<PaymentGatewayResult>;
}

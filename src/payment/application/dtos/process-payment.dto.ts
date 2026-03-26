export interface ProcessPaymentMethodDto {
  type: string;
  last4Digits: string;
  expiryMonth: number;
  expiryYear: number;
}

export interface ProcessPaymentDto {
  orderId: string;
  amount: number;
  currency: string;
  method: ProcessPaymentMethodDto;
}

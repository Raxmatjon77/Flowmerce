export interface PaymentResponseDto {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  transactionId: string | null;
  createdAt: Date;
}

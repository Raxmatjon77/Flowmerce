import {
  Payment,
  Money,
  PaymentStatus,
  PaymentMethod,
  PaymentMethodType,
} from '@payment/domain';
import { PaymentTable } from '../tables/payment.table';

export interface PaymentRow {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method_type: string;
  method_last4: string;
  method_expiry_month: number;
  method_expiry_year: number;
  transaction_id: string | null;
  failure_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export class PaymentMapper {
  static toDomain(row: PaymentRow): Payment {
    return Payment.reconstitute(
      row.id,
      {
        orderId: row.order_id,
        amount: Money.create(row.amount, row.currency),
        status: PaymentStatus.fromString(row.status),
        method: PaymentMethod.create(
          row.method_type as PaymentMethodType,
          row.method_last4,
          row.method_expiry_month,
          row.method_expiry_year,
        ),
        transactionId: row.transaction_id,
        failureReason: row.failure_reason,
      },
      row.created_at,
      row.updated_at,
    );
  }

  static toPersistence(payment: Payment): Omit<
    PaymentTable,
    'created_at' | 'updated_at'
  > & {
    created_at: Date;
    updated_at: Date;
  } {
    return {
      id: payment.id,
      order_id: payment.orderId,
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      status: payment.status.value,
      method_type: payment.method.type,
      method_last4: payment.method.last4Digits,
      method_expiry_month: payment.method.expiryMonth,
      method_expiry_year: payment.method.expiryYear,
      transaction_id: payment.transactionId,
      failure_reason: payment.failureReason,
      created_at: payment.createdAt,
      updated_at: payment.updatedAt,
    };
  }
}

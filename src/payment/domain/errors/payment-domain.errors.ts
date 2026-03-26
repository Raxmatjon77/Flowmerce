export class InvalidPaymentTransitionError extends Error {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      `Invalid payment status transition from '${currentStatus}' to '${targetStatus}'`,
    );
    this.name = 'InvalidPaymentTransitionError';
  }
}

export class PaymentNotFoundError extends Error {
  constructor(paymentId: string) {
    super(`Payment not found: ${paymentId}`);
    this.name = 'PaymentNotFoundError';
  }
}

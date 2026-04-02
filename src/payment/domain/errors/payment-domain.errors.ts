import { DomainError } from '../../../shared/domain/domain-error.base';
import { ERROR_CODES } from '../../../shared/domain/error-codes';

export class InvalidPaymentTransitionError extends DomainError {
  readonly code = ERROR_CODES.INVALID_PAYMENT_TRANSITION;
  readonly httpStatus = 409;

  constructor(currentStatus: string, targetStatus: string) {
    super(
      `Invalid payment status transition from '${currentStatus}' to '${targetStatus}'`,
    );
  }
}

export class PaymentNotFoundError extends DomainError {
  readonly code = ERROR_CODES.PAYMENT_NOT_FOUND;
  readonly httpStatus = 404;

  constructor(paymentId: string) {
    super(`Payment not found: ${paymentId}`);
  }
}

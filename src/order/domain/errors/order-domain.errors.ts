import { DomainError } from '../../../shared/domain/domain-error.base';
import { ERROR_CODES } from '../../../shared/domain/error-codes';

export class InvalidOrderTransitionError extends DomainError {
  readonly code = ERROR_CODES.INVALID_ORDER_TRANSITION;
  readonly httpStatus = 409;

  constructor(currentStatus: string, targetStatus: string) {
    super(
      `Invalid order status transition from '${currentStatus}' to '${targetStatus}'`,
    );
  }
}

export class OrderNotFoundError extends DomainError {
  readonly code = ERROR_CODES.ORDER_NOT_FOUND;
  readonly httpStatus = 404;

  constructor(orderId: string) {
    super(`Order not found: ${orderId}`);
  }
}

export class InvalidOrderError extends DomainError {
  readonly code = ERROR_CODES.INVALID_ORDER;
  readonly httpStatus = 400;

  constructor(message: string) {
    super(message);
  }
}

export class OrderWorkflowNotFoundError extends DomainError {
  readonly code = ERROR_CODES.ORDER_WORKFLOW_NOT_FOUND;
  readonly httpStatus = 409;

  constructor(orderId: string) {
    super(
      `Order workflow not found for order ${orderId}. The workflow may have expired or the orchestration engine was restarted.`,
    );
  }
}

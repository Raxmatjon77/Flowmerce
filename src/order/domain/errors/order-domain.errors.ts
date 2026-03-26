export class InvalidOrderTransitionError extends Error {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      `Invalid order status transition from '${currentStatus}' to '${targetStatus}'`,
    );
    this.name = 'InvalidOrderTransitionError';
  }
}

export class OrderNotFoundError extends Error {
  constructor(orderId: string) {
    super(`Order not found: ${orderId}`);
    this.name = 'OrderNotFoundError';
  }
}

export class InvalidOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOrderError';
  }
}

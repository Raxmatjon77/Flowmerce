import { DomainError } from '../../../shared/domain/domain-error.base';
import { ERROR_CODES } from '../../../shared/domain/error-codes';

export class InsufficientInventoryError extends DomainError {
  readonly code = ERROR_CODES.INSUFFICIENT_INVENTORY;
  readonly httpStatus = 409;

  constructor(
    public readonly inventoryItemId: string,
    public readonly requested: number,
    public readonly available: number,
  ) {
    super(
      `Insufficient inventory for item ${inventoryItemId}: requested ${requested}, available ${available}`,
    );
  }
}

export class InventoryNotFoundError extends DomainError {
  readonly code = ERROR_CODES.INVENTORY_NOT_FOUND;
  readonly httpStatus = 404;

  constructor(public readonly identifier: string) {
    super(`Inventory item not found: ${identifier}`);
  }
}

export class InvalidReservationError extends DomainError {
  readonly code = ERROR_CODES.INVALID_RESERVATION;
  readonly httpStatus = 400;

  constructor(message: string) {
    super(message);
  }
}

import { DomainError } from '../../../shared/domain/domain-error.base';
import { ERROR_CODES } from '../../../shared/domain/error-codes';

export class InvalidShipmentTransitionError extends DomainError {
  readonly code = ERROR_CODES.INVALID_SHIPMENT_TRANSITION;
  readonly httpStatus = 409;

  constructor(
    public readonly shipmentId: string,
    public readonly fromStatus: string,
    public readonly toStatus: string,
  ) {
    super(
      `Invalid shipment transition for ${shipmentId}: ${fromStatus} -> ${toStatus}`,
    );
  }
}

export class ShipmentNotFoundError extends DomainError {
  readonly code = ERROR_CODES.SHIPMENT_NOT_FOUND;
  readonly httpStatus = 404;

  constructor(public readonly identifier: string) {
    super(`Shipment not found: ${identifier}`);
  }
}

// Value Objects
export { TrackingNumber } from './value-objects/tracking-number.value-object';
export { Carrier, CarrierCode } from './value-objects/carrier.value-object';
export {
  ShipmentStatus,
  ShipmentStatusEnum,
} from './value-objects/shipment-status.value-object';

// Entities
export { Shipment } from './entities/shipment.entity';
export type {
  ShipmentProps,
  ShippingAddress,
} from './entities/shipment.entity';

// Events
export { ShipmentCreatedEvent } from './events/shipment-created.event';
export { ShipmentDeliveredEvent } from './events/shipment-delivered.event';

// Repository Interface
export {
  SHIPMENT_REPOSITORY,
  type IShipmentRepository,
} from './repositories/shipment.repository.interface';

// Errors
export {
  InvalidShipmentTransitionError,
  ShipmentNotFoundError,
} from './errors/shipping-domain.errors';

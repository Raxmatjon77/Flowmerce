// Value Objects
export { Sku } from './value-objects/sku.value-object';
export { Quantity } from './value-objects/quantity.value-object';

// Entities
export { InventoryItem } from './entities/inventory-item.entity';
export type { InventoryItemProps } from './entities/inventory-item.entity';
export { Reservation } from './entities/reservation.entity';
export type { ReservationProps } from './entities/reservation.entity';

// Events
export { InventoryReservedEvent } from './events/inventory-reserved.event';
export { InventoryReleasedEvent } from './events/inventory-released.event';
export { InventoryDeductedEvent } from './events/inventory-deducted.event';

// Repository Interface
export {
  INVENTORY_REPOSITORY,
  type IInventoryRepository,
} from './repositories/inventory.repository.interface';

// Errors
export {
  InsufficientInventoryError,
  InventoryNotFoundError,
  InvalidReservationError,
} from './errors/inventory-domain.errors';

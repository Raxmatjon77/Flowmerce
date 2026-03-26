export class InsufficientInventoryError extends Error {
  constructor(
    public readonly inventoryItemId: string,
    public readonly requested: number,
    public readonly available: number,
  ) {
    super(
      `Insufficient inventory for item ${inventoryItemId}: requested ${requested}, available ${available}`,
    );
    this.name = 'InsufficientInventoryError';
  }
}

export class InventoryNotFoundError extends Error {
  constructor(public readonly identifier: string) {
    super(`Inventory item not found: ${identifier}`);
    this.name = 'InventoryNotFoundError';
  }
}

export class InvalidReservationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidReservationError';
  }
}

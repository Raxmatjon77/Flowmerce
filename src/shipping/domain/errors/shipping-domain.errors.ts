export class InvalidShipmentTransitionError extends Error {
  constructor(
    public readonly shipmentId: string,
    public readonly fromStatus: string,
    public readonly toStatus: string,
  ) {
    super(
      `Invalid shipment transition for ${shipmentId}: ${fromStatus} -> ${toStatus}`,
    );
    this.name = 'InvalidShipmentTransitionError';
  }
}

export class ShipmentNotFoundError extends Error {
  constructor(public readonly identifier: string) {
    super(`Shipment not found: ${identifier}`);
    this.name = 'ShipmentNotFoundError';
  }
}

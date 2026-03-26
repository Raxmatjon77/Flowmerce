export enum ShipmentStatusEnum {
  PENDING = 'PENDING',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
}

const VALID_TRANSITIONS: Record<ShipmentStatusEnum, ShipmentStatusEnum[]> = {
  [ShipmentStatusEnum.PENDING]: [
    ShipmentStatusEnum.PICKED_UP,
    ShipmentStatusEnum.RETURNED,
  ],
  [ShipmentStatusEnum.PICKED_UP]: [
    ShipmentStatusEnum.IN_TRANSIT,
    ShipmentStatusEnum.RETURNED,
  ],
  [ShipmentStatusEnum.IN_TRANSIT]: [
    ShipmentStatusEnum.DELIVERED,
    ShipmentStatusEnum.RETURNED,
  ],
  [ShipmentStatusEnum.DELIVERED]: [],
  [ShipmentStatusEnum.RETURNED]: [],
};

export class ShipmentStatus {
  private constructor(private readonly _value: ShipmentStatusEnum) {}

  static create(value: ShipmentStatusEnum): ShipmentStatus {
    return new ShipmentStatus(value);
  }

  static pending(): ShipmentStatus {
    return new ShipmentStatus(ShipmentStatusEnum.PENDING);
  }

  get value(): ShipmentStatusEnum {
    return this._value;
  }

  canTransitionTo(target: ShipmentStatusEnum): boolean {
    return VALID_TRANSITIONS[this._value].includes(target);
  }

  transitionTo(target: ShipmentStatusEnum): ShipmentStatus {
    if (!this.canTransitionTo(target)) {
      throw new Error(
        `Invalid shipment status transition: ${this._value} -> ${target}`,
      );
    }
    return new ShipmentStatus(target);
  }

  equals(other: ShipmentStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

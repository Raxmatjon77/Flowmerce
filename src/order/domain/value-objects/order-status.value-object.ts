export enum OrderStatusEnum {
  PENDING = 'PENDING',
  INVENTORY_RESERVED = 'INVENTORY_RESERVED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

const VALID_TRANSITIONS: Record<OrderStatusEnum, OrderStatusEnum[]> = {
  [OrderStatusEnum.PENDING]: [
    OrderStatusEnum.INVENTORY_RESERVED,
    OrderStatusEnum.CANCELLED,
  ],
  [OrderStatusEnum.INVENTORY_RESERVED]: [
    OrderStatusEnum.PAYMENT_PROCESSED,
    OrderStatusEnum.CANCELLED,
  ],
  [OrderStatusEnum.PAYMENT_PROCESSED]: [OrderStatusEnum.CONFIRMED],
  [OrderStatusEnum.CONFIRMED]: [OrderStatusEnum.SHIPPED],
  [OrderStatusEnum.SHIPPED]: [OrderStatusEnum.DELIVERED],
  [OrderStatusEnum.DELIVERED]: [],
  [OrderStatusEnum.CANCELLED]: [],
};

export class OrderStatus {
  private constructor(private readonly _value: OrderStatusEnum) {}

  static pending(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.PENDING);
  }

  static inventoryReserved(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.INVENTORY_RESERVED);
  }

  static paymentProcessed(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.PAYMENT_PROCESSED);
  }

  static confirmed(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.CONFIRMED);
  }

  static shipped(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.SHIPPED);
  }

  static delivered(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.DELIVERED);
  }

  static cancelled(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.CANCELLED);
  }

  static fromString(value: string): OrderStatus {
    const enumValue = OrderStatusEnum[value as keyof typeof OrderStatusEnum];
    if (!enumValue) {
      throw new Error(`Invalid order status: ${value}`);
    }
    return new OrderStatus(enumValue);
  }

  get value(): OrderStatusEnum {
    return this._value;
  }

  canTransitionTo(target: OrderStatus): boolean {
    const allowedTransitions = VALID_TRANSITIONS[this._value];
    return allowedTransitions.includes(target._value);
  }

  equals(other: OrderStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

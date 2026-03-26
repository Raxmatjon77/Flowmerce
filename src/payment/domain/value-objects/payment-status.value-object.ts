export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

const VALID_TRANSITIONS: Record<PaymentStatusEnum, PaymentStatusEnum[]> = {
  [PaymentStatusEnum.PENDING]: [PaymentStatusEnum.PROCESSING],
  [PaymentStatusEnum.PROCESSING]: [
    PaymentStatusEnum.COMPLETED,
    PaymentStatusEnum.FAILED,
  ],
  [PaymentStatusEnum.COMPLETED]: [PaymentStatusEnum.REFUNDED],
  [PaymentStatusEnum.FAILED]: [],
  [PaymentStatusEnum.REFUNDED]: [],
};

export class PaymentStatus {
  private constructor(private readonly _value: PaymentStatusEnum) {}

  static pending(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.PENDING);
  }

  static processing(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.PROCESSING);
  }

  static completed(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.COMPLETED);
  }

  static failed(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.FAILED);
  }

  static refunded(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.REFUNDED);
  }

  static fromString(value: string): PaymentStatus {
    const enumValue =
      PaymentStatusEnum[value as keyof typeof PaymentStatusEnum];
    if (!enumValue) {
      throw new Error(`Invalid payment status: ${value}`);
    }
    return new PaymentStatus(enumValue);
  }

  get value(): PaymentStatusEnum {
    return this._value;
  }

  canTransitionTo(target: PaymentStatus): boolean {
    const allowedTransitions = VALID_TRANSITIONS[this._value];
    return allowedTransitions.includes(target._value);
  }

  equals(other: PaymentStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

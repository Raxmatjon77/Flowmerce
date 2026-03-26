import { ValueObject } from '@shared/domain';

interface QuantityProps {
  value: number;
}

export class Quantity extends ValueObject<QuantityProps> {
  private constructor(props: QuantityProps) {
    super(props);
  }

  static create(value: number): Quantity {
    if (!Number.isInteger(value)) {
      throw new Error(`Quantity must be an integer. Received: ${value}`);
    }

    if (value < 0) {
      throw new Error(`Quantity must be >= 0. Received: ${value}`);
    }

    return new Quantity({ value });
  }

  get value(): number {
    return this.props.value;
  }

  add(other: Quantity): Quantity {
    return Quantity.create(this.value + other.value);
  }

  subtract(other: Quantity): Quantity {
    const result = this.value - other.value;

    if (result < 0) {
      throw new Error(
        `Cannot subtract ${other.value} from ${this.value}: result would be negative`,
      );
    }

    return Quantity.create(result);
  }

  isAvailable(needed: number): boolean {
    return this.value >= needed;
  }

  isZero(): boolean {
    return this.value === 0;
  }

  toString(): string {
    return String(this.props.value);
  }
}

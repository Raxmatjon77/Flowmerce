import { ValueObject } from '../../../shared/domain/value-object.base';

interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  static create(amount: number, currency: string): Money {
    if (amount < 0) {
      throw new Error(`Money amount cannot be negative: ${amount}`);
    }

    if (!currency || currency.trim().length === 0) {
      throw new Error('Currency must not be empty');
    }

    return new Money({
      amount: Math.round(amount * 100) / 100,
      currency: currency.toUpperCase(),
    });
  }

  static zero(currency: string): Money {
    return Money.create(0, currency);
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.create(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error(
        `Cannot subtract ${other.amount} from ${this.amount}: result would be negative`,
      );
    }
    return Money.create(result, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error(`Cannot multiply money by negative factor: ${factor}`);
    }
    return Money.create(this.amount * factor, this.currency);
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount < other.amount;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Currency mismatch: cannot operate on ${this.currency} and ${other.currency}`,
      );
    }
  }
}

import { ValueObject } from '../../../shared/domain/value-object.base';

export enum PaymentMethodType {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

interface PaymentMethodProps {
  type: string;
  last4Digits: string;
  expiryMonth: number;
  expiryYear: number;
}

export class PaymentMethod extends ValueObject<PaymentMethodProps> {
  private constructor(props: PaymentMethodProps) {
    super(props);
  }

  static create(
    type: PaymentMethodType,
    last4Digits: string,
    expiryMonth: number,
    expiryYear: number,
  ): PaymentMethod {
    if (!/^\d{4}$/.test(last4Digits)) {
      throw new Error(
        `Invalid last 4 digits: ${last4Digits}. Must be exactly 4 digits.`,
      );
    }
    if (expiryMonth < 1 || expiryMonth > 12) {
      throw new Error(`Invalid expiry month: ${expiryMonth}`);
    }
    if (expiryYear < 2000 || expiryYear > 2100) {
      throw new Error(`Invalid expiry year: ${expiryYear}`);
    }

    return new PaymentMethod({
      type,
      last4Digits,
      expiryMonth,
      expiryYear,
    });
  }

  get type(): PaymentMethodType {
    return this.props.type as PaymentMethodType;
  }

  get last4Digits(): string {
    return this.props.last4Digits;
  }

  get expiryMonth(): number {
    return this.props.expiryMonth;
  }

  get expiryYear(): number {
    return this.props.expiryYear;
  }

  isExpired(currentMonth: number, currentYear: number): boolean {
    if (this.expiryYear < currentYear) return true;
    if (this.expiryYear === currentYear && this.expiryMonth < currentMonth) {
      return true;
    }
    return false;
  }

  toMaskedString(): string {
    return `${this.type} ending in ${this.last4Digits}`;
  }
}

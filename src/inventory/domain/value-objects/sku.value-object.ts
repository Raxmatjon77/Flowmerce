import { ValueObject } from '@shared/domain';

interface SkuProps {
  value: string;
}

export class Sku extends ValueObject<SkuProps> {
  private static readonly SKU_PATTERN = /^[A-Za-z0-9-]+$/;

  private constructor(props: SkuProps) {
    super(props);
  }

  static create(value: string): Sku {
    const trimmed = value.trim();

    if (!trimmed) {
      throw new Error('SKU cannot be empty');
    }

    if (!Sku.SKU_PATTERN.test(trimmed)) {
      throw new Error(
        `SKU must be alphanumeric with dashes only. Received: "${trimmed}"`,
      );
    }

    return new Sku({ value: trimmed });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}

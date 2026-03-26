import { ValueObject } from '@shared/domain';

export enum CarrierCode {
  FEDEX = 'FEDEX',
  UPS = 'UPS',
  DHL = 'DHL',
  USPS = 'USPS',
}

interface CarrierProps {
  name: string;
  code: string;
}

export class Carrier extends ValueObject<CarrierProps> {
  private constructor(props: CarrierProps) {
    super(props);
  }

  static create(name: string, code: string): Carrier {
    if (!name.trim()) {
      throw new Error('Carrier name cannot be empty');
    }

    if (!code.trim()) {
      throw new Error('Carrier code cannot be empty');
    }

    return new Carrier({ name: name.trim(), code: code.trim().toUpperCase() });
  }

  static fromCode(code: CarrierCode): Carrier {
    const names: Record<CarrierCode, string> = {
      [CarrierCode.FEDEX]: 'FedEx',
      [CarrierCode.UPS]: 'UPS',
      [CarrierCode.DHL]: 'DHL',
      [CarrierCode.USPS]: 'USPS',
    };

    return new Carrier({ name: names[code], code });
  }

  get name(): string {
    return this.props.name;
  }

  get code(): string {
    return this.props.code;
  }

  toString(): string {
    return `${this.props.name} (${this.props.code})`;
  }
}

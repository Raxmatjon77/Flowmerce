import { ValueObject } from '../../../shared/domain/value-object.base';

interface ShippingAddressProps {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export class ShippingAddress extends ValueObject<ShippingAddressProps> {
  private constructor(props: ShippingAddressProps) {
    super(props);
  }

  static create(
    street: string,
    city: string,
    state: string,
    zipCode: string,
    country: string,
  ): ShippingAddress {
    if (!street || street.trim().length === 0) {
      throw new Error('Street must not be empty');
    }
    if (!city || city.trim().length === 0) {
      throw new Error('City must not be empty');
    }
    if (!state || state.trim().length === 0) {
      throw new Error('State must not be empty');
    }
    if (!zipCode || zipCode.trim().length === 0) {
      throw new Error('Zip code must not be empty');
    }
    if (!country || country.trim().length === 0) {
      throw new Error('Country must not be empty');
    }

    return new ShippingAddress({
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      country: country.trim(),
    });
  }

  get street(): string {
    return this.props.street;
  }

  get city(): string {
    return this.props.city;
  }

  get state(): string {
    return this.props.state;
  }

  get zipCode(): string {
    return this.props.zipCode;
  }

  get country(): string {
    return this.props.country;
  }

  toFormattedString(): string {
    return `${this.street}, ${this.city}, ${this.state} ${this.zipCode}, ${this.country}`;
  }
}

import { ShippingAddress } from './shipping-address.value-object';

describe('ShippingAddress', () => {
  const validProps = {
    street: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
    country: 'US',
  };

  describe('create()', () => {
    it('should create a ShippingAddress with correct properties', () => {
      const address = ShippingAddress.create(
        validProps.street,
        validProps.city,
        validProps.state,
        validProps.zipCode,
        validProps.country,
      );

      expect(address.street).toBe('123 Main St');
      expect(address.city).toBe('Springfield');
      expect(address.state).toBe('IL');
      expect(address.zipCode).toBe('62701');
      expect(address.country).toBe('US');
    });

    it('should trim whitespace from all fields', () => {
      const address = ShippingAddress.create(
        '  123 Main St  ',
        '  Springfield  ',
        '  IL  ',
        '  62701  ',
        '  US  ',
      );

      expect(address.street).toBe('123 Main St');
      expect(address.city).toBe('Springfield');
      expect(address.state).toBe('IL');
      expect(address.zipCode).toBe('62701');
      expect(address.country).toBe('US');
    });

    it('should throw for empty street', () => {
      expect(() =>
        ShippingAddress.create(
          '',
          validProps.city,
          validProps.state,
          validProps.zipCode,
          validProps.country,
        ),
      ).toThrow('Street must not be empty');
    });

    it('should throw for empty city', () => {
      expect(() =>
        ShippingAddress.create(
          validProps.street,
          '',
          validProps.state,
          validProps.zipCode,
          validProps.country,
        ),
      ).toThrow('City must not be empty');
    });

    it('should throw for empty state', () => {
      expect(() =>
        ShippingAddress.create(
          validProps.street,
          validProps.city,
          '',
          validProps.zipCode,
          validProps.country,
        ),
      ).toThrow('State must not be empty');
    });

    it('should throw for empty zipCode', () => {
      expect(() =>
        ShippingAddress.create(
          validProps.street,
          validProps.city,
          validProps.state,
          '',
          validProps.country,
        ),
      ).toThrow('Zip code must not be empty');
    });

    it('should throw for empty country', () => {
      expect(() =>
        ShippingAddress.create(
          validProps.street,
          validProps.city,
          validProps.state,
          validProps.zipCode,
          '',
        ),
      ).toThrow('Country must not be empty');
    });

    it('should throw for whitespace-only fields', () => {
      expect(() =>
        ShippingAddress.create(
          '   ',
          validProps.city,
          validProps.state,
          validProps.zipCode,
          validProps.country,
        ),
      ).toThrow('Street must not be empty');
    });
  });

  describe('toFormattedString()', () => {
    it('should return a formatted address string', () => {
      const address = ShippingAddress.create(
        validProps.street,
        validProps.city,
        validProps.state,
        validProps.zipCode,
        validProps.country,
      );

      expect(address.toFormattedString()).toBe(
        '123 Main St, Springfield, IL 62701, US',
      );
    });
  });

  describe('equals()', () => {
    it('should return true for equal addresses', () => {
      const a = ShippingAddress.create(
        validProps.street,
        validProps.city,
        validProps.state,
        validProps.zipCode,
        validProps.country,
      );
      const b = ShippingAddress.create(
        validProps.street,
        validProps.city,
        validProps.state,
        validProps.zipCode,
        validProps.country,
      );

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different addresses', () => {
      const a = ShippingAddress.create(
        validProps.street,
        validProps.city,
        validProps.state,
        validProps.zipCode,
        validProps.country,
      );
      const b = ShippingAddress.create(
        '456 Oak Ave',
        validProps.city,
        validProps.state,
        validProps.zipCode,
        validProps.country,
      );

      expect(a.equals(b)).toBe(false);
    });
  });
});

import { Money } from './money.value-object';

describe('Money', () => {
  describe('create()', () => {
    it('should create Money with correct amount and currency', () => {
      const money = Money.create(10.5, 'usd');

      expect(money.amount).toBe(10.5);
      expect(money.currency).toBe('USD');
    });

    it('should round amount to 2 decimal places', () => {
      const money = Money.create(10.555, 'USD');

      expect(money.amount).toBe(10.56);
    });

    it('should round down when third decimal is less than 5', () => {
      const money = Money.create(10.554, 'USD');

      expect(money.amount).toBe(10.55);
    });

    it('should uppercase the currency', () => {
      const money = Money.create(5, 'eur');

      expect(money.currency).toBe('EUR');
    });

    it('should throw for negative amount', () => {
      expect(() => Money.create(-1, 'USD')).toThrow(
        'Money amount cannot be negative: -1',
      );
    });

    it('should throw for empty currency', () => {
      expect(() => Money.create(10, '')).toThrow('Currency must not be empty');
    });

    it('should throw for whitespace-only currency', () => {
      expect(() => Money.create(10, '   ')).toThrow(
        'Currency must not be empty',
      );
    });

    it('should allow zero amount', () => {
      const money = Money.create(0, 'USD');

      expect(money.amount).toBe(0);
    });
  });

  describe('zero()', () => {
    it('should create Money with zero amount', () => {
      const money = Money.zero('USD');

      expect(money.amount).toBe(0);
      expect(money.currency).toBe('USD');
    });
  });

  describe('add()', () => {
    it('should add two Money instances with same currency', () => {
      const a = Money.create(10, 'USD');
      const b = Money.create(5.5, 'USD');

      const result = a.add(b);

      expect(result.amount).toBe(15.5);
      expect(result.currency).toBe('USD');
    });

    it('should throw when currencies differ', () => {
      const usd = Money.create(10, 'USD');
      const eur = Money.create(5, 'EUR');

      expect(() => usd.add(eur)).toThrow('Currency mismatch');
    });
  });

  describe('subtract()', () => {
    it('should subtract two Money instances with same currency', () => {
      const a = Money.create(10, 'USD');
      const b = Money.create(3, 'USD');

      const result = a.subtract(b);

      expect(result.amount).toBe(7);
      expect(result.currency).toBe('USD');
    });

    it('should throw when result would be negative', () => {
      const a = Money.create(3, 'USD');
      const b = Money.create(10, 'USD');

      expect(() => a.subtract(b)).toThrow('result would be negative');
    });

    it('should throw when currencies differ', () => {
      const usd = Money.create(10, 'USD');
      const eur = Money.create(5, 'EUR');

      expect(() => usd.subtract(eur)).toThrow('Currency mismatch');
    });
  });

  describe('multiply()', () => {
    it('should multiply Money by a positive factor', () => {
      const money = Money.create(10, 'USD');

      const result = money.multiply(3);

      expect(result.amount).toBe(30);
      expect(result.currency).toBe('USD');
    });

    it('should multiply by zero', () => {
      const money = Money.create(10, 'USD');

      const result = money.multiply(0);

      expect(result.amount).toBe(0);
    });

    it('should throw for negative factor', () => {
      const money = Money.create(10, 'USD');

      expect(() => money.multiply(-2)).toThrow(
        'Cannot multiply money by negative factor: -2',
      );
    });

    it('should round result to 2 decimal places', () => {
      const money = Money.create(10, 'USD');

      const result = money.multiply(0.333);

      expect(result.amount).toBe(3.33);
    });
  });

  describe('isGreaterThan()', () => {
    it('should return true when amount is greater', () => {
      const a = Money.create(10, 'USD');
      const b = Money.create(5, 'USD');

      expect(a.isGreaterThan(b)).toBe(true);
    });

    it('should return false when amount is equal', () => {
      const a = Money.create(10, 'USD');
      const b = Money.create(10, 'USD');

      expect(a.isGreaterThan(b)).toBe(false);
    });

    it('should return false when amount is less', () => {
      const a = Money.create(5, 'USD');
      const b = Money.create(10, 'USD');

      expect(a.isGreaterThan(b)).toBe(false);
    });

    it('should throw when currencies differ', () => {
      const usd = Money.create(10, 'USD');
      const eur = Money.create(5, 'EUR');

      expect(() => usd.isGreaterThan(eur)).toThrow('Currency mismatch');
    });
  });

  describe('isLessThan()', () => {
    it('should return true when amount is less', () => {
      const a = Money.create(5, 'USD');
      const b = Money.create(10, 'USD');

      expect(a.isLessThan(b)).toBe(true);
    });

    it('should return false when amount is equal', () => {
      const a = Money.create(10, 'USD');
      const b = Money.create(10, 'USD');

      expect(a.isLessThan(b)).toBe(false);
    });

    it('should return false when amount is greater', () => {
      const a = Money.create(10, 'USD');
      const b = Money.create(5, 'USD');

      expect(a.isLessThan(b)).toBe(false);
    });
  });

  describe('isZero()', () => {
    it('should return true for zero amount', () => {
      const money = Money.zero('USD');

      expect(money.isZero()).toBe(true);
    });

    it('should return false for non-zero amount', () => {
      const money = Money.create(1, 'USD');

      expect(money.isZero()).toBe(false);
    });
  });

  describe('equals()', () => {
    it('should return true for equal Money instances', () => {
      const a = Money.create(10, 'USD');
      const b = Money.create(10, 'USD');

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different amounts', () => {
      const a = Money.create(10, 'USD');
      const b = Money.create(5, 'USD');

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different currencies', () => {
      const a = Money.create(10, 'USD');
      const b = Money.create(10, 'EUR');

      expect(a.equals(b)).toBe(false);
    });
  });
});

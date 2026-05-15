import { describe, it, expect } from 'vitest';
import { CURRENCIES } from './currencies';

describe('CURRENCIES', () => {
  it('should be an array', () => {
    expect(Array.isArray(CURRENCIES)).toBe(true);
  });

  it('should contain common currencies like USD, EUR, GBP', () => {
    const codes = CURRENCIES.map(c => c.code);
    expect(codes).toContain('USD');
    expect(codes).toContain('EUR');
    expect(codes).toContain('GBP');
  });

  it('should have the correct structure for each currency', () => {
    CURRENCIES.forEach(currency => {
      expect(currency).toHaveProperty('code');
      expect(currency).toHaveProperty('symbol');
      expect(currency).toHaveProperty('name');
      expect(typeof currency.code).toBe('string');
      expect(typeof currency.symbol).toBe('string');
      expect(typeof currency.name).toBe('string');
    });
  });
});

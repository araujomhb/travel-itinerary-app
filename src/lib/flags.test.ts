import { describe, it, expect } from 'vitest';
import { getFlagEmoji } from './flags';

describe('getFlagEmoji', () => {
  it('should return the correct flag for common countries', () => {
    expect(getFlagEmoji('Brazil')).toBe('🇧🇷');
    expect(getFlagEmoji('USA')).toBe('🇺🇸');
    expect(getFlagEmoji('France')).toBe('🇫🇷');
  });

  it('should handle variations of country names', () => {
    expect(getFlagEmoji('United States')).toBe('🇺🇸');
    expect(getFlagEmoji('United Kingdom')).toBe('🇬🇧');
    expect(getFlagEmoji('UK')).toBe('🇬🇧');
  });

  it('should handle edge cases and abbreviations from world-atlas', () => {
    expect(getFlagEmoji('W. Sahara')).toBe('🇪🇭');
    expect(getFlagEmoji('Dem. Rep. Congo')).toBe('🇨🇩');
    expect(getFlagEmoji('Eq. Guinea')).toBe('🇬🇶');
    expect(getFlagEmoji('Dominican Rep.')).toBe('🇩🇴');
    expect(getFlagEmoji('Czech Rep.')).toBe('🇨🇿');
    expect(getFlagEmoji('S. Africa')).toBe('🇿🇦');
    expect(getFlagEmoji('Fr. S. Antarctic Lands')).toBe('🇹🇫');
    expect(getFlagEmoji('Bosnia & Herz.')).toBe('🇧🇦');
  });

  it('should return 🏳️ for missing or unknown countries', () => {
    expect(getFlagEmoji('Unknown Country')).toBe('🏳️');
    expect(getFlagEmoji('')).toBe('🏳️');
  });
});

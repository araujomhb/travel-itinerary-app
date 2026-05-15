import { describe, it, expect } from 'vitest';
import { COUNTRY_CENTROIDS } from './centroids';

describe('COUNTRY_CENTROIDS', () => {
  it('should be an object', () => {
    expect(typeof COUNTRY_CENTROIDS).toBe('object');
    expect(COUNTRY_CENTROIDS).not.toBeNull();
  });

  it('should contain expected countries like Brazil, USA, Seychelles', () => {
    expect(COUNTRY_CENTROIDS).toHaveProperty('Brazil');
    expect(COUNTRY_CENTROIDS).toHaveProperty('United States');
    expect(COUNTRY_CENTROIDS).toHaveProperty('Seychelles');
  });

  it('should have valid lat/lng for entries', () => {
    const brazil = COUNTRY_CENTROIDS['Brazil'];
    expect(brazil.lat).toBeGreaterThan(-90);
    expect(brazil.lat).toBeLessThan(90);
    expect(brazil.lng).toBeGreaterThan(-180);
    expect(brazil.lng).toBeLessThan(180);
  });
});

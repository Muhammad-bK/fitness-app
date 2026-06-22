import { describe, it, expect } from 'vitest';
import { kgToLbs, lbsToKg, displayWeight, formatWeight } from '../units';

describe('kgToLbs', () => {
  it('converts 100kg correctly', () => {
    expect(kgToLbs(100)).toBeCloseTo(220.5, 0);
  });
});

describe('lbsToKg', () => {
  it('converts 220.46lbs correctly', () => {
    expect(lbsToKg(220.46)).toBeCloseTo(100, 0);
  });
});

describe('displayWeight', () => {
  it('returns kg unchanged', () => {
    expect(displayWeight(80, 'kg')).toBe(80);
  });

  it('converts to lbs', () => {
    expect(displayWeight(100, 'lbs')).toBeCloseTo(220.5, 0);
  });
});

describe('formatWeight', () => {
  it('formats kg', () => {
    expect(formatWeight(80, 'kg')).toBe('80 kg');
  });

  it('formats lbs', () => {
    expect(formatWeight(100, 'lbs')).toMatch(/220\.5 lbs/);
  });
});

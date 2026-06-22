import { describe, it, expect } from 'vitest';
import { estimateOneRepMax, calculateSetVolume } from '../calculations';

describe('estimateOneRepMax', () => {
  it('computes Epley for 100kg x 5', () => {
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.67, 1);
  });

  it('returns weight for single rep', () => {
    expect(estimateOneRepMax(140, 1)).toBe(140);
  });

  it('returns 0 for zero reps', () => {
    expect(estimateOneRepMax(100, 0)).toBe(0);
  });

  it('returns 0 for zero weight', () => {
    expect(estimateOneRepMax(0, 5)).toBe(0);
  });
});

describe('calculateSetVolume', () => {
  it('computes weight * reps', () => {
    expect(calculateSetVolume(80, 8)).toBe(640);
  });

  it('returns 0 for null weight', () => {
    expect(calculateSetVolume(null, 8)).toBe(0);
  });
});

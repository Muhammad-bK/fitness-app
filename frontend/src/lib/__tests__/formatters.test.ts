import { describe, it, expect } from 'vitest';
import { formatRestTime, formatDate } from '../formatters';

describe('formatRestTime', () => {
  it('formats minutes and seconds', () => {
    expect(formatRestTime(90)).toBe('1m 30s');
  });

  it('formats minutes only', () => {
    expect(formatRestTime(120)).toBe('2m');
  });

  it('formats seconds only', () => {
    expect(formatRestTime(45)).toBe('45s');
  });

  it('returns empty for null', () => {
    expect(formatRestTime(null)).toBe('');
  });

  it('returns empty for 0', () => {
    expect(formatRestTime(0)).toBe('');
  });
});

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2026-06-22');
    expect(result).toContain('Jun');
    expect(result).toContain('22');
  });
});

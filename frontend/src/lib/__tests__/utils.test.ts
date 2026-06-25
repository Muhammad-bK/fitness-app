import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('merges tailwind classes and resolves conflicts', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('handles conditional classes', () => {
    const hidden = false;
    expect(cn('base', hidden && 'hidden', 'visible')).toBe('base visible');
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applyTheme, getStoredTheme, getSystemTheme, resolveTheme, storeTheme } from '../theme';

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('light'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  it('stores and reads theme preference', () => {
    storeTheme('light');
    expect(getStoredTheme()).toBe('light');
    expect(resolveTheme()).toBe('light');
  });

  it('falls back to system theme when nothing is stored', () => {
    expect(getStoredTheme()).toBeNull();
    expect(getSystemTheme()).toBe('light');
    expect(resolveTheme()).toBe('light');
  });

  it('applies theme to the document root', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });
});

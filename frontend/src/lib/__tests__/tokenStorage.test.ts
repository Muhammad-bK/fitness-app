import { describe, it, expect, beforeEach } from 'vitest';
import { tokenStorage } from '../tokenStorage';

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no tokens are stored', () => {
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it('stores and reads the access token', () => {
    tokenStorage.setAccessToken('access-123');
    expect(tokenStorage.getAccessToken()).toBe('access-123');
  });

  it('stores and reads the refresh token', () => {
    tokenStorage.setRefreshToken('refresh-456');
    expect(tokenStorage.getRefreshToken()).toBe('refresh-456');
  });

  it('keeps access and refresh tokens independent', () => {
    tokenStorage.setAccessToken('a');
    tokenStorage.setRefreshToken('r');
    expect(tokenStorage.getAccessToken()).toBe('a');
    expect(tokenStorage.getRefreshToken()).toBe('r');
  });

  it('clears both tokens', () => {
    tokenStorage.setAccessToken('a');
    tokenStorage.setRefreshToken('r');
    tokenStorage.clear();
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it('overwrites an existing token', () => {
    tokenStorage.setAccessToken('first');
    tokenStorage.setAccessToken('second');
    expect(tokenStorage.getAccessToken()).toBe('second');
  });
});

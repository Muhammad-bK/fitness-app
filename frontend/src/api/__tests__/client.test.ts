import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  AxiosAdapter,
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  AxiosStatic,
  InternalAxiosRequestConfig,
} from 'axios';
import { tokenStorage } from '../../lib/tokenStorage';

function authHeader(config: InternalAxiosRequestConfig): unknown {
  return (config.headers as unknown as Record<string, unknown>)['Authorization'];
}

function okResponse(config: InternalAxiosRequestConfig): AxiosResponse {
  return {
    data: { ok: true },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  };
}

// Each test imports a fresh copy of the client so the module-level refresh
// state (isRefreshing / failedQueue) does not leak between cases.
async function freshClient(): Promise<{ apiClient: AxiosInstance; axios: AxiosStatic }> {
  vi.resetModules();
  const axios = (await import('axios')).default;
  const apiClient = (await import('../client')).default;
  return { apiClient, axios };
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('apiClient request interceptor', () => {
  it('attaches the bearer token when one is stored', async () => {
    tokenStorage.setAccessToken('test-access');
    const { apiClient } = await freshClient();

    let captured: InternalAxiosRequestConfig | undefined;
    const adapter: AxiosAdapter = (config) => {
      captured = config;
      return Promise.resolve(okResponse(config));
    };
    apiClient.defaults.adapter = adapter;

    await apiClient.get('/protected/');

    expect(captured).toBeDefined();
    expect(authHeader(captured!)).toBe('Bearer test-access');
  });

  it('does not attach an authorization header when no token is stored', async () => {
    const { apiClient } = await freshClient();

    let captured: InternalAxiosRequestConfig | undefined;
    apiClient.defaults.adapter = (config) => {
      captured = config;
      return Promise.resolve(okResponse(config));
    };

    await apiClient.get('/public/');

    expect(authHeader(captured!)).toBeUndefined();
  });
});

describe('apiClient 401 refresh flow', () => {
  it('refreshes the access token on 401 and retries the original request', async () => {
    tokenStorage.setAccessToken('old-access');
    tokenStorage.setRefreshToken('refresh-1');
    const { apiClient, axios } = await freshClient();

    const postSpy = vi
      .spyOn(axios, 'post')
      .mockResolvedValue({ data: { access: 'new-access' } });

    const seenAuthHeaders: unknown[] = [];
    let callCount = 0;
    apiClient.defaults.adapter = (config) => {
      seenAuthHeaders.push(authHeader(config));
      callCount += 1;
      if (callCount === 1) {
        const err = {
          config,
          response: { status: 401, data: {}, statusText: '', headers: {}, config },
          isAxiosError: true,
        } as unknown as AxiosError;
        return Promise.reject(err);
      }
      return Promise.resolve(okResponse(config));
    };

    const res = await apiClient.get('/protected/');

    // Original request + one retry.
    expect(callCount).toBe(2);
    expect(res.data).toEqual({ ok: true });

    // Refresh endpoint was called with the stored refresh token.
    expect(postSpy).toHaveBeenCalledWith(expect.stringContaining('/auth/refresh/'), { refresh: 'refresh-1' });

    // New token persisted and used on the retry.
    expect(tokenStorage.getAccessToken()).toBe('new-access');
    expect(seenAuthHeaders[1]).toBe('Bearer new-access');
  });

  it('clears tokens and rejects when there is no refresh token', async () => {
    tokenStorage.setAccessToken('old-access');
    const { apiClient } = await freshClient();

    apiClient.defaults.adapter = (config) => {
      const err = {
        config,
        response: { status: 401, data: {}, statusText: '', headers: {}, config },
        isAxiosError: true,
      } as unknown as AxiosError;
      return Promise.reject(err);
    };

    await expect(apiClient.get('/protected/')).rejects.toBeDefined();
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  it('clears tokens and rejects when the refresh request fails', async () => {
    tokenStorage.setAccessToken('old-access');
    tokenStorage.setRefreshToken('refresh-1');
    const { apiClient, axios } = await freshClient();

    vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh failed'));

    apiClient.defaults.adapter = (config) => {
      const err = {
        config,
        response: { status: 401, data: {}, statusText: '', headers: {}, config },
        isAxiosError: true,
      } as unknown as AxiosError;
      return Promise.reject(err);
    };

    await expect(apiClient.get('/protected/')).rejects.toBeDefined();
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });
});

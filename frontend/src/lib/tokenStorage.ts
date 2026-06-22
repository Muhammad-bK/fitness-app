/**
 * Token storage abstraction.
 * Web uses localStorage; swap to AsyncStorage/SecureStore for React Native.
 */

const ACCESS_KEY = 'wa_access_token';
const REFRESH_KEY = 'wa_refresh_token';

export const tokenStorage = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_KEY),
  setAccessToken: (token: string): void => localStorage.setItem(ACCESS_KEY, token),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_KEY),
  setRefreshToken: (token: string): void => localStorage.setItem(REFRESH_KEY, token),
  clear: (): void => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

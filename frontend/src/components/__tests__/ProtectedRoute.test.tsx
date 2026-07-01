import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuthContext } from '../../context/AuthContext';
import { tokenStorage } from '../../lib/tokenStorage';
import type { User } from '../../types';

vi.mock('../../context/AuthContext', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('../../lib/tokenStorage', () => ({
  tokenStorage: { getAccessToken: vi.fn() },
}));

const mockUseAuthContext = vi.mocked(useAuthContext);
const mockGetAccessToken = vi.mocked(tokenStorage.getAccessToken);

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u-1',
    email: 'me@test.com',
    display_name: 'Me',
    unit_preference: 'kg',
    is_onboarded: true,
    onboarding_step: 4,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <div>Onboarding Page</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Home Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProtectedRoute', () => {
  it('shows a loading state while auth is resolving', () => {
    mockGetAccessToken.mockReturnValue('token');
    mockUseAuthContext.mockReturnValue({ user: null, isLoading: true, isAuthenticated: false });

    renderAt('/');

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows a loading state when a token exists but the user is not yet loaded', () => {
    mockGetAccessToken.mockReturnValue('token');
    mockUseAuthContext.mockReturnValue({ user: null, isLoading: false, isAuthenticated: false });

    renderAt('/');

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('redirects to login when unauthenticated and no token is present', () => {
    mockGetAccessToken.mockReturnValue(null);
    mockUseAuthContext.mockReturnValue({ user: null, isLoading: false, isAuthenticated: false });

    renderAt('/');

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Home Content')).not.toBeInTheDocument();
  });

  it('redirects an authenticated but not-onboarded user to onboarding', () => {
    mockGetAccessToken.mockReturnValue('token');
    mockUseAuthContext.mockReturnValue({
      user: makeUser({ is_onboarded: false }),
      isLoading: false,
      isAuthenticated: true,
    });

    renderAt('/');

    expect(screen.getByText('Onboarding Page')).toBeInTheDocument();
    expect(screen.queryByText('Home Content')).not.toBeInTheDocument();
  });

  it('renders protected content for an authenticated, onboarded user', () => {
    mockGetAccessToken.mockReturnValue('token');
    mockUseAuthContext.mockReturnValue({
      user: makeUser(),
      isLoading: false,
      isAuthenticated: true,
    });

    renderAt('/');

    expect(screen.getByText('Home Content')).toBeInTheDocument();
  });

  it('redirects an onboarded user away from the onboarding page', () => {
    mockGetAccessToken.mockReturnValue('token');
    mockUseAuthContext.mockReturnValue({
      user: makeUser({ is_onboarded: true }),
      isLoading: false,
      isAuthenticated: true,
    });

    renderAt('/onboarding');

    expect(screen.getByText('Home Content')).toBeInTheDocument();
    expect(screen.queryByText('Onboarding Page')).not.toBeInTheDocument();
  });
});

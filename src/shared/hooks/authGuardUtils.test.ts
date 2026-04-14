import { describe, expect, it } from 'vitest';

import { ROUTES } from '@/config/constants';
import { resolveAuthGuardState } from '@/shared/hooks/authGuardUtils';

describe('authGuardUtils', () => {
  it('keeps protected routes pending while auth is loading', () => {
    expect(
      resolveAuthGuardState({
        isAuthenticated: false,
        isLoading: true,
        requireAuth: true,
      })
    ).toEqual({
      isAuthorized: false,
      isReady: false,
      redirectTo: null,
    });
  });

  it('redirects unauthenticated users away from protected routes', () => {
    expect(
      resolveAuthGuardState({
        isAuthenticated: false,
        isLoading: false,
        requireAuth: true,
      })
    ).toEqual({
      isAuthorized: false,
      isReady: true,
      redirectTo: ROUTES.login,
    });
  });

  it('redirects authenticated users away from guest-only routes', () => {
    expect(
      resolveAuthGuardState({
        isAuthenticated: true,
        isLoading: false,
        requireAuth: false,
      })
    ).toEqual({
      isAuthorized: false,
      isReady: true,
      redirectTo: ROUTES.adminHome,
    });
  });
});

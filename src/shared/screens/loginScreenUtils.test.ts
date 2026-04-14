import { describe, expect, it } from 'vitest';

import { resolveLoginFormState } from '@/shared/screens/loginScreenUtils';

describe('loginScreenUtils', () => {
  it('blocks submit and surfaces config guidance when Supabase envs are missing', () => {
    expect(
      resolveLoginFormState({
        email: 'admin@drakk3.ai',
        errorMessage: null,
        hasSupabaseConfig: false,
        password: 'secret',
      })
    ).toEqual({
      formError: 'Configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY before login.',
      isSubmitDisabled: true,
    });
  });

  it('allows submit when credentials and config are present', () => {
    expect(
      resolveLoginFormState({
        email: 'admin@drakk3.ai',
        errorMessage: 'Invalid credentials',
        hasSupabaseConfig: true,
        password: 'secret',
      })
    ).toEqual({
      formError: 'Invalid credentials',
      isSubmitDisabled: false,
    });
  });
});

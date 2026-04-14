import { describe, expect, it } from 'vitest';

import { resolveEnvConfig } from '@/config/envUtils';

describe('envUtils', () => {
  it('falls back to placeholder values when Supabase envs are missing', () => {
    expect(resolveEnvConfig({})).toEqual({
      hasSupabaseConfig: false,
      supabaseAnonKey: 'placeholder-anon-key',
      supabaseUrl: 'https://placeholder.supabase.co',
    });
  });

  it('keeps trimmed Supabase envs when both values are present', () => {
    expect(
      resolveEnvConfig({
        EXPO_PUBLIC_SUPABASE_ANON_KEY: ' anon-key ',
        EXPO_PUBLIC_SUPABASE_URL: ' https://project.supabase.co ',
      })
    ).toEqual({
      hasSupabaseConfig: true,
      supabaseAnonKey: 'anon-key',
      supabaseUrl: 'https://project.supabase.co',
    });
  });
});

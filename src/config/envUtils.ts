export interface EnvConfig {
  hasSupabaseConfig: boolean;
  supabaseAnonKey: string;
  supabaseUrl: string;
}

export interface EnvSource {
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  EXPO_PUBLIC_SUPABASE_URL?: string;
}

const FALLBACK_SUPABASE_URL = 'https://placeholder.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'placeholder-anon-key';

function normalizeEnvValue(value: string | undefined): string {
  return value?.trim() ?? '';
}

export function resolveEnvConfig(source: EnvSource): EnvConfig {
  const supabaseUrl = normalizeEnvValue(source.EXPO_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = normalizeEnvValue(source.EXPO_PUBLIC_SUPABASE_ANON_KEY);

  return {
    hasSupabaseConfig: Boolean(supabaseUrl && supabaseAnonKey),
    supabaseAnonKey: supabaseAnonKey || FALLBACK_SUPABASE_ANON_KEY,
    supabaseUrl: supabaseUrl || FALLBACK_SUPABASE_URL,
  };
}

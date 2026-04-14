interface ResolveLoginFormStateParams {
  email: string;
  errorMessage: string | null;
  hasSupabaseConfig: boolean;
  password: string;
}

export interface LoginFormState {
  formError: string | null;
  isSubmitDisabled: boolean;
}

export function resolveLoginFormState({
  email,
  errorMessage,
  hasSupabaseConfig,
  password,
}: ResolveLoginFormStateParams): LoginFormState {
  return {
    formError: hasSupabaseConfig
      ? errorMessage
      : 'Configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY before login.',
    isSubmitDisabled: !email || !password || !hasSupabaseConfig,
  };
}

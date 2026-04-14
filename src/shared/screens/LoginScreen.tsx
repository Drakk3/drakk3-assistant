import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ENV } from '@/config/env';
import { AuthShell } from '@/shared/components/AuthShell';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTheme } from '@/shared/hooks/useTheme';
import { resolveLoginFormState } from '@/shared/screens/loginScreenUtils';

export function LoginScreen(): React.JSX.Element {
  const { clearError, errorMessage, isLoading, signIn } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const formState = useMemo(() => {
    return resolveLoginFormState({
      email,
      errorMessage,
      hasSupabaseConfig: ENV.hasSupabaseConfig,
      password,
    });
  }, [email, errorMessage, password]);

  const handleEmailChange = useCallback((value: string): void => {
    setEmail(value);
    clearError();
  }, [clearError]);

  const handlePasswordChange = useCallback((value: string): void => {
    setPassword(value);
    clearError();
  }, [clearError]);

  const handleSubmit = useCallback((): void => {
    void signIn({ email, password });
  }, [email, password, signIn]);

  return (
    <AuthShell
      description="Admin-first bootstrap shell for Supabase auth and protected route flow."
      eyebrow="Auth shell"
      title="Sign in to the operator console"
    >
      <View style={styles.stack}>
        <Badge label="MVP base" tone="active" />

        <Input
          errorMessage={undefined}
          helperText="Email/password auth goes through Supabase Auth."
          keyboardType="email-address"
          label="Email"
          onChangeText={handleEmailChange}
          placeholder="admin@drakk3.ai"
          value={email}
        />

        <Input
          errorMessage={formState.formError ?? undefined}
          label="Password"
          onChangeText={handlePasswordChange}
          placeholder="••••••••"
          secureTextEntry
          value={password}
        />

        <Button
          isDisabled={formState.isSubmitDisabled}
          isLoading={isLoading}
          label="Sign in"
          onPress={handleSubmit}
        />

        <Text
          style={[
            styles.helper,
            {
              color: theme.colors.textMuted,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.typography.mono.fontSize,
              fontWeight: theme.typography.mono.fontWeight,
              letterSpacing: theme.typography.mono.letterSpacing,
              lineHeight: theme.typography.mono.lineHeight,
            },
          ]}
        >
          No direct writes to location_events are exposed in the client shell.
        </Text>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  helper: {
    maxWidth: 420,
  },
  stack: {
    gap: 16,
  },
});

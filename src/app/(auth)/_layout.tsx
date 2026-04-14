import React from 'react';

import { Stack } from 'expo-router';

import { LoadingScreen } from '@/shared/components/LoadingScreen';
import { useAuthGuard } from '@/shared/hooks/useAuthGuard';

export default function AuthLayout(): React.JSX.Element | null {
  const { isAuthorized, isReady } = useAuthGuard({ requireAuth: false });

  if (!isReady) {
    return <LoadingScreen message="Checking session…" />;
  }

  if (!isAuthorized) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

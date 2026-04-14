import React from 'react';

import { Stack } from 'expo-router';

import { LoadingScreen } from '@/shared/components/LoadingScreen';
import { useAuthGuard } from '@/shared/hooks/useAuthGuard';

export default function AdminLayout(): React.JSX.Element | null {
  const { isAuthorized, isReady } = useAuthGuard({ requireAuth: true });

  if (!isReady) {
    return <LoadingScreen message="Verifying admin access…" />;
  }

  if (!isAuthorized) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

import React from 'react';

import { Stack } from 'expo-router';

import { AppProviders } from '@/shared/providers/AppProviders';

export default function RootLayout(): React.JSX.Element {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createAppQueryClient } from '@/shared/providers/appProvidersConfig';
import { AuthProvider } from '@/shared/providers/AuthProvider';
import { ThemeProvider } from '@/shared/providers/ThemeProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps): React.JSX.Element {
  const [queryClient] = useState<QueryClient>(createAppQueryClient);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

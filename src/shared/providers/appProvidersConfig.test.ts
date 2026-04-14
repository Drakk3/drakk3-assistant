import { describe, expect, it } from 'vitest';

import { createAppQueryClient } from '@/shared/providers/appProvidersConfig';

describe('appProvidersConfig', () => {
  it('creates the shared query client defaults used by the app shell', () => {
    const queryClient = createAppQueryClient();
    const defaults = queryClient.getDefaultOptions();

    expect(defaults.queries).toMatchObject({
      refetchOnReconnect: true,
      retry: 1,
      staleTime: 30_000,
    });
  });
});

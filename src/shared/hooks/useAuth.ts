import { useContext } from 'react';

import { AuthContext } from '@/shared/providers/AuthProvider';

export function useAuth(): NonNullable<React.ContextType<typeof AuthContext>> {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return authContext;
}

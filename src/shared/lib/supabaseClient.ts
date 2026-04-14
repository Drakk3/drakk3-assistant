import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { ENV } from '@/config/env';
import type { Database } from '@/shared/types/database';

export const supabase = createClient<Database>(ENV.supabaseUrl, ENV.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: AsyncStorage,
  },
});

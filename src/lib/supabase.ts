
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';
if (!supabaseUrl) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL in .env.local'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isMock = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('dummy');

if (isMock) {
  console.warn('MindWell: Using Mock Supabase Client');
}

// Mock Supabase Client for Development
const mockSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
    signUp: async () => ({ data: { user: null, session: null }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: (callback: any) => {
      // Return a mock unsubscribe function
      return { data: { subscription: { unsubscribe: () => { } } } };
    },
    resetPasswordForEmail: async () => ({ error: null }),
  },
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: null, error: null }),
        order: () => ({
          limit: () => ({
            offset: async () => ({ data: [], error: null }),
          }),
        }),
      }),
      order: () => ({
        limit: () => ({
          offset: async () => ({ data: [], error: null }),
        }),
      }),
    }),
    insert: async () => ({ data: null, error: null }),
    update: () => ({
      eq: () => ({
        select: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
    delete: () => ({
      eq: async () => ({ error: null }),
    }),
  }),
};

export const supabase = isMock
  ? (mockSupabase as any)
  : createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });

export type SupabaseClient = typeof supabase;

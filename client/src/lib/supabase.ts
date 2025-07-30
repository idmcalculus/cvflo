import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Types for our application
export interface AuthUser {
  id: string;
  email?: string;
  emailConfirmed?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface CVData {
  id: string;
  user_id: string;
  cv_content: Record<string, unknown>;
  template_name: string;
  created_at: string;
  updated_at: string;
}
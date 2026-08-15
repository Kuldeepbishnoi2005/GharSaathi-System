import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

let clientInstance: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = 'https://zypwxtyuqwwnxiuuagtz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5cHd4dHl1cXd3bnhpdXVhZ3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDQyMDEsImV4cCI6MjEwMjI4MDIwMX0.gp7rxnr6xOcdByAlCdRkQYYOwErPYaDppU4PxjUrnJ4';

export function createClient() {
  if (clientInstance) return clientInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    DEFAULT_SUPABASE_ANON_KEY;

  clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return clientInstance;
}

export const supabase = createClient();

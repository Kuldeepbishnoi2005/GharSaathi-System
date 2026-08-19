import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

let clientInstance: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = 'https://zypwxtyuqwwnxiuuagtz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5cHd4dHl1cXd3bnhpdXVhZ3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDQyMDEsImV4cCI6MjEwMjI4MDIwMX0.gp7rxnr6xOcdByAlCdRkQYYOwErPYaDppU4PxjUrnJ4';

function getCleanUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!envUrl || typeof envUrl !== 'string') return DEFAULT_SUPABASE_URL;

  const cleaned = envUrl.trim().replace(/^["']|["']$/g, '').trim().replace(/\/$/, '');
  if (cleaned.startsWith('https://') && cleaned.includes('.supabase.co')) {
    return cleaned;
  }
  return DEFAULT_SUPABASE_URL;
}

function getCleanKey(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ];

  for (const raw of candidates) {
    if (!raw || typeof raw !== 'string') continue;
    const cleaned = raw.trim().replace(/^["']|["']$/g, '').trim();
    if (cleaned.startsWith('eyJhbGci') && cleaned.length > 100) {
      return cleaned;
    }
    if (cleaned.startsWith('sb_publishable_') && cleaned.length > 20) {
      return cleaned;
    }
  }

  return DEFAULT_SUPABASE_ANON_KEY;
}

export function createClient() {
  if (clientInstance) return clientInstance;

  const supabaseUrl = getCleanUrl();
  const supabaseAnonKey = getCleanKey();

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

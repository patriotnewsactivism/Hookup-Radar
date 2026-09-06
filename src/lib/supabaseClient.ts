import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // Don't throw at module-eval time (that's exactly the bug we're fixing —
  // a missing/dead backend client crashing the app before React mounts).
  // eslint-disable-next-line no-console
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — Supabase client will not work.'
  );
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder');

export default supabase;

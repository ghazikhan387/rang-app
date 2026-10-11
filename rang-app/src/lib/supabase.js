/**
 * Rang Healthcare — Supabase Client for React Frontend
 * PRD §4.3 & §15: Safe client-side initialization using anon key.
 *
 * No mock data fallback: when env vars are missing or invalid the client
 * is null and callers must surface a clear configuration error to the user.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-ref')
  );
};

/**
 * Explains WHY Supabase is not configured, so the UI can tell the user
 * exactly what to fix instead of silently showing fake content.
 * Returns null when configuration looks valid.
 */
export const getSupabaseConfigError = () => {
  if (!supabaseUrl && !supabaseAnonKey) {
    return 'Missing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Add them to your .env file and restart the dev server.';
  }
  if (!supabaseUrl) {
    return 'Missing VITE_SUPABASE_URL. Add it to your .env file and restart the dev server.';
  }
  if (!supabaseAnonKey) {
    return 'Missing VITE_SUPABASE_ANON_KEY. Add it to your .env file and restart the dev server.';
  }
  if (!supabaseUrl.startsWith('https://')) {
    return `Invalid VITE_SUPABASE_URL "${supabaseUrl}". It must start with https:// (e.g. https://xyzcompany.supabase.co).`;
  }
  if (supabaseUrl.includes('your-project-ref')) {
    return 'VITE_SUPABASE_URL still contains the placeholder "your-project-ref". Replace it with your real Supabase project URL.';
  }
  return null;
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

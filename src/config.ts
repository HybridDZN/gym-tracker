// Prefer client-visible VITE_ env vars, but allow non-VITE names if they were provided at build time.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || '';

// Debugging: fail fast with a clear message if the client config is missing
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase client configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for the frontend build, or SUPABASE_URL/SUPABASE_ANON_KEY for server-side config.');
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required for the frontend');
}
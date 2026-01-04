import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
// Load environment variables from .env file (development)
dotenv.config();

// Prefer server-side env names. If unavailable (legacy), fall back to VITE_ vars
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Provide a clear error for deployment logs
  const missing = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');
  console.error(`Supabase configuration missing: ${missing.join(', ')}. Set these in your environment (e.g., Vercel Dashboard).`);
  throw new Error('Missing Supabase configuration. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.');
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Insert a workout into the "workouts" table
export async function insertWorkout(workout: Record<string, any>) {
  const { data, error } = await supabase
    .from("workouts")
    .insert([workout])
    .select();

  if (error) {
    throw error;
  }
  return data;
}
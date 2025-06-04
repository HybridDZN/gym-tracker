import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
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
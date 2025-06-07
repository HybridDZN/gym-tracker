export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;


// Debugging 
// console.log("Supabase URL:", SUPABASE_URL);
// console.log("Supabase Anon Key:", SUPABASE_ANON_KEY ? "Set" : "Not Set");
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  alert("Missing Supabase configuration.");
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required");
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Missing Supabase environment variables!\n" +
    "Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel project settings:\n" +
    "Vercel Dashboard → Your Project → Settings → Environment Variables"
  );
}

export const supabase = createClient(
  supabaseUrl || "",
  supabaseAnonKey || "",
  {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

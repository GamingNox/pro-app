import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — " +
      "set them in .env.local (local) and in Vercel → Project → Settings → Environment Variables (prod)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Logs a Supabase mutation error to the console without swallowing the rejection.
 * Use for fire-and-forget updates/deletes where optimistic UI has already applied.
 *
 *   supabase.from("x").update(...).eq("id", id).then(logMutation("x.update"));
 */
export function logMutation(op: string) {
  return (res: { error: { message?: string } | null }) => {
    if (res.error) {
      console.error(`[supabase] ${op} failed:`, res.error.message || res.error);
    }
  };
}

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

/**
 * Demo mode is the zero-config path for local Cursor.
 * It is on when NEXT_PUBLIC_DEMO_MODE=true, or when Supabase URL/key are missing.
 * NEXT_PUBLIC_DEMO_MODE=false forces the real Supabase path.
 */
export function isDemoMode() {
  const flag = process.env.NEXT_PUBLIC_DEMO_MODE;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return !supabaseUrl() || !supabaseAnonKey();
}

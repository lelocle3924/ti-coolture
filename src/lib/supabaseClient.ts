import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes("your-project-ref")
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Retrieves the active Supabase access token (JWT) if signed in.
 */
export async function getSupabaseToken(): Promise<string | null> {
  const adminBypass = typeof localStorage !== "undefined" ? localStorage.getItem("ti_admin_bypass_token") : null;
  if (adminBypass) return adminBypass;

  if (!supabase) {
    // Check fallback dev token if any
    return typeof localStorage !== "undefined" ? localStorage.getItem("ti_portal_dev_token") : null;
  }
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || (typeof localStorage !== "undefined" ? localStorage.getItem("ti_portal_dev_token") : null);
}

/**
 * Triggers Google OAuth sign-in flow.
 */
export async function signInWithGoogle(redirectTo?: string) {
  if (!supabase) {
    throw new Error("Supabase chưa được cấu hình biến môi trường VITE_SUPABASE_URL.");
  }
  const targetUrl = redirectTo || `${window.location.origin}/portal`;
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: targetUrl,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });
}

/**
 * Signs out from Supabase Auth session.
 */
export async function signOut() {
  localStorage.removeItem("ti_portal_dev_token");
  localStorage.removeItem("ti_portal_dev_email");
  if (supabase) {
    await supabase.auth.signOut();
  }
}

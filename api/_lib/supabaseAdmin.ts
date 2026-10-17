import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

let cachedAdminClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client with service_role key to bypass RLS for server-side verification.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdminClient) return cachedAdminClient;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase configuration (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  }

  cachedAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedAdminClient;
}

/**
 * Computes SHA-256 hash of a raw portal token.
 */
export function hashPortalToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
}

export interface ValidatedPortalInvite {
  id: string;
  shop_id: string;
  status: string;
  expires_at: string;
}

/**
 * Verifies that a portal token is valid, active, and unexpired.
 */
export async function verifyPortalToken(rawToken: string): Promise<ValidatedPortalInvite> {
  if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length < 8) {
    throw new Error("Mã truy cập portal không hợp lệ.");
  }

  const tokenHash = hashPortalToken(rawToken);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("portal_invites")
    .select("id, shop_id, status, expires_at")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !data) {
    throw new Error("Link mời không tồn tại hoặc đã bị thu hồi.");
  }

  if (data.status !== "active") {
    if (data.status === "locked_pending") {
      throw new Error("Dữ liệu của shop đang trong quá trình duyệt. Không thể tải thêm ảnh.");
    }
    throw new Error("Link mời đã hoàn thành hoặc không còn khả dụng.");
  }

  const expiry = new Date(data.expires_at).getTime();
  if (expiry <= Date.now()) {
    throw new Error("Link mời đã hết hạn. Vui lòng liên hệ team Tí Coolture để nhận link mới.");
  }

  return data;
}

import { getSupabaseAdmin } from "./supabaseAdmin.js";

export interface AuthenticatedShopContext {
  userId: string;
  userEmail: string;
  shopId: string;
  shopName: string;
  shopSlug: string;
  shopStatus: string;
  role: "owner" | "editor";
}

export interface AuthenticatedStaffContext {
  userId: string;
  userEmail: string;
  fullName: string;
  role: "admin" | "moderator" | "viewer";
}

/**
 * Extracts Bearer token from incoming request headers.
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Verifies the Supabase JWT and resolves the user's authorized shop membership.
 * Features Auto-Linking: If the user is logging in with an email that was invited,
 * they are automatically enrolled into `shop_members`.
 */
export async function authenticateShopMember(authHeader?: string): Promise<AuthenticatedShopContext> {
  const token = extractBearerToken(authHeader);
  if (!token) {
    throw new Error("Vui lòng đăng nhập với tài khoản Google để tiếp tục.");
  }

  const supabase = getSupabaseAdmin();

  // 1. Verify JWT with Supabase Auth
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    throw new Error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
  }

  const user = userData.user;
  const userEmail = (user.email || "").toLowerCase().trim();

  if (!userEmail) {
    throw new Error("Tài khoản Google không có email hợp lệ.");
  }

  // 2. Check existing shop membership in shop_members
  const { data: memberData } = await supabase
    .from("shop_members")
    .select(`
      shop_role,
      shops (
        id,
        name,
        slug,
        status
      )
    `)
    .eq("user_id", user.id)
    .single();

  if (memberData && memberData.shops) {
    const shop = memberData.shops as any;
    return {
      userId: user.id,
      userEmail,
      shopId: shop.id,
      shopName: shop.name,
      shopSlug: shop.slug,
      shopStatus: shop.status,
      role: memberData.shop_role as "owner" | "editor",
    };
  }

  // 3. Auto-linking: Check if there is an active/pending invitation for this email
  const { data: inviteData } = await supabase
    .from("shop_invitations")
    .select(`
      id,
      shop_id,
      shop_role,
      status,
      expires_at,
      shops (
        id,
        name,
        slug,
        status
      )
    `)
    .eq("invited_email", userEmail)
    .eq("status", "pending")
    .single();

  if (inviteData && inviteData.shops) {
    const expiry = new Date(inviteData.expires_at).getTime();
    if (expiry > Date.now()) {
      // Auto-enroll user into shop_members
      await supabase.from("shop_members").insert({
        user_id: user.id,
        shop_id: inviteData.shop_id,
        shop_role: inviteData.shop_role,
      });

      // Mark invitation as accepted
      await supabase
        .from("shop_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", inviteData.id);

      const shop = inviteData.shops as any;
      return {
        userId: user.id,
        userEmail,
        shopId: shop.id,
        shopName: shop.name,
        shopSlug: shop.slug,
        shopStatus: shop.status,
        role: inviteData.shop_role as "owner" | "editor",
      };
    }
  }

  // 4. Unauthorized
  throw new Error(
    `Email Google "${userEmail}" chưa được cấp quyền quản lý xưởng nào trên Tí Coolture. Vui lòng liên hệ ban quản trị để được hỗ trợ.`
  );
}

/**
 * Verifies that the authenticated user is an internal staff member (admin, moderator, viewer).
 */
export async function authenticateStaffMember(authHeader?: string): Promise<AuthenticatedStaffContext> {
  const token = extractBearerToken(authHeader);
  if (!token) {
    throw new Error("Yêu cầu quyền truy cập của quản trị viên.");
  }

  const supabase = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData?.user) {
    throw new Error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
  }

  const user = userData.user;

  const { data: staffData, error: staffError } = await supabase
    .from("staff_members")
    .select("role, full_name, is_active")
    .eq("user_id", user.id)
    .single();

  if (staffError || !staffData || !staffData.is_active) {
    throw new Error("Tài khoản của bạn không có quyền truy cập quản trị hệ thống.");
  }

  return {
    userId: user.id,
    userEmail: user.email || "",
    fullName: staffData.full_name,
    role: staffData.role as "admin" | "moderator" | "viewer",
  };
}

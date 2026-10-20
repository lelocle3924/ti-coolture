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

export interface AuthenticatedPortalContext {
  userId: string;
  userEmail: string;
  isAdmin: boolean;
  adminRole?: "admin" | "moderator" | "viewer";
  staffName?: string;
  shopId?: string;
  shopName?: string;
  shopSlug?: string;
  shopStatus?: string;
  role: "admin" | "owner" | "editor";
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
 * Authenticates any valid portal user (Staff Admin OR Shop Partner).
 * Returns their role and contextual metadata.
 */
export async function authenticatePortalUser(authHeader?: string): Promise<AuthenticatedPortalContext> {
  const token = extractBearerToken(authHeader);
  if (!token) {
    throw new Error("Vui lòng đăng nhập với tài khoản Google để tiếp tục.");
  }

  // Admin Token Bypass (chỉ cho phép trong Dev/Preview mode)
  const isDev = process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview";
  const adminBypassToken = isDev ? process.env.ADMIN_TOKEN : null;
  if (adminBypassToken && token === adminBypassToken) {
    return {
      userId: "00000000-0000-0000-0000-000000000001",
      userEmail: "admin@ti-coolture.local",
      isAdmin: true,
      adminRole: "admin",
      staffName: "Super Admin (Bypass)",
      role: "admin",
    };
  }

  // Shop Token Bypass (cho phép dev/shop test tài khoản american3924)
  if (token === "american3924@gmail.com" || token === "shop_dev_token") {
    return {
      userId: "9ca20278-5873-4607-b00c-742ac14e9728",
      userEmail: "american3924@gmail.com",
      isAdmin: false,
      shopId: "80cac062-e9f3-4d7a-880f-268d12097828",
      shopName: "American Workshop",
      shopSlug: "american-workshop",
      shopStatus: "published",
      role: "owner",
    };
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

  // 2. Check Staff / Admin membership (by user_id or by email)
  let staffData: any = null;
  const { data: staffByUid } = await supabase
    .from("staff_members")
    .select("id, role, full_name, is_active, user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (staffByUid) {
    staffData = staffByUid;
  } else {
    const { data: staffByEmail } = await supabase
      .from("staff_members")
      .select("id, role, full_name, is_active, user_id")
      .eq("email", userEmail)
      .maybeSingle();

    if (staffByEmail) {
      staffData = staffByEmail;
      // Link user_id to staff record
      await supabase
        .from("staff_members")
        .update({ user_id: user.id })
        .eq("id", staffByEmail.id);
    }
  }

  const isStaffActive = Boolean(staffData && staffData.is_active);

  // 3. Check existing shop membership in shop_members
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

  let shopInfo: any = null;
  if (memberData && memberData.shops) {
    shopInfo = memberData.shops;
  }

  // 4. Auto-linking: Check if there is an active/pending invitation for this email
  if (!shopInfo) {
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
        await supabase.from("shop_members").insert({
          user_id: user.id,
          shop_id: inviteData.shop_id,
          shop_role: inviteData.shop_role,
        });

        await supabase
          .from("shop_invitations")
          .update({
            status: "accepted",
            accepted_at: new Date().toISOString(),
          })
          .eq("id", inviteData.id);

        shopInfo = inviteData.shops;
      }
    }
  }

  // If user is Staff/Admin: allow entry!
  if (isStaffActive) {
    return {
      userId: user.id,
      userEmail,
      isAdmin: true,
      adminRole: staffData.role as "admin" | "moderator" | "viewer",
      staffName: staffData.full_name,
      shopId: shopInfo?.id,
      shopName: shopInfo?.name,
      shopSlug: shopInfo?.slug,
      shopStatus: shopInfo?.status,
      role: "admin",
    };
  }

  // If user has a shop: allow entry!
  if (shopInfo) {
    return {
      userId: user.id,
      userEmail,
      isAdmin: false,
      shopId: shopInfo.id,
      shopName: shopInfo.name,
      shopSlug: shopInfo.slug,
      shopStatus: shopInfo.status,
      role: (memberData?.shop_role as "owner" | "editor") || "owner",
    };
  }

  // Unauthorized
  throw new Error(
    `Email Google "${userEmail}" chưa được cấp quyền quản lý xưởng nào trên Tí Coolture. Vui lòng liên hệ ban quản trị để được hỗ trợ.`
  );
}

/**
 * Legacy shop member auth helper
 */
export async function authenticateShopMember(authHeader?: string): Promise<AuthenticatedShopContext> {
  const context = await authenticatePortalUser(authHeader);
  if (!context.shopId) {
    throw new Error("Tài khoản chưa được liên kết với xưởng nào.");
  }
  return {
    userId: context.userId,
    userEmail: context.userEmail,
    shopId: context.shopId,
    shopName: context.shopName || "",
    shopSlug: context.shopSlug || "",
    shopStatus: context.shopStatus || "draft",
    role: context.role === "editor" ? "editor" : "owner",
  };
}

/**
 * Verifies that the authenticated user is an internal staff member (admin, moderator, viewer).
 */
export async function authenticateStaffMember(authHeader?: string): Promise<AuthenticatedStaffContext> {
  const token = extractBearerToken(authHeader);
  if (!token) {
    throw new Error("Yêu cầu quyền truy cập của quản trị viên.");
  }

  // Admin Token Bypass (chỉ cho phép trong Dev/Preview mode)
  const isDev = process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview";
  const adminBypassToken = isDev ? process.env.ADMIN_TOKEN : null;
  if (adminBypassToken && token === adminBypassToken) {
    return {
      userId: "00000000-0000-0000-0000-000000000001",
      userEmail: "admin@ti-coolture.local",
      fullName: "Super Admin (Bypass)",
      role: "admin",
    };
  }

  const supabase = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData?.user) {
    throw new Error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
  }

  const user = userData.user;
  const userEmail = (user.email || "").toLowerCase().trim();

  let staffData: any = null;
  const { data: staffByUid } = await supabase
    .from("staff_members")
    .select("id, role, full_name, is_active, user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (staffByUid) {
    staffData = staffByUid;
  } else {
    const { data: staffByEmail } = await supabase
      .from("staff_members")
      .select("id, role, full_name, is_active, user_id")
      .eq("email", userEmail)
      .maybeSingle();

    if (staffByEmail) {
      staffData = staffByEmail;
      await supabase
        .from("staff_members")
        .update({ user_id: user.id })
        .eq("id", staffByEmail.id);
    }
  }

  if (!staffData || !staffData.is_active) {
    throw new Error("Tài khoản của bạn không có quyền truy cập quản trị hệ thống.");
  }

  return {
    userId: user.id,
    userEmail: user.email || "",
    fullName: staffData.full_name,
    role: staffData.role as "admin" | "moderator" | "viewer",
  };
}

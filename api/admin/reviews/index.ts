import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateStaffMember } from "../../_lib/supabaseAuth.js";
import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    await authenticateStaffMember(authHeader);

    const supabase = getSupabaseAdmin();

    // 1. Fetch all products with images, shops, categories for Admin review
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("*, shops(id, name, slug, contact_email), product_images(*), categories(name_vi)")
      .order("created_at", { ascending: false });

    if (prodErr) throw prodErr;

    // 2. Fetch all shops with their products for Admin visibility toggling
    const { data: shops, error: shopErr } = await supabase
      .from("shops")
      .select(`
        id,
        name,
        slug,
        status,
        contact_email,
        address,
        area_tag,
        logo_url,
        cover_url,
        created_at,
        products (
          id,
          name_vi,
          price_vnd,
          status,
          category_id,
          product_images (
            id,
            url,
            is_cover
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (shopErr) throw shopErr;

    return res.status(200).json({
      success: true,
      products: products || [],
      shops: shops || [],
    });
  } catch (err: any) {
    console.error("[admin/reviews] Error:", err.message);
    return res.status(401).json({ success: false, error: err.message || "Unauthorized" });
  }
}

/**
 * Placeholder dataset — every shop, product, price and route below comes from
 * docs/03-CONTENT-PACK.md Part B, which marks all of it as INVENTED.
 *
 *   ⚠ Nothing here is a real brand, product or price.
 *   ⚠ Replace with real shops before any public demo. Do not ship these names.
 *
 * Images are generated as inline SVG data URIs rather than stock photography:
 * docs/01-ART-DIRECTION-BRIEF.md §8 bans stock photos outright, and Part C
 * specifies a solid --paper-warm block carrying its ratio label instead.
 */

import type { Database } from "./schema";
import { placeholderImage } from "./placeholder";
import {
  buildExtraImages,
  buildExtraMaterials,
  buildExtraProducts,
  buildFillerImages,
  describe as describeProduct,
  dimensionFor,
} from "./catalogue";
import {
  REAL_MATERIAL_ROWS,
  realProductImageRows,
  realProductMaterialRows,
  realProductRows,
  realShopRows,
  realShopSocialRows,
} from "./realShops";

const PRICE_NOTE = "Giá tham khảo, giá cuối do shop quyết định";
const NOW = "2026-08-14T00:00:00.000Z";

const cat = (slug: string, vi: string, en: string, order: number) => ({
  id: `cat-${slug}`,
  slug,
  name_vi: vi,
  name_en: en,
  icon: null,
  sort_order: order,
  is_active: true,
});

export const seed: Database = {
  categories: [
    cat("thu-cong-trang-tri", "Thủ công & Trang trí", "Craft & Decor", 1),
    cat("nghe-thuat-an-pham", "Nghệ thuật & Ấn phẩm", "Art & Print", 2),
    cat("thoi-trang-phu-kien", "Thời trang & Phụ kiện", "Fashion & Accessories", 3),
    cat("art-toy-suu-tam", "Art Toy & Sưu tầm", "Art Toys & Collectibles", 4),
    cat("cham-soc-ca-nhan", "Chăm sóc cá nhân", "Personal Care", 5),
    cat("am-thuc-dac-san", "Ẩm thực & Đặc sản", "Food & Specialties", 6),
  ],

  materials: [
    { id: "mat-gom", slug: "gom-men-ran", name_vi: "Gốm men rạn", name_en: "Crackle-glaze ceramic" },
    { id: "mat-giay-my-thuat", slug: "giay-my-thuat", name_vi: "Giấy mỹ thuật", name_en: "Fine art paper" },
    { id: "mat-giay-tai-che", slug: "giay-tai-che", name_vi: "Giấy tái chế", name_en: "Recycled paper" },
    { id: "mat-vai-lanh", slug: "vai-lanh", name_vi: "Vải lanh", name_en: "Linen" },
    { id: "mat-cotton-cham", slug: "cotton-nhuom-cham", name_vi: "Cotton nhuộm chàm", name_en: "Indigo-dyed cotton" },
    { id: "mat-resin", slug: "resin", name_vi: "Resin", name_en: "Resin" },
    { id: "mat-sap-dau-nanh", slug: "sap-dau-nanh", name_vi: "Sáp đậu nành", name_en: "Soy wax" },
    { id: "mat-dau-dua", slug: "dau-dua-bo-ket", name_vi: "Dầu dừa, bồ kết", name_en: "Coconut oil, soap berry" },
    { id: "mat-thuy-tinh", slug: "thuy-tinh", name_vi: "Thuỷ tinh", name_en: "Glass" },
    { id: "mat-hop-giay", slug: "hop-giay", name_vi: "Hộp giấy", name_en: "Paperboard" },
  ],

  // ⚠ INVENTED — content pack Part B. Six placeholder shops.
  shops: [
    ["gom-mu-u", "Gốm Mù U", "Men rạn, nung củi, mỗi cái một khác", "Thủ Đức"],
    ["xuong-lem", "Xưởng Lem", "In lụa thủ công. Mực lem là chuyện thường.", "Quận 1"],
    ["chi-do", "Chỉ Đỏ", "Thêu tay trên vải lanh nhuộm chàm", "Chợ Lớn"],
    ["ben-da-studio", "Bến Đá Studio", "Tượng resin đúc thủ công, mỗi mẻ 30 con", "Bình Thạnh"],
    ["nha-co-dai", "Nhà Cỏ Dại", "Nến sáp đậu nành, mùi lấy từ chợ quê", "Gò Vấp"],
    ["muoi-ot-xanh", "Muối Ớt Xanh", "Gia vị vùng miền, đóng lọ nhỏ để tặng", "Tân Bình"],
  ].map(([slug, name, tagline, area]) => ({
    id: `shop-${slug}`,
    slug,
    name,
    tagline_vi: tagline,
    tagline_en: null,
    story_vi: null,
    story_en: null,
    logo_url: placeholderImage("LOGO SHOP"),
    cover_url: placeholderImage("ẢNH BÌA SHOP", "21:9"),
    contact_email: null,
    is_online_only: false,
    address: null,
    area_tag: area,
    status: "published" as const,
    is_featured: false,
    created_at: NOW,
    updated_at: NOW,
  })),

  shop_socials: [
    { id: "soc-1", shop_id: "shop-gom-mu-u", platform: "instagram", url: "https://instagram.com/", handle: null, is_visible: true },
    { id: "soc-2", shop_id: "shop-xuong-lem", platform: "instagram", url: "https://instagram.com/", handle: null, is_visible: true },
    { id: "soc-3", shop_id: "shop-chi-do", platform: "tiktok", url: "https://tiktok.com/", handle: null, is_visible: true },
    { id: "soc-4", shop_id: "shop-ben-da-studio", platform: "instagram", url: "https://instagram.com/", handle: null, is_visible: true },
    { id: "soc-5", shop_id: "shop-nha-co-dai", platform: "facebook", url: "https://facebook.com/", handle: null, is_visible: true },
    { id: "soc-6", shop_id: "shop-muoi-ot-xanh", platform: "instagram", url: "https://instagram.com/", handle: null, is_visible: true },
  ],

  // ⚠ INVENTED — content pack Part B. Twelve placeholder products.
  // The 65k–750k spread is deliberate: cards must survive both extremes.
  products: (
    [
      ["binh-gom-mua-thang-bay", 'Bình gốm "Mưa Tháng Bảy"', "shop-gom-mu-u", "cat-thu-cong-trang-tri", 480000, "mat-gom"],
      ["chen-tra-nung-cui", "Chén trà nung củi (bộ 2)", "shop-gom-mu-u", "cat-thu-cong-trang-tri", 320000, "mat-gom"],
      ["poster-sai-gon-5-gio-sang", 'Poster in lụa "Sài Gòn 5 Giờ Sáng"', "shop-xuong-lem", "cat-nghe-thuat-an-pham", 250000, "mat-giay-my-thuat"],
      ["zine-hem-so-03", 'Zine "Hẻm" số 03', "shop-xuong-lem", "cat-nghe-thuat-an-pham", 120000, "mat-giay-tai-che"],
      ["tui-tote-theu-cham", "Túi tote thêu tay hoa văn Chăm", "shop-chi-do", "cat-thoi-trang-phu-kien", 390000, "mat-vai-lanh"],
      ["khan-bandana-cham", "Khăn bandana nhuộm chàm", "shop-chi-do", "cat-thoi-trang-phu-kien", 180000, "mat-cotton-cham"],
      ["tuong-ca-ong-resin", 'Tượng "Cá Ông" resin xanh ngọc', "shop-ben-da-studio", "cat-art-toy-suu-tam", 750000, "mat-resin"],
      ["moc-khoa-thuyen-thung", 'Móc khoá "Thuyền Thúng"', "shop-ben-da-studio", "cat-art-toy-suu-tam", 95000, "mat-resin"],
      ["nen-cho-som-180g", 'Nến "Chợ Sớm" 180g', "shop-nha-co-dai", "cat-cham-soc-ca-nhan", 285000, "mat-sap-dau-nanh"],
      ["xa-phong-bo-ket", "Xà phòng bồ kết", "shop-nha-co-dai", "cat-cham-soc-ca-nhan", 85000, "mat-dau-dua"],
      ["muoi-ot-xanh-phu-quoc", "Muối ớt xanh Phú Quốc", "shop-muoi-ot-xanh", "cat-am-thuc-dac-san", 65000, "mat-thuy-tinh"],
      ["hop-qua-4-vi-gia-vi", "Hộp quà 4 vị gia vị miền", "shop-muoi-ot-xanh", "cat-am-thuc-dac-san", 340000, "mat-hop-giay"],
    ] as const
  ).map(([slug, name, shopId, categoryId, price], i) => ({
    id: `prod-${slug}`,
    shop_id: shopId,
    category_id: categoryId,
    slug,
    name_vi: name,
    name_en: null,
    short_desc_vi: null,
    short_desc_en: null,
    story_vi: null,
    story_en: null,
    price_vnd: price,
    price_note_vi: PRICE_NOTE,
    price_updated_at: "2026-08-01",
    dimensions: null,
    status: "published" as const,
    is_featured: i < 4,
    published_at: NOW,
    created_at: NOW,
    updated_at: NOW,
    variants: [],
  })),

  product_images: [
    "binh-gom-mua-thang-bay",
    "chen-tra-nung-cui",
    "poster-sai-gon-5-gio-sang",
    "zine-hem-so-03",
    "tui-tote-theu-cham",
    "khan-bandana-cham",
    "tuong-ca-ong-resin",
    "moc-khoa-thuyen-thung",
    "nen-cho-som-180g",
    "xa-phong-bo-ket",
    "muoi-ot-xanh-phu-quoc",
    "hop-qua-4-vi-gia-vi",
  ].map((slug, i) => ({
    id: `img-${slug}`,
    product_id: `prod-${slug}`,
    url: placeholderImage("ẢNH SẢN PHẨM 1:1"),
    alt_vi: "Ảnh sản phẩm mẫu — chưa có ảnh thật",
    alt_en: "Sample product image — real photography pending",
    is_cover: true,
    sort_order: i,
    width: 1200,
    height: 1200,
  })),

  product_materials: [
    { product_id: "prod-binh-gom-mua-thang-bay", material_id: "mat-gom" },
    { product_id: "prod-chen-tra-nung-cui", material_id: "mat-gom" },
    { product_id: "prod-poster-sai-gon-5-gio-sang", material_id: "mat-giay-my-thuat" },
    { product_id: "prod-zine-hem-so-03", material_id: "mat-giay-tai-che" },
    { product_id: "prod-tui-tote-theu-cham", material_id: "mat-vai-lanh" },
    { product_id: "prod-khan-bandana-cham", material_id: "mat-cotton-cham" },
    { product_id: "prod-tuong-ca-ong-resin", material_id: "mat-resin" },
    { product_id: "prod-moc-khoa-thuyen-thung", material_id: "mat-resin" },
    { product_id: "prod-nen-cho-som-180g", material_id: "mat-sap-dau-nanh" },
    { product_id: "prod-xa-phong-bo-ket", material_id: "mat-dau-dua" },
    { product_id: "prod-muoi-ot-xanh-phu-quoc", material_id: "mat-thuy-tinh" },
    { product_id: "prod-hop-qua-4-vi-gia-vi", material_id: "mat-hop-giay" },
  ],

  // ⚠ INVENTED — content pack Part B. Three placeholder routes.
  routes: [
    {
      id: "route-cho-lon",
      slug: "vong-cho-lon",
      title_vi: "Vòng Chợ Lớn",
      title_en: "Chợ Lớn Loop",
      description_vi: "4 điểm · nửa ngày",
      description_en: "4 stops · half a day",
      cover_url: null,
      duration_min: 240,
      status: "published",
      sort_order: 1,
    },
    {
      id: "route-thu-duc",
      slug: "sang-tao-thu-duc",
      title_vi: "Sáng tạo Thủ Đức",
      title_en: "Thủ Đức Makers",
      description_vi: "5 điểm · cả ngày",
      description_en: "5 stops · full day",
      cover_url: null,
      duration_min: 480,
      status: "published",
      sort_order: 2,
    },
    {
      id: "route-quan-1",
      slug: "mot-buoi-chieu-quan-1",
      title_vi: "Một buổi chiều Quận 1",
      title_en: "An Afternoon in District 1",
      description_vi: "3 điểm · 3 giờ",
      description_en: "3 stops · 3 hours",
      cover_url: null,
      duration_min: 180,
      status: "published",
      sort_order: 3,
    },
  ],

  route_stops: [
    // Vòng Chợ Lớn
    ["route-cho-lon", 1, "Bưu điện Chợ Lớn", 14, 74, null],
    ["route-cho-lon", 2, "Hội quán Tuệ Thành", 36, 52, null],
    ["route-cho-lon", 3, "Chợ vải Soái Kình Lâm", 62, 60, null],
    ["route-cho-lon", 4, "Xưởng thêu Chỉ Đỏ", 84, 34, "shop-chi-do"],
    // Sáng tạo Thủ Đức
    ["route-thu-duc", 1, "Ga Metro Bến Thành", 10, 66, null],
    ["route-thu-duc", 2, "Bảo tàng Áo Dài", 32, 44, null],
    ["route-thu-duc", 3, "Lò gốm Mù U", 52, 62, "shop-gom-mu-u"],
    ["route-thu-duc", 4, "Cà phê Xưởng", 72, 38, null],
    ["route-thu-duc", 5, "Chợ đêm Thủ Đức", 90, 58, null],
    // Một buổi chiều Quận 1
    ["route-quan-1", 1, "Đường sách Nguyễn Văn Bình", 18, 60, null],
    ["route-quan-1", 2, "Xưởng Lem", 50, 38, "shop-xuong-lem"],
    ["route-quan-1", 3, "Chung cư 42 Nguyễn Huệ", 82, 56, null],
  ].map(([routeId, n, name, x, y, shopId]) => ({
    id: `stop-${routeId}-${n}`,
    route_id: routeId as string,
    stop_number: n as number,
    name_vi: name as string,
    name_en: null,
    description_vi: null,
    description_en: null,
    address: name as string,
    map_x: x as number,
    map_y: y as number,
    image_url: null,
    external_url: null,
    shop_id: (shopId as string | null) ?? null,
  })),

  // ⚠ INVENTED — content pack Part B, "3 nội dung Hidden Gems".
  featured_items: [
    {
      id: "gem-1",
      placement: "hidden_gem",
      product_id: "prod-binh-gom-mua-thang-bay",
      note_vi: "Cái bình này Tí giữ lại một cái cho mình. Nói vậy đủ hiểu.",
      note_en: null,
      sort_order: 1,
      is_active: true,
    },
    {
      id: "gem-2",
      placement: "hidden_gem",
      product_id: "prod-zine-hem-so-03",
      note_vi: "Zine bán hết trong 3 ngày mỗi lần ra số. Số 03 vừa in lại.",
      note_en: null,
      sort_order: 2,
      is_active: true,
    },
    {
      id: "gem-3",
      placement: "hidden_gem",
      product_id: "prod-tuong-ca-ong-resin",
      note_vi: "Chỉ làm 30 con mỗi mẻ. Mẻ này còn 7.",
      note_en: null,
      sort_order: 3,
      is_active: true,
    },
  ],

  blog_topics: [
    { id: "topic-thu-cong", slug: "thu-cong-my-nghe", name_vi: "Thủ công mỹ nghệ", name_en: "Craft", sort_order: 1 },
    { id: "topic-thuong-hieu", slug: "cau-chuyen-thuong-hieu", name_vi: "Câu chuyện thương hiệu", name_en: "Brand stories", sort_order: 2 },
    { id: "topic-du-lich", slug: "du-lich-mua-sam", name_vi: "Du lịch mua sắm", name_en: "Shopping trips", sort_order: 3 },
  ],

  // ⚠ INVENTED — content pack Part B, "3 tiêu đề bài tạp chí".
  blog_posts: [
    {
      id: "post-gom-nung-cui",
      topic_id: "topic-thu-cong",
      slug: "vi-sao-gom-nung-cui-khong-bao-gio-ra-hai-cai-giong-nhau",
      title_vi: "Vì sao gốm nung củi không bao giờ ra hai cái giống nhau",
      title_en: null,
      excerpt_vi: "Nhiệt độ trong lò không bao giờ đều. Đó không phải lỗi — đó là chữ ký.",
      excerpt_en: null,
      cover_url: placeholderImage("ẢNH BÌA BÀI VIẾT", "3:2"),
      read_minutes: 6,
      status: "published",
      published_at: "2026-08-02T00:00:00.000Z",
    },
    {
      id: "post-chi-do-ba-nam",
      topic_id: "topic-thuong-hieu",
      slug: "chi-do-ba-nam-de-theu-xong-mot-tam-khan-dau-tien",
      title_vi: "Chỉ Đỏ: ba năm để thêu xong một tấm khăn đầu tiên",
      title_en: null,
      excerpt_vi: "Một xưởng thêu nhỏ ở Chợ Lớn, và câu hỏi vì sao phải mất lâu đến thế.",
      excerpt_en: null,
      cover_url: placeholderImage("ẢNH BÌA BÀI VIẾT", "3:2"),
      read_minutes: 8,
      status: "published",
      published_at: "2026-07-20T00:00:00.000Z",
    },
    {
      id: "post-ban-do-12-xuong",
      topic_id: "topic-du-lich",
      slug: "ban-do-12-xuong-thu-cong-con-sot-lai-o-cho-lon",
      title_vi: "Bản đồ 12 xưởng thủ công còn sót lại ở Chợ Lớn",
      title_en: null,
      excerpt_vi: "Đi bộ một buổi chiều là hết. Nhưng phải biết đường mới thấy.",
      excerpt_en: null,
      cover_url: placeholderImage("ẢNH BÌA BÀI VIẾT", "3:2"),
      read_minutes: 11,
      status: "published",
      published_at: "2026-07-05T00:00:00.000Z",
    },
  ],

  collections: [
    {
      id: "coll-gom",
      slug: "gom-va-ban-tay",
      title_vi: "Gốm và bàn tay",
      title_en: "Clay and hands",
      description_vi: "Men rạn, nung củi, không mẻ nào giống mẻ nào.",
      description_en: null,
      cover_url: placeholderImage("ẢNH BÌA BỘ SƯU TẬP", "3:2"),
      sort_order: 1,
      status: "published",
    },
    {
      id: "coll-in-an",
      slug: "muc-va-giay",
      title_vi: "Mực và giấy",
      title_en: "Ink and paper",
      description_vi: "In lụa, zine, poster — làm thủ công từng bản.",
      description_en: null,
      cover_url: placeholderImage("ẢNH BÌA BỘ SƯU TẬP", "3:2"),
      sort_order: 2,
      status: "published",
    },
    {
      id: "coll-qua-tang",
      slug: "qua-tang-duoi-200k",
      title_vi: "Quà dưới 200k",
      title_en: "Gifts under 200k",
      description_vi: "Nhỏ, gọn, mang đi được. Vẫn có gu.",
      description_en: null,
      cover_url: placeholderImage("ẢNH BÌA BỘ SƯU TẬP", "3:2"),
      sort_order: 3,
      status: "published",
    },
    {
      id: "coll-cho-lon",
      slug: "lam-o-cho-lon",
      title_vi: "Làm ở Chợ Lớn",
      title_en: "Made in Chợ Lớn",
      description_vi: "Những xưởng còn giữ nghề trong khu phố cũ.",
      description_en: null,
      cover_url: placeholderImage("ẢNH BÌA BỘ SƯU TẬP", "3:2"),
      sort_order: 4,
      status: "published",
    },
  ],

  collection_products: [
    { collection_id: "coll-gom", product_id: "prod-binh-gom-mua-thang-bay", sort_order: 1 },
    { collection_id: "coll-gom", product_id: "prod-chen-tra-nung-cui", sort_order: 2 },
    { collection_id: "coll-in-an", product_id: "prod-poster-sai-gon-5-gio-sang", sort_order: 1 },
    { collection_id: "coll-in-an", product_id: "prod-zine-hem-so-03", sort_order: 2 },
    { collection_id: "coll-qua-tang", product_id: "prod-moc-khoa-thuyen-thung", sort_order: 1 },
    { collection_id: "coll-qua-tang", product_id: "prod-xa-phong-bo-ket", sort_order: 2 },
    { collection_id: "coll-qua-tang", product_id: "prod-muoi-ot-xanh-phu-quoc", sort_order: 3 },
    { collection_id: "coll-qua-tang", product_id: "prod-khan-bandana-cham", sort_order: 4 },
    { collection_id: "coll-cho-lon", product_id: "prod-tui-tote-theu-cham", sort_order: 1 },
    { collection_id: "coll-cho-lon", product_id: "prod-khan-bandana-cham", sort_order: 2 },
  ],

  site_settings: [
    {
      key: "message_template",
      value:
        'Chào shop, mình thấy sản phẩm "{tên sản phẩm}" trên Tí Coolture và muốn hỏi thêm ạ.',
    },
  ],

  click_events: [],
};

/* ── catalogue-scale extension (2026-08-21) ───────────────────────────────
   The original twelve rows stay exactly as written; everything below is
   appended so the catalogue can be judged at real scale. See
   src/lib/mock/catalogue.ts for why, and for the same INVENTED warning. */

const baseCount = seed.products.length;

seed.products.forEach((row, i) => {
  if (!row.short_desc_vi) {
    row.short_desc_vi = describeProduct(row.name_vi, row.shop_id, row.category_id, i);
  }
  if (!row.dimensions) row.dimensions = dimensionFor(row.category_id, i);
});

seed.products.push(...buildExtraProducts(baseCount));
seed.product_images.push(...buildExtraImages());
seed.product_images.push(...buildFillerImages(seed.products.slice(0, baseCount).map((p) => p.id)));
seed.product_materials.push(...buildExtraMaterials());

/* ── the photographed shops (2026-08-28) ──────────────────────────────────
   Thirteen real shops with their own photography, from the drop the team
   collected. Everything above this line is invented and renders as a labelled
   grey block; this is what actual product imagery looks like in the same
   layouts. See src/lib/mock/realShops.ts — the shop names are real, the
   product names and prices are not.

   Unshifted rather than pushed, deliberately. "Mới nhất" is the default sort
   and it does not reorder, so array order is what the catalogue shows: the
   photographed rows have to come first or the first three screens of
   /products are still grey. */

seed.materials.push(...REAL_MATERIAL_ROWS);
seed.shops.unshift(...realShopRows());
seed.shop_socials.push(...realShopSocialRows());
seed.products.unshift(...realProductRows());
seed.product_images.unshift(...realProductImageRows());
seed.product_materials.push(...realProductMaterialRows());

export { placeholderImage };

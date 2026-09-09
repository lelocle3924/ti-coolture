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
  REAL_MATERIAL_ROWS,
  realProductImageRows,
  realProductMaterialRows,
  realProductRows,
  realShopRows,
  realShopSocialRows,
} from "./realShops";

const PRICE_NOTE = "Giá tham khảo, giá cuối do shop quyết định";
const NOW = "2026-08-14T00:00:00.000Z";

/** One of the seven groups the tabs are built from. */
const cat = (slug: string, vi: string, en: string, order: number) => ({
  id: `cat-${slug}`,
  slug,
  name_vi: vi,
  name_en: en,
  icon: null,
  parent_id: null,
  sort_order: order,
  is_active: true,
});

/** A kind of product inside a group — what a product is actually filed under. */
const sub = (parent: string, slug: string, vi: string, en: string, order: number) => ({
  id: `cat-${slug}`,
  slug,
  name_vi: vi,
  name_en: en,
  icon: null,
  parent_id: `cat-${parent}`,
  sort_order: order,
  is_active: true,
});

export const seed: Database = {
  /* The taxonomy the team supplied on 08/09, verbatim: seven groups, and the
     kinds of product listed under each one. It replaces the six flat
     categories the catalogue was written against, and every product has been
     re-filed against a leaf.

     ⚠ ONE LEAF IS NOT THEIRS. "Đặc sản" under Quà tặng/Quà lưu niệm was added
     here, because the drawing has no group that takes food and the catalogue
     has thirteen food products in it — muối ớt, mắm ruốc, mứt, trà, cà phê,
     and the Tết gift boxes. Filing them under Móc khoá or Hình dán would have
     been worse than saying so. Confirm the group with the team; if food is
     meant to be an eighth group rather than a kind of souvenir, this is the
     one line that changes.

     Five leaves are empty on today's catalogue — Phụ kiện điện thoại, Giấy
     ghi chú, Sổ lập kế hoạch, Hình dán, Gối chườm, Bộ trò chơi and Sách và
     tạp chí. They stay in the list: /products shows their count, which is 0,
     and does not let them be pressed, so the strip states what the site is
     open to stocking without ever offering a filter that empties the page. */
  categories: [
    cat("thoi-trang", "Thời trang", "Fashion", 1),
    sub("thoi-trang", "quan-ao", "Quần áo", "Clothing", 1),
    sub("thoi-trang", "phu-kien", "Phụ kiện", "Accessories", 2),
    sub("thoi-trang", "phu-kien-dien-thoai", "Phụ kiện điện thoại", "Phone accessories", 3),

    cat("san-pham-nghe-thuat", "Sản phẩm nghệ thuật", "Art Products", 2),
    sub("san-pham-nghe-thuat", "tranh-ky-thuat-so", "Tranh Kỹ thuật số", "Digital prints", 1),
    sub("san-pham-nghe-thuat", "tranh-riso", "Tranh Riso", "Riso prints", 2),
    sub("san-pham-nghe-thuat", "tranh-nguyen-ban", "Tranh nguyên bản", "Original prints", 3),
    sub("san-pham-nghe-thuat", "zine", "Zine", "Zines", 4),

    cat("van-phong-pham", "Văn phòng phẩm", "Stationery", 3),
    sub("van-phong-pham", "so", "Sổ", "Notebooks", 1),
    sub("van-phong-pham", "giay-ghi-chu", "Giấy ghi chú", "Sticky notes", 2),
    sub("van-phong-pham", "so-lap-ke-hoach", "Sổ lập kế hoạch", "Planners", 3),
    sub("van-phong-pham", "lich", "Lịch", "Calendars", 4),
    sub("van-phong-pham", "van-phong-pham-khac", "Văn phòng phẩm khác", "Other stationery", 5),

    cat("qua-tang", "Quà tặng/Quà lưu niệm", "Gifts & Souvenirs", 4),
    sub("qua-tang", "thiep", "Thiệp", "Greeting cards", 1),
    sub("qua-tang", "buu-thiep", "Bưu thiếp", "Postcards", 2),
    sub("qua-tang", "nam-cham", "Nam châm", "Magnets", 3),
    sub("qua-tang", "moc-khoa", "Móc khoá", "Keyrings", 4),
    sub("qua-tang", "hinh-dan", "Hình dán", "Stickers", 5),
    sub("qua-tang", "dac-san", "Đặc sản", "Regional specialties", 6),

    cat("noi-that", "Nội thất", "Interiors", 5),
    sub("noi-that", "dung-cu-an-uong", "Dụng cụ ăn uống", "Tableware", 1),
    sub("noi-that", "trang-tri", "Trang trí", "Decor", 2),
    sub("noi-that", "den", "Đèn", "Lighting", 3),
    sub("noi-that", "do-gom", "Đồ gốm", "Ceramics", 4),

    cat("cham-soc-da", "Dưỡng/Chăm sóc da", "Skincare", 6),
    sub("cham-soc-da", "nuoc-hoa", "Nước hoa", "Fragrance", 1),
    sub("cham-soc-da", "nen-thom", "Nến thơm", "Scented candles", 2),
    sub("cham-soc-da", "tam-goi", "Sản phẩm tắm - gội", "Bath & hair", 3),
    sub("cham-soc-da", "goi-chuom", "Gối chườm", "Heat packs", 4),

    cat("giai-tri", "Giải trí", "Leisure", 7),
    sub("giai-tri", "bo-tro-choi", "Bộ trò chơi", "Games", 1),
    sub("giai-tri", "do-choi-thu-bong", "Đồ chơi/Thú bông", "Toys & plush", 2),
    sub("giai-tri", "sach-tap-chi", "Sách và tạp chí", "Books & magazines", 3),
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

  /* The six placeholder shops that used to sit here are gone (09/09), with
     the products they hosted — see `products` below. Their logos and covers
     were placeholderImage() blocks too, so keeping them would have left six
     shops in the directory with a grey cover, a grey logo and nothing to
     sell. The thirteen photographed shops are unshifted in at the bottom of
     this file. */
  shops: [],

  shop_socials: [],

  /* Empty on purpose since 09/09: "xoá các sản phẩm mock mà hình ảnh đang
     để là placeholder… Tôi muốn thấy ảnh sản phẩm thực sự thì sẽ render chỗ
     hidden gems như thế nào."

     There were twelve rows here and sixty-five more in src/lib/mock/catalogue.ts,
     and every one of them rendered as a labelled --paper-warm block reading
     "ẢNH SẢN PHẨM 1:1". That was the right answer while there was no
     photography — docs/01-ART-DIRECTION-BRIEF.md §8 bans stock, so an
     unfilled slot states what it is waiting for. It stopped being the right
     answer once thirteen shops sent real photographs: a grey block tells you
     nothing about how a card, a gem or a rail actually looks.

     catalogue.ts is deleted rather than left unimported. The catalogue is 60
     products now, which is still two pages at 36 a page, so the paging it
     was built to exercise is still exercised.

     placeholderImage() stays. It is still what an unfilled slot renders as
     for any shop that has not sent a picture yet. */
  products: [],

  product_images: [],

  product_materials: [],

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

  /* The last column is the kind of place — see RouteStopRow.category. Filed
     by hand against what each place actually is, not spread evenly to make
     the map look full: Chợ Lớn has no eating stop in the dataset and Quận 1
     has nothing filed under chụp ảnh, and /discover says so rather than
     inventing one. */
  route_stops: [
    // Vòng Chợ Lớn
    ["route-cho-lon", 1, "Bưu điện Chợ Lớn", 14, 74, null, "tham-quan"],
    ["route-cho-lon", 2, "Hội quán Tuệ Thành", 36, 52, null, "chup-anh"],
    ["route-cho-lon", 3, "Chợ vải Soái Kình Lâm", 62, 60, null, "mua-sam"],
    ["route-cho-lon", 4, "Xưởng thêu Chỉ Đỏ", 84, 34, "shop-chi-do", "mua-sam"],
    // Sáng tạo Thủ Đức
    ["route-thu-duc", 1, "Ga Metro Bến Thành", 10, 66, null, "chup-anh"],
    ["route-thu-duc", 2, "Bảo tàng Áo Dài", 32, 44, null, "tham-quan"],
    ["route-thu-duc", 3, "Lò gốm Mù U", 52, 62, "shop-gom-mu-u", "mua-sam"],
    ["route-thu-duc", 4, "Cà phê Xưởng", 72, 38, null, "an-uong"],
    ["route-thu-duc", 5, "Chợ đêm Thủ Đức", 90, 58, null, "an-uong"],
    // Một buổi chiều Quận 1
    ["route-quan-1", 1, "Đường sách Nguyễn Văn Bình", 18, 60, null, "tham-quan"],
    ["route-quan-1", 2, "Xưởng Lem", 50, 38, "shop-xuong-lem", "mua-sam"],
    ["route-quan-1", 3, "Chung cư 42 Nguyễn Huệ", 82, 56, null, "an-uong"],
  ].map(([routeId, n, name, x, y, shopId, category]) => ({
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
    category: category as string,
  })),

  // ⚠ INVENTED — content pack Part B, "3 nội dung Hidden Gems".
  /* ⚠ INVENTED editorial notes, same standing as the rest of this file.
     All three used to point at placeholder products, so the card the 09/09
     note is asking about — "Tôi muốn thấy ảnh sản phẩm thực sự thì sẽ render
     chỗ hidden gems như thế nào" — could only ever show a grey block. Three
     photographed products from three different shops now, so opening the
     card twice shows two real pictures. */
  featured_items: [
    {
      id: "gem-1",
      placement: "hidden_gem",
      product_id: "prod-so-tay-da-bo-khoa-gai",
      note_vi: "Da bò khâu tay. Dùng vài tháng là quyển sổ lên màu của riêng bạn.",
      note_en: null,
      sort_order: 1,
      is_active: true,
    },
    {
      id: "gem-2",
      placement: "hidden_gem",
      product_id: "prod-nen-ca-phe-sua-da",
      note_vi: "Mùi cà phê sữa đá, đựng trong đúng cái ly quen thuộc.",
      note_en: null,
      sort_order: 2,
      is_active: true,
    },
    {
      id: "gem-3",
      placement: "hidden_gem",
      product_id: "prod-den-ban-nam-do",
      note_vi: "Bật lên một cái là góc bàn đổi hẳn tông.",
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

  /* Re-pointed 09/09 onto photographed products. Nothing renders these
     yet — fetchCollections has no caller, and the homepage builds its own
     placeholder collections in src/home/homeData.ts — but a row pointing at
     a deleted product is a trap for whoever wires the real page up. */
  collection_products: [
    { collection_id: "coll-gom", product_id: "prod-vit-gom-hoa-tiet-xanh", sort_order: 1 },
    { collection_id: "coll-in-an", product_id: "prod-tranh-di-nhe-noi-khe", sort_order: 1 },
    { collection_id: "coll-qua-tang", product_id: "prod-moc-khoa-tron-ven", sort_order: 1 },
    { collection_id: "coll-qua-tang", product_id: "prod-thiep-mica-du-day-hanh-phuc", sort_order: 2 },
    { collection_id: "coll-cho-lon", product_id: "prod-so-tay-da-bo-bo-mau", sort_order: 1 },
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

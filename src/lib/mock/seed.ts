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

  /* The three districts of the team's place list (14/09), in the sheet's
     order. They replace the three invented routes (Chợ Lớn, Thủ Đức and an
     afternoon in Quận 1) and take their ids from the district. */
  routes: [
    {
      id: "route-quan-1",
      slug: "quan-1",
      title_vi: "Quận 1",
      title_en: "District 1",
      description_vi: "13 điểm",
      description_en: "13 places",
      cover_url: null,
      duration_min: null,
      status: "published",
      sort_order: 1,
    },
    {
      id: "route-quan-2",
      slug: "quan-2",
      title_vi: "Quận 2",
      title_en: "District 2",
      description_vi: "13 điểm",
      description_en: "13 places",
      cover_url: null,
      duration_min: null,
      status: "published",
      sort_order: 2,
    },
    {
      id: "route-quan-3",
      slug: "quan-3",
      title_vi: "Quận 3",
      title_en: "District 3",
      description_vi: "11 điểm",
      description_en: "11 places",
      cover_url: null,
      duration_min: null,
      status: "published",
      sort_order: 3,
    },
  ],

  /* The team's place list (14/09, "List địa điểm các quận"): each place's
     name, its kinds and its Google Maps link come straight from the sheet.
     The rest is derived from those, and nothing is invented:

       · map_x / map_y are the place's real position, read off its link and
         stretched per axis into the band the islands were drawn in (x 13–87,
         y 34–72), so north is up and east is right. The island is built from
         these, so its outline follows where the places actually are.
       · stop_number runs west to east. The sheet's numbering counts rows, it
         is not a walk, and the pins on /discover are spaced along the walk —
         see pointsAlongRoute.
       · The sheet lists Compound Garment twice, under 3 and under 1, and both
         links open the same pin, so it is one place filed under both. Four
         names are spelled as the place spells itself on its pin: Compund,
         And CLub, Icescream and Infiniti were typos.
       · address is empty: the sheet gives none, and the row links the pin
         instead.

     The kinds are the sheet's key — 1 ăn uống, 2 tham quan, 3 mua sắm,
     4 chụp ảnh, 5 vui chơi giải trí. A kind with nothing in a district stays
     empty (Quận 1 has no vui chơi giải trí, Quận 2 no chụp ảnh) and
     /discover says so rather than inventing a place. */
  route_stops: [
    // Quận 1
    ["route-quan-1", 1, "Hãng đĩa thời đại", 13, 38, ["mua-sam"], "https://maps.app.goo.gl/VbuzUKt5X6wHSujW8"],
    ["route-quan-1", 2, "Scoopy Ice Cream", 15, 36, ["an-uong"], "https://maps.app.goo.gl/ZkfodXd8Jh4qXJbL9"],
    ["route-quan-1", 3, "Cục Gạch Quán", 17, 36, ["an-uong"], "https://maps.app.goo.gl/TA8JymSzJYMP8MTr5"],
    ["route-quan-1", 4, "Tân Định Vintage Store", 21, 34, ["mua-sam"], "https://maps.app.goo.gl/Q8KUTrK467X9Ki3L8"],
    ["route-quan-1", 5, "Au Parc Cafe", 51, 57, ["an-uong"], "https://maps.app.goo.gl/SDhbohJ4zpskYbsKA"],
    ["route-quan-1", 6, "Chùa Ông Ấn Độ", 58, 64, ["tham-quan"], "https://maps.app.goo.gl/iSuBm1EidcHmeqrC9"],
    ["route-quan-1", 7, "Triển lãm những con mắt của thời gian", 61, 58, ["tham-quan"], "https://maps.app.goo.gl/uaHNpT3wMEVX9JeA9"],
    ["route-quan-1", 8, "And Club Photobooth", 61, 63, ["chup-anh"], "https://maps.app.goo.gl/RJJUnXrYwG6c2aVY6"],
    ["route-quan-1", 9, "Tổ hợp mua sắm Lý Tự Trọng", 62, 58, ["an-uong", "mua-sam"], "https://maps.app.goo.gl/nDbnDDn3GM7F6gj8A"],
    ["route-quan-1", 10, "Compound Garment", 63, 72, ["mua-sam", "an-uong"], "https://maps.app.goo.gl/bceyaDaN1uevVQ8U7"],
    ["route-quan-1", 11, "Chung cư Tôn Thất Đạm", 72, 71, ["an-uong", "mua-sam", "chup-anh"], "https://maps.app.goo.gl/N9gTEpY569uFHpHRA"],
    ["route-quan-1", 12, "Bảo tàng Lịch Sử Hồ Chí Minh", 75, 43, ["tham-quan"], "https://maps.app.goo.gl/ab8a8HpUUD1LGLNY6"],
    ["route-quan-1", 13, "Bảo tàng địa chất Việt Nam", 87, 48, ["tham-quan"], "https://maps.app.goo.gl/ESV5enabwP1GJmAt6"],
    // Quận 2
    ["route-quan-2", 1, "Dogma Collection", 13, 68, ["tham-quan"], "https://maps.app.goo.gl/JaoGwFcsQh1PWCzm7"],
    ["route-quan-2", 2, "Sip N Play Board & video game bar", 17, 69, ["an-uong", "vui-choi"], "https://maps.app.goo.gl/N7QtShETowN3vtra8"],
    ["route-quan-2", 3, "Quang San Art Museum", 21, 34, ["tham-quan"], "https://maps.app.goo.gl/QhDnkYGXDtJJVfh16"],
    ["route-quan-2", 4, "Workshop Hub", 29, 65, ["vui-choi"], "https://maps.app.goo.gl/UoLnM7mRaGdZNYgB7"],
    ["route-quan-2", 5, "Simple Place", 30, 47, ["an-uong"], "https://maps.app.goo.gl/hwz7f54Q824mxLsJ6"],
    ["route-quan-2", 6, "annenlamda", 34, 55, ["mua-sam"], "https://maps.app.goo.gl/7MMQWfYmiyyAwEr29"],
    ["route-quan-2", 7, "CHILLALA Art Museum", 38, 66, ["tham-quan"], "https://maps.app.goo.gl/qPWrpmLBuB1eNYY47"],
    ["route-quan-2", 8, "Tổ hợp Hẻm 28 Thảo Điền", 54, 63, ["an-uong", "tham-quan", "mua-sam"], "https://maps.app.goo.gl/2NDWy1jCSR7kdhCD7"],
    ["route-quan-2", 9, "BARTELS Thảo Điền", 55, 70, ["an-uong"], "https://maps.app.goo.gl/W9JAwGj2xS9FjLGM7"],
    ["route-quan-2", 10, "Tổ hợp 14 Trần Ngọc Diện", 60, 68, ["an-uong", "tham-quan", "mua-sam"], "https://maps.app.goo.gl/5g8AfMNUJS2qTgw78"],
    ["route-quan-2", 11, "Infinity Racing", 67, 70, ["vui-choi"], "https://maps.app.goo.gl/mrhzcvLFdeSr8wFx6"],
    ["route-quan-2", 12, "Umatcha Se Artisan Matcha", 68, 63, ["an-uong"], "https://maps.app.goo.gl/hEYCb2yLAbSAipjC7"],
    ["route-quan-2", 13, "SCLIMB Climbing Sport", 87, 72, ["vui-choi"], "https://maps.app.goo.gl/YUTFS7YveAcrTsSw7"],
    // Quận 3
    ["route-quan-3", 1, "Airy Studio", 13, 41, ["vui-choi"], "https://maps.app.goo.gl/mPpSAMp9zDrf1JZV7"],
    ["route-quan-3", 2, "Kollab Photo", 24, 34, ["chup-anh"], "https://maps.app.goo.gl/tGKJQ8d5B7HyqX1K9"],
    ["route-quan-3", 3, "Tổ hợp mua sắm quần áo Lê Văn Sỹ", 24, 35, ["mua-sam"], "https://maps.app.goo.gl/yNww4nicFkXkV9Tz6"],
    ["route-quan-3", 4, "Tran Quan's Archery Club", 25, 43, ["vui-choi"], "https://maps.app.goo.gl/N4W3qg221ZvBNM496"],
    ["route-quan-3", 5, "Workshop làm nến Dipsoul Candle", 35, 72, ["vui-choi"], "https://maps.app.goo.gl/9fqG422hBeBB8MhL8"],
    ["route-quan-3", 6, "Sundate Matcha", 62, 42, ["an-uong"], "https://maps.app.goo.gl/poFfedY98ti9rov27"],
    ["route-quan-3", 7, "Hội Boardgame Ánh Trăng", 62, 72, ["vui-choi"], "https://maps.app.goo.gl/Hb7K6U9o3sT3vBYy7"],
    ["route-quan-3", 8, "Cà phê Rêverie", 78, 52, ["an-uong"], "https://maps.app.goo.gl/Mv97uwDBf7CvV1LS8"],
    ["route-quan-3", 9, "Bảo tàng chứng tích chiến tranh", 81, 56, ["tham-quan"], "https://maps.app.goo.gl/obJqd6TjpqE9dZeY9"],
    ["route-quan-3", 10, "Casinha", 85, 51, ["an-uong"], "https://maps.app.goo.gl/nm382r3og7XxS5b46"],
    ["route-quan-3", 11, "Phê Men", 87, 43, ["an-uong"], "https://maps.app.goo.gl/mAXoGtz7QRWfdqH99"],
  ].map(([routeId, n, name, x, y, categories, link]) => ({
    id: `stop-${routeId}-${n}`,
    route_id: routeId as string,
    stop_number: n as number,
    name_vi: name as string,
    name_en: null,
    description_vi: null,
    description_en: null,
    address: null,
    map_x: x as number,
    map_y: y as number,
    image_url: null,
    external_url: link as string,
    shop_id: null,
    categories: categories as string[],
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

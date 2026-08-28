/**
 * The thirteen shops the team photographed — added 2026-08-28.
 *
 * This module has a different standing from seed.ts and catalogue.ts, and the
 * difference matters:
 *
 *   ✔ SHOP NAMES ARE REAL. These are the shops themselves, and the photography
 *     is theirs — the drop the team collected, not stock and not generated.
 *     docs/01-ART-DIRECTION-BRIEF.md §8 bans stock photography; this is the
 *     opposite of that, and it is why the labelled grey placeholder blocks are
 *     no longer the only thing the catalogue can show.
 *   ⚠ PRODUCT NAMES, PRICES AND CATEGORIES ARE STILL INVENTED. They were
 *     written off what each photograph shows so the grid reads plausibly.
 *     Nothing here was supplied by the shops, and no price is a real price.
 *     Confirm all of it with each shop before any public demo.
 *
 * Images are addressed by convention rather than by manifest, so this stays a
 * plain data module with no build step in front of it:
 *
 *     /shop-photos/<shop slug>/<product index>-<image index>.webp
 *
 * They live in public/ rather than src/assets/ because there are 186 of them
 * and they are referenced by path, not imported — and neither the raw drop nor
 * the optimised output is committed (team decision, 28/08). If the folder is
 * missing, run `python scripts/build-shop-photos.py` against the drop; the
 * slugs below are the ones that script produces.
 */

import type {
  ProductImageRow,
  ProductMaterialRow,
  ProductRow,
  ShopRow,
  ShopSocialRow,
} from "./schema";

const NOW = "2026-08-28T00:00:00.000Z";
const PRICE_NOTE = "Giá tham khảo, giá cuối do shop quyết định";

interface ProductSpec {
  slug: string;
  name: string;
  category: string;
  /** null renders as "Liên hệ" — never as 0. */
  price: number | null;
  material: string;
  /** How many photos the drop has for this product. Most are 3. */
  photos: number;
}

interface ShopSpec {
  slug: string;
  name: string;
  tagline: string;
  area: string;
  /** Instagram handle — these shops sell on their own channels, per §1. */
  handle: string;
  /** In the drop's folder order, because that is what names the files. */
  products: ProductSpec[];
}

const SHOPS: ShopSpec[] = [
  {
    slug: "ga-con-studios",
    name: "Gà Con Studios",
    tagline: "Sổ tay da khâu tay, mỗi cuốn một nết",
    area: "Quận 3",
    handle: "gacon.studios",
    products: [
      { slug: "so-tay-da-bo-bo-mau", name: "Sổ tay da bò (bộ màu)", category: "cat-nghe-thuat-an-pham", price: 320000, material: "mat-da-that", photos: 3 },
      { slug: "so-tay-da-bo-khoa-gai", name: "Sổ tay da bò khoá gài", category: "cat-nghe-thuat-an-pham", price: 280000, material: "mat-da-that", photos: 3 },
    ],
  },
  {
    slug: "lo-stuff",
    name: "Lọ Stuff",
    tagline: "Nến sáp đậu nành, nặn theo mấy món ăn quen",
    area: "Bình Thạnh",
    handle: "lo.stuff",
    products: [
      { slug: "nen-ca-phe-sua-da", name: "Nến cà phê sữa đá", category: "cat-cham-soc-ca-nhan", price: 195000, material: "mat-sap-dau-nanh", photos: 3 },
      { slug: "nen-lon-bia-sai-gon", name: "Nến lon bia Sài Gòn", category: "cat-cham-soc-ca-nhan", price: 165000, material: "mat-sap-dau-nanh", photos: 3 },
      { slug: "nen-banh-flan", name: "Nến bánh flan", category: "cat-cham-soc-ca-nhan", price: 175000, material: "mat-sap-dau-nanh", photos: 3 },
    ],
  },
  {
    slug: "nen-mlem",
    name: "Nến Mlem",
    tagline: "Món Việt đổ thành nến, thắp thì thơm chứ không ăn được",
    area: "Phú Nhuận",
    handle: "nen.mlem",
    products: [
      { slug: "nen-ly-thuy-tinh-quai-dong", name: "Nến ly thuỷ tinh quai đồng", category: "cat-cham-soc-ca-nhan", price: 210000, material: "mat-sap-dau-nanh", photos: 3 },
      { slug: "nen-ca-phe-phin", name: "Nến cà phê phin", category: "cat-cham-soc-ca-nhan", price: 230000, material: "mat-sap-dau-nanh", photos: 3 },
      { slug: "nen-to-pho", name: "Nến tô phở", category: "cat-cham-soc-ca-nhan", price: 260000, material: "mat-sap-dau-nanh", photos: 3 },
      { slug: "nen-che-khuc-bach", name: "Nến chè khúc bạch", category: "cat-cham-soc-ca-nhan", price: 185000, material: "mat-sap-dau-nanh", photos: 3 },
      { slug: "nen-bun-bo-ghe-nhua", name: "Nến bún bò ghế nhựa", category: "cat-cham-soc-ca-nhan", price: 275000, material: "mat-sap-dau-nanh", photos: 3 },
    ],
  },
  {
    slug: "plasti-light",
    name: "Plasti.light",
    tagline: "Đèn mica, ánh chuyển sắc theo góc nhìn",
    area: "Quận 1",
    handle: "plasti.light",
    products: [
      { slug: "den-tru-mica-cau-vong", name: "Đèn trụ mica ánh cầu vồng", category: "cat-thu-cong-trang-tri", price: 690000, material: "mat-mica", photos: 3 },
      { slug: "den-ngu-mica-bo-tron", name: "Đèn ngủ mica bo tròn", category: "cat-thu-cong-trang-tri", price: 520000, material: "mat-mica", photos: 3 },
      { slug: "den-ban-nam-do", name: "Đèn bàn nấm đỏ", category: "cat-thu-cong-trang-tri", price: 750000, material: "mat-mica", photos: 3 },
      { slug: "den-xep-ly-hong-phan", name: "Đèn xếp ly hồng phấn", category: "cat-thu-cong-trang-tri", price: 640000, material: "mat-mica", photos: 3 },
      { slug: "den-de-ban-cam-dat", name: "Đèn để bàn cam đất", category: "cat-thu-cong-trang-tri", price: 580000, material: "mat-mica", photos: 3 },
    ],
  },
  {
    slug: "tap-hoa-tieng-viet",
    name: "Tạp Hoá Tiếng Việt",
    tagline: "Chữ Việt trên mica và giấy, chơi chữ là chính",
    area: "Quận 10",
    handle: "taphoatiengviet",
    products: [
      { slug: "moc-khoa-tron-ven", name: "Móc khoá “Trọn Vẹn”", category: "cat-art-toy-suu-tam", price: 85000, material: "mat-mica", photos: 3 },
      { slug: "khay-mica-xuan-binh-ngo", name: "Khay mica “Xuân Bính Ngọ”", category: "cat-art-toy-suu-tam", price: 190000, material: "mat-mica", photos: 3 },
      { slug: "tranh-di-nhe-noi-khe", name: "Tranh khung “Đi Nhẹ Nói Khẽ Cười Duyên”", category: "cat-nghe-thuat-an-pham", price: 350000, material: "mat-giay-my-thuat", photos: 3 },
      { slug: "thiep-mica-du-day-hanh-phuc", name: "Thiệp mica “Đủ Đầy Hạnh Phúc”", category: "cat-nghe-thuat-an-pham", price: 120000, material: "mat-mica", photos: 3 },
      { slug: "hop-mica-o-nha-thuong-nhau", name: "Hộp mica “Ở Nhà Thương Nhau”", category: "cat-art-toy-suu-tam", price: 165000, material: "mat-mica", photos: 3 },
    ],
  },
  {
    slug: "thaotran-studio",
    name: "Thaotran.studio",
    tagline: "Đèn khối kim loại và đá, mài tay từng cạnh",
    area: "Thủ Đức",
    handle: "thaotran.studio",
    products: [
      { slug: "den-khoi-nhom-bo-4", name: "Đèn khối nhôm (bộ 4 cỡ)", category: "cat-thu-cong-trang-tri", price: 1250000, material: "mat-kim-loai", photos: 3 },
      { slug: "chan-sach-chim-se", name: "Chặn sách chim sẻ", category: "cat-thu-cong-trang-tri", price: 380000, material: "mat-kim-loai", photos: 3 },
      { slug: "den-khoi-diem-ban-mau", name: "Đèn khối “Điểm” bản màu", category: "cat-thu-cong-trang-tri", price: 890000, material: "mat-mica", photos: 3 },
      { slug: "den-da-hong-mai-tay", name: "Đèn đá hồng mài tay", category: "cat-thu-cong-trang-tri", price: null, material: "mat-kim-loai", photos: 3 },
      { slug: "ghe-bang-thep-ngoai-troi", name: "Ghế băng thép ngoài trời", category: "cat-thu-cong-trang-tri", price: null, material: "mat-kim-loai", photos: 3 },
    ],
  },
  {
    slug: "thoi-ke-di-kios",
    name: "Thôi Kệ Đi Kios",
    tagline: "Magnet, sticker và ấn phẩm nhặt từ vỉa hè",
    area: "Quận 4",
    handle: "thoikedi.kios",
    products: [
      { slug: "magnet-tich-cuc-nhieu-len", name: "Magnet “Tích Cực Nhiều Lên”", category: "cat-art-toy-suu-tam", price: 65000, material: "mat-mica", photos: 3 },
      { slug: "magnet-via-he-bo-4", name: "Magnet “Vỉa Hè” (bộ 4)", category: "cat-art-toy-suu-tam", price: 180000, material: "mat-mica", photos: 4 },
      { slug: "magnet-ca-loc", name: "Magnet “Cá Lóc”", category: "cat-art-toy-suu-tam", price: 70000, material: "mat-mica", photos: 3 },
      { slug: "poster-tieu-lenh-chua-lanh", name: "Poster “Tiêu Lệnh Chữa Lành”", category: "cat-nghe-thuat-an-pham", price: 150000, material: "mat-giay-my-thuat", photos: 3 },
      { slug: "moc-khoa-365-ngay-binh-an", name: "Móc khoá “365 Ngày Bình An”", category: "cat-art-toy-suu-tam", price: 90000, material: "mat-mica", photos: 4 },
    ],
  },
  {
    slug: "at-o-studio",
    name: "at.o_studio",
    tagline: "Art toy giấy và mica, lấy tích dân gian làm mẫu",
    area: "Chợ Lớn",
    handle: "at.o_studio",
    products: [
      { slug: "dau-lan-giay-thu-cong", name: "Đầu lân giấy thủ công", category: "cat-art-toy-suu-tam", price: 850000, material: "mat-giay-my-thuat", photos: 3 },
      { slug: "bo-dia-cyanotype-hoa-van", name: "Bộ đĩa cyanotype hoa văn", category: "cat-thu-cong-trang-tri", price: 420000, material: "mat-giay-my-thuat", photos: 3 },
      { slug: "vit-gom-hoa-tiet-xanh", name: "Vịt gốm hoạ tiết xanh", category: "cat-thu-cong-trang-tri", price: 260000, material: "mat-gom", photos: 3 },
      { slug: "tuong-mica-ong-dia", name: "Tượng mica “Ông Địa”", category: "cat-art-toy-suu-tam", price: 690000, material: "mat-mica", photos: 3 },
      { slug: "standee-mica-phat-quang", name: "Standee mica phát quang", category: "cat-art-toy-suu-tam", price: 240000, material: "mat-mica", photos: 4 },
    ],
  },
  {
    slug: "dongvui-space",
    name: "dongvui.space",
    tagline: "Tote in lụa, chữ lấy từ mấy chuyến đi",
    area: "Đà Lạt",
    handle: "dongvui.space",
    products: [
      { slug: "tote-canvas-da-lat-4-mau", name: "Tote canvas “Đà Lạt” (4 màu)", category: "cat-thoi-trang-phu-kien", price: 190000, material: "mat-vai-lanh", photos: 3 },
      { slug: "tote-dalat-dalat-dalat", name: "Tote “Dalat Dalat Dalat”", category: "cat-thoi-trang-phu-kien", price: 210000, material: "mat-vai-lanh", photos: 3 },
      { slug: "tote-du-lich-sapa", name: "Tote “Du Lịch Sapa”", category: "cat-thoi-trang-phu-kien", price: 220000, material: "mat-vai-lanh", photos: 3 },
      { slug: "tote-denim-dalat", name: "Tote denim “Dalat”", category: "cat-thoi-trang-phu-kien", price: 370000, material: "mat-cotton-cham", photos: 3 },
      { slug: "tote-canvas-in-lua-co-lon", name: "Tote canvas in lụa cỡ lớn", category: "cat-thoi-trang-phu-kien", price: 250000, material: "mat-vai-lanh", photos: 3 },
    ],
  },
  {
    slug: "fat-rug",
    name: "fat.rug",
    tagline: "Thảm tufting bắn tay, mẫu nào cũng chỉ làm một cái",
    area: "Gò Vấp",
    handle: "fat.rug",
    products: [
      { slug: "tham-tufting-ong-ho", name: "Thảm tufting “Ông Hổ”", category: "cat-thu-cong-trang-tri", price: 2400000, material: "mat-len-tufting", photos: 3 },
      { slug: "tham-tufting-xe-hoi", name: "Thảm tufting xe hơi", category: "cat-thu-cong-trang-tri", price: 1850000, material: "mat-len-tufting", photos: 3 },
      { slug: "tham-tufting-8-ball", name: "Thảm tufting “8 Ball”", category: "cat-thu-cong-trang-tri", price: 980000, material: "mat-len-tufting", photos: 3 },
      { slug: "tham-tufting-doi-cun", name: "Thảm tufting đôi cún", category: "cat-thu-cong-trang-tri", price: 1250000, material: "mat-len-tufting", photos: 3 },
      { slug: "tham-tufting-ca-chua", name: "Thảm tufting cà chua", category: "cat-thu-cong-trang-tri", price: 890000, material: "mat-len-tufting", photos: 3 },
    ],
  },
  {
    slug: "flickier",
    name: "flickier",
    tagline: "Đèn giấy và nến cột, thắp lên là đổi cả phòng",
    area: "Quận 7",
    handle: "flicker.quicker",
    products: [
      { slug: "den-cot-soc-mau", name: "Đèn cột sọc màu", category: "cat-thu-cong-trang-tri", price: 460000, material: "mat-mica", photos: 3 },
      { slug: "den-lover-bo-doi", name: "Đèn “Lover” (bộ đôi)", category: "cat-thu-cong-trang-tri", price: 520000, material: "mat-sap-dau-nanh", photos: 3 },
      { slug: "den-tru-hong-mo", name: "Đèn trụ hồng mờ", category: "cat-thu-cong-trang-tri", price: 480000, material: "mat-mica", photos: 3 },
      { slug: "den-hop-giay-vuong", name: "Đèn hộp giấy vuông", category: "cat-thu-cong-trang-tri", price: 390000, material: "mat-giay-my-thuat", photos: 3 },
      { slug: "den-hop-in-hoa-tiet-pop", name: "Đèn hộp in hoạ tiết pop", category: "cat-thu-cong-trang-tri", price: 430000, material: "mat-giay-my-thuat", photos: 3 },
    ],
  },
  {
    slug: "nom-vn",
    name: "nom.vn",
    tagline: "Túi gấp và phụ kiện, gọn trong lòng bàn tay",
    area: "Hà Nội",
    handle: "nom.vn",
    products: [
      { slug: "tui-gap-hoa-tiet-cam", name: "Túi gấp “Hoạ Tiết Cam”", category: "cat-thoi-trang-phu-kien", price: 280000, material: "mat-vai-lanh", photos: 3 },
      { slug: "bookmark-kim-loai-bo-3", name: "Bookmark kim loại (bộ 3)", category: "cat-nghe-thuat-an-pham", price: 150000, material: "mat-kim-loai", photos: 3 },
      { slug: "tui-gap-quai-hong", name: "Túi gấp quai hồng", category: "cat-thoi-trang-phu-kien", price: 260000, material: "mat-vai-lanh", photos: 3 },
      { slug: "tui-gap-vai-tai-che", name: "Túi gấp vải tái chế", category: "cat-thoi-trang-phu-kien", price: 240000, material: "mat-vai-lanh", photos: 3 },
      { slug: "bo-qua-du-hi", name: "Bộ quà “Du Hí”", category: "cat-thoi-trang-phu-kien", price: 450000, material: "mat-hop-giay", photos: 3 },
    ],
  },
  {
    slug: "roomroom-mushii",
    name: "roomroom.mushii",
    tagline: "Đèn nấm resin, đổ từng cái một",
    area: "Quận 2",
    handle: "roomroom.mushii",
    products: [
      { slug: "den-nam-hong-bo-3", name: "Đèn nấm hồng (bộ 3)", category: "cat-thu-cong-trang-tri", price: 720000, material: "mat-resin", photos: 6 },
      { slug: "den-nam-chuyen-sac", name: "Đèn nấm chuyển sắc", category: "cat-thu-cong-trang-tri", price: 580000, material: "mat-resin", photos: 3 },
      { slug: "den-nam-cam-ho-phach", name: "Đèn nấm cam hổ phách", category: "cat-thu-cong-trang-tri", price: 620000, material: "mat-resin", photos: 3 },
      { slug: "den-nam-soc-hong", name: "Đèn nấm sọc hồng", category: "cat-thu-cong-trang-tri", price: 540000, material: "mat-resin", photos: 3 },
      { slug: "den-nam-soc-cam", name: "Đèn nấm sọc cam", category: "cat-thu-cong-trang-tri", price: 560000, material: "mat-resin", photos: 3 },
    ],
  },
];

/** `/shop-photos/<shop>/<product index>-<image index>.webp` */
const photoUrl = (shopSlug: string, productIndex: number, imageIndex: number) =>
  `/shop-photos/${shopSlug}/${productIndex + 1}-${imageIndex + 1}.webp`;

/* Four materials the existing seed has no row for. Ceramic, linen, resin and
   soy wax already cover the rest. */
export const REAL_MATERIAL_ROWS = [
  { id: "mat-mica", slug: "mica", name_vi: "Mica", name_en: "Acrylic" },
  { id: "mat-kim-loai", slug: "kim-loai", name_vi: "Kim loại", name_en: "Metal" },
  { id: "mat-len-tufting", slug: "len-tufting", name_vi: "Len tufting", name_en: "Tufted yarn" },
  { id: "mat-da-that", slug: "da-that", name_vi: "Da thật", name_en: "Leather" },
];

export function realShopRows(): ShopRow[] {
  return SHOPS.map((shop) => ({
    id: `shop-${shop.slug}`,
    slug: shop.slug,
    name: shop.name,
    tagline_vi: shop.tagline,
    tagline_en: null,
    story_vi: null,
    story_en: null,
    /* Both taken from the shop's own photography rather than a grey block —
       the whole point of the drop. The logo seal is small and round, so the
       second product's first frame reads as an avatar well enough and keeps
       the cover and the seal from being the same picture. */
    logo_url: photoUrl(shop.slug, Math.min(1, shop.products.length - 1), 0),
    cover_url: photoUrl(shop.slug, 0, 0),
    contact_email: null,
    is_online_only: true,
    address: shop.area,
    area_tag: shop.area,
    status: "published" as const,
    is_featured: false,
    created_at: NOW,
    updated_at: NOW,
  }));
}

export function realShopSocialRows(): ShopSocialRow[] {
  return SHOPS.map((shop) => ({
    id: `soc-${shop.slug}`,
    shop_id: `shop-${shop.slug}`,
    platform: "instagram" as const,
    url: `https://instagram.com/${shop.handle}`,
    handle: shop.handle,
    is_visible: true,
  }));
}

export function realProductRows(): ProductRow[] {
  return SHOPS.flatMap((shop, shopIndex) =>
    shop.products.map((product, i) => ({
      id: `prod-${product.slug}`,
      shop_id: `shop-${shop.slug}`,
      category_id: product.category,
      slug: product.slug,
      name_vi: product.name,
      name_en: null,
      short_desc_vi: `${product.name} — ảnh thật do ${shop.name} gửi. Mô tả và giá còn chờ shop xác nhận.`,
      short_desc_en: null,
      story_vi: null,
      story_en: null,
      price_vnd: product.price,
      price_note_vi: PRICE_NOTE,
      price_updated_at: "2026-08-28",
      dimensions: null,
      status: "published" as const,
      /* The homepage hero and the "featured" rails read this. One per shop for
         the first four shops, so the deck opens on four different makers. */
      is_featured: shopIndex < 4 && i === 0,
      published_at: NOW,
      created_at: NOW,
      updated_at: NOW,
      variants: [],
    }))
  );
}

export function realProductImageRows(): ProductImageRow[] {
  let sortOrder = 0;
  return SHOPS.flatMap((shop) =>
    shop.products.flatMap((product, productIndex) =>
      Array.from({ length: product.photos }, (_, imageIndex) => ({
        id: `img-${product.slug}-${imageIndex + 1}`,
        product_id: `prod-${product.slug}`,
        url: photoUrl(shop.slug, productIndex, imageIndex),
        alt_vi: `${product.name} — ảnh do ${shop.name} cung cấp`,
        alt_en: null,
        is_cover: imageIndex === 0,
        sort_order: sortOrder++,
        /* The drop is mostly 1080x1440 portrait; build-shop-photos.py fits it
           inside 720 on the long edge, so this is the common case. Cards crop
           to square with object-cover either way. */
        width: 540,
        height: 720,
      }))
    )
  );
}

export function realProductMaterialRows(): ProductMaterialRow[] {
  return SHOPS.flatMap((shop) =>
    shop.products.map((product) => ({
      product_id: `prod-${product.slug}`,
      material_id: product.material,
    }))
  );
}

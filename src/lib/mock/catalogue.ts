/**
 * Catalogue-scale placeholder set — added 2026-08-21.
 *
 *   ⚠ INVENTED. Same standing as docs/03-CONTENT-PACK.md Part B: no shop,
 *   ⚠ product, price or description below is real. Do not ship these names.
 *
 * Why it exists: the team asked to see the catalogue at real scale — how many
 * products one page shows, how paging behaves, and how the grid transitions
 * into a product page. Twelve rows could not answer any of that. This module
 * takes the six placeholder shops to 77 products across the six categories,
 * with shops deliberately crossing categories so filter combinations mean
 * something, and with three NULL prices so the "Liên hệ" path stays covered.
 *
 * It also writes short_desc_vi for every product, including the original
 * twelve, which had none — a product page cannot be judged without body copy,
 * and the copy has to run long enough to need a "xem thêm".
 */

import type { ProductImageRow, ProductMaterialRow, ProductRow } from "./schema";
import { placeholderImage } from "./placeholder";

const NOW = "2026-08-21T00:00:00.000Z";
const PRICE_NOTE = "Giá tham khảo, giá cuối do shop quyết định";

/** [slug, name, shop, category, price (null = Liên hệ), material] */
type Row = readonly [string, string, string, string, number | null, string];

const SHOP_NAMES: Record<string, string> = {
  "shop-gom-mu-u": "Gốm Mù U",
  "shop-xuong-lem": "Xưởng Lem",
  "shop-chi-do": "Chỉ Đỏ",
  "shop-ben-da-studio": "Bến Đá Studio",
  "shop-nha-co-dai": "Nhà Cỏ Dại",
  "shop-muoi-ot-xanh": "Muối Ớt Xanh",
};

export const EXTRA_PRODUCT_ROWS: Row[] = [
  // ── Gốm Mù U — men rạn, nung củi ────────────────────────────────────────
  ["dia-men-ran-song-nuoc", "Đĩa men rạn “Sóng Nước”", "shop-gom-mu-u", "cat-dung-cu-an-uong", 260000, "mat-gom"],
  ["ly-gom-mo-tay-bo-4", "Ly gốm mỏ tay (bộ 4)", "shop-gom-mu-u", "cat-dung-cu-an-uong", 420000, "mat-gom"],
  ["am-tra-nung-cui-so-7", "Ấm trà nung củi số 7", "shop-gom-mu-u", "cat-dung-cu-an-uong", 890000, "mat-gom"],
  ["bat-com-men-tro-bo-6", "Bát cơm men tro (bộ 6)", "shop-gom-mu-u", "cat-dung-cu-an-uong", 540000, "mat-gom"],
  ["lo-hoa-co-cao-men-ran", "Lọ hoa cổ cao men rạn", "shop-gom-mu-u", "cat-do-gom", 380000, "mat-gom"],
  ["gat-tan-gom-tron", "Gạt tàn gốm tròn", "shop-gom-mu-u", "cat-do-gom", 150000, "mat-gom"],
  ["khay-gom-vuong-nho", "Khay gốm vuông nhỏ", "shop-gom-mu-u", "cat-do-gom", 190000, "mat-gom"],
  ["coc-gom-quai-moc", "Cốc gốm quai mộc", "shop-gom-mu-u", "cat-dung-cu-an-uong", 165000, "mat-gom"],
  ["binh-hoa-mieng-loe", "Bình hoa miệng loe", "shop-gom-mu-u", "cat-do-gom", null, "mat-gom"],
  ["de-nhang-gom-la-sen", "Đế nhang gốm lá sen", "shop-gom-mu-u", "cat-do-gom", 95000, "mat-gom"],
  ["hop-qua-gom-2-mon", "Hộp quà gốm 2 món", "shop-gom-mu-u", "cat-dac-san", 620000, "mat-hop-giay"],

  // ── Xưởng Lem — in lụa kéo tay ──────────────────────────────────────────
  ["poster-ben-binh-dong", "Poster in lụa “Bến Bình Đông”", "shop-xuong-lem", "cat-tranh-nguyen-ban", 250000, "mat-giay-my-thuat"],
  ["poster-cho-hoa-ho-thi-ky", "Poster “Chợ Hoa Hồ Thị Kỷ”", "shop-xuong-lem", "cat-tranh-riso", 230000, "mat-giay-my-thuat"],
  ["zine-hem-so-04", "Zine “Hẻm” số 04", "shop-xuong-lem", "cat-zine", 120000, "mat-giay-tai-che"],
  ["zine-hem-so-05", "Zine “Hẻm” số 05", "shop-xuong-lem", "cat-zine", 130000, "mat-giay-tai-che"],
  ["bo-buu-thiep-6-tam", "Bộ bưu thiếp 6 tấm", "shop-xuong-lem", "cat-buu-thiep", 90000, "mat-giay-my-thuat"],
  ["so-tay-khau-chi", "Sổ tay khâu chỉ giấy tái chế", "shop-xuong-lem", "cat-so", 145000, "mat-giay-tai-che"],
  ["lich-ban-in-lua-2027", "Lịch bàn in lụa 2027", "shop-xuong-lem", "cat-lich", 210000, "mat-giay-my-thuat"],
  ["tranh-in-lua-khung-go", "Tranh in lụa khung gỗ", "shop-xuong-lem", "cat-tranh-nguyen-ban", 780000, "mat-giay-my-thuat"],
  ["tui-vai-in-lua-lem", "Túi vải in lụa “Lem”", "shop-xuong-lem", "cat-phu-kien", 180000, "mat-vai-lanh"],
  ["bookmark-in-lua-bo-4", "Bookmark in lụa (bộ 4)", "shop-xuong-lem", "cat-van-phong-pham-khac", 55000, "mat-giay-my-thuat"],
  ["poster-khu-tap-the", "Poster “Khu Tập Thể”", "shop-xuong-lem", "cat-tranh-riso", 240000, "mat-giay-my-thuat"],
  ["zine-anh-den-trang", "Zine ảnh đen trắng", "shop-xuong-lem", "cat-zine", 160000, "mat-giay-tai-che"],

  // ── Chỉ Đỏ — thêu tay, nhuộm chàm ───────────────────────────────────────
  ["ao-so-mi-lanh-moc", "Áo sơ mi lanh mộc", "shop-chi-do", "cat-quan-ao", 690000, "mat-vai-lanh"],
  ["khan-quang-vien-do", "Khăn quàng viền đỏ", "shop-chi-do", "cat-phu-kien", 210000, "mat-cotton-cham"],
  ["tui-deo-cheo-lanh", "Túi đeo chéo vải lanh", "shop-chi-do", "cat-phu-kien", 450000, "mat-vai-lanh"],
  ["vi-vai-theu-hoa-nho", "Ví vải thêu hoa nhỏ", "shop-chi-do", "cat-phu-kien", 175000, "mat-vai-lanh"],
  ["bang-do-dau-nhuom-cham", "Băng đô nhuộm chàm", "shop-chi-do", "cat-phu-kien", 85000, "mat-cotton-cham"],
  ["khan-trai-ban-cham", "Khăn trải bàn nhuộm chàm", "shop-chi-do", "cat-trang-tri", 520000, "mat-cotton-cham"],
  ["ao-khoac-cham-form-rong", "Áo khoác chàm form rộng", "shop-chi-do", "cat-quan-ao", 1150000, "mat-cotton-cham"],
  ["tui-dung-but-theu-tay", "Túi đựng bút thêu tay", "shop-chi-do", "cat-van-phong-pham-khac", 130000, "mat-vai-lanh"],
  ["khan-tay-vien-thu-cong", "Khăn tay viền thủ công (bộ 3)", "shop-chi-do", "cat-phu-kien", 120000, "mat-cotton-cham"],
  ["non-vai-cham-van-song", "Nón vải chàm vân sóng", "shop-chi-do", "cat-phu-kien", 260000, "mat-cotton-cham"],
  ["tam-lot-ly-theu-bo-4", "Tấm lót ly thêu (bộ 4)", "shop-chi-do", "cat-dung-cu-an-uong", 140000, "mat-vai-lanh"],
  ["ao-thun-in-lua-cham", "Áo thun in lụa nhuộm chàm", "shop-chi-do", "cat-quan-ao", null, "mat-cotton-cham"],

  // ── Bến Đá Studio — resin đúc thủ công ──────────────────────────────────
  ["tuong-ong-dia-mini", "Tượng “Ông Địa” mini", "shop-ben-da-studio", "cat-do-choi-thu-bong", 430000, "mat-resin"],
  ["bo-tuong-ca-3-con", "Bộ tượng cá 3 con", "shop-ben-da-studio", "cat-do-choi-thu-bong", 990000, "mat-resin"],
  ["moc-khoa-ghe-nhua-do", "Móc khoá “Ghế Nhựa Đỏ”", "shop-ben-da-studio", "cat-moc-khoa", 95000, "mat-resin"],
  ["tuong-meo-mai-ngoi", "Tượng “Mèo Mái Ngói”", "shop-ben-da-studio", "cat-do-choi-thu-bong", 560000, "mat-resin"],
  ["den-ngu-resin-van-song", "Đèn ngủ resin vân sóng", "shop-ben-da-studio", "cat-den", 720000, "mat-resin"],
  ["pin-cai-ao-bo-5", "Pin cài áo (bộ 5)", "shop-ben-da-studio", "cat-phu-kien", 110000, "mat-resin"],
  ["tuong-xe-lam-mini", "Tượng “Xe Lam” mini", "shop-ben-da-studio", "cat-do-choi-thu-bong", 480000, "mat-resin"],
  ["chan-giay-resin-song", "Chặn giấy resin vân sóng", "shop-ben-da-studio", "cat-van-phong-pham-khac", 350000, "mat-resin"],
  ["tuong-thung-chai", "Tượng “Thúng Chai”", "shop-ben-da-studio", "cat-do-choi-thu-bong", null, "mat-resin"],
  ["bo-suu-tam-mua-1", "Bộ sưu tầm mùa 1 (6 món)", "shop-ben-da-studio", "cat-do-choi-thu-bong", 1200000, "mat-resin"],

  // ── Nhà Cỏ Dại — nến, xà phòng, thảo mộc ────────────────────────────────
  ["nen-mua-dau-mua-180g", "Nến “Mưa Đầu Mùa” 180g", "shop-nha-co-dai", "cat-nen-thom", 285000, "mat-sap-dau-nanh"],
  ["nen-vuon-sau-90g", "Nến “Vườn Sau” 90g", "shop-nha-co-dai", "cat-nen-thom", 165000, "mat-sap-dau-nanh"],
  ["xa-phong-ca-phe-so", "Xà phòng cà phê sớ", "shop-nha-co-dai", "cat-tam-goi", 90000, "mat-dau-dua"],
  ["dau-goi-bo-ket-250ml", "Dầu gội bồ kết 250ml", "shop-nha-co-dai", "cat-tam-goi", 195000, "mat-dau-dua"],
  ["muoi-tam-thao-moc", "Muối tắm thảo mộc", "shop-nha-co-dai", "cat-tam-goi", 140000, "mat-thuy-tinh"],
  ["tinh-dau-sa-chanh-10ml", "Tinh dầu sả chanh 10ml", "shop-nha-co-dai", "cat-nuoc-hoa", 120000, "mat-thuy-tinh"],
  ["hop-qua-cham-soc-3-mon", "Hộp quà chăm sóc 3 món", "shop-nha-co-dai", "cat-tam-goi", 460000, "mat-hop-giay"],
  ["nen-tealight-bo-9", "Nến tealight (bộ 9)", "shop-nha-co-dai", "cat-nen-thom", 130000, "mat-sap-dau-nanh"],
  ["son-duong-moi-sap-ong", "Son dưỡng môi sáp ong", "shop-nha-co-dai", "cat-tam-goi", 95000, "mat-dau-dua"],
  ["xong-phong-thao-moc", "Xông phòng thảo mộc", "shop-nha-co-dai", "cat-nuoc-hoa", 175000, "mat-hop-giay"],

  // ── Muối Ớt Xanh — gia vị, đặc sản đóng lọ ──────────────────────────────
  ["muoi-tieu-rung-lo-nho", "Muối tiêu rừng lọ nhỏ", "shop-muoi-ot-xanh", "cat-dac-san", 75000, "mat-thuy-tinh"],
  ["tuong-ot-len-men", "Tương ớt lên men", "shop-muoi-ot-xanh", "cat-dac-san", 95000, "mat-thuy-tinh"],
  ["muoi-tom-tay-ninh-lo", "Muối tôm Tây Ninh lọ", "shop-muoi-ot-xanh", "cat-dac-san", 70000, "mat-thuy-tinh"],
  ["mam-ruoc-chung-thit", "Mắm ruốc chưng thịt", "shop-muoi-ot-xanh", "cat-dac-san", 130000, "mat-thuy-tinh"],
  ["tra-hoa-cuc-say-lanh", "Trà hoa cúc sấy lạnh", "shop-muoi-ot-xanh", "cat-dac-san", 160000, "mat-hop-giay"],
  ["ca-phe-rang-cui-250g", "Cà phê rang củi 250g", "shop-muoi-ot-xanh", "cat-dac-san", 185000, "mat-hop-giay"],
  ["mut-vo-buoi", "Mứt vỏ bưởi", "shop-muoi-ot-xanh", "cat-dac-san", 85000, "mat-thuy-tinh"],
  ["hop-qua-tet-6-vi", "Hộp quà Tết 6 vị", "shop-muoi-ot-xanh", "cat-dac-san", 690000, "mat-hop-giay"],
  ["duong-thot-not-vien", "Đường thốt nốt viên", "shop-muoi-ot-xanh", "cat-dac-san", 65000, "mat-hop-giay"],
  ["bo-gia-vi-uop-nuong", "Bộ gia vị ướp nướng", "shop-muoi-ot-xanh", "cat-dac-san", 220000, "mat-hop-giay"],
];

/* ── placeholder body copy ──────────────────────────────────────────────
   Written to be obviously generic: it describes how a small workshop works,
   never a claim about a real maker. Half the catalogue gets the long form so
   the product page's "xem thêm" has something to collapse. */

/**
 * Which making process a kind of product comes out of.
 *
 * The body copy and the dimensions used to be keyed by category, back when a
 * category *was* a craft — "Thủ công & Trang trí" meant a kiln. The 08/09
 * taxonomy files by what a thing is for instead, so a group now spans several
 * processes: Nhà cửa holds both a kiln and a lamp shop. This map is the bit
 * that was implicit before, written down.
 */
type Family = "gom" | "in" | "vai" | "duc" | "den" | "det" | "nau" | "lo";

const FAMILY: Record<string, Family> = {
  "cat-do-gom": "gom",
  "cat-dung-cu-an-uong": "gom",

  "cat-tranh-ky-thuat-so": "in",
  "cat-tranh-riso": "in",
  "cat-tranh-nguyen-ban": "in",
  "cat-zine": "in",
  "cat-so": "in",
  "cat-giay-ghi-chu": "in",
  "cat-so-lap-ke-hoach": "in",
  "cat-lich": "in",
  "cat-van-phong-pham-khac": "in",
  "cat-thiep": "in",
  "cat-buu-thiep": "in",
  "cat-hinh-dan": "in",
  "cat-sach-tap-chi": "in",

  "cat-quan-ao": "vai",
  "cat-phu-kien": "vai",
  "cat-phu-kien-dien-thoai": "vai",

  "cat-do-choi-thu-bong": "duc",
  "cat-moc-khoa": "duc",
  "cat-nam-cham": "duc",
  "cat-bo-tro-choi": "duc",

  "cat-den": "den",
  "cat-trang-tri": "det",

  "cat-nen-thom": "nau",
  "cat-tam-goi": "nau",
  "cat-nuoc-hoa": "nau",
  "cat-goi-chuom": "nau",

  "cat-dac-san": "lo",
};

const CRAFT_NOTE: Record<Family, string> = {
  gom: "Làm thủ công theo mẻ nhỏ tại xưởng. Men và nước lửa mỗi mẻ mỗi khác, nên vết men, sắc đậm nhạt và đường tay trên mỗi món đều là dấu riêng của lần nung đó.",
  in: "In và đóng thủ công từng bản, mực chồng lớp nên có bản đậm bản nhạt. Giấy được cắt, gấp và hoàn thiện tại xưởng.",
  vai: "May và hoàn thiện thủ công. Vải nhuộm tự nhiên nên màu sẽ dịu dần sau vài lần giặt — đó là tính chất của thuốc nhuộm, không phải lỗi sản phẩm.",
  duc: "Đúc thủ công theo mẻ giới hạn, sơn tay từng chi tiết. Giữa các con có sai khác nhỏ ở nước sơn và đường viền khuôn.",
  den: "Ghép và mài tay từng khối, đi dây tại xưởng. Vân sáng và sắc màu đổi theo góc nhìn, nên không có hai chiếc giống hệt nhau.",
  det: "Dệt và tufting bằng tay trên khung, xén tỉa từng lớp. Chiều nỉ và độ dày thay đổi nhẹ theo tấm.",
  nau: "Nấu thủ công theo mẻ nhỏ, không phẩm màu. Mùi hương thay đổi nhẹ theo nguyên liệu từng mùa.",
  lo: "Làm theo mẻ nhỏ và đóng lọ thủ công. Hạn dùng cùng hướng dẫn bảo quản được in trên nhãn từng lọ.",
};

const LONG_TAIL =
  "Xưởng nhận làm theo yêu cầu về kích thước, màu và số lượng — nhắn trực tiếp qua kênh của xưởng để hỏi thời gian làm và cách gửi hàng. " +
  "Giá hiển thị trên Tí Coolture là giá tham khảo tại thời điểm xưởng cập nhật; giá cuối, phí gửi và thời gian giao do xưởng quyết định khi bạn liên hệ. " +
  "Tí Coolture không giữ hàng, không nhận thanh toán và không can thiệp vào đơn của bạn.";

const DIMENSIONS: Record<Family, string[]> = {
  gom: ["Ø 12 × 8 cm", "Ø 18 × 4 cm", "14 × 14 × 22 cm", "20 × 20 × 6 cm"],
  in: ["A3 — 29,7 × 42 cm", "A4 — 21 × 29,7 cm", "14 × 20 cm, 32 trang", "10 × 15 cm"],
  vai: ["Free size", "S · M · L", "38 × 42 cm", "60 × 60 cm"],
  duc: ["Cao 9 cm", "Cao 14 cm", "6 × 4 × 3 cm", "Cao 22 cm"],
  den: ["Cao 18 cm", "Cao 24 cm", "12 × 12 × 20 cm", "Ø 14 × 22 cm"],
  det: ["60 × 40 cm", "80 × 50 cm", "Ø 60 cm", "45 × 45 cm"],
  nau: ["180 g", "90 g", "250 ml", "10 ml"],
  lo: ["Lọ 120 g", "Lọ 200 g", "Hộp 6 lọ", "Túi 250 g"],
};

export function describe(name: string, shopId: string, categoryId: string, index: number): string {
  const shop = SHOP_NAMES[shopId] ?? "xưởng";
  const lead = `${name} do ${shop} làm tại xưởng, số lượng có hạn theo mỗi mẻ.`;
  const craft = CRAFT_NOTE[FAMILY[categoryId]] ?? "";
  return index % 2 === 0 ? `${lead} ${craft} ${LONG_TAIL}` : `${lead} ${craft}`;
}

export function dimensionFor(categoryId: string, index: number): string {
  const pool = DIMENSIONS[FAMILY[categoryId]] ?? ["Kích thước theo xưởng"];
  return pool[index % pool.length];
}

/* ── row builders ───────────────────────────────────────────────────────── */

export function buildExtraProducts(startIndex: number): ProductRow[] {
  return EXTRA_PRODUCT_ROWS.map(([slug, name, shopId, categoryId, price], i) => ({
    id: `prod-${slug}`,
    shop_id: shopId,
    category_id: categoryId,
    slug,
    name_vi: name,
    name_en: null,
    short_desc_vi: describe(name, shopId, categoryId, startIndex + i),
    short_desc_en: null,
    story_vi: null,
    story_en: null,
    price_vnd: price,
    price_note_vi: PRICE_NOTE,
    price_updated_at: "2026-08-18",
    dimensions: dimensionFor(categoryId, i),
    status: "published" as const,
    is_featured: false,
    published_at: NOW,
    // Publication dates are spread with a stride that is coprime with the row
    // count, so "mới nhất" interleaves the six shops instead of listing them
    // one workshop at a time — the seed is ordered by shop.
    created_at: new Date(
      Date.parse(NOW) - (startIndex + ((i * 23) % EXTRA_PRODUCT_ROWS.length)) * 36e5
    ).toISOString(),
    updated_at: NOW,
    variants: [],
  }));
}

/** Three slots per product: a cover plus two more, so the gallery, the card
 *  hover swap and the thumbnail strip all have something to show. */
export function buildExtraImages(): ProductImageRow[] {
  return EXTRA_PRODUCT_ROWS.flatMap(([slug], i) =>
    [0, 1, 2].map((n) => ({
      id: `img-${slug}-${n + 1}`,
      product_id: `prod-${slug}`,
      url: placeholderImage(`ẢNH SẢN PHẨM ${n + 1}/3`),
      alt_vi: "Ảnh sản phẩm mẫu — chưa có ảnh thật",
      alt_en: "Sample product image — real photography pending",
      is_cover: n === 0,
      sort_order: i * 3 + n,
      width: 1200,
      height: 1200,
    }))
  );
}

/** The original twelve ship one image each; give them the same three slots so
 *  a gallery, a thumbnail strip and a hover swap behave the same everywhere. */
export function buildFillerImages(productIds: string[]): ProductImageRow[] {
  return productIds.flatMap((id, i) =>
    [1, 2].map((n) => ({
      id: `img-${id}-fill-${n}`,
      product_id: id,
      url: placeholderImage(`ẢNH SẢN PHẨM ${n + 1}/3`),
      alt_vi: "Ảnh sản phẩm mẫu — chưa có ảnh thật",
      alt_en: "Sample product image — real photography pending",
      is_cover: false,
      sort_order: 1000 + i * 2 + n,
      width: 1200,
      height: 1200,
    }))
  );
}

export function buildExtraMaterials(): ProductMaterialRow[] {
  return EXTRA_PRODUCT_ROWS.map(([slug, , , , , material]) => ({
    product_id: `prod-${slug}`,
    material_id: material,
  }));
}

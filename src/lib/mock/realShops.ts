/**
 * The thirteen shops on the site, and everything they show.
 *
 * This module's standing changed on 16/09, and the difference matters:
 *
 *   ✔ SHOP NAMES AND HANDLES ARE REAL — the shops the team collected in
 *     August.
 *   ⚠ EVERYTHING ELSE IS DEMO MATERIAL. "Bỏ hết tất cả ảnh sản phẩm cũ, chỉ
 *     dùng các ảnh trong folder /Ảnh up shop/foreign, vì ảnh trong đây tôi đã
 *     đảm bảo không dính bản quyền, an toàn để làm demo." The shops' own
 *     photographs are gone. Every product — its name, price, category and
 *     material — is written to one of 29 demo photographs, and each shop's
 *     line is whichever of those sit closest to what the shop made. None of
 *     it came from the shops; their descriptions are in shopStories.ts and
 *     have the same standing. Replace all of it before any public demo.
 *
 * The rules the team gave for the catalogue (16/09):
 *
 *   · twice as many products as photographs — 29 photographs, 58 products,
 *     so every photograph opens two products, always in two different shops;
 *   · a product's second picture is related to its first: the same kind of
 *     thing, chosen by eye;
 *   · the third and fourth are random — drawn once with a fixed seed
 *     (Python's random.Random(1609)) and written out, so a reload shows the
 *     same gallery.
 *
 * Each shop's first product gives it its cover and its second the round seal,
 * and no photograph is the cover or the seal of two shops.
 *
 * The photographs are built by scripts/build-shop-photos.py:
 *
 *     /shop-photos/<first 8 characters of the source file name>.webp
 */

import type {
  ProductImageRow,
  ProductMaterialRow,
  ProductRow,
  ShopRow,
  ShopSocialRow,
} from "./schema";
import { SHOP_STORIES } from "./shopStories";

const NOW = "2026-08-28T00:00:00.000Z";
const PRICE_NOTE = "Giá tham khảo, giá cuối do shop quyết định";

interface ProductSpec {
  slug: string;
  name: string;
  category: string;
  /** null renders as "Liên hệ" — never as 0. */
  price: number | null;
  /** null where no material applies — food. */
  material: string | null;
  /** The product, a picture related to it, and two drawn at random. */
  photos: [string, string, string, string];
}

interface ShopSpec {
  slug: string;
  name: string;
  tagline: string;
  area: string;
  /** Instagram handle — these shops sell on their own channels, per §1. */
  handle: string;
  /** The first gives the shop its cover, the second its seal. */
  products: ProductSpec[];
}

/** Each built photograph's size in pixels, long edge 720. */
const PHOTO_SIZES: Record<string, [number, number]> = {
  "01969148": [480, 720],
  "06510d14": [576, 720],
  "0a13156c": [480, 720],
  "0cfc19d9": [540, 720],
  "1854913f": [720, 564],
  "1af9b30d": [480, 720],
  "1c25b61b": [720, 720],
  "209407df": [540, 720],
  "23910558": [480, 720],
  "2879b0e9": [576, 720],
  "37385e31": [405, 720],
  "380d474d": [720, 720],
  "3cb5f709": [480, 720],
  "4072dda8": [541, 720],
  "439f01c7": [540, 720],
  "4afee351": [480, 720],
  "5ccebf97": [576, 720],
  "5f479d48": [576, 720],
  "64c8db60": [720, 720],
  "77ef052b": [503, 720],
  "7fc41ab5": [576, 720],
  "8427ac1c": [480, 720],
  "aff28091": [480, 720],
  "d83eb155": [480, 720],
  "da57170e": [493, 720],
  "de7c8670": [522, 720],
  "e364150f": [480, 720],
  "f0d0c8d2": [480, 720],
  "f1d4e806": [536, 720],
};

const SHOPS: ShopSpec[] = [
  {
    slug: "ga-con-studios",
    name: "Gà Con Studios",
    tagline: "Sổ tay da khâu tay, mỗi cuốn một nết",
    area: "Quận 3",
    handle: "gacon.studios",
    products: [
      { slug: "tui-deo-vai-da-lon-nau-khoa-cai", name: "Túi đeo vai da lộn nâu khoá cài", category: "cat-phu-kien", price: 890000, material: "mat-da-that", photos: ["4072dda8", "f1d4e806", "439f01c7", "d83eb155"] },
      { slug: "tui-hobo-da-do-gach", name: "Túi hobo da đỏ gạch", category: "cat-phu-kien", price: 1150000, material: "mat-da-that", photos: ["5ccebf97", "4072dda8", "209407df", "0a13156c"] },
      { slug: "tui-kep-nach-da-man-chin", name: "Túi kẹp nách da mận chín", category: "cat-phu-kien", price: 790000, material: "mat-da-that", photos: ["f1d4e806", "4072dda8", "1af9b30d", "64c8db60"] },
      { slug: "tui-jean-deo-vai-dinh-no", name: "Túi jean đeo vai đính nơ", category: "cat-phu-kien", price: 380000, material: "mat-denim", photos: ["5f479d48", "4afee351", "de7c8670", "f0d0c8d2"] },
    ],
  },
  {
    slug: "lo-stuff",
    name: "Lọ Stuff",
    tagline: "Nến sáp đậu nành, nặn theo mấy món ăn quen",
    area: "Bình Thạnh",
    handle: "lo.stuff",
    products: [
      { slug: "lo-tru-da-reu", name: "Lọ trụ đá rêu", category: "cat-trang-tri", price: 520000, material: "mat-thuy-tinh", photos: ["77ef052b", "8427ac1c", "4afee351", "7fc41ab5"] },
      { slug: "terrarium-chuong-kinh-de-go", name: "Terrarium chuông kính đế gỗ", category: "cat-trang-tri", price: 590000, material: "mat-thuy-tinh", photos: ["8427ac1c", "77ef052b", "5ccebf97", "1c25b61b"] },
      { slug: "hu-ngu-coc-cacao-gion", name: "Hũ ngũ cốc cacao giòn", category: "cat-dac-san", price: 99000, material: null, photos: ["06510d14", "3cb5f709", "aff28091", "de7c8670"] },
      { slug: "lo-reu-tron-nap-kinh", name: "Lọ rêu tròn nắp kính", category: "cat-trang-tri", price: 450000, material: "mat-thuy-tinh", photos: ["380d474d", "77ef052b", "5ccebf97", "0a13156c"] },
    ],
  },
  {
    slug: "nen-mlem",
    name: "Nến Mlem",
    tagline: "Món Việt đổ thành nến, thắp thì thơm chứ không ăn được",
    area: "Phú Nhuận",
    handle: "nen.mlem",
    products: [
      { slug: "granola-socola-hanh-nhan", name: "Granola socola hạnh nhân", category: "cat-dac-san", price: 129000, material: null, photos: ["06510d14", "e364150f", "380d474d", "1c25b61b"] },
      { slug: "bot-pha-khong-duong-bo-4-vi", name: "Bột pha không đường (bộ 4 vị)", category: "cat-dac-san", price: 189000, material: null, photos: ["3cb5f709", "0a13156c", "8427ac1c", "d83eb155"] },
      { slug: "tra-trai-cay-dong-chai-cap-doi", name: "Trà trái cây đóng chai (cặp đôi)", category: "cat-dac-san", price: 89000, material: null, photos: ["0a13156c", "3cb5f709", "aff28091", "8427ac1c"] },
      { slug: "gio-snack-trai-cay-say-8-goi", name: "Giỏ snack trái cây sấy (8 gói)", category: "cat-dac-san", price: 159000, material: null, photos: ["e364150f", "06510d14", "1c25b61b", "01969148"] },
    ],
  },
  {
    slug: "plasti-light",
    name: "Plasti.light",
    tagline: "Đèn mica, ánh chuyển sắc theo góc nhìn",
    area: "Quận 1",
    handle: "plasti.light",
    products: [
      { slug: "den-mica-tang-xanh-loi-cam", name: "Đèn mica tầng xanh — lõi cam", category: "cat-den", price: 1190000, material: "mat-mica", photos: ["0cfc19d9", "2879b0e9", "06510d14", "77ef052b"] },
      { slug: "charm-mica-ca-xanh", name: "Charm mica cá xanh", category: "cat-moc-khoa", price: 59000, material: "mat-mica", photos: ["1af9b30d", "7fc41ab5", "209407df", "1c25b61b"] },
      { slug: "den-mica-tam-tang-loi-hong", name: "Đèn mica tám tầng — lõi hồng", category: "cat-den", price: 1290000, material: "mat-mica", photos: ["2879b0e9", "0cfc19d9", "4072dda8", "209407df"] },
    ],
  },
  {
    slug: "tap-hoa-tieng-viet",
    name: "Tạp Hoá Tiếng Việt",
    tagline: "Chữ Việt trên mica và giấy, chơi chữ là chính",
    area: "Quận 10",
    handle: "taphoatiengviet",
    products: [
      { slug: "the-treo-chia-khoa-hinh-ca", name: "Thẻ treo chìa khoá hình cá", category: "cat-moc-khoa", price: 79000, material: "mat-mica", photos: ["64c8db60", "01969148", "23910558", "3cb5f709"] },
      { slug: "bo-charm-ly-ca-phe-treo-tui", name: "Bộ charm ly cà phê treo túi", category: "cat-moc-khoa", price: 95000, material: "mat-mica", photos: ["439f01c7", "aff28091", "06510d14", "4afee351"] },
      { slug: "chum-charm-moi-ngay", name: "Chùm charm “Mỗi Ngày”", category: "cat-moc-khoa", price: 145000, material: "mat-mica", photos: ["1af9b30d", "7fc41ab5", "de7c8670", "01969148"] },
      { slug: "charm-tulip-do", name: "Charm tulip đỏ", category: "cat-moc-khoa", price: 69000, material: "mat-mica", photos: ["7fc41ab5", "1af9b30d", "23910558", "f1d4e806"] },
      { slug: "day-deo-chia-khoa-hoa-tiet-la", name: "Dây đeo chìa khoá hoạ tiết lá", category: "cat-moc-khoa", price: 69000, material: "mat-kim-loai", photos: ["01969148", "64c8db60", "7fc41ab5", "2879b0e9"] },
      { slug: "charm-ngoc-trai-treo-tui", name: "Charm ngọc trai treo túi", category: "cat-moc-khoa", price: 89000, material: null, photos: ["f1d4e806", "5ccebf97", "23910558", "1854913f"] },
    ],
  },
  {
    slug: "thaotran-studio",
    name: "Thaotran.studio",
    tagline: "Đèn khối kim loại và đá, mài tay từng cạnh",
    area: "Thủ Đức",
    handle: "thaotran.studio",
    products: [
      { slug: "den-khoi-mica-anh-do", name: "Đèn khối mica ánh đỏ", category: "cat-den", price: 950000, material: "mat-mica", photos: ["2879b0e9", "0cfc19d9", "77ef052b", "439f01c7"] },
      { slug: "paludarium-khung-go-oc-cho", name: "Paludarium khung gỗ óc chó", category: "cat-trang-tri", price: 4500000, material: "mat-thuy-tinh", photos: ["d83eb155", "da57170e", "1c25b61b", "0cfc19d9"] },
      { slug: "vivarium-khung-den-hai-den", name: "Vivarium khung đen hai đèn", category: "cat-trang-tri", price: null, material: "mat-thuy-tinh", photos: ["da57170e", "d83eb155", "1c25b61b", "4072dda8"] },
      { slug: "den-khoi-mica-bon-tang", name: "Đèn khối mica bốn tầng", category: "cat-den", price: 890000, material: "mat-mica", photos: ["0cfc19d9", "2879b0e9", "4072dda8", "8427ac1c"] },
    ],
  },
  {
    slug: "thoi-ke-di-kios",
    name: "Thôi Kệ Đi Kios",
    tagline: "Magnet, sticker và ấn phẩm nhặt từ vỉa hè",
    area: "Quận 4",
    handle: "thoikedi.kios",
    products: [
      { slug: "bo-pin-cai-nha-bien", name: "Bộ pin cài “Nhà Biển”", category: "cat-phu-kien", price: 120000, material: "mat-kim-loai", photos: ["23910558", "f0d0c8d2", "de7c8670", "7fc41ab5"] },
      { slug: "moc-khoa-carabiner-day-du-bo-3-mau", name: "Móc khoá carabiner dây dù (bộ 3 màu)", category: "cat-moc-khoa", price: 159000, material: "mat-kim-loai", photos: ["01969148", "64c8db60", "209407df", "06510d14"] },
      { slug: "moc-khoa-khoen-xanh-hinh-ca", name: "Móc khoá khoen xanh hình cá", category: "cat-moc-khoa", price: 110000, material: "mat-kim-loai", photos: ["64c8db60", "01969148", "439f01c7", "4afee351"] },
      { slug: "bo-pin-cai-xanh-reu", name: "Bộ pin cài xanh rêu", category: "cat-phu-kien", price: 110000, material: "mat-kim-loai", photos: ["f0d0c8d2", "23910558", "d83eb155", "1af9b30d"] },
      { slug: "mu-thuy-thu-jean-duong-chi", name: "Mũ thuỷ thủ jean đường chỉ", category: "cat-phu-kien", price: 250000, material: "mat-denim", photos: ["209407df", "1c25b61b", "06510d14", "de7c8670"] },
    ],
  },
  {
    slug: "at-o-studio",
    name: "at.o_studio",
    tagline: "Art toy giấy và mica, lấy tích dân gian làm mẫu",
    area: "Chợ Lớn",
    handle: "at.o_studio",
    products: [
      { slug: "binh-reu-giac-ngu-trua", name: "Bình rêu “Giấc Ngủ Trưa”", category: "cat-trang-tri", price: 690000, material: "mat-thuy-tinh", photos: ["380d474d", "8427ac1c", "37385e31", "439f01c7"] },
      { slug: "moc-khoa-cun-cam-va-tulip", name: "Móc khoá cún cam và tulip", category: "cat-moc-khoa", price: 99000, material: "mat-mica", photos: ["7fc41ab5", "1af9b30d", "0cfc19d9", "439f01c7"] },
      { slug: "chuong-kinh-nguoi-may-phu-reu", name: "Chuông kính “Người Máy Phủ Rêu”", category: "cat-trang-tri", price: 790000, material: "mat-thuy-tinh", photos: ["8427ac1c", "380d474d", "37385e31", "0cfc19d9"] },
    ],
  },
  {
    slug: "dongvui-space",
    name: "dongvui.space",
    tagline: "Tote in lụa, chữ lấy từ mấy chuyến đi",
    area: "Đà Lạt",
    handle: "dongvui.space",
    products: [
      { slug: "mu-luoi-trai-reu-dinh-pin", name: "Mũ lưỡi trai rêu đính pin", category: "cat-phu-kien", price: 290000, material: "mat-canvas", photos: ["f0d0c8d2", "23910558", "1854913f", "7fc41ab5"] },
      { slug: "tui-day-rut-di-bien", name: "Túi dây rút đi biển", category: "cat-phu-kien", price: 320000, material: "mat-canvas", photos: ["aff28091", "439f01c7", "e364150f", "0cfc19d9"] },
      { slug: "tui-canvas-mini-deo-cheo", name: "Túi canvas mini đeo chéo", category: "cat-phu-kien", price: 390000, material: "mat-canvas", photos: ["439f01c7", "aff28091", "06510d14", "4072dda8"] },
      { slug: "mu-bucket-chi-cam-khau-tay", name: "Mũ bucket chỉ cam khâu tay", category: "cat-phu-kien", price: 350000, material: "mat-denim", photos: ["37385e31", "1854913f", "439f01c7", "380d474d"] },
      { slug: "mu-luoi-trai-xanh-dinh-pin", name: "Mũ lưỡi trai xanh đính pin", category: "cat-phu-kien", price: 310000, material: "mat-canvas", photos: ["23910558", "f0d0c8d2", "de7c8670", "4072dda8"] },
      { slug: "mu-tai-beo-jean-di-phuot", name: "Mũ tai bèo jean đi phượt", category: "cat-phu-kien", price: 260000, material: "mat-denim", photos: ["1854913f", "37385e31", "8427ac1c", "aff28091"] },
    ],
  },
  {
    slug: "fat-rug",
    name: "fat.rug",
    tagline: "Thảm tufting bắn tay, mẫu nào cũng chỉ làm một cái",
    area: "Gò Vấp",
    handle: "fat.rug",
    products: [
      { slug: "mu-bucket-denim-tua-rach", name: "Mũ bucket denim tua rách", category: "cat-phu-kien", price: 340000, material: "mat-denim", photos: ["1c25b61b", "209407df", "380d474d", "4afee351"] },
      { slug: "mu-docker-denim-chap-va", name: "Mũ docker denim chắp vá", category: "cat-phu-kien", price: 280000, material: "mat-denim", photos: ["209407df", "1c25b61b", "1af9b30d", "3cb5f709"] },
      { slug: "mu-bucket-denim-day-rut", name: "Mũ bucket denim dây rút", category: "cat-phu-kien", price: 290000, material: "mat-denim", photos: ["1854913f", "1c25b61b", "380d474d", "23910558"] },
      { slug: "mu-tai-beo-vien-chi-noi", name: "Mũ tai bèo viền chỉ nổi", category: "cat-phu-kien", price: 330000, material: "mat-denim", photos: ["37385e31", "209407df", "0a13156c", "1c25b61b"] },
      { slug: "tui-deo-cheo-jean-nhieu-ngan", name: "Túi đeo chéo jean nhiều ngăn", category: "cat-phu-kien", price: 460000, material: "mat-denim", photos: ["4afee351", "de7c8670", "1c25b61b", "3cb5f709"] },
      { slug: "tui-deo-vai-jean-tui-hop", name: "Túi đeo vai jean túi hộp", category: "cat-phu-kien", price: 420000, material: "mat-denim", photos: ["de7c8670", "4afee351", "1c25b61b", "3cb5f709"] },
    ],
  },
  {
    slug: "flickier",
    name: "flickier",
    tagline: "Đèn giấy và nến cột, thắp lên là đổi cả phòng",
    area: "Quận 7",
    handle: "flicker.quicker",
    products: [
      { slug: "nuoc-ep-dao-dong-chai", name: "Nước ép đào đóng chai", category: "cat-dac-san", price: 45000, material: null, photos: ["0a13156c", "3cb5f709", "f1d4e806", "439f01c7"] },
      { slug: "thach-trai-cay-tui-mix-vi", name: "Thạch trái cây túi mix vị", category: "cat-dac-san", price: 65000, material: null, photos: ["e364150f", "06510d14", "1af9b30d", "f0d0c8d2"] },
      { slug: "tra-sua-hoa-tan-it-ngot", name: "Trà sữa hoà tan ít ngọt", category: "cat-dac-san", price: 79000, material: null, photos: ["3cb5f709", "0a13156c", "e364150f", "4072dda8"] },
    ],
  },
  {
    slug: "nom-vn",
    name: "nom.vn",
    tagline: "Túi gấp và phụ kiện, gọn trong lòng bàn tay",
    area: "Hà Nội",
    handle: "nom.vn",
    products: [
      { slug: "tui-dua-thu-denim-den", name: "Túi đưa thư denim đen", category: "cat-phu-kien", price: 490000, material: "mat-denim", photos: ["4afee351", "de7c8670", "380d474d", "0a13156c"] },
      { slug: "tui-hobo-tai-che-tu-quan-jean", name: "Túi hobo tái chế từ quần jean", category: "cat-phu-kien", price: 420000, material: "mat-denim", photos: ["5f479d48", "de7c8670", "f1d4e806", "0a13156c"] },
      { slug: "tui-kep-nach-nau-dinh-tan", name: "Túi kẹp nách nâu đinh tán", category: "cat-phu-kien", price: 690000, material: "mat-da-that", photos: ["4072dda8", "5ccebf97", "2879b0e9", "209407df"] },
      { slug: "tui-rut-xanh-com-quai-hong", name: "Túi rút xanh cốm quai hồng", category: "cat-phu-kien", price: 350000, material: "mat-canvas", photos: ["aff28091", "439f01c7", "da57170e", "64c8db60"] },
      { slug: "mu-tai-beo-ghep-vai-jean", name: "Mũ tai bèo ghép vải jean", category: "cat-phu-kien", price: 320000, material: "mat-denim", photos: ["1c25b61b", "1854913f", "7fc41ab5", "01969148"] },
      { slug: "tui-xach-da-mem-quai-don", name: "Túi xách da mềm quai đơn", category: "cat-phu-kien", price: 990000, material: "mat-da-that", photos: ["5ccebf97", "f1d4e806", "01969148", "0a13156c"] },
      { slug: "tui-hop-denim-bac-mau", name: "Túi hộp denim bạc màu", category: "cat-phu-kien", price: 450000, material: "mat-denim", photos: ["de7c8670", "5f479d48", "64c8db60", "380d474d"] },
    ],
  },
  {
    slug: "roomroom-mushii",
    name: "roomroom.mushii",
    tagline: "Đèn nấm resin, đổ từng cái một",
    area: "Quận 2",
    handle: "roomroom.mushii",
    products: [
      { slug: "tu-kinh-duong-xi-co-den", name: "Tủ kính dương xỉ có đèn", category: "cat-trang-tri", price: 3900000, material: "mat-thuy-tinh", photos: ["da57170e", "d83eb155", "8427ac1c", "aff28091"] },
      { slug: "tu-kinh-rung-mua-go-lua", name: "Tủ kính rừng mưa gỗ lũa", category: "cat-trang-tri", price: null, material: "mat-thuy-tinh", photos: ["d83eb155", "da57170e", "2879b0e9", "4afee351"] },
      { slug: "be-reu-mini-de-go", name: "Bể rêu mini đế gỗ", category: "cat-trang-tri", price: 480000, material: "mat-thuy-tinh", photos: ["77ef052b", "380d474d", "4afee351", "f1d4e806"] },
    ],
  },
];

/** `/shop-photos/<photograph>.webp` */
const photoUrl = (photo: string) => `/shop-photos/${photo}.webp`;

/* Materials the seed has no row for. Ceramic, linen, resin, glass and soy wax
   are already there. */
export const REAL_MATERIAL_ROWS = [
  { id: "mat-mica", slug: "mica", name_vi: "Mica", name_en: "Acrylic" },
  { id: "mat-kim-loai", slug: "kim-loai", name_vi: "Kim loại", name_en: "Metal" },
  { id: "mat-len-tufting", slug: "len-tufting", name_vi: "Len tufting", name_en: "Tufted yarn" },
  { id: "mat-da-that", slug: "da-that", name_vi: "Da thật", name_en: "Leather" },
  { id: "mat-denim", slug: "denim", name_vi: "Vải denim", name_en: "Denim" },
  { id: "mat-canvas", slug: "canvas", name_vi: "Vải canvas", name_en: "Canvas" },
];

export function realShopRows(): ShopRow[] {
  return SHOPS.map((shop) => ({
    id: `shop-${shop.slug}`,
    slug: shop.slug,
    name: shop.name,
    tagline_vi: SHOP_STORIES[shop.slug]?.tagline ?? shop.tagline,
    tagline_en: null,
    story_vi: SHOP_STORIES[shop.slug]?.story ?? null,
    story_en: null,
    logo_url: photoUrl(shop.products[Math.min(1, shop.products.length - 1)].photos[0]),
    cover_url: photoUrl(shop.products[0].photos[0]),
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

/* ⚠ DEMO CHANNELS (15/09). "thêm các nút demo threads, facebook, tiktok cho
   vài shop 1 cách ngẫu nhiên để kiểm tra hiển thị."

   Drawn once, at random, with a fixed seed — Python's random.Random(1509),
   none to three of the three per shop — and written out here so every reload
   shows the same page: six shops on Instagram alone, two on two platforms,
   one on three and four on all four, which is every count the shop page has
   to lay out.

   The shops never gave these. Each URL is that platform's own search for the
   shop's name, so a click lands somewhere harmless instead of on a stranger
   who happens to hold the same handle there. Take them out before any public
   demo. */
type DemoPlatform = "threads" | "facebook" | "tiktok";

const DEMO_CHANNELS: Record<string, DemoPlatform[]> = {
  "ga-con-studios": ["tiktok"],
  "nen-mlem": ["threads"],
  "tap-hoa-tieng-viet": ["threads", "facebook", "tiktok"],
  "thaotran-studio": ["threads", "facebook", "tiktok"],
  "thoi-ke-di-kios": ["threads", "facebook", "tiktok"],
  "fat-rug": ["threads", "facebook", "tiktok"],
  "nom-vn": ["facebook", "tiktok"],
};

const DEMO_SEARCH: Record<DemoPlatform, (query: string) => string> = {
  threads: (q) => `https://www.threads.net/search?q=${q}`,
  facebook: (q) => `https://www.facebook.com/search/top?q=${q}`,
  tiktok: (q) => `https://www.tiktok.com/search?q=${q}`,
};

export function realShopSocialRows(): ShopSocialRow[] {
  return SHOPS.flatMap((shop) => [
    {
      id: `soc-${shop.slug}`,
      shop_id: `shop-${shop.slug}`,
      platform: "instagram" as const,
      url: `https://instagram.com/${shop.handle}`,
      handle: shop.handle,
      is_visible: true,
    },
    ...(DEMO_CHANNELS[shop.slug] ?? []).map((platform) => ({
      id: `soc-${shop.slug}-${platform}`,
      shop_id: `shop-${shop.slug}`,
      platform,
      url: DEMO_SEARCH[platform](encodeURIComponent(shop.name)),
      handle: null,
      is_visible: true,
    })),
  ]);
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
      short_desc_vi: `${product.name} — ảnh minh hoạ; tên và giá đặt cho bản demo, chưa phải của shop.`,
      short_desc_en: null,
      story_vi: null,
      story_en: null,
      price_vnd: product.price,
      price_note_vi: PRICE_NOTE,
      price_updated_at: "2026-09-16",
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
    shop.products.flatMap((product) =>
      product.photos.map((photo, imageIndex) => ({
        id: `img-${product.slug}-${imageIndex + 1}`,
        product_id: `prod-${product.slug}`,
        url: photoUrl(photo),
        alt_vi: `${product.name} — ảnh minh hoạ ${imageIndex + 1}`,
        alt_en: null,
        is_cover: imageIndex === 0,
        sort_order: sortOrder++,
        width: PHOTO_SIZES[photo][0],
        height: PHOTO_SIZES[photo][1],
      }))
    )
  );
}

export function realProductMaterialRows(): ProductMaterialRow[] {
  return SHOPS.flatMap((shop) =>
    shop.products.flatMap((product) =>
      product.material ? [{ product_id: `prod-${product.slug}`, material_id: product.material }] : []
    )
  );
}

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
 *     material — is written to one of 75 demo photographs, and each shop's
 *     line is whichever of those sit closest to what the shop made. None of
 *     it came from the shops; their descriptions are in shopStories.ts and
 *     have the same standing. Replace all of it before any public demo.
 *
 * The rules the team gave for the catalogue (16/09):
 *
 *   · twice as many products as photographs — 75 photographs (29 at first,
 *     46 more the same day), 150 products — so every photograph opens two
 *     products, always in two different shops;
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

/** Each built photograph's size in pixels, long edge 640. */
const PHOTO_SIZES: Record<string, [number, number]> = {
  "00511e24": [480, 640],
  "01969148": [427, 640],
  "06510d14": [512, 640],
  "0a13156c": [427, 640],
  "0cfc19d9": [480, 640],
  "0d1a7f22": [512, 640],
  "0dd6ab68": [427, 640],
  "0f31f1c3": [457, 640],
  "1042bcd5": [640, 640],
  "122b1194": [518, 640],
  "1854913f": [640, 502],
  "1af9b30d": [427, 640],
  "1c25b61b": [640, 640],
  "207db202": [427, 640],
  "209407df": [480, 640],
  "23910558": [427, 640],
  "2751911f": [640, 620],
  "2879b0e9": [512, 640],
  "31b8afa1": [427, 640],
  "356d93ae": [640, 640],
  "37385e31": [360, 640],
  "380d474d": [640, 640],
  "386e7cef": [480, 640],
  "3cb5f709": [426, 640],
  "3f1e3551": [427, 640],
  "4072dda8": [481, 640],
  "439f01c7": [480, 640],
  "47a9a8c7": [457, 640],
  "4afee351": [427, 640],
  "524f506c": [520, 640],
  "56745fc4": [512, 640],
  "570ae4ca": [427, 640],
  "5b7670e4": [479, 640],
  "5ccebf97": [512, 640],
  "5f479d48": [512, 640],
  "64c8db60": [640, 640],
  "65d8ce37": [387, 640],
  "6f402e93": [640, 640],
  "733c96db": [640, 640],
  "73999c05": [640, 640],
  "77ef052b": [447, 640],
  "7e17da61": [427, 640],
  "7fc41ab5": [512, 640],
  "816754c8": [482, 640],
  "8427ac1c": [427, 640],
  "851ce0fc": [478, 640],
  "8685d0d4": [357, 640],
  "88c9da94": [600, 600],
  "8964cb63": [513, 640],
  "8dfbdb76": [480, 640],
  "9636c8d4": [377, 640],
  "98ecead7": [512, 640],
  "a3e1b8ef": [640, 640],
  "a9713e46": [515, 640],
  "aabcf542": [429, 640],
  "aff28091": [427, 640],
  "b6a8e057": [513, 640],
  "b9b4154a": [360, 640],
  "c424f7ce": [481, 640],
  "c559208b": [360, 640],
  "c81e2cd3": [427, 640],
  "d07d0837": [480, 640],
  "d1a3312e": [530, 640],
  "d83eb155": [427, 640],
  "d96796d3": [640, 640],
  "da57170e": [438, 640],
  "de7c8670": [464, 640],
  "ded490e6": [302, 497],
  "e364150f": [427, 640],
  "e6016326": [512, 640],
  "e7e7ec36": [640, 640],
  "f0d0c8d2": [427, 640],
  "f1d4e806": [477, 640],
  "f9aa0953": [474, 640],
  "fee0346a": [640, 426],
};

const SHOPS: ShopSpec[] = [
  {
    slug: "ga-con-studios",
    name: "Gà Con Studios",
    tagline: "Sổ tay da khâu tay, mỗi cuốn một nết",
    area: "Quận 3",
    handle: "gacon.studios",
    products: [
      { slug: "tui-deo-vai-da-lon-nau-khoa-cai", name: "Túi đeo vai da lộn nâu khoá cài", category: "cat-phu-kien", price: 890000, material: "mat-da-that", photos: ["4072dda8", "f1d4e806", "b6a8e057", "5b7670e4"] },
      { slug: "tui-hobo-da-do-gach", name: "Túi hobo da đỏ gạch", category: "cat-phu-kien", price: 1150000, material: "mat-da-that", photos: ["5ccebf97", "4072dda8", "1af9b30d", "386e7cef"] },
      { slug: "tui-kep-nach-da-man-chin", name: "Túi kẹp nách da mận chín", category: "cat-phu-kien", price: 790000, material: "mat-da-that", photos: ["f1d4e806", "4072dda8", "e7e7ec36", "d83eb155"] },
      { slug: "tui-jean-deo-vai-dinh-no", name: "Túi jean đeo vai đính nơ", category: "cat-phu-kien", price: 380000, material: "mat-denim", photos: ["5f479d48", "4afee351", "ded490e6", "4072dda8"] },
      { slug: "day-deo-dan-guitar-det-hoa-tiet", name: "Dây đeo đàn guitar dệt hoạ tiết", category: "cat-phu-kien", price: 590000, material: "mat-da-that", photos: ["0dd6ab68", "207db202", "da57170e", "122b1194"] },
      { slug: "day-deo-guitar-theu-xanh-ngoc", name: "Dây đeo guitar thêu xanh ngọc", category: "cat-phu-kien", price: 620000, material: "mat-da-that", photos: ["207db202", "0dd6ab68", "851ce0fc", "3cb5f709"] },
      { slug: "gio-dan-cai-hoa-vai", name: "Giỏ đan cài hoa vải", category: "cat-phu-kien", price: 260000, material: "mat-nhua", photos: ["7e17da61", "b6a8e057", "37385e31", "00511e24"] },
      { slug: "tui-da-dan-hong-phan", name: "Túi da đan hồng phấn", category: "cat-phu-kien", price: 850000, material: "mat-da-that", photos: ["b6a8e057", "7e17da61", "0d1a7f22", "f1d4e806"] },
      { slug: "ca-vat-lua-soc-do-xanh", name: "Cà vạt lụa sọc đỏ xanh", category: "cat-phu-kien", price: 220000, material: "mat-lua", photos: ["d1a3312e", "0dd6ab68", "47a9a8c7", "380d474d"] },
    ],
  },
  {
    slug: "lo-stuff",
    name: "Lọ Stuff",
    tagline: "Nến sáp đậu nành, nặn theo mấy món ăn quen",
    area: "Bình Thạnh",
    handle: "lo.stuff",
    products: [
      { slug: "lo-tru-da-reu", name: "Lọ trụ đá rêu", category: "cat-trang-tri", price: 520000, material: "mat-thuy-tinh", photos: ["77ef052b", "8427ac1c", "8dfbdb76", "3f1e3551"] },
      { slug: "terrarium-chuong-kinh-de-go", name: "Terrarium chuông kính đế gỗ", category: "cat-trang-tri", price: 590000, material: "mat-thuy-tinh", photos: ["8427ac1c", "77ef052b", "570ae4ca", "88c9da94"] },
      { slug: "lo-reu-tron-nap-kinh", name: "Lọ rêu tròn nắp kính", category: "cat-trang-tri", price: 450000, material: "mat-thuy-tinh", photos: ["380d474d", "77ef052b", "0cfc19d9", "c81e2cd3"] },
      { slug: "hu-ngu-coc-cacao-gion", name: "Hũ ngũ cốc cacao giòn", category: "cat-dac-san", price: 99000, material: null, photos: ["06510d14", "3cb5f709", "0cfc19d9", "570ae4ca"] },
      { slug: "coc-gom-ca-voi-sao-dem", name: "Cốc gốm cá voi sao đêm", category: "cat-do-gom", price: 290000, material: "mat-gom", photos: ["8685d0d4", "0d1a7f22", "5ccebf97", "2879b0e9"] },
      { slug: "serum-duong-am-lo-nho-giot", name: "Serum dưỡng ẩm lọ nhỏ giọt", category: "cat-duong-da", price: 390000, material: null, photos: ["851ce0fc", "c559208b", "e7e7ec36", "98ecead7"] },
      { slug: "tinh-chat-phuc-hoi-lo-ho-phach", name: "Tinh chất phục hồi lọ hổ phách", category: "cat-duong-da", price: 450000, material: null, photos: ["c559208b", "851ce0fc", "3f1e3551", "207db202"] },
      { slug: "lo-tem-cu-tron-mau", name: "Lọ tem cũ trộn màu", category: "cat-van-phong-pham-khac", price: 180000, material: "mat-giay-my-thuat", photos: ["c81e2cd3", "1042bcd5", "4072dda8", "aabcf542"] },
      { slug: "cuon-chieu-coi-mini-trang-tri", name: "Cuộn chiếu cói mini trang trí", category: "cat-trang-tri", price: 320000, material: "mat-coi", photos: ["6f402e93", "733c96db", "8964cb63", "47a9a8c7"] },
    ],
  },
  {
    slug: "nen-mlem",
    name: "Nến Mlem",
    tagline: "Món Việt đổ thành nến, thắp thì thơm chứ không ăn được",
    area: "Phú Nhuận",
    handle: "nen.mlem",
    products: [
      { slug: "granola-socola-hanh-nhan", name: "Granola socola hạnh nhân", category: "cat-dac-san", price: 129000, material: null, photos: ["06510d14", "e364150f", "00511e24", "b6a8e057"] },
      { slug: "bot-pha-khong-duong-bo-4-vi", name: "Bột pha không đường (bộ 4 vị)", category: "cat-dac-san", price: 189000, material: null, photos: ["3cb5f709", "0a13156c", "c81e2cd3", "380d474d"] },
      { slug: "tra-trai-cay-dong-chai-cap-doi", name: "Trà trái cây đóng chai (cặp đôi)", category: "cat-dac-san", price: 89000, material: null, photos: ["0a13156c", "3cb5f709", "0f31f1c3", "8427ac1c"] },
      { slug: "gio-snack-trai-cay-say-8-goi", name: "Giỏ snack trái cây sấy (8 gói)", category: "cat-dac-san", price: 159000, material: null, photos: ["e364150f", "06510d14", "aff28091", "2751911f"] },
      { slug: "nuoc-dua-len-men-vi-dua-hau-lon", name: "Nước dừa lên men vị dưa hấu (lon)", category: "cat-dac-san", price: 55000, material: null, photos: ["31b8afa1", "65d8ce37", "b6a8e057", "851ce0fc"] },
      { slug: "thanh-nang-luong-socola-lac-hop", name: "Thanh năng lượng socola lạc (hộp)", category: "cat-dac-san", price: 145000, material: null, photos: ["570ae4ca", "56745fc4", "209407df", "31b8afa1"] },
      { slug: "nuoc-chuoi-ep-nap-vo-chuoi", name: "Nước chuối ép nắp vỏ chuối", category: "cat-dac-san", price: 59000, material: null, photos: ["65d8ce37", "31b8afa1", "1c25b61b", "0f31f1c3"] },
      { slug: "keo-mut-ca-sau-xanh", name: "Kẹo mút cá sấu xanh", category: "cat-dac-san", price: 35000, material: null, photos: ["a9713e46", "570ae4ca", "aabcf542", "8dfbdb76"] },
      { slug: "banh-thanh-dam-vi-trai-cay", name: "Bánh thanh đạm vị trái cây", category: "cat-dac-san", price: 89000, material: null, photos: ["56745fc4", "570ae4ca", "73999c05", "9636c8d4"] },
      { slug: "ruou-dua-nhiet-doi", name: "Rượu dừa nhiệt đới", category: "cat-dac-san", price: 420000, material: null, photos: ["2751911f", "31b8afa1", "73999c05", "b6a8e057"] },
      { slug: "ruou-agave-uong-mua-he", name: "Rượu agave uống mùa hè", category: "cat-dac-san", price: 650000, material: null, photos: ["8964cb63", "ded490e6", "37385e31", "7e17da61"] },
      { slug: "the-thom-treo-xe-hinh-sandwich", name: "Thẻ thơm treo xe hình sandwich", category: "cat-moc-khoa", price: 45000, material: "mat-giay-my-thuat", photos: ["98ecead7", "fee0346a", "65d8ce37", "439f01c7"] },
    ],
  },
  {
    slug: "plasti-light",
    name: "Plasti.light",
    tagline: "Đèn mica, ánh chuyển sắc theo góc nhìn",
    area: "Quận 1",
    handle: "plasti.light",
    products: [
      { slug: "den-mica-tang-xanh-loi-cam", name: "Đèn mica tầng xanh — lõi cam", category: "cat-den", price: 1190000, material: "mat-mica", photos: ["0cfc19d9", "2879b0e9", "1af9b30d", "47a9a8c7"] },
      { slug: "charm-mica-ca-xanh", name: "Charm mica cá xanh", category: "cat-moc-khoa", price: 59000, material: "mat-mica", photos: ["1af9b30d", "7fc41ab5", "439f01c7", "98ecead7"] },
      { slug: "den-mica-tam-tang-loi-hong", name: "Đèn mica tám tầng — lõi hồng", category: "cat-den", price: 1290000, material: "mat-mica", photos: ["2879b0e9", "0cfc19d9", "47a9a8c7", "98ecead7"] },
      { slug: "moc-khoa-mica-the-dai-co-khoen", name: "Móc khoá mica thẻ dài có khoen", category: "cat-moc-khoa", price: 99000, material: "mat-mica", photos: ["00511e24", "8dfbdb76", "9636c8d4", "2879b0e9"] },
      { slug: "the-ten-mica-cho-thu-cung", name: "Thẻ tên mica cho thú cưng", category: "cat-moc-khoa", price: 89000, material: "mat-mica", photos: ["8dfbdb76", "00511e24", "8964cb63", "122b1194"] },
      { slug: "moc-khoa-ghe-nhua-cam", name: "Móc khoá ghế nhựa cam", category: "cat-moc-khoa", price: 79000, material: "mat-nhua", photos: ["e6016326", "0f31f1c3", "1af9b30d", "733c96db"] },
      { slug: "the-treo-hinh-banh-mi-kep", name: "Thẻ treo hình bánh mì kẹp", category: "cat-moc-khoa", price: 49000, material: "mat-giay-my-thuat", photos: ["98ecead7", "00511e24", "570ae4ca", "f1d4e806"] },
      { slug: "moc-khoa-oval-xanh-la", name: "Móc khoá oval xanh lá", category: "cat-moc-khoa", price: 59000, material: "mat-mica", photos: ["0f31f1c3", "e6016326", "06510d14", "01969148"] },
      { slug: "khung-giay-khen-go-uon-song", name: "Khung giấy khen gỗ uốn sóng", category: "cat-trang-tri", price: 490000, material: "mat-go", photos: ["122b1194", "e7e7ec36", "1854913f", "f1d4e806"] },
      { slug: "khui-nap-chai-inox-dang-may", name: "Khui nắp chai inox dáng mây", category: "cat-dung-cu-an-uong", price: 170000, material: "mat-kim-loai", photos: ["0d1a7f22", "88c9da94", "8964cb63", "73999c05"] },
    ],
  },
  {
    slug: "tap-hoa-tieng-viet",
    name: "Tạp Hoá Tiếng Việt",
    tagline: "Chữ Việt trên mica và giấy, chơi chữ là chính",
    area: "Quận 10",
    handle: "taphoatiengviet",
    products: [
      { slug: "the-treo-chia-khoa-hinh-ca", name: "Thẻ treo chìa khoá hình cá", category: "cat-moc-khoa", price: 79000, material: "mat-mica", photos: ["64c8db60", "01969148", "d1a3312e", "c424f7ce"] },
      { slug: "bo-charm-ly-ca-phe-treo-tui", name: "Bộ charm ly cà phê treo túi", category: "cat-moc-khoa", price: 95000, material: "mat-mica", photos: ["439f01c7", "aff28091", "b6a8e057", "a9713e46"] },
      { slug: "chum-charm-moi-ngay", name: "Chùm charm “Mỗi Ngày”", category: "cat-moc-khoa", price: 145000, material: "mat-mica", photos: ["1af9b30d", "7fc41ab5", "fee0346a", "00511e24"] },
      { slug: "charm-tulip-do", name: "Charm tulip đỏ", category: "cat-moc-khoa", price: 69000, material: "mat-mica", photos: ["7fc41ab5", "1af9b30d", "816754c8", "31b8afa1"] },
      { slug: "day-deo-chia-khoa-hoa-tiet-la", name: "Dây đeo chìa khoá hoạ tiết lá", category: "cat-moc-khoa", price: 69000, material: "mat-kim-loai", photos: ["01969148", "64c8db60", "56745fc4", "23910558"] },
      { slug: "charm-ngoc-trai-treo-tui", name: "Charm ngọc trai treo túi", category: "cat-moc-khoa", price: 89000, material: null, photos: ["f1d4e806", "5ccebf97", "37385e31", "98ecead7"] },
      { slug: "moc-khoa-ca-noc-hong", name: "Móc khoá cá nóc hồng", category: "cat-moc-khoa", price: 129000, material: "mat-da-that", photos: ["d96796d3", "7fc41ab5", "2751911f", "524f506c"] },
      { slug: "vong-co-charm-nhieu-tang", name: "Vòng cổ charm nhiều tầng", category: "cat-phu-kien", price: 350000, material: "mat-kim-loai", photos: ["3f1e3551", "1af9b30d", "2751911f", "23910558"] },
      { slug: "thiep-o-banh-mi-cat-khuon", name: "Thiệp ổ bánh mì cắt khuôn", category: "cat-thiep", price: 55000, material: "mat-giay-my-thuat", photos: ["47a9a8c7", "fee0346a", "b6a8e057", "8685d0d4"] },
      { slug: "moc-khoa-non-la-kem-thiep", name: "Móc khoá nón lá kèm thiệp", category: "cat-moc-khoa", price: 119000, material: "mat-coi", photos: ["a3e1b8ef", "b6a8e057", "1af9b30d", "380d474d"] },
      { slug: "bo-thiep-banh-mi-bo-dau-phong", name: "Bộ thiệp bánh mì bơ đậu phộng", category: "cat-thiep", price: 85000, material: "mat-giay-my-thuat", photos: ["fee0346a", "e7e7ec36", "439f01c7", "37385e31"] },
      { slug: "buu-thiep-ga-trong-hoa-van", name: "Bưu thiếp gà trống hoa văn", category: "cat-buu-thiep", price: 35000, material: "mat-giay-my-thuat", photos: ["356d93ae", "f9aa0953", "2751911f", "1042bcd5"] },
      { slug: "bo-the-mica-hru-moo-woof", name: "Bộ thẻ mica “Hru Moo Woof”", category: "cat-moc-khoa", price: 119000, material: "mat-mica", photos: ["8dfbdb76", "e6016326", "7e17da61", "5f479d48"] },
      { slug: "danh-thiep-hinh-ao-ngu", name: "Danh thiếp hình áo ngủ", category: "cat-thiep", price: 150000, material: "mat-giay-my-thuat", photos: ["e7e7ec36", "fee0346a", "3cb5f709", "e364150f"] },
      { slug: "charm-non-la-hong-treo-tui", name: "Charm nón lá hồng treo túi", category: "cat-moc-khoa", price: 89000, material: "mat-coi", photos: ["b6a8e057", "a3e1b8ef", "e364150f", "5ccebf97"] },
    ],
  },
  {
    slug: "thaotran-studio",
    name: "Thaotran.studio",
    tagline: "Đèn khối kim loại và đá, mài tay từng cạnh",
    area: "Thủ Đức",
    handle: "thaotran.studio",
    products: [
      { slug: "den-khoi-mica-anh-do", name: "Đèn khối mica ánh đỏ", category: "cat-den", price: 950000, material: "mat-mica", photos: ["2879b0e9", "0cfc19d9", "37385e31", "e6016326"] },
      { slug: "paludarium-khung-go-oc-cho", name: "Paludarium khung gỗ óc chó", category: "cat-trang-tri", price: 4500000, material: "mat-thuy-tinh", photos: ["d83eb155", "da57170e", "c424f7ce", "0d1a7f22"] },
      { slug: "vivarium-khung-den-hai-den", name: "Vivarium khung đen hai đèn", category: "cat-trang-tri", price: null, material: "mat-thuy-tinh", photos: ["da57170e", "d83eb155", "01969148", "e6016326"] },
      { slug: "den-khoi-mica-bon-tang", name: "Đèn khối mica bốn tầng", category: "cat-den", price: 890000, material: "mat-mica", photos: ["0cfc19d9", "2879b0e9", "1c25b61b", "5ccebf97"] },
      { slug: "lich-hop-ngan-keo-ao-vest", name: "Lịch hộp ngăn kéo “Áo Vest”", category: "cat-lich", price: 390000, material: "mat-giay-my-thuat", photos: ["386e7cef", "122b1194", "851ce0fc", "64c8db60"] },
      { slug: "bang-go-vien-luon-khac-chu", name: "Bảng gỗ viền lượn khắc chữ", category: "cat-trang-tri", price: 550000, material: "mat-go", photos: ["122b1194", "386e7cef", "aabcf542", "77ef052b"] },
      { slug: "do-khui-bia-thep-hinh-may", name: "Đồ khui bia thép hình mây", category: "cat-dung-cu-an-uong", price: 190000, material: "mat-kim-loai", photos: ["0d1a7f22", "8685d0d4", "1af9b30d", "9636c8d4"] },
      { slug: "tinh-chat-duong-da-dang-giot", name: "Tinh chất dưỡng da dạng giọt", category: "cat-duong-da", price: 420000, material: null, photos: ["851ce0fc", "c559208b", "00511e24", "f9aa0953"] },
      { slug: "serum-lo-thuy-tinh-ho-phach", name: "Serum lọ thuỷ tinh hổ phách", category: "cat-duong-da", price: 480000, material: null, photos: ["c559208b", "851ce0fc", "ded490e6", "e6016326"] },
      { slug: "hop-den-quay-sach-ti-hon", name: "Hộp đèn quầy sách tí hon", category: "cat-den", price: 720000, material: "mat-go", photos: ["733c96db", "6f402e93", "1c25b61b", "5b7670e4"] },
    ],
  },
  {
    slug: "thoi-ke-di-kios",
    name: "Thôi Kệ Đi Kios",
    tagline: "Magnet, sticker và ấn phẩm nhặt từ vỉa hè",
    area: "Quận 4",
    handle: "thoikedi.kios",
    products: [
      { slug: "bo-pin-cai-nha-bien", name: "Bộ pin cài “Nhà Biển”", category: "cat-phu-kien", price: 120000, material: "mat-kim-loai", photos: ["23910558", "f0d0c8d2", "01969148", "d1a3312e"] },
      { slug: "moc-khoa-carabiner-day-du-bo-3-mau", name: "Móc khoá carabiner dây dù (bộ 3 màu)", category: "cat-moc-khoa", price: 159000, material: "mat-kim-loai", photos: ["01969148", "64c8db60", "3cb5f709", "e6016326"] },
      { slug: "moc-khoa-khoen-xanh-hinh-ca", name: "Móc khoá khoen xanh hình cá", category: "cat-moc-khoa", price: 110000, material: "mat-kim-loai", photos: ["64c8db60", "01969148", "ded490e6", "439f01c7"] },
      { slug: "bo-pin-cai-xanh-reu", name: "Bộ pin cài xanh rêu", category: "cat-phu-kien", price: 110000, material: "mat-kim-loai", photos: ["f0d0c8d2", "23910558", "8685d0d4", "e7e7ec36"] },
      { slug: "mu-thuy-thu-jean-duong-chi", name: "Mũ thuỷ thủ jean đường chỉ", category: "cat-phu-kien", price: 250000, material: "mat-denim", photos: ["209407df", "1c25b61b", "d1a3312e", "122b1194"] },
      { slug: "tranh-in-ca-phe-cham-bi", name: "Tranh in “Cà Phê Chấm Bi”", category: "cat-tranh-ky-thuat-so", price: 180000, material: "mat-giay-my-thuat", photos: ["1042bcd5", "356d93ae", "37385e31", "88c9da94"] },
      { slug: "thiep-hinh-lat-banh-mi-phet-mut", name: "Thiệp hình lát bánh mì phết mứt", category: "cat-thiep", price: 45000, material: "mat-giay-my-thuat", photos: ["fee0346a", "47a9a8c7", "f9aa0953", "4072dda8"] },
      { slug: "bo-mieng-dan-theu-leo-nui-9-mieng", name: "Bộ miếng dán thêu “Leo Núi” (9 miếng)", category: "cat-hinh-dan", price: 190000, material: "mat-cotton", photos: ["73999c05", "f0d0c8d2", "aff28091", "fee0346a"] },
      { slug: "poster-quang-cao-co-dao-rum", name: "Poster quảng cáo cổ “Đảo Rum”", category: "cat-tranh-ky-thuat-so", price: 190000, material: "mat-giay-my-thuat", photos: ["f9aa0953", "ded490e6", "3f1e3551", "1c25b61b"] },
      { slug: "tui-tem-cu-suu-tam-50-con", name: "Túi tem cũ sưu tầm (50 con)", category: "cat-van-phong-pham-khac", price: 150000, material: "mat-giay-my-thuat", photos: ["c81e2cd3", "386e7cef", "e7e7ec36", "5f479d48"] },
      { slug: "khoen-carabiner-xanh-kem-the-ten", name: "Khoen carabiner xanh kèm thẻ tên", category: "cat-moc-khoa", price: 139000, material: "mat-kim-loai", photos: ["00511e24", "01969148", "439f01c7", "0dd6ab68"] },
      { slug: "poster-o-du-bai-bien", name: "Poster “Ô Dù Bãi Biển”", category: "cat-tranh-ky-thuat-so", price: 160000, material: "mat-giay-my-thuat", photos: ["ded490e6", "1042bcd5", "0dd6ab68", "8685d0d4"] },
      { slug: "moc-khoa-ghe-nhua-via-he", name: "Móc khoá ghế nhựa vỉa hè", category: "cat-moc-khoa", price: 69000, material: "mat-nhua", photos: ["e6016326", "00511e24", "356d93ae", "439f01c7"] },
      { slug: "lich-giay-moc-ao-12-thang", name: "Lịch giấy móc áo 12 tháng", category: "cat-lich", price: 220000, material: "mat-giay-my-thuat", photos: ["386e7cef", "c81e2cd3", "56745fc4", "0f31f1c3"] },
    ],
  },
  {
    slug: "at-o-studio",
    name: "at.o_studio",
    tagline: "Art toy giấy và mica, lấy tích dân gian làm mẫu",
    area: "Chợ Lớn",
    handle: "at.o_studio",
    products: [
      { slug: "binh-reu-giac-ngu-trua", name: "Bình rêu “Giấc Ngủ Trưa”", category: "cat-trang-tri", price: 690000, material: "mat-thuy-tinh", photos: ["380d474d", "8427ac1c", "47a9a8c7", "1042bcd5"] },
      { slug: "moc-khoa-cun-cam-va-tulip", name: "Móc khoá cún cam và tulip", category: "cat-moc-khoa", price: 99000, material: "mat-mica", photos: ["7fc41ab5", "1af9b30d", "1042bcd5", "5b7670e4"] },
      { slug: "chuong-kinh-nguoi-may-phu-reu", name: "Chuông kính “Người Máy Phủ Rêu”", category: "cat-trang-tri", price: 790000, material: "mat-thuy-tinh", photos: ["8427ac1c", "380d474d", "8685d0d4", "a3e1b8ef"] },
      { slug: "tranh-in-ga-thoi-sao", name: "Tranh in “Gà Thổi Sáo”", category: "cat-tranh-ky-thuat-so", price: 220000, material: "mat-giay-my-thuat", photos: ["356d93ae", "1042bcd5", "56745fc4", "c81e2cd3"] },
      { slug: "nam-cham-da-cuoi-ve-tay-bo-7", name: "Nam châm đá cuội vẽ tay (bộ 7)", category: "cat-nam-cham", price: 260000, material: "mat-da", photos: ["5b7670e4", "733c96db", "209407df", "aabcf542"] },
      { slug: "quat-nan-hinh-hamburger", name: "Quạt nan hình hamburger", category: "cat-trang-tri", price: 150000, material: "mat-coi", photos: ["d07d0837", "6f402e93", "f0d0c8d2", "8685d0d4"] },
      { slug: "buu-thiep-tem-ca-phe-phin", name: "Bưu thiếp tem cà phê phin", category: "cat-buu-thiep", price: 35000, material: "mat-giay-my-thuat", photos: ["1042bcd5", "ded490e6", "aff28091", "0d1a7f22"] },
      { slug: "charm-ca-noc-khau-tay", name: "Charm cá nóc khâu tay", category: "cat-moc-khoa", price: 115000, material: "mat-da-that", photos: ["d96796d3", "a3e1b8ef", "06510d14", "851ce0fc"] },
      { slug: "tranh-in-quang-cao-co-dao-nhiet-doi", name: "Tranh in quảng cáo cổ đảo nhiệt đới", category: "cat-tranh-ky-thuat-so", price: 210000, material: "mat-giay-my-thuat", photos: ["f9aa0953", "356d93ae", "a3e1b8ef", "9636c8d4"] },
      { slug: "buu-thiep-banh-mi-mon-qua-lon", name: "Bưu thiếp bánh mì “Món Quà Lớn”", category: "cat-buu-thiep", price: 45000, material: "mat-giay-my-thuat", photos: ["47a9a8c7", "e7e7ec36", "a3e1b8ef", "3cb5f709"] },
      { slug: "thiep-con-gi-dep-hon-kem-charm", name: "Thiệp “Còn Gì Đẹp Hơn” kèm charm", category: "cat-thiep", price: 99000, material: "mat-giay-my-thuat", photos: ["a3e1b8ef", "d96796d3", "3cb5f709", "88c9da94"] },
    ],
  },
  {
    slug: "dongvui-space",
    name: "dongvui.space",
    tagline: "Tote in lụa, chữ lấy từ mấy chuyến đi",
    area: "Đà Lạt",
    handle: "dongvui.space",
    products: [
      { slug: "mu-luoi-trai-reu-dinh-pin", name: "Mũ lưỡi trai rêu đính pin", category: "cat-phu-kien", price: 290000, material: "mat-canvas", photos: ["f0d0c8d2", "23910558", "386e7cef", "d1a3312e"] },
      { slug: "tui-day-rut-di-bien", name: "Túi dây rút đi biển", category: "cat-phu-kien", price: 320000, material: "mat-canvas", photos: ["aff28091", "439f01c7", "7e17da61", "e364150f"] },
      { slug: "tui-canvas-mini-deo-cheo", name: "Túi canvas mini đeo chéo", category: "cat-phu-kien", price: 390000, material: "mat-canvas", photos: ["439f01c7", "aff28091", "00511e24", "8dfbdb76"] },
      { slug: "mu-bucket-chi-cam-khau-tay", name: "Mũ bucket chỉ cam khâu tay", category: "cat-phu-kien", price: 350000, material: "mat-denim", photos: ["37385e31", "1854913f", "da57170e", "5f479d48"] },
      { slug: "mu-luoi-trai-xanh-dinh-pin", name: "Mũ lưỡi trai xanh đính pin", category: "cat-phu-kien", price: 310000, material: "mat-canvas", photos: ["23910558", "f0d0c8d2", "c559208b", "d07d0837"] },
      { slug: "mu-tai-beo-jean-di-phuot", name: "Mũ tai bèo jean đi phượt", category: "cat-phu-kien", price: 260000, material: "mat-denim", photos: ["1854913f", "37385e31", "570ae4ca", "f9aa0953"] },
      { slug: "mu-luoi-trai-vang-tui-luoi", name: "Mũ lưỡi trai vàng túi lưới", category: "cat-phu-kien", price: 280000, material: "mat-canvas", photos: ["524f506c", "aabcf542", "b9b4154a", "207db202"] },
      { slug: "mu-luoi-trai-soc-kiwi", name: "Mũ lưỡi trai sọc kiwi", category: "cat-phu-kien", price: 300000, material: "mat-canvas", photos: ["aabcf542", "524f506c", "aff28091", "570ae4ca"] },
      { slug: "khan-vuong-hoa-tiet-di-phuot", name: "Khăn vuông hoạ tiết đi phượt", category: "cat-phu-kien", price: 130000, material: "mat-cotton", photos: ["816754c8", "c424f7ce", "2879b0e9", "d96796d3"] },
      { slug: "moc-kep-treo-do-di-bien", name: "Móc kẹp treo đồ đi biển", category: "cat-trang-tri", price: 120000, material: "mat-nhua", photos: ["0f31f1c3", "b9b4154a", "d1a3312e", "851ce0fc"] },
      { slug: "gong-kinh-doi-moi", name: "Gọng kính đồi mồi", category: "cat-phu-kien", price: 420000, material: null, photos: ["b9b4154a", "0f31f1c3", "8427ac1c", "5ccebf97"] },
      { slug: "mieng-dan-theu-cam-trai", name: "Miếng dán thêu cắm trại", category: "cat-hinh-dan", price: 45000, material: "mat-cotton", photos: ["73999c05", "23910558", "f9aa0953", "7e17da61"] },
      { slug: "tat-co-cao-mau-keo", name: "Tất cổ cao màu kẹo", category: "cat-quan-ao", price: 85000, material: "mat-cotton", photos: ["c424f7ce", "816754c8", "3f1e3551", "8964cb63"] },
    ],
  },
  {
    slug: "fat-rug",
    name: "fat.rug",
    tagline: "Thảm tufting bắn tay, mẫu nào cũng chỉ làm một cái",
    area: "Gò Vấp",
    handle: "fat.rug",
    products: [
      { slug: "mu-bucket-denim-tua-rach", name: "Mũ bucket denim tua rách", category: "cat-phu-kien", price: 340000, material: "mat-denim", photos: ["1c25b61b", "209407df", "0cfc19d9", "7fc41ab5"] },
      { slug: "mu-docker-denim-chap-va", name: "Mũ docker denim chắp vá", category: "cat-phu-kien", price: 280000, material: "mat-denim", photos: ["209407df", "1c25b61b", "8427ac1c", "ded490e6"] },
      { slug: "mu-bucket-denim-day-rut", name: "Mũ bucket denim dây rút", category: "cat-phu-kien", price: 290000, material: "mat-denim", photos: ["1854913f", "1c25b61b", "d96796d3", "0cfc19d9"] },
      { slug: "mu-tai-beo-vien-chi-noi", name: "Mũ tai bèo viền chỉ nổi", category: "cat-phu-kien", price: 330000, material: "mat-denim", photos: ["37385e31", "209407df", "01969148", "77ef052b"] },
      { slug: "tui-deo-cheo-jean-nhieu-ngan", name: "Túi đeo chéo jean nhiều ngăn", category: "cat-phu-kien", price: 460000, material: "mat-denim", photos: ["4afee351", "de7c8670", "524f506c", "73999c05"] },
      { slug: "tui-deo-vai-jean-tui-hop", name: "Túi đeo vai jean túi hộp", category: "cat-phu-kien", price: 420000, material: "mat-denim", photos: ["de7c8670", "4afee351", "01969148", "f0d0c8d2"] },
      { slug: "khan-bandana-in-moc-ban", name: "Khăn bandana in mộc bản", category: "cat-phu-kien", price: 150000, material: "mat-cotton", photos: ["816754c8", "d1a3312e", "1af9b30d", "386e7cef"] },
      { slug: "ca-vat-vintage-chon-mau", name: "Cà vạt vintage (chọn mẫu)", category: "cat-phu-kien", price: 180000, material: "mat-lua", photos: ["d1a3312e", "816754c8", "a9713e46", "9636c8d4"] },
      { slug: "tat-cotton-cuon-hop-rock-on", name: "Tất cotton cuộn hộp “Rock On”", category: "cat-quan-ao", price: 95000, material: "mat-cotton", photos: ["c424f7ce", "e7e7ec36", "37385e31", "851ce0fc"] },
      { slug: "day-deo-guitar-jacquard-mau-dat", name: "Dây đeo guitar jacquard màu đất", category: "cat-phu-kien", price: 520000, material: "mat-cotton", photos: ["0dd6ab68", "207db202", "31b8afa1", "da57170e"] },
      { slug: "thiep-hinh-bo-pyjama-ke-soc", name: "Thiệp hình bộ pyjama kẻ sọc", category: "cat-thiep", price: 40000, material: "mat-giay-my-thuat", photos: ["e7e7ec36", "c424f7ce", "570ae4ca", "d07d0837"] },
      { slug: "mu-luoi-trai-vang-chanh", name: "Mũ lưỡi trai vàng chanh", category: "cat-phu-kien", price: 260000, material: "mat-canvas", photos: ["524f506c", "f0d0c8d2", "570ae4ca", "6f402e93"] },
    ],
  },
  {
    slug: "flickier",
    name: "flickier",
    tagline: "Đèn giấy và nến cột, thắp lên là đổi cả phòng",
    area: "Quận 7",
    handle: "flicker.quicker",
    products: [
      { slug: "nuoc-ep-dao-dong-chai", name: "Nước ép đào đóng chai", category: "cat-dac-san", price: 45000, material: null, photos: ["0a13156c", "3cb5f709", "733c96db", "c559208b"] },
      { slug: "thach-trai-cay-tui-mix-vi", name: "Thạch trái cây túi mix vị", category: "cat-dac-san", price: 65000, material: null, photos: ["e364150f", "06510d14", "d83eb155", "8685d0d4"] },
      { slug: "tra-sua-hoa-tan-it-ngot", name: "Trà sữa hoà tan ít ngọt", category: "cat-dac-san", price: 79000, material: null, photos: ["3cb5f709", "0a13156c", "380d474d", "356d93ae"] },
      { slug: "ruou-rum-vi-dua-750ml", name: "Rượu rum vị dừa (750ml)", category: "cat-dac-san", price: 450000, material: null, photos: ["2751911f", "8964cb63", "c424f7ce", "23910558"] },
      { slug: "thanh-protein-ba-vi", name: "Thanh protein ba vị", category: "cat-dac-san", price: 99000, material: null, photos: ["56745fc4", "570ae4ca", "e6016326", "7e17da61"] },
      { slug: "tranh-in-chai-vang-tren-bai-bien", name: "Tranh in chai vang trên bãi biển", category: "cat-tranh-ky-thuat-so", price: 210000, material: "mat-giay-my-thuat", photos: ["ded490e6", "f9aa0953", "fee0346a", "0dd6ab68"] },
      { slug: "nuoc-dua-co-ga-vi-dua-hau", name: "Nước dừa có ga vị dưa hấu", category: "cat-dac-san", price: 49000, material: null, photos: ["31b8afa1", "2751911f", "207db202", "64c8db60"] },
      { slug: "keo-thanh-caramel-hat-bo-mau", name: "Kẹo thanh caramel hạt (bộ màu)", category: "cat-dac-san", price: 120000, material: null, photos: ["570ae4ca", "a9713e46", "31b8afa1", "37385e31"] },
      { slug: "ruou-tequila-blanco", name: "Rượu tequila blanco", category: "cat-dac-san", price: 690000, material: null, photos: ["8964cb63", "2751911f", "fee0346a", "3f1e3551"] },
      { slug: "sinh-to-chuoi-dong-chai", name: "Sinh tố chuối đóng chai", category: "cat-dac-san", price: 55000, material: null, photos: ["65d8ce37", "0a13156c", "d1a3312e", "77ef052b"] },
      { slug: "keo-duong-hinh-ca-sau", name: "Kẹo đường hình cá sấu", category: "cat-dac-san", price: 39000, material: null, photos: ["a9713e46", "56745fc4", "ded490e6", "0d1a7f22"] },
      { slug: "hop-qua-xach-tay-cho-chai", name: "Hộp quà xách tay cho chai", category: "cat-phu-kien", price: 55000, material: "mat-hop-giay", photos: ["88c9da94", "65d8ce37", "1854913f", "356d93ae"] },
    ],
  },
  {
    slug: "nom-vn",
    name: "nom.vn",
    tagline: "Túi gấp và phụ kiện, gọn trong lòng bàn tay",
    area: "Hà Nội",
    handle: "nom.vn",
    products: [
      { slug: "tui-dua-thu-denim-den", name: "Túi đưa thư denim đen", category: "cat-phu-kien", price: 490000, material: "mat-denim", photos: ["4afee351", "de7c8670", "0cfc19d9", "d07d0837"] },
      { slug: "tui-hobo-tai-che-tu-quan-jean", name: "Túi hobo tái chế từ quần jean", category: "cat-phu-kien", price: 420000, material: "mat-denim", photos: ["5f479d48", "de7c8670", "d07d0837", "06510d14"] },
      { slug: "tui-kep-nach-nau-dinh-tan", name: "Túi kẹp nách nâu đinh tán", category: "cat-phu-kien", price: 690000, material: "mat-da-that", photos: ["4072dda8", "5ccebf97", "570ae4ca", "8685d0d4"] },
      { slug: "tui-rut-xanh-com-quai-hong", name: "Túi rút xanh cốm quai hồng", category: "cat-phu-kien", price: 350000, material: "mat-canvas", photos: ["aff28091", "439f01c7", "c424f7ce", "a9713e46"] },
      { slug: "mu-tai-beo-ghep-vai-jean", name: "Mũ tai bèo ghép vải jean", category: "cat-phu-kien", price: 320000, material: "mat-denim", photos: ["1c25b61b", "1854913f", "de7c8670", "2879b0e9"] },
      { slug: "tui-xach-da-mem-quai-don", name: "Túi xách da mềm quai đơn", category: "cat-phu-kien", price: 990000, material: "mat-da-that", photos: ["5ccebf97", "f1d4e806", "0cfc19d9", "0d1a7f22"] },
      { slug: "tui-hop-denim-bac-mau", name: "Túi hộp denim bạc màu", category: "cat-phu-kien", price: 450000, material: "mat-denim", photos: ["de7c8670", "5f479d48", "4afee351", "2879b0e9"] },
      { slug: "gio-nhua-dan-quai-quan-vai", name: "Giỏ nhựa đan quai quấn vải", category: "cat-phu-kien", price: 280000, material: "mat-nhua", photos: ["7e17da61", "439f01c7", "da57170e", "01969148"] },
      { slug: "tui-giay-xach-bo-hoa", name: "Túi giấy xách bó hoa", category: "cat-phu-kien", price: 75000, material: "mat-hop-giay", photos: ["9636c8d4", "88c9da94", "3cb5f709", "64c8db60"] },
      { slug: "quai-xach-chai-bang-giay-ban-nguyet", name: "Quai xách chai bằng giấy bán nguyệt", category: "cat-phu-kien", price: 65000, material: "mat-hop-giay", photos: ["88c9da94", "9636c8d4", "da57170e", "de7c8670"] },
      { slug: "day-deo-tui-theu-hoa-tiet", name: "Dây đeo túi thêu hoạ tiết", category: "cat-phu-kien", price: 240000, material: "mat-cotton", photos: ["207db202", "0dd6ab68", "31b8afa1", "e7e7ec36"] },
      { slug: "day-chuyen-charm-bac-xin", name: "Dây chuyền charm bạc xỉn", category: "cat-phu-kien", price: 290000, material: "mat-kim-loai", photos: ["3f1e3551", "a3e1b8ef", "209407df", "6f402e93"] },
      { slug: "mu-soc-nau-vang-dong-khay", name: "Mũ sọc nâu vàng đóng khay", category: "cat-phu-kien", price: 290000, material: "mat-canvas", photos: ["aabcf542", "23910558", "b9b4154a", "37385e31"] },
      { slug: "kinh-gong-tron-nau", name: "Kính gọng tròn nâu", category: "cat-phu-kien", price: 390000, material: null, photos: ["b9b4154a", "2751911f", "524f506c", "00511e24"] },
    ],
  },
  {
    slug: "roomroom-mushii",
    name: "roomroom.mushii",
    tagline: "Đèn nấm resin, đổ từng cái một",
    area: "Quận 2",
    handle: "roomroom.mushii",
    products: [
      { slug: "tu-kinh-duong-xi-co-den", name: "Tủ kính dương xỉ có đèn", category: "cat-trang-tri", price: 3900000, material: "mat-thuy-tinh", photos: ["da57170e", "d83eb155", "e364150f", "570ae4ca"] },
      { slug: "tu-kinh-rung-mua-go-lua", name: "Tủ kính rừng mưa gỗ lũa", category: "cat-trang-tri", price: null, material: "mat-thuy-tinh", photos: ["d83eb155", "da57170e", "b6a8e057", "65d8ce37"] },
      { slug: "be-reu-mini-de-go", name: "Bể rêu mini đế gỗ", category: "cat-trang-tri", price: 480000, material: "mat-thuy-tinh", photos: ["77ef052b", "380d474d", "c424f7ce", "0cfc19d9"] },
      { slug: "mo-hinh-quay-sach-bao-ti-hon", name: "Mô hình quầy sách báo tí hon", category: "cat-trang-tri", price: 650000, material: "mat-go", photos: ["733c96db", "5b7670e4", "816754c8", "aff28091"] },
      { slug: "mo-hinh-cuon-chieu-coi-va-khung-det", name: "Mô hình cuộn chiếu cói và khung dệt", category: "cat-trang-tri", price: 450000, material: "mat-coi", photos: ["6f402e93", "d07d0837", "31b8afa1", "e7e7ec36"] },
      { slug: "da-cuoi-ve-nguoi-vung-cao", name: "Đá cuội vẽ người vùng cao", category: "cat-trang-tri", price: 180000, material: "mat-da", photos: ["5b7670e4", "6f402e93", "f9aa0953", "f1d4e806"] },
      { slug: "ly-gom-ca-voi-xanh", name: "Ly gốm cá voi xanh", category: "cat-do-gom", price: 270000, material: "mat-gom", photos: ["8685d0d4", "0d1a7f22", "e364150f", "d07d0837"] },
      { slug: "gio-giay-khoet-lo-cam-hoa", name: "Giỏ giấy khoét lỗ cắm hoa", category: "cat-trang-tri", price: 85000, material: "mat-hop-giay", photos: ["9636c8d4", "7e17da61", "5f479d48", "5b7670e4"] },
      { slug: "quat-dan-tay-banh-kep", name: "Quạt đan tay bánh kẹp", category: "cat-trang-tri", price: 140000, material: "mat-coi", photos: ["d07d0837", "5b7670e4", "d83eb155", "73999c05"] },
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
  { id: "mat-cotton", slug: "cotton", name_vi: "Vải cotton", name_en: "Cotton" },
  { id: "mat-lua", slug: "lua", name_vi: "Lụa", name_en: "Silk" },
  { id: "mat-nhua", slug: "nhua", name_vi: "Nhựa", name_en: "Plastic" },
  { id: "mat-coi", slug: "coi-nan", name_vi: "Cói, nan", name_en: "Sedge & rattan" },
  { id: "mat-da", slug: "da", name_vi: "Đá", name_en: "Stone" },
  { id: "mat-go", slug: "go", name_vi: "Gỗ", name_en: "Wood" },
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

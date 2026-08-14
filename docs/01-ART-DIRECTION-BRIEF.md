# TÍ COOLTURE — ART DIRECTION BRIEF
**Dùng cho:** Claude Design, brand designer, bất kỳ ai chạm vào giao diện
**Ngày:** 10/08/2026 · **Version:** 1.0

---

## 1. CHỦ THỂ — pin chặt trước khi thiết kế

**Sản phẩm là gì:** Một catalogue *được tuyển chọn* giới thiệu local brand và artist ở TP.HCM. Không phải sàn thương mại điện tử. Không có giỏ hàng, không có thanh toán, không có nút "Mua". Website kết thúc bằng một cú click đưa người dùng sang Instagram/TikTok của thương hiệu.

**Vì thế nó không được trông giống Shopee, Tiki hay Etsy.** Nó nên trông giống **một tạp chí nghệ thuật có chức năng chỉ đường**.

**Người xem:** Gen Z Việt 18–28 và du khách nước ngoài đang tìm "một món quà thật sự có gu". Họ thạo thiết kế, họ lướt Instagram cả ngày, và họ nhận ra template ngay lập tức.

**Việc duy nhất của mỗi trang:**
| Trang | Việc duy nhất |
|---|---|
| Trang chủ | Làm người ta tin rằng ở đây có thứ đáng khám phá |
| Danh sách sản phẩm | Thu hẹp nhanh mà không cảm giác đang lọc dữ liệu |
| Trang sản phẩm | Kể đủ câu chuyện để người ta muốn nhắn tin cho shop |
| Trang shop | Làm shop trông có tầm hơn trang Instagram của chính họ |

---

## 2. BA TÍNH TỪ

> **Sắc sảo · Thủ công · Đang chuyển động**

- **Sắc sảo** — biên tập có quan điểm. Ít mà đúng. Không nhồi 40 sản phẩm lên trang chủ.
- **Thủ công** — mọi thứ ở đây do người làm ra. Thiết kế phải có dấu tay, không được trông như sinh ra từ khuôn.
- **Đang chuyển động** — thuyền rẽ sóng. Cảnh sáng tạo Việt đang chảy, không đứng yên.

Ba tính từ này đến từ chính brand: logo là *con thuyền rẽ sóng*, vân tay là *dấu ấn độc bản*, mắt thuyền là *tầm nhìn*.

---

## 3. BẢNG MÀU — 6 giá trị, không thêm

```
--ink        #12081F   Gần đen, ám tím. Chữ chính, nền đảo màu.
--paper      #FFFFFF   Trắng thuần. Nền chủ đạo (60%).
--paper-warm #FAF8FF   Trắng ám tím rất nhạt. Nền khối, phân tầng.
--violet     #7520F7   MÀU BRAND. Chữ, link, nút, mọi tương tác. 6.3:1 ✅
--teal       #39D6CF   MÀU BRAND. CHỈ mảng nền và họa tiết. 1.8:1 ❌ không bao giờ làm chữ.
--teal-ink   #0B7C77   Bậc teal duy nhất được làm chữ. 5.0:1 ✅
```

Tỷ lệ theo brand guidelines: **trắng 60% · tím 30% · teal 10%**.

**Quy tắc một dòng cho designer:** *teal là để nhìn, teal-ink là để đọc.*

Không thêm màu thứ tư vào ngôn ngữ thị giác. Success/warning/danger tồn tại nhưng **chỉ dùng cho trạng thái hệ thống** (badge duyệt trong admin, thông báo lỗi) — không bao giờ dùng trang trí.

---

## 4. TYPOGRAPHY

| Vai trò | Font | Ghi chú |
|---|---|---|
| **Display** | `Archivo Expanded` (Black 900 / SemiBold 600) | Nặng, rộng, dứt khoát. Echo trực tiếp chữ COOLTURE trong logo. **Kiểm tra bộ dấu tiếng Việt trước khi chốt** |
| **Body** | `Alexandria` (300/400/500) | Font brand. Có dấu tiếng Việt tốt |
| **Utility** | `Alexandria` 500, viết HOA, tracking +0.12em, 11–12px | Nhãn, eyebrow, số liệu. Không dùng font thứ ba |

**Vì sao KHÔNG dùng serif display:** serif tương phản cao (Playfair, Bodoni) là lựa chọn mặc định cho mọi trang "tạp chí" — và nó mâu thuẫn với logo, vốn là geometric sans nặng. Grotesque expanded vừa hiếm gặp hơn, vừa trung thành với brand.

**Thang chữ** — nhảy quãng lớn, không đều đặn. Đây là thứ tạo cảm giác biên tập:

```
hero     clamp(3rem, 9vw, 7rem)   Archivo Black    line-height .88  tracking -.03em
h1       clamp(2rem, 5vw, 3.5rem) Archivo Black    line-height .95  tracking -.02em
h2       1.75rem                   Archivo SemiBold line-height 1.1
h3       1.125rem                  Alexandria 500   line-height 1.3
body     1rem / 1.0625rem          Alexandria 400   line-height 1.65
small    .875rem                   Alexandria 400   line-height 1.5
label    .6875rem UPPERCASE        Alexandria 500   tracking .12em
```

Chữ hero phải **to đến mức hơi khó chịu**. Đó là điểm tựa của cả trang.

---

## 5. LAYOUT

**Lưới 12 cột, nhưng nội dung hiếm khi lấp đủ.** Bố cục bất đối xứng có chủ đích: khối text chiếm cột 2–7, ảnh tràn từ cột 8 ra ngoài mép phải. Khoảng trắng lớn là một phần của thiết kế, không phải chỗ chưa điền.

**Bo góc gần như bằng không.** `--radius: 2px`. Sắc cạnh. Ảnh sản phẩm góc vuông tuyệt đối.

**Đường kẻ tóc 1px màu ink ở 12% alpha** làm cấu trúc chính, thay cho box-shadow. Không dùng đổ bóng ở đâu cả trừ modal.

### Wireframe trang chủ — desktop 1440px

```
┌────────────────────────────────────────────────────────────┐
│ [logo]              SẢN PHẨM  SHOP  KHÁM PHÁ  BLOG   VI|EN │  ← nav mảnh, kẻ dưới 1px
├────────────────────────────────────────────────────────────┤
│                                                            │
│   MỖI NGƯỜI                          ┌──────────────┐      │
│   MỘT "TÍ"                           │              │      │
│   CHẤT RIÊNG                         │  ảnh tràn ra │      │
│   ───────────────                    │  mép phải →  │      │
│   Nơi tuyển chọn local brand         │              │      │
│   và artist Việt.        [Khám phá]  └──────────────┘      │
│                                                            │
│ ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿ │  ← SÓNG (signature)
├────────────────────────────────────────────────────────────┤
│ ĐANG CÓ TRONG KHO                              ← →         │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│ │  ảnh   │ │  ảnh   │ │  ảnh   │ │  ảnh   │  (tràn ra mép) │
│ └────────┘ └────────┘ └────────┘ └────────┘               │
│ tên shop   tên shop                                        │
│ Tên sản phẩm                                               │
│ 350.000₫                                                   │
├────────────────────────────────────────────────────────────┤
│              ┌─────────────────────────────┐               │
│  LỘ TRÌNH    │      bản đồ + pin ①②③      │               │
│  KHÁM PHÁ    │      nối bằng đường SÓNG    │               │
│              └─────────────────────────────┘               │
├────────────────────────────────────────────────────────────┤
│ TỪ TẠP CHÍ                                                 │
│ ┌──────────────────┐  ┌────────┐  ┌────────┐              │
│ │ bài nổi bật to   │  │ bài 2  │  │ bài 3  │              │
│ └──────────────────┘  └────────┘  └────────┘              │
├────────────────────────────────────────────────────────────┤
│ footer nền --ink, chữ trắng, sóng dạng âm bản              │
└────────────────────────────────────────────────────────────┘
                                                   ┃ ← tab Hidden Gems
                                                   ┃   mép phải, 32px
```

### Wireframe trang chủ — mobile 360px

```
┌──────────────────┐
│ [logo]      ☰ VI │
├──────────────────┤
│ MỖI NGƯỜI        │
│ MỘT "TÍ"         │
│ CHẤT RIÊNG       │
│                  │
│ Nơi tuyển chọn   │
│ local brand Việt.│
│                  │
│ [ Khám phá ]     │
│ ┌──────────────┐ │
│ │     ảnh      │ │
│ └──────────────┘ │
│ ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿ │
├──────────────────┤
│ ĐANG CÓ TRONG KHO│
│ ┌─────┐ ┌─────┐  │  ← cuộn ngang
│ │ ảnh │ │ ảnh │  │
│ └─────┘ └─────┘ ▸│
├──────────────────┤
│ LỘ TRÌNH KHÁM PHÁ│
│ ┌──────────────┐ │
│ │ bản đồ TĨNH  │ │  ← không pan/zoom
│ │ chạm → mở to │ │
│ └──────────────┘ │
│ ① Chợ Bến Thành  │
│ ② Đường sách     │
│ ③ Xưởng gốm Lái  │
└──────────────────┘
                  ┃ ← tab luôn hiện
```

---

## 6. SIGNATURE ELEMENT — chọn một, và chỉ một

## ∿ ĐƯỜNG SÓNG

Lấy trực tiếp từ "dấu hiệu phụ trợ — dòng chảy" trong brand guidelines. Một đường SVG duy nhất, nét 2px, làm **ba việc** trên toàn site:

1. **Phân tách section** — thay cho `<hr>`. Biên độ sóng thay đổi nhẹ theo vị trí cuộn.
2. **Đường ray carousel** — thẻ sản phẩm trong "Đang có trong kho" ngồi *trên* đường sóng, hơi lệch cao thấp khác nhau như thuyền nổi trên nước.
3. **Polyline bản đồ** — đường nối các pin trong lộ trình khám phá chính là đường sóng đó.

Một thiết bị thị giác làm ba việc = mạch lạc. Ba thiết bị khác nhau = lộn xộn.

**Màu:** `--teal` trên nền sáng, `--teal` hoặc trắng trên nền `--ink`.
**Chuyển động:** trôi ngang rất chậm (40s/chu kỳ), biên độ tăng nhẹ khi cuộn. Tắt hoàn toàn khi `prefers-reduced-motion`.

### Rủi ro thẩm mỹ được phép lấy: BASELINE CONG

Nhãn section (`ĐANG CÓ TRONG KHO`, `LỘ TRÌNH KHÁM PHÁ`) đặt trên `<textPath>` cong nhẹ — echo baseline cong của chữ COOLTURE trong logo. **Chỉ dùng cho nhãn section, tối đa 1 lần/section, không bao giờ dùng cho nội dung đọc.** Bắt buộc có `aria-label` để screen reader đọc đúng.

Nếu thấy quá đà thì bỏ. Nhưng thử một lần.

---

## 7. CHUYỂN ĐỘNG

Một khoảnh khắc được dàn dựng ăn đứt mười hiệu ứng rải rác.

| Chỗ | Hiệu ứng | Thời lượng |
|---|---|---|
| Load trang chủ | Chữ hero hiện theo từng dòng (60ms lệch nhau), rồi sóng vẽ từ trái sang phải | 900ms tổng |
| Cuộn tới section | Fade + dịch lên 16px, ngưỡng 20% | 400ms |
| Hover thẻ sản phẩm | Ảnh scale 1.03, nhãn shop đổi sang `--violet` | 250ms |
| Hover card social | Dịch lên 4px, viền dày lên 2px | 150ms |
| Chuyển trang | Không có | — |

Easing chuẩn: `cubic-bezier(0.16, 1, 0.3, 1)`.

**Không dùng:** parallax, cursor tùy chỉnh, hiệu ứng gõ chữ, số đếm tăng dần, nền gradient động, blob. Tất cả đều là dấu hiệu "AI làm".

---

## 8. ANTI-BRIEF — những thứ tuyệt đối không làm

Đọc kỹ mục này. Nó quan trọng ngang phần còn lại.

❌ **Nền kem `#F4F1EA` + serif tương phản cao + accent màu đất nung `#D97757`.** Đây là look mặc định của AI hiện nay. Nhận ra ngay.
❌ **Nền đen + một màu acid green/vermilion.** Cũng là mặc định.
❌ **Layout kiểu báo giấy với kẻ tóc dày đặc và cột chữ san sát.** Cũng là mặc định.
❌ Thẻ sản phẩm bo góc 12px + đổ bóng mềm + nút gradient. Đó là Shopee.
❌ Số thứ tự 01/02/03 trang trí — **chỉ dùng khi thật sự là một chuỗi có thứ tự** (lộ trình khám phá thì được, "3 giá trị cốt lõi" thì không).
❌ Icon tròn trong hình tròn màu nhạt.
❌ Hero kiểu "con số to + nhãn nhỏ + 3 stat".
❌ Ảnh stock. Nếu chưa có ảnh thật, dùng khối màu đặc `--paper-warm` có nhãn `ẢNH SẢN PHẨM 1:1`.
❌ Lorem ipsum. Dùng copy thật ở file `03-CONTENT-PACK.md`.

---

## 9. GIỌNG VĂN

Tiếng Việt tự nhiên, không dịch cứng từ tiếng Anh. Câu ngắn. Động từ chủ động.

| Đừng viết | Hãy viết |
|---|---|
| "Submit" | "Gửi cho shop" |
| "Không tìm thấy kết quả nào" | "Chưa có sản phẩm nào khớp. Thử bỏ bớt bộ lọc?" |
| "Đã xảy ra lỗi" | "Không tải được danh sách. Thử lại sau vài giây." |
| "Khám phá ngay hôm nay!" | "Xem sản phẩm" |
| "Nền tảng kết nối hàng đầu" | "Nơi tuyển chọn local brand Việt" |

Nút giữ nguyên tên xuyên suốt luồng: nút ghi "Lưu" thì toast ghi "Đã lưu".
Trạng thái rỗng là lời mời hành động, không phải lời xin lỗi.

---

## 10. THÀNH PHẦN CẦN CÓ TRONG MOCKUP

- Nav (desktop + mobile drawer), chuyển ngôn ngữ
- Ô tìm kiếm có dropdown gợi ý
- Thẻ sản phẩm — 3 trạng thái: mặc định, hover, đã lưu
- Thẻ shop
- Card social (Instagram / TikTok / Facebook / Threads)
- Chip lọc + bottom sheet lọc (mobile)
- Pin bản đồ (đánh số) + panel chi tiết stop
- Tab Hidden Gems (thu gọn + mở)
- Nút: primary / secondary / ghost — mỗi loại 4 state
- Trạng thái rỗng · trạng thái lỗi · skeleton loading
- Footer
- 404

Mỗi thành phần vẽ ở **cả 360px và 1440px**. Mockup chỉ có desktop là mockup chưa xong.

---

# PHỤ LỤC — CẬP NHẬT TRIỂN KHAI

**Ngày:** 14/08/2026 · **Bổ sung cho brief v1.0 ở trên**

Brief v1.0 giữ nguyên làm tài liệu gốc. Phần này ghi lại những chỗ bản dựng
thực tế **đã đi khác brief**, kèm lý do và ngày quyết định, để người đọc sau
không phải đoán cái nào mới hơn.

## A. Những quyết định đã thay đổi

| Mục trong brief | Brief v1.0 | Bản đang chạy | Lý do |
|---|---|---|---|
| §3 Tỷ lệ màu | trắng 60 · tím 30 · teal 10 | **tím 60 · trắng 30 · teal 10** | Brand guidelines PDF ghi 60% cho `#7520F7`. Brief v1.0 ghi ngược. Chốt theo guidelines (13/08). |
| §4 Font display | `Archivo Expanded` | **DFVN Some Time Later** | Archivo không có trong bộ font được cấp; guidelines chỉ định DFVN là kiểu chữ chủ đạo. |
| §4 Vai trò font | display cho mọi tiêu đề | **Alexandria cho hero + phần lớn tiêu đề; DFVN chỉ cho nhãn section và chữ "Tí"** | Theo mockup Lovable (14/08). DFVN chỉ có 1 trọng lượng nên không dựng được thang chữ. |
| §4 Thang chữ | hero `line-height .88` | **`line-height 1.02` trở lên** | Đo thực tế: chữ `Ẫ` trong DFVN cao 0.977em trên baseline, chữ hoa có dấu dưới tụt xuống dưới — chữ hoa tiếng Việt chiếm ~1.18em. `.88` là chồng dấu. |
| §5 Bo góc | `--radius: 2px`, sắc cạnh | **6–8px (`rounded-md` / `rounded-lg`)** | Theo mockup Lovable (14/08). |
| §6 Sóng | dùng cho 3 việc | **dùng cho 2: đường chân trời hero + polyline bản đồ** | Đường ray carousel đã thay bằng dải phim (xem C). |
| §7 Chuyển động | không parallax, không cursor tuỳ chỉnh | **giữ nguyên** | |

## B. Cấu trúc trang chủ hiện tại

Theo mockup Lovable, thứ tự section là:

1. **Hero** — nền tím, chữ Alexandria in hoa 1 dòng, chữ "Tí" đặt bằng DFVN màu teal.
   Đường chân trời dùng `brand-wave-bottom-extended.svg` (thẳng ở nửa trái,
   sóng vỡ ở góc dưới phải), tô **trắng** — tức là khoảng âm dẫn sang section
   sau. Ribbon teal nằm **sau** đường cong, đáy ribbon trùng đáy sóng.
2. **Đang có trong kho** — nền trắng, dải phim (xem C).
3. **Lộ trình khám phá** — nền tím đậm, tab lộ trình đánh số, bản đồ + pin nối bằng sóng.
4. **Bộ sưu tập** — lưới, thẻ đầu chiếm 2 cột.
5. **Footer** — nền ink, 4 cột, dùng chung cho mọi route.

**Viên ngọc ẩn** không còn là tab chữ ở mép phải: nay là **ngôi sao 5 cánh trắng**
phập phồng và phát sáng; bấm vào mở thẻ nổi có nhãn "Cái này hay nè" và nút đóng.

## C. Dải phim thay cho carousel

Section "Đang có trong kho" dựng thành **dải phim 35mm** (`src/components/FilmStrip.tsx`):

- Mỗi khung mang theo nền phim và hai hàng lỗ răng của chính nó, nên **mép phim
  chạy cùng khung ảnh**. Chiều rộng ô là bội số đúng của bước răng (46 × 5 = 230px)
  để lỗ răng đều nhau qua chỗ nối.
- Tự trôi phải → trái, **dừng khi hover hoặc khi có focus bàn phím**, có nút
  dừng/chạy hiện rõ (WCAG 2.2.2), và **kéo chuột được** để tua tới lui.
- Ảnh, tên sản phẩm, tên shop, giá đều nằm **trong khung phim**.
- Tên sản phẩm khoá cứng 2 dòng (`40px`), tràn thì cắt bằng `…` — nếu để tự do,
  tên dài sẽ đẩy ô cao lên và **làm gãy đường chân trời của mép phim**.
- Mép phim **không có chữ**. Bản gốc tham khảo có chữ in màu hổ phách; bỏ đi để
  không thêm màu thứ tư vào hệ.

## D. Vẫn còn nợ so với brief

- **Chưa có bản EN.** Nút VI/EN có trong nav nhưng chưa nối i18n.
- **Chưa có trang 404 riêng** — route `*` đang chuyển hướng về trang chủ.
- **Chưa có bottom sheet lọc trên mobile**, chưa có chip lọc.
- **Chưa dựng đủ 4 state cho từng loại nút.**
- **Baseline cong** (`<textPath>`) ở §6 chưa thử.

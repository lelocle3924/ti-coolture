# Kế hoạch Backend — Tí Coolture

Oct 4, 2026 · @minh

Tài liệu này xin review **một quyết định kiến trúc** và **sáu câu hỏi cụ thể** — không xin duyệt toàn bộ lộ trình. Backend chưa thi công dòng nào.

Nếu chỉ có 10 phút: đọc *Quyết định cần review*, *Những chỗ kế hoạch tự biết là yếu*, và *Sáu câu hỏi*.

Bối cảnh nhân lực, vì nó ảnh hưởng tới mọi khuyến nghị bên dưới: 1 người code, beginner, chưa từng deploy production (SRS §0.2). Mọi phương án đúng về kỹ thuật nhưng cần ba hệ thống mới đều phải chịu thêm một lần kiểm tra về khả năng thi công.

## Hiện trạng

Mọi dòng dưới đây đã verify trực tiếp trong repo ngày 04/10/2026 — không lấy theo tài liệu.

| Lớp | Đang chạy | SRS §3.1 nói sẽ là |
| --- | --- | --- |
| Framework | React 19 + Vite 6, **SPA** | Next.js 15 App Router, **SSR bắt buộc** (D3) |
| Dữ liệu | mock in-memory, `src/lib/mock/` | Supabase PostgreSQL, 15 bảng |
| Seam dữ liệu | `src/lib/dbService.ts` — 599 dòng, 35 hàm export, **18 file import vào** | — |
| Ảnh | 75 WebP 640px trong `public/shop-photos`, **2.1 MB**, nằm trong git | Cloudflare R2 + `next/image` |
| Auth | **giả** — `AuthGateway.tsx` nhận mọi cặp email/mật khẩu | Supabase Auth, 2FA cho admin (AD-01) |
| Analytics | `click_events` trong RAM, mất khi reload | 14 loại event, chống "data đểu" (SRS §8) |
| SEO | `vercel.json` gắn `X-Robots-Tag: noindex` cho **mọi** route | SEO là hạng mục P0 |
| Typecheck | `tsc --noEmit` trên `main`: **0 lỗi** | — |

### Ba điều kiện biên

**Dữ liệu thật mới có một nửa.** `src/lib/mock/realShops.ts` ghi rõ trong header: tên và handle của 13 shop là thật, team thu thập tháng 8. Còn lại — 150 sản phẩm, giá, category, material, và cả 75 ảnh — là demo, viết ra để dựng UI.

**Merge queue còn 11 branch, 8 trong số đó sửa data layer.** Tổng 99 branch, 88 đã merge. Diff riêng mỗi branch nhỏ (5–7 dòng thêm), nhưng xem R7 để biết vì sao điều đó không an ủi được.

**Lịch trong SRS §12 đã hết hạn.** Deadline public là 31/08/2026; hôm nay 04/10. Phần backend cần lịch mới.

### Vì sao `dbService.ts` là tài sản quan trọng nhất

`src/lib/mock/schema.ts` khai báo kiểu hàng **đúng theo schema Postgres trong SRS §4**: snake\_case, song ngữ `*_vi`/`*_en`, `price_vnd`, `publish_status`, `map_x`/`map_y`, cột ảnh lưu **key** chứ không lưu URL đầy đủ.

`dbService.ts` là adapter duy nhất giữa hình dạng hàng đó và kiểu camelCase mà view dùng. Nói cách khác: lớp cách ly giữa FE và DB đã được dựng sẵn từ trước khi có DB. Đó là điều kiện thuận lợi nhất của dự án, và là lý do phần dưới còn cân được nhiều phương án thay vì bị dồn vào một.

## Quyết định cần review

SRS §0.1 D3 nói: *"Server-side rendering bắt buộc. Không làm SPA. SEO là kênh tăng trưởng chính."* FE hiện tại là SPA, và không phải SPA hạng nhẹ: View Transitions tự viết (`src/lib/continuity.tsx`), scroll restoration thủ công theo `location.key` (`src/App.tsx:38`), motion gắn chặt vào `react-router`.

|  | A — Migrate Next.js ngay | B — Giữ Vite + prerender | C — Giữ SPA, hoãn SEO |
| --- | --- | --- | --- |
| SEO | mở ngay | mở, trễ một lần build | **tắt** |
| Rủi ro FE | cao — viết lại router + continuity layer, rebase 11 branch | thấp — không đụng continuity layer | bằng 0 |
| Tiến độ BE | chặn tới khi migrate xong | song song được | nhanh nhất |
| Ẩn số chưa đo | — | prerender × continuity layer | — |

Phương án C đáng nói thẳng: với một sản phẩm mà mục đích là *khám phá*, một catalogue không ai tìm thấy qua Google chỉ còn là cái link gửi trên Instagram — thứ mà bản thân các shop đã có.

### Khuyến nghị: B

Đường **đọc** của site này về bản chất không cần server. Supabase client + anon key + RLS `status = 'published'` là query thẳng Postgres từ browser. Chỉ đường **ghi** — admin CRUD, upload, analytics ingest, rate limit — mới cần server, và chỗ đó dùng Vercel Functions là xong.

Catalogue 13 shop + 150 sản phẩm, đổi vài lần một tháng: đúng ca lý tưởng của static prerender.

### Hai chỗ khuyến nghị này có thể sai

**1. "Hoãn migration chờ FE ổn định" là hoãn vô thời hạn.** Code không dễ migrate hơn khi lớn lên. Devlog cho thấy design iterate liên tục hai tháng, nên điều kiện "FE ổn định" có thể không bao giờ tới.

Vì vậy kế hoạch này **không dùng** điều kiện đó. Thay bằng một cổng đo được: *merge queue về 0 thì xét lại A*, kiểm tra bằng `git branch --no-merged main`.

**2. Phương án B có một ẩn số chưa đo.** Nếu prerender xung đột với continuity layer thì B sụp xuống thành C, và lúc đó A đáng giá hơn. Đề nghị spike một ngày để đo trước khi cam kết — chứ không cam kết rồi mới biết.

## Lộ trình

&#91;embedded content: lộ trình BE · 3 tiền đề, 7 mốc, 1 chỗ nghẽn\]

BE-2 là chỗ nghẽn: mọi mốc sau đều đi qua nó, nên cả ba tiền đề ở trên phải đóng trước. **Merge queue = 0** vẽ nét đứt vì nó không phải việc backend — không mốc nào trong hình làm nó xảy ra.

Mỗi mốc là một branch off `main`, commit nhỏ theo từng việc, để nguyên cho team review — quy ước có sẵn của dự án. Mỗi mốc phải qua một **cổng kiểm chứng**: `tsc --noEmit` sạch (baseline hiện tại là 0 lỗi), Playwright sweep mọi route so screenshot trước/sau, và kiểm **đường lỗi** chứ không chỉ đường thành công — tắt mạng, xem view hiện "không tải được" hay hiện "chưa có gì".

Ba việc hoãn ra khỏi giai đoạn này, không nằm trong hình: R2 cho ảnh (R4), dashboard analytics (AD-08), trình sửa bản đồ route (AD-05).

## Những chỗ kế hoạch này tự biết là yếu

Phần này là kết quả một lượt tự phản biện có chủ đích, giữ nguyên không xoá. Người review cần thấy rủi ro được gọi tên, không cần thấy một bản kế hoạch tự tin. Sáu trong tám phát hiện dưới đây đã đổi thật lộ trình.

**R1 — "Không cần API layer cho đường đọc" đúng về correctness, hở về vận hành.** Anon key là public: ai mở devtools cũng lấy được và query bất kỳ bảng nào. RLS bảo vệ *dòng*, không bảo vệ *khối lượng* — không chặn được ai kéo sạch catalogue hay nã DB tới hết quota. **Chưa giải quyết. Xin ý kiến.**

**R2 — Kiến trúc này không tự thoả mãn được checklist của chính nó.** SRS §7.1 bắt rate limit search 30 req/phút/IP. Bản nháp đầu đặt rate limit chỉ cho admin login rồi bỏ rơi dòng search — tức là lặng lẽ không đáp ứng §7.1. Đã sửa bằng mốc BE-6. Ghi lại vì đó là dạng lỗi đáng sợ hơn lỗi code: một yêu cầu bị bỏ qua mà không ai ghi là đã bỏ qua.

**R3 — Thứ tự thi công của bản nháp đầu tạo ra lỗ bảo mật.** Auth giả xếp ở mốc cuối, trong khi `ShopDashboard` có đường gọi `updateProduct`, `moderateProduct`, `deleteStore`. Nối data layer vào Supabase trước khi xỆ lý những view đó = ship quyền ghi không cần xác thực. **Đã sửa: thành cổng G2, chặn trước BE-2.**

**R4 — Bản nháp đầu over-engineer phần ảnh.** 75 ảnh, 2.1 MB, đang được Vercel CDN phục vụ miễn phí với `immutable`. R2 thêm một hệ thống, một bộ credential, một pipeline — để giải bài toán chưa tồn tại. **Đã hoãn.**

**R5 — Gộp analytics ingest với dashboard là gộp hai độ cấp thiết khác nhau.** Ingest không backfill được nên phải sớm; dashboard đọc một tập dữ liệu còn quá thưa để kết luận. **Đã tách.**

**R6 — Bản nháp đầu không có bước kiểm chứng nào.** Rút data layer ra khỏi gầm 18 file mà chỉ dựa vào "nó compile" thì không gọi là kiểm chứng. **Đã thêm cổng kiểm chứng cho mọi mốc.**

**R7 — Rủi ro merge bị bỏ sót, và một con số nói quá.** Bản nháp đầu nói "25+ branch chưa merge" — sai, thực tế 11. Hàng rào chống phương án A thấp hơn lời kể. Nhưng **8 trong 11 branch có sửa `dbService.ts` hoặc `src/lib/mock/`**: vì BE-2 viết lại gần trọn 599 dòng, git không còn điểm tựa chung, nên mỗi branch thành một lần resolve tay bất kể diff riêng chỉ 5–7 dòng.

**R8 — Hai chỗ còn ẩn số chưa đo.** (a) Prerender tương tác thế nào với continuity layer — chưa biết, đề nghị spike một ngày. (b) Giới hạn free tier của Supabase (project tự pause, số project active) — **cần verify theo điều khoản hiện hành** trước khi cam kết mô hình hai project ở SRS §3.3. Tài liệu này không khẳng định con số nào về free tier.

## Ba lỗi trong SRS phải sửa trước khi viết migration

Chạy SQL ở SRS §4.2 nguyên bản **sẽ lỗi**. Đã verify cả ba.

|  | Lỗi | Vị trí | Sửa |
| --- | --- | --- | --- |
| 1 | FK trỏ vào bảng không tồn tại — `REFERENCES admin_users(id)`, nhưng `admin_users` không được tạo ở đâu | `SRS.md:411`, `SRS.md:520` | đổi thành `staff_members(user_id)` (`SRS.md:228`) |
| 2 | Thứ tự tạo bảng sai — `shop_members` có FK trỏ vào `shops`, nhưng tạo trước `shops` | `SRS.md:240` vs `:269` | đảo thứ tự |
| 3 | `collections` / `collection_products` chạy trong code nhưng không có trong SRS — grep `collection` trong `SRS.md` ra **0 kết quả** | `mock/schema.ts`, `dbService.ts`, Homepage | **quyết định sản phẩm** |

Lỗi 1 và 2 là sửa ba dòng. Lỗi 3 không phải lỗi code mà là quyết định sản phẩm: bổ sung vào SRS §4, hay bỏ tính năng?

## Đường tới hạn không nằm trong kỹ thuật

Toàn bộ bảy mốc có thể "done" mà site vẫn **không launch được**. Phải nói thẳng, vì đây là chỗ một kế hoạch kỹ thuật dễ tự lừa mình nhất.

- 13 shop có tên và handle thật. Nhưng **150/150 sản phẩm là demo** — tên, giá, category, material, và cả 75 ảnh.
- BE-7 nói chỉ bật index sau khi xoá sạch dữ liệu demo. Xoá xong thì còn **0 sản phẩm**.
- Không mốc nào tạo ra dữ liệu thật. Đó là việc đi xin ảnh, tên, giá, mô tả từ 13 shop — theo SRS §0.1 D1 thì đường đi là Google Form rồi admin nhập tay vào CMS.

**Nghĩa là:** AD-02 và AD-03 (CRUD shop và sản phẩm, mốc BE-5) không phải "tính năng admin" — nó là **công cụ sản xuất nội dung**, và nó nằm trên đường tới hạn thật của việc launch. Nếu phải cắt scope, cắt mọi thứ khác trước khi cắt nó. Đây cũng là nền của câu hỏi 6.

Một ràng buộc pháp lý liên quan: các cột `legal_name`, `tax_code`, `business_reg_no` trên `shops` và bảng `shop_monthly_reports` (doanh thu shop tự khai) là thu thập dữ liệu kinh doanh của đối tác. Việc đó cần văn bản thoả thuận với từng shop, không chỉ cần cột trong database. Không thuộc phạm vi kỹ thuật, nhưng một kế hoạch im lặng về nó là kế hoạch thiếu.

## Sáu câu hỏi cho người review

1. **Chọn A, B, hay C?** Và nếu B: ẩn số prerender × continuity layer (R8a) có đáng một spike một ngày trước khi cam kết, hay có cách đo rẻ hơn?
2. **Bulk scraping đường đọc (R1).** Để browser query thẳng Postgres qua anon key + RLS có chấp nhận được ở quy mô này, hay nên đặt cả đường đọc sau một Function ngay từ đầu? Kế hoạch này chưa có câu trả lời tự tin.
3. **Ba view auth giả (cổng G2): xoá hay chặn đường vào?** Khả năng nghiêng về xoá — code chết quanh một lỗ bảo mật là code sẽ có người vô tình nối lại.
4. **Tiền đề "merge queue về 0" cho BE-2 có thực tế?** Hay nên giữ `dbService.ts` ở chế độ chỉ-thêm trong suốt cửa sổ đó để 8 branch kia merge được, rồi mới rewrite?
5. **`collections`: vào SRS hay bỏ?** (Lỗi 3 ở trên.)
6. **Thứ tự có nên đảo thêm?** Nếu đường tới hạn thật là nội dung, và AD-02/AD-03 là công cụ sản xuất nội dung, thì admin CRUD có nên leo lên trước BE-4 (analytics ingest) không?

## Ngoài phạm vi

Nói trước để khỏi mất thời gian review.

- **Cart, checkout, payment, order handling** — không bao giờ. Đó là bản chất sản phẩm, không phải scope cut: SRS §0 ghi *"website vĩnh viễn không xứ lý giao dịch, thanh toán hay giỏ hàng"*.
- **Tài khoản shop tự đăng nhập** — V2, và SRS §9 yêu cầu ý kiến pháp lý trước. Schema đã chuẩn bị sẵn hai trục quyền (`staff_members` toàn cục vs `shop_members` có phạm vi) nên bật lên không phải migrate.
- **Tài khoản người dùng** — không có ở V1 (D2). Wishlist ở `localStorage`.
- **Google Maps API** — không dùng. Bản đồ route là SVG tự vẽ, toạ độ lưu dạng phần trăm (`map_x`/`map_y`), không phải lat/lng.

### Tài liệu liên quan trong repo

| Tài liệu | Nội dung |
| --- | --- |
| `docs/BE-PLAN.md` | bản đầy đủ của tài liệu này, có chi tiết từng mốc |
| `docs/SRS.md` | nguồn chuẩn: scope, schema §4, đặc tả §5, bảo mật §7, đo lường §8 |
| `docs/api_specification.md` | mô tả lớp dữ liệu **đang chạy** — adapter, 35 hàm, nợ kỹ thuật |
| `src/lib/mock/schema.ts` | kiểu hàng, đã theo đúng schema Postgres |
| `src/lib/mock/realShops.ts` | header ghi rõ cái gì thật, cái gì demo |

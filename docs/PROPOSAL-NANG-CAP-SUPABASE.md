# Đề Xuất Phê Duyệt Ngân Sách: Nâng Cấp Hạ Tầng Supabase Pro

> **Dự án:** Tí Coolture (`ticoolture.vn`)  
> **Người đề xuất:** Đội ngũ Kỹ thuật Tí Coolture  
> **Ngân sách dự kiến:** $25/tháng (~625.000 VNĐ/tháng) trích từ quỹ 10.000.000 VNĐ  
> **Thời gian duy trì:** **16 tháng** (1 năm 4 tháng)  

---

## 1. Tóm Tắt Hiện Trạng & Vấn Đề (Problem Statement)

Trang web đang gặp tình trạng phản hồi rất chậm khi tải sản phẩm và danh sách shop:
- **Thời gian chờ hiển thị nội dung (LCP) trên trang `/products`:** Đang ở mức **6,44 giây** (chuẩn Google Core Web Vitals yêu cầu dưới 2,5 giây).
- Khách vào web phải nhìn màn hình chờ xoay từ 3 - 6 giây mới thấy danh sách sản phẩm.
- **Feedback từ Senior IT:** *"LCP ở page là render data từ Supabase... do DB chậm... lỗi nghẽn lớn ngay tại đây."*

---

## 2. Bằng Chứng Kỹ Thuật Cụ Thể (Concrete Evidence)

### 2.1. Số liệu đo kiểm thực tế (End-to-End Audit - Xóa 100% Cache)

Đội ngũ kỹ thuật đã đo kiểm độc lập bằng công cụ Chromium tự động (giả lập khách mới lần đầu truy cập):

| Chỉ số đo lường | Kết quả thực tế | Tiêu chuẩn chấp nhận | Đánh giá |
| :--- | :---: | :---: | :---: |
| **Thời gian Supabase trả dữ liệu (`/products`)** | **2.545 ms (2.55 giây)** | < 150 ms | **Nghẽn nghiêm trọng (90% độ trễ)** |
| **LCP (Chờ xem nội dung chính)** | **6.440 ms (6.4 giây)** | < 2.500 ms | **Mức Báo Động Đỏ (Poor)** |
| **Thời gian Vercel tải HTML (TTFB)** | **36 ms** | < 100 ms | Rất tốt |
| **Thời gian tải Script JS/CSS** | **220 - 400 ms** | < 500 ms | Rất tốt |

> **Kết luận từ số liệu:** Hệ thống mạng Vercel và mã nguồn giao diện tải rất nhanh (dưới 0.4s). **Thủ phạm duy nhất làm web lag 90% chính là Database Supabase mất tới 2.55 giây để phản hồi query.**

---

### 2.2. Phân tích nguyên nhân gốc rễ trên hệ thống Supabase hiện tại

Dù database đã được đặt tại khu vực **Singapore (`ap-southeast-1`)**, hệ thống vẫn nghẽn vì:

1. **Cấu hình máy ảo quá yếu (Nano Compute - Shared CPU):**
   - Gói Free chỉ cấp **500 MB RAM** và **CPU dùng chung**.
   - Thực tế đo trên Dashboard: Chỉ mới vài lượt test nội bộ, RAM đã ngốn tới **57%**.
   - Khi chạy truy vấn lấy sản phẩm gộp 4 bảng (`products` + `shops` + `categories` + `product_images`), máy ảo bị tràn RAM, buộc phải đọc từ ổ đĩa (Disk I/O) chậm chạp, kéo dài thời gian xử lý lên 2.55s.
2. **Rủi ro vận hành (Risk of Inactivity Pause):**
   - Chính sách Supabase Free: *Tự động đóng băng (Pause) database sau 7 ngày không có tương tác.*
   - Nếu dự án bước vào giai đoạn quảng bá hoặc gửi link cho đối tác mà DB đang "ngủ", web sẽ sập hoàn toàn và báo lỗi kết nối.

---

## 3. Quyết Định Nâng Cấp & Cắt Giảm Chi Phí Thừa

### 3.1. Chốt: Nâng Cấp Supabase Lên Gói Pro ($25/tháng)
* **Compute chuyên dụng:** RAM lớn (8GB storage quota, pooler kết nối riêng), CPU không bị bóp nghẽn.
* **Thời gian phản hồi:** Giảm từ **2.550 ms xuống dưới 50 - 100 ms**.
* **Ổn định 100%:** Triệt tiêu hoàn toàn rủi ro bị pause/ngủ database.
* **Sao lưu tự động:** Daily backup lưu trữ 7 ngày (an toàn tuyệt đối cho dữ liệu đối tác và sản phẩm).

### 3.2. Không Mua Vercel Pro ($20/tháng) — Tiết Kiệm 500.000 VNĐ/tháng
* Mạng Vercel CDN hiện tại đang định tuyến **81.5% qua Hong Kong** (đây là nút mạng quốc tế có độ trễ thấp nhất về các nhà mạng Việt Nam: 18 - 25ms).
* Trang web là React SPA tĩnh, gói Vercel Hobby phục vụ file tĩnh trên cùng hạ tầng CDN toàn cầu như Pro.
* Gói Pro $20 không làm tăng tốc độ tải trang cho người dùng. Giữ nguyên Vercel Hobby.

---

## 4. Bảng Phân Bổ Ngân Sách 10.000.000 VNĐ

| Hạng mục | Nhà cung cấp | Chi phí hàng tháng | Thời gian duy trì với 10 triệu |
| :--- | :--- | :---: | :---: |
| **Database & Auth (Chính)** | **Supabase Pro** | **$25.00** (~625.000 VNĐ) | **16 tháng** *(1 năm 4 tháng)* |
| **Hosting Frontend** | Vercel Hobby | **$0.00** | Trọn đời |
| **Lưu trữ & Phân phối ảnh** | Cloudflare R2 + CDN Custom | **$0.00** | Theo dung lượng cơ bản |
| **Tổng cộng** | | **~625.000 VNĐ / tháng** | **16 THÁNG** |

*(Tùy chọn mở rộng sau này: Nếu muốn tích hợp thêm bộ nén ảnh chuyên nghiệp Bunny Optimizer xuất ảnh 2K/4K sắc nét chuẩn Retina cho các shop, bổ sung $9.5/tháng (~240k/tháng), ngân sách 10 triệu vẫn duy trì được gần 12 tháng).*

---

## 5. Cam Kết Kết Quả Sau Khi Nâng Cấp

1. **Tốc độ phản hồi:** Loại bỏ hoàn toàn độ trễ 2.5s. Web mở tức thì.
2. **Tỉ lệ giữ chân khách:** Người dùng không còn rời bỏ web vì chờ tải sản phẩm quá lâu.
3. **An toàn hệ thống:** Không lo sập web bất ngờ do database bị pause.

---

> **Đề xuất hành động:** Phê duyệt chi phí **$25/tháng** để kích hoạt ngay gói **Supabase Pro** cho dự án `TiCoolture`.

# TÍ COOLTURE — BẢNG KÊ CHI PHÍ HẠ TẦNG & KẾ HOẠCH NGÂN SÁCH VẬN HÀNH

**Tài liệu:** Kế hoạch Quản lý Chi phí Hạ tầng & Dự toán Ngân sách Vận hành  
**Mã tài liệu:** DOC-BUDGET-01  
**Phiên bản:** 1.0  
**Ngày lập:** 15/10/2026  
**Chủ tài khoản & Giám sát:** Lộc  
**Tổng ngân sách phân bổ:** **20.000.000 VNĐ** (Hai mươi triệu đồng)  

---

## 1. NGUYÊN TẮC QUẢN TRỊ CHI PHÍ ("CALM INFRASTRUCTURE")

1. **Triệt tiêu chi phí biến đổi khó lường:** Không sử dụng các dịch vụ tính tiền theo lưu lượng đọc/băng thông (Egress Fees) không giới hạn như AWS S3 hay GCP Cloud Storage.
2. **Ưu tiên tối đa Free Tier trong giai đoạn đầu:** Khởi động với chi phí 0đ cho đến khi sản phẩm có dòng tiền hoặc lượng truy cập thật.
3. **Chuyển đổi trả phí có kiểm soát:** Chỉ bật các gói trả phí (như Supabase Pro) khi cần đảm bảo tính sẵn sàng 24/7 không bị gián đoạn.
4. **Bảo toàn nguồn vốn:** Với quỹ 20 triệu VNĐ, hệ thống được thiết kế để có thể **duy trì hoạt động liên tục từ 2,5 đến 3 năm** mà không cần bổ sung thêm vốn.

---

## 2. BẢNG KÊ CHI TIẾT TỪNG DỊCH VỤ HẠ TẦNG

| # | Dịch vụ & Nhà cung cấp | Vai trò trong hệ thống | Hạn mức Gói Miễn Phí (Free Tier) | Mức phí khi Nâng cấp (Paid Tier) | Rủi ro & Điểm cần lưu ý |
|---|---|---|---|---|---|
| **1** | **Supabase** | Cơ sở dữ liệu PostgreSQL, Row Level Security, Auth Session | • 500 MB lưu trữ DB<br>• 50.000 người dùng hoạt động/tháng (MAU)<br>• 5 GB băng thông DB | **$25 / tháng** (~630.000 VNĐ/tháng)<br>*(Gói Pro)* | **Lưu ý quan trọng:** Gói Free sẽ tự động tạm dừng (pause) nếu 7 ngày liên tục không có query. Lên gói Pro sẽ chạy 24/7 và có sao lưu tự động hàng ngày. |
| **2** | **Cloudflare R2** | Lưu trữ hàng nghìn ảnh sản phẩm của nghệ nhân | • **10 GB** dung lượng lưu trữ<br>• 1.000.000 lượt ghi (Class A)/tháng<br>• 10.000.000 lượt đọc (Class B)/tháng<br>• **Miễn phí 100% băng thông tải ảnh (Free Egress)** | **$0.015 / GB / tháng** (~380 VNĐ / GB / tháng).<br>*Ví dụ: Lưu 50 GB ảnh chỉ tốn thêm ~15.000 VNĐ/tháng.* | Không có bẫy chi phí băng thông. Dù có hàng trăm nghìn lượt xem ảnh/ngày, tiền egress vẫn là **0 VNĐ**. |
| **3** | **Vercel** | Hosting giao diện Web + Vercel Serverless Functions (`/api/*`) | • 100 GB băng thông/tháng<br>• 100.000 lượt thực thi serverless function/ngày<br>• Tự động cấp chứng chỉ SSL miễn phí | **$20 / user / tháng**<br>*(Chỉ cần khi mở rộng team nhiều lập trình viên cùng quản lý)* | Gói cá nhân (Hobby) hoàn toàn đủ cho nhu cầu vận hành hiện tại với 1 người quản trị. |
| **4** | **Google Cloud Console** | Google OAuth 2.0 (Xác thực đăng nhập shop & user) | • **Miễn phí 100% vĩnh viễn** cho luồng OAuth Consent Screen & Client Credentials | 0 VNĐ | Tuân thủ chính sách định danh của Google, không phát sinh chi phí duy trì. |
| **5** | **Telegram Bot API** | Bắn thông báo tức thời cho Admin khi shop nộp bài duyệt | • **Miễn phí 100% vĩnh viễn** | 0 VNĐ | Resilient API: Nếu Telegram lỗi mạng, serverless function vẫn chạy bình thường. |
| **6** | **Tên miền `ticoolture.vn`** | Tên miền thương hiệu quốc gia (.vn) | Không có | **~250.000 – 350.000 VNĐ / năm** | Cần gia hạn hàng năm theo quy định của VNNIC. |

---

## 3. KỊCH BẢN PHÂN BỔ NGÂN SÁCH (RUN-RATE VỚI QUỸ 20 TRIỆU VNĐ)

```
Tổng ngân sách: 20.000.000 VNĐ
 │
 ├── Giai đoạn 1: Launch & Thử nghiệm (Tháng 1 – Tháng 6) ──────► Chi phí: ~0 VNĐ/tháng
 │
 └── Giai đoạn 2: Vận hành ổn định & Bật Supabase Pro ──────────► Chi phí: ~650.000 VNĐ/tháng
     (Chạy liên tục ~30 tháng = 2,5 năm)
```

### Kịch bản 1: Khởi động tinh gọn (Giai đoạn Launch: 3 – 6 tháng đầu)
* **Chính sách:** Tận dụng 100% Free Tier của Supabase, Cloudflare R2, Vercel, Google OAuth.
* **Chi phí hàng tháng:** **0 VNĐ**.
* **Đánh giá:** Rất phù hợp khi mới bắt đầu onboard 20 – 50 shop đầu tiên, dữ liệu ảnh nằm gọn trong 10GB miễn phí của R2 và 500MB của Supabase.

### Kịch bản 2: Vận hành chuyên nghiệp (Bật Supabase Pro để êm ả tuyệt đối)
* **Kích hoạt khi:** Web có lượng truy cập ổn định hàng ngày và bạn không muốn bận tâm về việc database bị pause sau 7 ngày vắng vẻ.
* **Bảng tính chi phí hàng tháng:**
  * Supabase Pro: $25 $\approx$ 630.000 VNĐ
  * Cloudflare R2 (Lưu trữ ~30 – 50 GB ảnh): ~15.000 VNĐ
  * Vercel Hobby: 0 VNĐ
  * Phí duy trì tên miền (chia đều hàng tháng): ~25.000 VNĐ
  * **Tổng chi phí hàng tháng:** **~670.000 VNĐ / tháng**.
* **Thời gian duy trì với ngân sách 20 triệu VNĐ:**
  $$\text{Thời gian vận hành} = \frac{20.000.000 \text{ VNĐ}}{670.000 \text{ VNĐ/tháng}} \approx \mathbf{29,8\text{ tháng (gần 2,5 năm)}}$$

### Kịch bản 3: Tăng trưởng quy mô lớn (Quy mô 200+ shops, hàng chục nghìn ảnh)
* Dung lượng ảnh R2 lên đến 150 GB: $140 \text{ GB vượt} \times \$0.015 \approx \$2.1$ (~53.000 VNĐ/tháng).
* Supabase Pro: ~630.000 VNĐ/tháng.
* Tổng chi phí: **~710.000 VNĐ / tháng**.
* Quỹ 20 triệu vẫn đảm bảo hoạt động liên tục hơn **2 năm (28 tháng)**.

---

## 4. CHECKLIST CHUẨN BỊ VÀ THIẾT LẬP AN TOÀN TÀI CHÍNH

- [ ] **Thẻ thanh toán quốc tế (Visa/Mastercard Debit):**
  * Khuyên dùng: Mở 1 thẻ debit phụ riêng cho dự án (ví dụ thẻ ảo Timo, Techcombank, MB Bank).
  * Chỉ nạp vào thẻ số dư vừa đủ (khoảng 1 - 2 triệu VNĐ), không dùng thẻ tín dụng hạn mức lớn để tránh rủi ro bị trừ tiền ngoài ý muốn.
- [ ] **Thiết lập Cảnh báo Hạn mức (Billing Alerts & Spending Limits):**
  * **Supabase:** Vào *Organization > Billing*, bật cờ **Spend Cap** (không cho phép chi vượt quá hạn mức $25/tháng, tự động chặn thay vì tính thêm tiền ngoài dự kiến).
  * **Cloudflare:** Vào *Billing*, thiết lập thông báo khi chi phí vượt quá $5/tháng.
- [ ] **Sao lưu dữ liệu định kỳ (Data Backups):**
  * Tận dụng tính năng Daily Automated Backup có sẵn trong Supabase Pro.
  * Xuất bản sao lưu schema và dữ liệu hàng tháng về máy cục bộ.

---

## 5. KẾT LUẬN & ĐÁNH GIÁ TỔNG QUAN

Kiến trúc backend hiện tại được thiết kế chính xác để giải quyết bài toán: **Ít nhân sự bảo trì, nhiều dữ liệu hình ảnh, chi phí cố định và dễ kiểm soát.**

Ngân sách **20.000.000 VNĐ** là **hoàn toàn dư dả** để Tí Coolture yên tâm vận hành, phát triển đối tác và phục vụ khách hàng trong suốt **2 đến 2,5 năm tới** mà không chịu bất kỳ áp lực nào về mặt hạ tầng máy chủ.

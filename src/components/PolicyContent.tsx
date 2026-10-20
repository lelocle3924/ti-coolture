import { useState } from "react";

interface PolicyContentProps {
  initialTab?: "privacy" | "terms";
  showTabs?: boolean;
}

export default function PolicyContent({
  initialTab = "terms",
  showTabs = true,
}: PolicyContentProps) {
  const [tab, setTab] = useState<"privacy" | "terms">(initialTab);

  return (
    <div className="space-y-8">
      {showTabs && (
        <div className="flex border-b border-ink/10 pb-2 gap-2">
          <button
            type="button"
            onClick={() => setTab("terms")}
            className={`rounded-full px-4 py-2 text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              tab === "terms"
                ? "bg-brand text-paper shadow-sm"
                : "bg-ink/5 text-ink/70 hover:bg-ink/10 hover:text-ink"
            }`}
          >
            Điều khoản sử dụng
          </button>
          <button
            type="button"
            onClick={() => setTab("privacy")}
            className={`rounded-full px-4 py-2 text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              tab === "privacy"
                ? "bg-brand text-paper shadow-sm"
                : "bg-ink/5 text-ink/70 hover:bg-ink/10 hover:text-ink"
            }`}
          >
            Chính sách quyền riêng tư
          </button>
        </div>
      )}

      {tab === "privacy" && (
        <article className="space-y-8 text-ink/80 text-sm md:text-base leading-relaxed">
          <header className="border-b border-ink/10 pb-4">
            <h2 className="display text-2xl md:text-3xl text-brand normal-case">
              Chính sách quyền riêng tư
            </h2>
            <p className="mt-1 text-xs text-ink/50">Cập nhật: 2026</p>
          </header>

          <section className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl text-ink">1. Tí là ai?</h3>
            <p>
              Tí Coolture (<a href="https://ticoolture.vn" className="text-brand underline hover:text-brand-deep">https://ticoolture.vn</a>) là trang khám phá local brand Việt, do một nhóm bạn trẻ tự vận hành. Tí chưa phải công ty.
            </p>
            <p>
              Tí không bán hàng. Khi bạn bấm vào một sản phẩm, Tí dẫn bạn sang Instagram, TikTok, Facebook hoặc website của shop. Mọi việc mua bán diễn ra ở đó, theo chính sách riêng của shop.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="font-bold text-lg md:text-xl text-ink">2. Tí thu thập gì, để làm gì?</h3>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-ink text-sm md:text-base">Nếu bạn là người xem:</h4>
              <div className="overflow-x-auto rounded-xl border border-ink/10">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-ink/5 text-ink font-semibold border-b border-ink/10">
                    <tr>
                      <th className="p-3">Khi nào</th>
                      <th className="p-3">Chuyện gì xảy ra</th>
                      <th className="p-3">Để làm gì</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    <tr>
                      <td className="p-3 font-medium">Bạn vào web</td>
                      <td className="p-3">Nhà cung cấp máy chủ tự ghi nhật ký kỹ thuật: địa chỉ IP, loại trình duyệt, thời điểm truy cập</td>
                      <td className="p-3">Giữ web chạy ổn, chặn spam và tấn công</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Bạn lưu yêu thích, theo dõi shop, tìm kiếm</td>
                      <td className="p-3">Lưu trên trình duyệt của bạn. Tí <strong>không</strong> nhận</td>
                      <td className="p-3">Để bạn xem lại lần sau</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Bạn bấm vào một sản phẩm</td>
                      <td className="p-3">Bộ đếm tổng của sản phẩm đó tăng thêm 1. Tí <strong>không</strong> ghi ai đã bấm</td>
                      <td className="p-3">Biết sản phẩm nào được quan tâm</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Bạn email cho Tí</td>
                      <td className="p-3">Nội dung thư và địa chỉ email</td>
                      <td className="p-3">Trả lời bạn</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-ink/60">
                Tí không xin vị trí của bạn và không có bình luận hay nhắn tin.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="font-semibold text-ink text-sm md:text-base">Nếu bạn là shop đối tác:</h4>
              <div className="overflow-x-auto rounded-xl border border-ink/10">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-ink/5 text-ink font-semibold border-b border-ink/10">
                    <tr>
                      <th className="p-3">Khi nào</th>
                      <th className="p-3">Tí nhận được gì</th>
                      <th className="p-3">Để làm gì</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    <tr>
                      <td className="p-3 font-medium">Shop gửi đăng ký hợp tác</td>
                      <td className="p-3">Tên shop, tên người phụ trách, email Google, số điện thoại/Zalo, khu vực, link mạng xã hội, mô tả, link ảnh</td>
                      <td className="p-3">Xét duyệt và liên hệ với shop</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Shop đăng nhập Google</td>
                      <td className="p-3">Mã tài khoản, email, tên, ảnh đại diện, thời điểm đăng nhập gần nhất</td>
                      <td className="p-3">Cho shop vào trang quản lý</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Shop đăng sản phẩm</td>
                      <td className="p-3">Ảnh, mô tả sản phẩm, thông tin xưởng</td>
                      <td className="p-3">Hiển thị công khai sau khi Tí duyệt</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="rounded-xl bg-ink/5 p-4 text-xs md:text-sm space-y-2">
                <p>
                  <strong>Về đăng nhập Google:</strong> Tí chỉ xin quyền cơ bản (openid, email, profile). Tí không lưu mật khẩu hay token Google và không đọc Gmail, Drive hay danh bạ. Bạn có thể ngắt kết nối tại <a href="https://myaccount.google.com/connections" target="_blank" rel="noreferrer" className="text-brand underline">myaccount.google.com/connections</a>. Lưu ý: ngắt kết nối chưa xóa dữ liệu ở Tí. Muốn xóa, xem mục 6.
                </p>
                <p>
                  Việc Tí sử dụng thông tin nhận từ Google tuân theo <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-brand underline">Chính sách dữ liệu người dùng của Google API Services</a>.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl text-ink">3. Cookie và bộ nhớ trình duyệt</h3>
            <p>
              Tí <strong>không</strong> dùng cookie.
            </p>
            <p>
              Tí dùng bộ nhớ trình duyệt (localStorage, sessionStorage) cho những việc cần thiết: lưu yêu thích, shop đã theo dõi, tìm kiếm gần đây, vị trí cuộn trang và giữ phiên đăng nhập của shop. Dữ liệu này nằm trên máy bạn. Bạn xóa được bất cứ lúc nào bằng cách xóa dữ liệu trang web trong cài đặt trình duyệt.
            </p>
            <p>
              Nếu sau này Tí thêm công cụ thống kê hoặc quảng cáo, Tí sẽ hỏi ý bạn trước. Bạn có quyền từ chối.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl text-ink">4. Ai được xem dữ liệu?</h3>
            <p>
              <strong>Team Tí:</strong> chỉ thành viên được giao việc duyệt shop và vận hành web.
            </p>
            <p>
              <strong>Nhà cung cấp dịch vụ</strong> giúp Tí chạy web:
            </p>
            <div className="overflow-x-auto rounded-xl border border-ink/10">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-ink/5 text-ink font-semibold border-b border-ink/10">
                  <tr>
                    <th className="p-3">Dịch vụ</th>
                    <th className="p-3">Dùng để</th>
                    <th className="p-3">Chính sách</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  <tr>
                    <td className="p-3 font-medium">Vercel</td>
                    <td className="p-3">Chạy website</td>
                    <td className="p-3"><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer" className="text-brand underline">Xem</a></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Supabase</td>
                    <td className="p-3">Cơ sở dữ liệu, đăng nhập</td>
                    <td className="p-3"><a href="https://supabase.com/privacy" target="_blank" rel="noreferrer" className="text-brand underline">Xem</a></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Cloudflare R2</td>
                    <td className="p-3">Lưu ảnh sản phẩm</td>
                    <td className="p-3"><a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer" className="text-brand underline">Xem</a></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Upstash</td>
                    <td className="p-3">Bộ nhớ đệm giúp web nhanh hơn</td>
                    <td className="p-3"><a href="https://upstash.com/trust/privacy.pdf" target="_blank" rel="noreferrer" className="text-brand underline">Xem</a></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Google</td>
                    <td className="p-3">Đăng nhập cho shop và team</td>
                    <td className="p-3"><a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-brand underline">Xem</a></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-ink/70">
              Máy chủ của các dịch vụ này có thể đặt ngoài Việt Nam. Tí chỉ chọn nhà cung cấp có cam kết bảo mật và thực hiện thủ tục chuyển dữ liệu ra nước ngoài theo quy định.
            </p>
            <p>
              <strong>Cơ quan nhà nước</strong> khi pháp luật yêu cầu.
            </p>
            <p>
              Tí <strong>không</strong> bán, cho thuê hay dùng dữ liệu để quảng cáo. Thông tin shop đăng công khai (tên shop, ảnh, mô tả, link) sẽ hiện cho mọi người xem. Số điện thoại và email của người phụ trách shop không hiển thị công khai.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl text-ink">5. Tí giữ dữ liệu bao lâu?</h3>
            <div className="overflow-x-auto rounded-xl border border-ink/10">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-ink/5 text-ink font-semibold border-b border-ink/10">
                  <tr>
                    <th className="p-3">Dữ liệu</th>
                    <th className="p-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  <tr>
                    <td className="p-3 font-medium">Nhật ký kỹ thuật</td>
                    <td className="p-3">Tối đa 7 ngày, nhà cung cấp tự xóa</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Bản sao lưu</td>
                    <td className="p-3">Tối đa 7 ngày, tự xoay vòng</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Dữ liệu trên trình duyệt của bạn</td>
                    <td className="p-3">Đến khi bạn tự xóa</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Tài khoản shop</td>
                    <td className="p-3">Trong thời gian hợp tác. Tài khoản bỏ không 24 tháng: Tí báo trước 30 ngày rồi xóa</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Đăng ký hợp tác và sản phẩm</td>
                    <td className="p-3">Trong thời gian hợp tác. Shop rút thì Tí gỡ và xóa nhanh chóng</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Email hỗ trợ</td>
                    <td className="p-3">6 tháng sau khi xử lý xong</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl text-ink">6. Quyền của bạn</h3>
            <p>Bạn có quyền:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Biết Tí đang giữ gì về bạn và nhận bản sao;</li>
              <li>Sửa thông tin sai;</li>
              <li>Xóa dữ liệu hoặc tài khoản;</li>
              <li>Rút lại sự đồng ý, phản đối hoặc yêu cầu hạn chế việc xử lý;</li>
              <li>Khiếu nại tới cơ quan có thẩm quyền.</li>
            </ul>
            <p>
              <strong>Người xem:</strong> Tí gần như không giữ gì về bạn. Dữ liệu trên trình duyệt thì bạn tự xóa được ngay.
            </p>
            <p>
              <strong>Shop:</strong> gửi email tới <a href="mailto:creativespace.ticoolture@gmail.com" className="text-brand underline">creativespace.ticoolture@gmail.com</a> từ email đã đăng nhập, ghi rõ yêu cầu. Muốn xóa thì đặt tiêu đề <strong>"Xóa tài khoản"</strong>. Tí sẽ xóa tài khoản, trang shop, sản phẩm, ảnh và hồ sơ đăng ký, rồi báo lại khi xong.
            </p>
            <p className="text-xs text-ink/70">
              Tí xác nhận đã nhận trong 2 ngày làm việc và xử lý trong thời hạn pháp luật quy định. Tí không yêu cầu CCCD. Đừng bao giờ gửi mật khẩu cho Tí.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl text-ink">7. Tí bảo vệ dữ liệu thế nào?</h3>
            <p>
              Web chạy HTTPS. Chỉ người được giao việc mới vào được trang quản lý. Tài khoản quản trị được bảo vệ bằng xác thực hai lớp.
            </p>
            <p>
              Nếu xảy ra sự cố rò rỉ, Tí sẽ khắc phục ngay, báo cơ quan chức năng và báo người bị ảnh hưởng theo quy định pháp luật.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl text-ink">8. Trẻ em</h3>
            <p>
              Ai cũng có thể xem Tí. Người xem không cần cung cấp thông tin cá nhân nào.
            </p>
            <p>
              Tài khoản shop dành cho người từ 18 tuổi. Người dưới 18 tuổi cần bố mẹ hoặc người giám hộ đồng ý và đứng ra liên hệ với Tí.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl text-ink">9. Khi chính sách thay đổi</h3>
            <p>
              Ngày cập nhật luôn ghi ở đầu trang. Nếu thay đổi lớn, Tí sẽ báo trên web trước khi áp dụng. Nếu Tí muốn dùng dữ liệu cho mục đích mới, Tí sẽ hỏi bạn trước.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl text-ink">10. Liên hệ</h3>
            <p>
              Email: <a href="mailto:creativespace.ticoolture@gmail.com" className="text-brand underline font-semibold">creativespace.ticoolture@gmail.com</a>
            </p>
            <p className="text-xs text-ink/60">
              Chính sách này tuân theo Luật Bảo vệ dữ liệu cá nhân 2025 và các văn bản hướng dẫn.
            </p>
          </section>
        </article>
      )}

      {tab === "terms" && (
        <article className="space-y-8 text-ink/80 text-sm md:text-base leading-relaxed">
          <header className="border-b border-ink/10 pb-4">
            <h2 className="display text-2xl md:text-3xl text-brand normal-case">
              Điều khoản sử dụng
            </h2>
            <p className="mt-1 text-xs text-ink/50">Cập nhật: 2026</p>
          </header>

          <section className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl text-ink">1. Tí là gì?</h3>
            <p>
              Tí Coolture (<a href="https://ticoolture.vn" className="text-brand underline hover:text-brand-deep">https://ticoolture.vn</a>) giúp bạn khám phá thương hiệu, sản phẩm và hoạt động sáng tạo Việt Nam. Tí do một nhóm cá nhân vận hành.
            </p>
            <p>
              Mỗi sản phẩm trên Tí dẫn tới kênh riêng của shop. Tí không nhận đơn, không thu tiền, không giao hàng. Giá, tình trạng hàng, thanh toán, vận chuyển, bảo hành và đổi trả do shop quyết định.
            </p>
            <p>
              Tí chọn lọc shop cẩn thận, nhưng việc một shop có mặt trên Tí không có nghĩa Tí bảo đảm chất lượng mọi sản phẩm. Hãy kiểm tra kỹ trước khi mua.
            </p>
            <p>
              Bằng việc dùng Tí, bạn đồng ý với các điều khoản này và Chính sách quyền riêng tư của chúng mình.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl text-ink">2. Người xem</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Bạn xem Tí không cần tài khoản.</li>
              <li>Yêu thích và shop bạn theo dõi được lưu trên trình duyệt của bạn. Đổi máy hoặc xóa dữ liệu trình duyệt thì danh sách sẽ mất.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="font-bold text-lg md:text-xl text-ink">3. Dành cho shop</h3>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-ink text-sm md:text-base">Tham gia thế nào:</h4>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Shop gửi đăng ký hợp tác trên web.</li>
                <li>Team Tí xét duyệt. Được duyệt, shop đăng nhập trang quản lý bằng Google.</li>
                <li>Shop tạo bản nháp sản phẩm, sửa thông tin shop và tải ảnh lên.</li>
                <li>Shop bấm "Gửi duyệt". Chỉ khi Tí duyệt, nội dung mới hiện công khai.</li>
              </ol>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="font-semibold text-ink text-sm md:text-base">Shop cam kết:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Người đăng ký từ 18 tuổi, hoặc có bố mẹ/người giám hộ đồng ý, và có quyền đại diện cho shop.</li>
                <li>Thông tin là thật, đúng, được cập nhật khi thay đổi.</li>
                <li>Có quyền dùng mọi ảnh, logo, nội dung đã gửi.</li>
                <li>Tự giữ an toàn tài khoản Google dùng để đăng nhập.</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="font-semibold text-ink text-sm md:text-base">Quyền với nội dung:</h4>
              <p>
                Shop vẫn là chủ nội dung của mình. Shop cho Tí quyền miễn phí, không độc quyền, để lưu trữ, chỉnh cách trình bày và hiển thị nội dung trên Tí (và giới thiệu trên các kênh chính thức của Tí như Instagram, TikTok).
              </p>
              <p>
                Tí có thể từ chối, yêu cầu sửa hoặc ẩn nội dung không phù hợp. Việc được duyệt không phải chứng nhận chất lượng hay xuất xứ của sản phẩm.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="font-semibold text-ink text-sm md:text-base">Phí và rời đi:</h4>
              <p>
                Tham gia Tí miễn phí. Tí không lấy hoa hồng. Nếu sau này có dịch vụ trả phí, Tí sẽ công bố riêng và shop tự chọn có tham gia hay không.
              </p>
              <p>
                Muốn rời Tí? Chỉ cần email cho tụi mình là được.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl text-ink">4. Những điều không được làm</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Lừa đảo, mạo danh, đăng thông tin sai sự thật.</li>
              <li>Giới thiệu hàng giả, hàng cấm, hàng vi phạm bản quyền.</li>
              <li>Spam, quấy rối, phát tán mã độc, tấn công hoặc truy cập trái phép hệ thống.</li>
              <li>Cào dữ liệu hàng loạt, hoặc sao chép nội dung của Tí để dùng vào mục đích thương mại.</li>
            </ul>
            <p className="text-xs text-ink/70">
              Nếu có vi phạm, Tí có thể gỡ nội dung hoặc khóa tài khoản. Tí sẽ báo lý do khi có thể. Bạn có thể email để Tí xem xét lại.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl text-ink">5. Bản quyền</h3>
            <p>
              Logo, thiết kế và bài viết do Tí tạo thuộc về Tí. Ảnh, nhãn hiệu và nội dung của shop thuộc về shop.
            </p>
            <p>
              Thấy nội dung vi phạm bản quyền hoặc link giả mạo? Báo Tí qua email, Tí sẽ kiểm tra và gỡ nếu đúng.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl text-ink">6. Trách nhiệm</h3>
            <p>
              Tí cố gắng giữ web chạy ổn và thông tin chính xác. Dù vậy, web có thể gián đoạn khi bảo trì hoặc gặp sự cố, và thông tin của shop (giá, hàng còn hay hết) có thể thay đổi. Hãy xác nhận lại với shop trước khi mua.
            </p>
            <p>
              Mỗi bên chịu trách nhiệm về phần việc của mình theo pháp luật. Điều khoản này không lấy đi bất kỳ quyền nào pháp luật dành cho bạn, kể cả quyền khiếu nại và khởi kiện.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl text-ink">7. Thay đổi và luật áp dụng</h3>
            <p>
              Khi điều khoản thay đổi, Tí cập nhật ngày ở đầu trang và báo trên web nếu thay đổi lớn.
            </p>
            <p>
              Điều khoản này theo pháp luật Việt Nam. Có tranh chấp, hai bên trao đổi trước. Việc này không hạn chế quyền của bạn đưa vụ việc tới cơ quan có thẩm quyền.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl text-ink">8. Liên hệ</h3>
            <p>
              Góp ý, khiếu nại, báo vi phạm: <a href="mailto:creativespace.ticoolture@gmail.com" className="text-brand underline font-semibold">creativespace.ticoolture@gmail.com</a>. Ghi kèm link liên quan để Tí xử lý nhanh hơn.
            </p>
          </section>
        </article>
      )}
    </div>
  );
}

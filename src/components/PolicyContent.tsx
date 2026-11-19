import React from "react";

export function PrivacyContent() {
  return (
    <div className="space-y-12 text-ink/80 text-sm md:text-base leading-relaxed">
      {/* ========================================================================= */}
      {/* PHIÊN BẢN TIẾNG VIỆT                                                      */}
      {/* ========================================================================= */}
      <article className="space-y-8">
        <header className="border-b border-ink/10 pb-4">
          <div className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand mb-2">
            Tiếng Việt
          </div>
          <h2 className="display text-2xl md:text-3xl text-brand normal-case">
            Chính sách quyền riêng tư — Ti Coolture
          </h2>
          <p className="mt-1 text-xs text-ink/50">Cập nhật lần cuối: 2026 | Phiên bản 2.0</p>
        </header>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">1. Tí Coolture là ai?</h3>
          <p>
            <strong>Ti Coolture</strong> (địa chỉ website chính thức:{" "}
            <a href="https://ticoolture.vn" className="text-brand underline hover:text-brand-deep">
              https://ticoolture.vn
            </a>
            ) là nền tảng số tuyển chọn và khám phá các thương hiệu địa phương (local brand), nghệ sĩ độc lập và không gian sáng tạo tại Việt Nam.
          </p>
          <p>
            Ti Coolture không trực tiếp bán hàng, không thu tiền và không xử lý đơn vận chuyển. Khi bạn bấm vào một sản phẩm hoặc shop, hệ thống chuyển hướng bạn đến kênh chính thức của shop (Instagram, TikTok, Facebook, Shopee hoặc website riêng). Mọi giao dịch phát sinh sẽ thuộc phạm vi chính sách riêng của từng shop.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="font-bold text-lg md:text-xl text-ink">2. Dữ liệu thu thập &amp; Mục đích sử dụng</h3>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-ink text-sm md:text-base">2.1. Đối với người xem website (Khách truy cập):</h4>
            <div className="overflow-x-auto rounded-xl border border-ink/10">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-ink/5 text-ink font-semibold border-b border-ink/10">
                  <tr>
                    <th className="p-3">Hành động</th>
                    <th className="p-3">Dữ liệu phát sinh</th>
                    <th className="p-3">Mục đích sử dụng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  <tr>
                    <td className="p-3 font-medium">Truy cập website</td>
                    <td className="p-3">Nhật ký máy chủ (địa chỉ IP ẩn danh, loại trình duyệt, hệ điều hành, thời gian truy cập)</td>
                    <td className="p-3">Bảo vệ an ninh hệ thống, ngăn ngừa tấn công mạng/DDoS và thống kê lượt xem</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Lưu sản phẩm yêu thích, tìm kiếm</td>
                    <td className="p-3">Lưu trữ cục bộ trên thiết bị của bạn (localStorage trình duyệt). Bộ đếm sản phẩm chỉ tăng tổng số lượt lưu</td>
                    <td className="p-3">Giúp bạn xem lại danh sách yêu thích và hỗ trợ shop biết sản phẩm được quan tâm mà không nhận dạng cá nhân</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Bấm liên hệ shop đối tác</td>
                    <td className="p-3">Ghi nhận 01 lượt bấm chuyển hướng (Click counter)</td>
                    <td className="p-3">Đo lường độ quan tâm đối với từng shop đối tác</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Gửi email hỗ trợ</td>
                    <td className="p-3">Địa chỉ email và nội dung phản hồi của bạn</td>
                    <td className="p-3">Phản hồi và hỗ trợ giải quyết thắc mắc</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-ink/60">
              Ti Coolture không thu thập dữ liệu định vị GPS, không yêu cầu cấp quyền danh bạ, micro, camera hay thiết bị của người xem.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-semibold text-ink text-sm md:text-base">2.2. Đối với Shop đối tác &amp; Quản trị viên (Google OAuth):</h4>
            <div className="overflow-x-auto rounded-xl border border-ink/10">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-ink/5 text-ink font-semibold border-b border-ink/10">
                  <tr>
                    <th className="p-3">Hạng mục</th>
                    <th className="p-3">Dữ liệu thu thập</th>
                    <th className="p-3">Mục đích sử dụng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  <tr>
                    <td className="p-3 font-medium">Đăng ký tham gia shop</td>
                    <td className="p-3">Tên shop, tên người đại diện, số điện thoại/Zalo, khu vực hoạt động, link mạng xã hội, mô tả thương hiệu, hình ảnh sản phẩm</td>
                    <td className="p-3">Xét duyệt tiêu chuẩn, liên hệ trao đổi hợp tác và cấu hình trang hồ sơ shop</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Đăng nhập bằng Google (Google Sign-In)</td>
                    <td className="p-3">ID người dùng Google, địa chỉ email, tên hiển thị, hình ảnh đại diện (avatar)</td>
                    <td className="p-3">Xác thực danh tính chủ shop để cấp quyền truy cập trang quản lý sản phẩm (Shop Portal)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Quản lý nội dung shop</td>
                    <td className="p-3">Hình ảnh sản phẩm tải lên, thông tin mô tả, trạng thái kho hàng (còn hàng / tạm hết hàng)</td>
                    <td className="p-3">Hiển thị công khai tới người dùng sau khi ban quản trị Ti Coolture kiểm duyệt</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">
            3. Dữ liệu từ Google APIs &amp; Tuân thủ chính sách Limited Use
          </h3>
          <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 space-y-3">
            <p>
              Ti Coolture chỉ yêu cầu các phạm vi quyền OAuth cơ bản tối thiểu từ Google:{" "}
              <code className="rounded bg-brand/10 px-1.5 py-0.5 text-xs text-brand font-mono font-bold">openid</code>,{" "}
              <code className="rounded bg-brand/10 px-1.5 py-0.5 text-xs text-brand font-mono font-bold">email</code>,{" "}
              <code className="rounded bg-brand/10 px-1.5 py-0.5 text-xs text-brand font-mono font-bold">profile</code>.
            </p>
            <p>
              Hệ thống <strong>không</strong> yêu cầu quyền đọc hộp thư Gmail, Google Drive, danh bạ hay bất kỳ dịch vụ nhạy cảm nào khác của Google. Ti Coolture không lưu trữ mật khẩu tài khoản Google của bạn.
            </p>
            <p className="font-semibold text-brand">
              Cam kết tuân thủ Google API Services User Data Policy:
            </p>
            <p className="italic">
              &ldquo;Việc Ti Coolture sử dụng và chuyển giao thông tin nhận được từ các API của Google cho bất kỳ ứng dụng nào khác sẽ luôn tuân thủ{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="underline font-medium hover:text-brand-deep"
              >
                Chính sách dữ liệu người dùng của Google API Services (Google API Services User Data Policy)
              </a>
              , bao gồm các yêu cầu về Sử dụng có giới hạn (Limited Use requirements).&rdquo;
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm">
              <li>Chúng tôi <strong>không bao giờ</strong> bán hoặc chia sẻ dữ liệu người dùng Google cho bên thứ ba vì mục đích tiếp thị hoặc quảng cáo.</li>
              <li>Chúng tôi <strong>không</strong> sử dụng dữ liệu người dùng Google để huấn luyện các mô hình trí tuệ nhân tạo (AI/ML).</li>
              <li>Người dùng có thể thu hồi quyền truy cập của Ti Coolture bất kỳ lúc nào tại{" "}
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="underline font-medium">
                  myaccount.google.com/permissions
                </a>.
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">4. Bộ nhớ trình duyệt &amp; Cookie</h3>
          <p>
            Ti Coolture <strong>không sử dụng cookie theo dõi</strong> của bên thứ ba nhằm mục đích quảng cáo bám đuổi.
          </p>
          <p>
            Chúng tôi sử dụng bộ nhớ cục bộ trên trình duyệt (<code>localStorage</code>, <code>sessionStorage</code>) để phục vụ các tiện ích thiết yếu: lưu danh sách sản phẩm yêu thích của bạn, ghi nhớ trạng thái phiên đăng nhập của shop đối tác, và tối ưu tốc độ tải trang. Bạn hoàn toàn có thể xóa các dữ liệu này bất cứ lúc nào trong phần cài đặt trình duyệt.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">5. Chia sẻ dữ liệu với bên thứ ba</h3>
          <p>
            Ti Coolture <strong>không bán, không cho thuê và không thương mại hóa dữ liệu cá nhân</strong> của bạn. Dữ liệu kỹ thuật chỉ được chuyển tiếp qua các nhà cung cấp hạ tầng đám mây uy tín phục vụ việc vận hành website:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm">
            <li><strong>Vercel Inc.:</strong> Lưu trữ và chạy mã nguồn ứng dụng web.</li>
            <li><strong>Supabase Inc.:</strong> Cơ sở dữ liệu và hạ tầng xác thực danh tính người dùng (OAuth).</li>
            <li><strong>Cloudflare R2:</strong> Mạng lưu trữ và truyền tải hình ảnh sản phẩm.</li>
            <li><strong>Upstash:</strong> Bộ nhớ đệm tốc độ cao (Redis Cache) để tối ưu hiệu năng hiển thị.</li>
            <li><strong>Google LLC:</strong> Cung cấp dịch vụ đăng nhập xác thực Google Sign-In.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">6. Thời gian lưu trữ dữ liệu</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Nhật ký kỹ thuật máy chủ:</strong> Tự động luân chuyển và xóa sau tối đa 7 ngày.</li>
            <li><strong>Dữ liệu trình duyệt người xem:</strong> Tồn tại trên máy người dùng cho đến khi bạn tự xóa cache.</li>
            <li><strong>Hồ sơ shop và thông tin sản phẩm:</strong> Lưu trữ trong suốt thời gian shop đồng hành cùng Ti Coolture. Khi shop ngừng hợp tác hoặc yêu cầu xóa, toàn bộ dữ liệu sẽ được xóa hoàn toàn khỏi cơ sở dữ liệu chính.</li>
            <li><strong>Thông tin liên hệ hỗ trợ:</strong> Lưu trữ tối đa 06 tháng để theo dõi tiến độ xử lý khiếu nại.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">
            7. Quyền của bạn &amp; Hướng dẫn yêu cầu xóa dữ liệu (Data Deletion Instructions)
          </h3>
          <p>Theo quy định bảo vệ dữ liệu cá nhân, bạn có đầy đủ các quyền:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Quyền biết và yêu cầu trích xuất bản sao dữ liệu của mình;</li>
            <li>Quyền chỉnh sửa thông tin chưa chính xác;</li>
            <li>Quyền phản đối, hạn chế việc xử lý dữ liệu;</li>
            <li>Quyền yêu cầu xóa bỏ hoàn toàn tài khoản và dữ liệu liên quan.</li>
          </ul>
          <div className="rounded-xl bg-ink/5 p-4 space-y-2 mt-2">
            <h4 className="font-bold text-ink text-sm md:text-base">Quy trình yêu cầu xóa dữ liệu (Data Deletion):</h4>
            <p>
              Để yêu cầu xóa tài khoản hoặc toàn bộ dữ liệu liên quan đến tài khoản của bạn, vui lòng gửi email trực tiếp từ địa chỉ email đăng ký tới:{" "}
              <a href="mailto:creativespace.ticoolture@gmail.com" className="font-semibold text-brand underline">
                creativespace.ticoolture@gmail.com
              </a>
            </p>
            <p className="text-xs text-ink/70">
              • Tiêu đề thư: <strong>&ldquo;Yêu cầu xóa tài khoản / Data Deletion Request&rdquo;</strong><br />
              • Nội dung: Ghi rõ tên shop hoặc email tài khoản Google cần xóa.<br />
              • Thời hạn xử lý: Ban quản trị Ti Coolture sẽ xác nhận phản hồi trong vòng <strong>02 ngày làm việc</strong> và tiến hành xóa vĩnh viễn dữ liệu tài khoản, danh sách sản phẩm và hình ảnh đính kèm khỏi hệ thống.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">8. Bảo mật thông tin</h3>
          <p>
            Mọi kết nối tới Ti Coolture đều được mã hóa theo tiêu chuẩn SSL/TLS (HTTPS). Quyền quản trị hệ thống áp dụng cơ chế xác thực đa yếu tố (2FA) và giới hạn quyền truy cập theo vai trò (Role-based access control).
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">9. Trẻ em</h3>
          <p>
            Ti Coolture là nền tảng văn hóa mở, phù hợp cho mọi lứa tuổi tìm hiểu sản phẩm sáng tạo. Tuy nhiên, tính năng đăng ký mở shop đối tác chỉ dành cho công dân từ 18 tuổi trở lên hoặc người dưới 18 tuổi có sự giám hộ và đồng ý hợp pháp của phụ huynh.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">10. Thông tin liên hệ</h3>
          <p>Mọi thắc mắc, phản ánh hoặc yêu cầu về quyền riêng tư, vui lòng liên hệ:</p>
          <ul className="list-none space-y-1 pl-0">
            <li><strong>Tên dự án:</strong> Ti Coolture</li>
            <li><strong>Website:</strong> <a href="https://ticoolture.vn" className="text-brand underline">https://ticoolture.vn</a></li>
            <li><strong>Email ban quản trị:</strong> <a href="mailto:creativespace.ticoolture@gmail.com" className="text-brand underline font-semibold">creativespace.ticoolture@gmail.com</a></li>
          </ul>
        </section>
      </article>

      {/* ========================================================================= */}
      {/* VẠCH PHÂN CÁCH NGÔN NGỮ                                                   */}
      {/* ========================================================================= */}
      <div className="relative py-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t-2 border-dashed border-ink/20"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-paper px-4 text-xs font-bold uppercase tracking-wider text-ink/50 border border-ink/10 rounded-full py-1">
            English Version Below
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PHIÊN BẢN TIẾNG ANH (CHUẨN GOOGLE OAUTH AUDIT)                            */}
      {/* ========================================================================= */}
      <article className="space-y-8">
        <header className="border-b border-ink/10 pb-4">
          <div className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand mb-2">
            English Version
          </div>
          <h2 className="display text-2xl md:text-3xl text-brand normal-case">
            Privacy Policy — Ti Coolture
          </h2>
          <p className="mt-1 text-xs text-ink/50">Last Updated: 2026 | Version 2.0</p>
        </header>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">1. Overview &amp; Identity</h3>
          <p>
            <strong>Ti Coolture</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), accessible at{" "}
            <a href="https://ticoolture.vn" className="text-brand underline hover:text-brand-deep">
              https://ticoolture.vn
            </a>
            , is a curated discovery platform for Vietnamese local brands, creative studios, and independent artists.
          </p>
          <p>
            Ti Coolture does not conduct direct sales, handle retail payments, or deliver goods. When users click on a product or store, they are directed to the respective merchant&apos;s official channels (e.g., Instagram, TikTok Shop, Shopee, Facebook, or dedicated brand website). All transactions occur on those external platforms under their own terms.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="font-bold text-lg md:text-xl text-ink">2. Information We Collect and How We Use It</h3>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-ink text-sm md:text-base">2.1. General Visitors:</h4>
            <p>
              When you browse Ti Coolture, technical server logs (anonymized IP address, user-agent string, operating system, and request timestamps) are processed strictly for website security, anti-abuse monitoring, and load performance.
            </p>
            <p>
              User actions such as saving favorite items or search history are stored locally on your device (via browser <code>localStorage</code>). Item favoriting and click tracking increment aggregate counters only and are not tied to your personal identity.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-semibold text-ink text-sm md:text-base">2.2. Partner Merchants &amp; Shop Owners (Google Sign-In):</h4>
            <p>
              To manage listings and verify merchant identity, shop owners authenticate using Google OAuth. Through the standard OAuth scopes (<code>openid</code>, <code>email</code>, <code>profile</code>), we collect:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Google Account Unique Identifier (sub)</li>
              <li>Primary email address</li>
              <li>Display name</li>
              <li>Profile photo URL</li>
            </ul>
            <p>
              <strong>Purpose of use:</strong> This data is used exclusively to authenticate shop owners, grant secure access to the merchant administration portal (Shop Portal), and associate verified catalog products with the rightful store owner.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">
            3. Google API Services User Data Policy &amp; Limited Use Disclosure
          </h3>
          <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 space-y-3">
            <p>
              Ti Coolture requests only non-sensitive, basic authentication scopes: <code>openid</code>, <code>email</code>, and <code>profile</code>. We do not access sensitive Google user data such as Gmail messages, Google Drive documents, contacts, or location data.
            </p>
            <p className="font-semibold text-brand">
              Google Limited Use Compliance Statement:
            </p>
            <p className="italic font-medium">
              &ldquo;Ti Coolture&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-brand-deep"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.&rdquo;
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm">
              <li>We do <strong>not</strong> sell, rent, or transfer Google user data to third parties for advertising, marketing, or general commercial gain.</li>
              <li>We do <strong>not</strong> use Google user data to serve targeted advertisements.</li>
              <li>We do <strong>not</strong> use or transfer Google user data to train generalized artificial intelligence (AI) or machine learning (ML) models.</li>
              <li>You may review or revoke Ti Coolture&apos;s access to your Google Account at any time via{" "}
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="underline font-medium">
                  Google Security Permissions
                </a>.
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">4. Cookies and Local Storage</h3>
          <p>
            Ti Coolture does not use tracking cookies for behavioral advertising or cross-site profiling. We use local browser storage (<code>localStorage</code>, <code>sessionStorage</code>) solely for essential application operations (saving bookmarked products, retaining active merchant portal login state, and caching view configurations). You may clear this data at any time through your browser settings.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">5. Third-Party Data Disclosures</h3>
          <p>
            We do not share your private personal information with third parties, except with verified infrastructure vendors necessary to deliver the application:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm">
            <li><strong>Vercel:</strong> Application hosting, edge delivery, and serverless compute.</li>
            <li><strong>Supabase:</strong> Managed database and authentication services.</li>
            <li><strong>Cloudflare R2:</strong> Storage for merchant product images.</li>
            <li><strong>Upstash Redis:</strong> In-memory caching for query performance.</li>
            <li><strong>Google LLC:</strong> Identity provider for Google Sign-In.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">6. Data Retention Policy</h3>
          <p>
            Technical server logs are retained for a maximum of 7 days before being automatically purged. Merchant profile and product catalog data are retained for the duration of the active partnership. If a merchant terminates their partnership or requests account deletion, all associated authentication records, profile details, and listings are permanently removed.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">
            7. Your Rights and Data Deletion Instructions
          </h3>
          <p>
            You have the right to access, rectify, restrict processing, or request the complete deletion of your personal data at any time.
          </p>
          <div className="rounded-xl bg-ink/5 p-4 space-y-2 mt-2">
            <h4 className="font-bold text-ink text-sm md:text-base">Data Deletion Instructions:</h4>
            <p>
              To request the permanent deletion of your account, store profile, and all associated data, please send an email from your registered Google email address to:{" "}
              <a href="mailto:creativespace.ticoolture@gmail.com" className="font-semibold text-brand underline">
                creativespace.ticoolture@gmail.com
              </a>
            </p>
            <p className="text-xs text-ink/70">
              • <strong>Subject Line:</strong> &ldquo;Data Deletion Request&rdquo; or &ldquo;Delete Account&rdquo;<br />
              • <strong>Information Needed:</strong> Your registered email address and shop name.<br />
              • <strong>Processing Timeframe:</strong> Our team will acknowledge your request within <strong>2 business days</strong> and complete the irrevocable deletion of your account and related records from our production database within 30 days in compliance with applicable law.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">8. Data Security</h3>
          <p>
            All communications are encrypted using Transport Layer Security (TLS/HTTPS). Administrative systems are protected with multi-factor authentication (MFA) and strict role-based access controls to safeguard data integrity and prevent unauthorized access.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">9. Children&apos;s Privacy</h3>
          <p>
            Ti Coolture is an open cultural discovery site. We do not knowingly collect personal information from children under the age of 13. Merchant accounts are restricted to individuals aged 18 and older, or those with explicit parental/guardian consent.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">10. Contact Information</h3>
          <p>For any inquiries regarding this Privacy Policy or your personal data, please contact:</p>
          <ul className="list-none space-y-1 pl-0">
            <li><strong>Project:</strong> Ti Coolture</li>
            <li><strong>Website:</strong> <a href="https://ticoolture.vn" className="text-brand underline">https://ticoolture.vn</a></li>
            <li><strong>Email:</strong> <a href="mailto:creativespace.ticoolture@gmail.com" className="text-brand underline font-semibold">creativespace.ticoolture@gmail.com</a></li>
          </ul>
        </section>
      </article>
    </div>
  );
}

export function TermsContent() {
  return (
    <div className="space-y-12 text-ink/80 text-sm md:text-base leading-relaxed">
      {/* ========================================================================= */}
      {/* PHIÊN BẢN TIẾNG VIỆT                                                      */}
      {/* ========================================================================= */}
      <article className="space-y-8">
        <header className="border-b border-ink/10 pb-4">
          <div className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand mb-2">
            Tiếng Việt
          </div>
          <h2 className="display text-2xl md:text-3xl text-brand normal-case">
            Điều khoản sử dụng — Ti Coolture
          </h2>
          <p className="mt-1 text-xs text-ink/50">Cập nhật lần cuối: 2026 | Phiên bản 2.0</p>
        </header>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">1. Tí Coolture là gì?</h3>
          <p>
            <strong>Ti Coolture</strong> (<a href="https://ticoolture.vn" className="text-brand underline hover:text-brand-deep">https://ticoolture.vn</a>) giúp người dùng khám phá thương hiệu thời trang, thiết kế sáng tạo và sản phẩm thủ công Việt Nam.
          </p>
          <p>
            Mỗi sản phẩm trên Ti Coolture dẫn tới kênh bán hàng chính thức của từng shop. Ti Coolture không nhận đơn hàng, không thu tiền và không vận chuyển hàng hóa. Giá bán, tình trạng tồn kho, chính sách bảo hành, đổi trả và giao hàng hoàn toàn do từng shop quyết định.
          </p>
          <p>
            Bằng việc sử dụng website Ti Coolture, bạn đồng ý tuân thủ các Điều khoản này và Chính sách quyền riêng tư của chúng tôi.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">2. Dành cho người xem (Khách truy cập)</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Bạn tự do khám phá toàn bộ nội dung trên Ti Coolture mà không bắt buộc tạo tài khoản.</li>
            <li>Danh sách sản phẩm yêu thích và các shop bạn theo dõi được lưu trữ trên bộ nhớ trình duyệt máy bạn (localStorage). Việc xóa dữ liệu trình duyệt có thể làm mất danh sách lưu này.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="font-bold text-lg md:text-xl text-ink">3. Dành cho Shop đối tác</h3>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-ink text-sm md:text-base">3.1. Quy trình tham gia:</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Shop gửi đơn đăng ký hợp tác tại trang <a href="/open-shop" className="text-brand underline font-medium">Đăng ký shop</a>.</li>
              <li>Ban quản trị Ti Coolture xét duyệt tính phù hợp về thương hiệu và văn hóa.</li>
              <li>Sau khi được phê duyệt, shop đăng nhập vào trang quản trị (Shop Portal) bằng tài khoản Google.</li>
              <li>Shop tạo bản nháp sản phẩm, cập nhật thông tin và hình ảnh. Nội dung chỉ hiển thị công khai khi ban quản trị Ti Coolture kiểm duyệt.</li>
            </ol>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-semibold text-ink text-sm md:text-base">3.2. Cam kết của shop:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Người đại diện đăng ký từ 18 tuổi trở lên, hoặc có sự đồng ý hợp pháp của người giám hộ, và có đầy đủ quyền đại diện cho shop.</li>
              <li>Cung cấp thông tin trung thực, chính xác và chủ động cập nhật khi có thay đổi (giá, kênh liên hệ, tình trạng kho).</li>
              <li>Sở hữu quyền hợp pháp đối với toàn bộ hình ảnh, logo, nội dung đăng tải; không vi phạm bản quyền hoặc sở hữu trí tuệ của bên thứ ba.</li>
              <li>Tự chịu trách nhiệm bảo mật tài khoản Google dùng để đăng nhập.</li>
            </ul>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-semibold text-ink text-sm md:text-base">3.3. Quyền đối với nội dung &amp; Chi phí:</h4>
            <p>
              Shop luôn là chủ sở hữu bản quyền đối với hình ảnh và nội dung của mình. Shop cấp cho Ti Coolture quyền phi độc quyền, miễn phí bản quyền để lưu trữ, hiển thị và quảng bá nội dung đó trên website Ti Coolture và các kênh truyền thông chính thức của Tí (Instagram, TikTok).
            </p>
            <p>
              Việc tham gia hiển thị trên Ti Coolture hiện tại là <strong>hoàn toàn miễn phí</strong>. Ti Coolture không thu phí hoa hồng trên các đơn hàng mua bán giữa khách hàng và shop.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">4. Hành vi nghiêm cấm</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Lừa đảo, mạo danh cá nhân, tổ chức hoặc thương hiệu khác.</li>
            <li>Đăng tải hình ảnh, sản phẩm hàng giả, hàng nhái, hàng vi phạm pháp luật hoặc thuần phong mỹ tục.</li>
            <li>Phát tán mã độc, tấn công từ chối dịch vụ (DDoS) hoặc can thiệp trái phép vào hệ thống của Ti Coolture.</li>
            <li>Sử dụng các công cụ tự động (scraping, crawl) để sao chép dữ liệu quy mô lớn mà không có sự đồng ý bằng văn bản từ Ti Coolture.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">5. Bản quyền &amp; Sở hữu trí tuệ</h3>
          <p>
            Nhãn hiệu, giao diện đồ họa, mã nguồn và các bài viết do Ti Coolture biên soạn thuộc quyền sở hữu của Ti Coolture. Nhãn hiệu, hình ảnh sản phẩm và nội dung của các shop thuộc quyền sở hữu của từng shop đối tác tương ứng.
          </p>
          <p>
            Nếu bạn phát hiện nội dung có dấu hiệu vi phạm bản quyền trên nền tảng, vui lòng liên hệ email <a href="mailto:creativespace.ticoolture@gmail.com" className="text-brand underline font-medium">creativespace.ticoolture@gmail.com</a> kèm bằng chứng để chúng tôi tiến hành gỡ bỏ kịp thời.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">6. Trách nhiệm &amp; Miễn trừ</h3>
          <p>
            Ti Coolture nỗ lực đảm bảo hệ thống vận hành liên tục, ổn định và các thông tin giới thiệu được chọn lọc kỹ lưỡng. Tuy nhiên, Ti Coolture không chịu trách nhiệm pháp lý đối với bất kỳ tranh chấp thương mại, chất lượng sản phẩm, thanh toán hay giao nhận hàng hóa giữa người mua và shop đối tác.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">7. Thay đổi điều khoản &amp; Luật áp dụng</h3>
          <p>
            Ti Coolture có quyền sửa đổi các Điều khoản này khi cần thiết. Các sửa đổi sẽ có hiệu lực kể từ ngày đăng tải trên website. Điều khoản này được điều chỉnh bởi pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">8. Liên hệ</h3>
          <p>
            Mọi ý kiến đóng góp, thắc mắc hoặc báo cáo vi phạm, vui lòng gửi email về:{" "}
            <a href="mailto:creativespace.ticoolture@gmail.com" className="text-brand underline font-semibold">
              creativespace.ticoolture@gmail.com
            </a>
          </p>
        </section>
      </article>

      {/* ========================================================================= */}
      {/* VẠCH PHÂN CÁCH NGÔN NGỮ                                                   */}
      {/* ========================================================================= */}
      <div className="relative py-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t-2 border-dashed border-ink/20"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-paper px-4 text-xs font-bold uppercase tracking-wider text-ink/50 border border-ink/10 rounded-full py-1">
            English Version Below
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PHIÊN BẢN TIẾNG ANH (TERMS OF SERVICE)                                    */}
      {/* ========================================================================= */}
      <article className="space-y-8">
        <header className="border-b border-ink/10 pb-4">
          <div className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand mb-2">
            English Version
          </div>
          <h2 className="display text-2xl md:text-3xl text-brand normal-case">
            Terms of Service — Ti Coolture
          </h2>
          <p className="mt-1 text-xs text-ink/50">Last Updated: 2026 | Version 2.0</p>
        </header>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">1. About Ti Coolture</h3>
          <p>
            <strong>Ti Coolture</strong> (<a href="https://ticoolture.vn" className="text-brand underline hover:text-brand-deep">https://ticoolture.vn</a>) is an online discovery hub showcasing Vietnamese local fashion brands, creative workshops, and independent creators.
          </p>
          <p>
            Ti Coolture does not sell products, collect transaction payments, or deliver goods. Every product featured redirects users to the respective shop&apos;s own channels. Product pricing, availability, returns, and fulfillment remain the sole responsibility of the individual shop.
          </p>
          <p>
            By accessing or using Ti Coolture, you acknowledge and agree to these Terms of Service and our Privacy Policy.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">2. For General Visitors</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>You can explore Ti Coolture freely without creating an account.</li>
            <li>Saved favorites and bookmarked stores are stored locally on your device browser (<code>localStorage</code>). Clearing your browser cache will reset your saved list.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="font-bold text-lg md:text-xl text-ink">3. For Partner Merchants &amp; Shop Owners</h3>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-ink text-sm md:text-base">3.1. Registration Process:</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Merchants submit an application via the <a href="/open-shop" className="text-brand underline font-medium">Partner Registration</a> page.</li>
              <li>Ti Coolture reviews brand curation and quality criteria.</li>
              <li>Upon approval, merchants log in to the merchant portal using Google Sign-In.</li>
              <li>Merchants create drafts and submit product listings. Content goes live only after Ti Coolture editorial review.</li>
            </ol>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-semibold text-ink text-sm md:text-base">3.2. Merchant Obligations:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Representatives must be at least 18 years old (or have authorized parental/guardian consent) with legal authority to represent the brand.</li>
              <li>All submitted business information, pricing, and contact details must be accurate and promptly maintained.</li>
              <li>Merchants warrant they hold all necessary intellectual property rights for submitted imagery, trademarks, and text.</li>
              <li>Merchants are responsible for maintaining the confidentiality and security of their Google credentials.</li>
            </ul>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-semibold text-ink text-sm md:text-base">3.3. Content Rights &amp; Fees:</h4>
            <p>
              Merchants retain full intellectual property ownership of their brand assets. By uploading content, merchants grant Ti Coolture a non-exclusive, royalty-free license to host, format, and display the assets on the platform and its official social media channels.
            </p>
            <p>
              Listing on Ti Coolture is currently <strong>100% free</strong>. Ti Coolture charges no commission on merchant transactions.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">4. Prohibited Conduct</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Impersonating another person, business, or trademark.</li>
            <li>Uploading counterfeit goods, copyright-infringing assets, or unlawful products.</li>
            <li>Engaging in denial-of-service attacks, malware transmission, or unauthorized systems access.</li>
            <li>Automated high-frequency scraping or commercial replication of Ti Coolture catalog data without prior written authorization.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">5. Intellectual Property</h3>
          <p>
            Ti Coolture brand assets, interface designs, original copywriting, and codebase are the proprietary property of Ti Coolture. Merchant logos, photographs, and trademarks remain the property of their respective owners.
          </p>
          <p>
            To report copyright infringements, please contact <a href="mailto:creativespace.ticoolture@gmail.com" className="text-brand underline font-medium">creativespace.ticoolture@gmail.com</a> with supporting ownership documentation.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">6. Disclaimers &amp; Limitation of Liability</h3>
          <p>
            Ti Coolture is provided on an &ldquo;as is&rdquo; basis. While we curate verified independent brands, Ti Coolture is not liable for commercial disputes, defective merchandise, shipping delays, or payment discrepancies between visitors and independent merchants.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">7. Governing Law</h3>
          <p>
            These Terms of Service are governed by and construed in accordance with the laws of the Socialist Republic of Vietnam.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-lg md:text-xl text-ink">8. Contact Us</h3>
          <p>
            For any questions or legal inquiries regarding these Terms, please contact:{" "}
            <a href="mailto:creativespace.ticoolture@gmail.com" className="text-brand underline font-semibold">
              creativespace.ticoolture@gmail.com
            </a>
          </p>
        </section>
      </article>
    </div>
  );
}

// Fallback component for existing imports (e.g. OpenShop modal)
interface PolicyContentProps {
  initialTab?: "privacy" | "terms";
  showTabs?: boolean;
}

export default function PolicyContent({
  initialTab = "terms",
  showTabs = true,
}: PolicyContentProps) {
  const [tab, setTab] = React.useState<"privacy" | "terms">(initialTab);

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
            Điều khoản sử dụng (Terms)
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
            Chính sách quyền riêng tư (Privacy)
          </button>
        </div>
      )}

      {tab === "privacy" ? <PrivacyContent /> : <TermsContent />}
    </div>
  );
}

import React, { useState } from "react";
import { X, Send, CheckCircle2, Store, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface PartnerApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PartnerApplyModal({ isOpen, onClose }: PartnerApplyModalProps) {
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [category, setCategory] = useState("Đồ gốm");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopName.trim() || !email.trim()) {
      setError("Vui lòng điền tên shop và email Google liên hệ.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const cleanEmail = email.toLowerCase().trim();

    // Enforce 1 Gmail = 1 Role: Không thể đăng ký làm Shop nếu đã là Admin hoặc đã có Shop
    if (supabase) {
      const { data: existingStaff } = await supabase
        .from("staff_members")
        .select("user_id")
        .eq("email", cleanEmail)
        .eq("is_active", true)
        .maybeSingle();

      if (existingStaff) {
        setError("Email này đã được đăng ký vai trò Ban Quản Trị (Admin). Mỗi Gmail chỉ được đăng ký 1 vai trò duy nhất.");
        setIsSubmitting(false);
        return;
      }

      const { data: existingShop } = await supabase
        .from("shop_invitations")
        .select("id")
        .eq("invited_email", cleanEmail)
        .maybeSingle();

      if (existingShop) {
        setError("Email này đã được cấp quyền quản lý cho một Shop. Mỗi Gmail chỉ được đăng ký 1 vai trò duy nhất.");
        setIsSubmitting(false);
        return;
      }
    }

    const payload = {
      shop_name: shopName.trim(),
      applicant_email: cleanEmail,
      applicant_name: name.trim() || null,
      phone_or_zalo: phone.trim() || null,
      social_link: socialLink.trim() || null,
      category,
      description: description.trim() || null,
      status: "pending",
    };

    try {
      if (supabase) {
        const { error: insertErr } = await supabase.from("partner_requests").insert(payload);
        if (insertErr) {
          console.warn("Supabase insert error, saving to local fallback:", insertErr);
        }
      }

      // Also save to localStorage fallback so Admin can see it locally
      const stored = JSON.parse(localStorage.getItem("ti_partner_requests") || "[]");
      stored.unshift({
        ...payload,
        id: `req-${Date.now()}`,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("ti_partner_requests", JSON.stringify(stored));

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi gửi hồ sơ.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#181224] border border-[#2e2344] rounded-2xl p-6 sm:p-8 text-[#faf8ff] shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#a39ab8] hover:text-white hover:bg-[#23173d] rounded-xl transition"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#23173d] border border-[#39d6cf]/50 flex items-center justify-center mx-auto text-[#39d6cf]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold text-white">
              Đã gửi hồ sơ mở shop thành công!
            </h3>
            <p className="text-sm text-[#a39ab8] leading-relaxed max-w-sm mx-auto">
              Cảm ơn bạn đã quan tâm. Ban quản trị Tí Coolture sẽ xem xét hồ sơ và gửi quyền truy cập Portal qua Gmail <strong className="text-white">{email}</strong>.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="py-2.5 px-6 bg-[#7520f7] hover:bg-[#5a12c6] text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition"
              >
                Đóng lại
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#23173d] border border-[#3b2a60] flex items-center justify-center text-[#39d6cf]">
                <Store className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-serif font-bold text-white">
                Đăng ký mở Shop trên Tí Coolture
              </h3>
            </div>
            <p className="text-xs text-[#a39ab8] mb-6 leading-relaxed">
              Dành cho các shop thủ công, local brand và nghệ nhân Việt. Mỗi tài khoản Gmail mở duy nhất 1 shop.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800/60 text-red-200 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#a39ab8] mb-1">
                    Tên Shop / Local Brand *
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Ví dụ: Gốm Mộc Chân"
                    className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#a39ab8] mb-1">
                    Email Google liên hệ *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doitac@gmail.com"
                    className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#a39ab8] mb-1">
                    Họ và tên nghệ nhân / Đại diện
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#a39ab8] mb-1">
                    Số Zalo / Điện thoại
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#a39ab8] mb-1">
                    Nhóm ngành chế tác
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                  >
                    <option value="Đồ gốm">Đồ gốm thủ công</option>
                    <option value="Đồ da & May mặc">Đồ da & May mặc</option>
                    <option value="Trang sức & Phụ kiện">Trang sức & Phụ kiện</option>
                    <option value="Trang trí & Đèn">Trang trí & Đèn</option>
                    <option value="Nến thơm & Dưỡng da">Nến thơm & Dưỡng da</option>
                    <option value="Mây tre & Gỗ">Mây tre & Gỗ</option>
                    <option value="Khác">Nhóm khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#a39ab8] mb-1">
                    Link Mạng Xã Hội (Instagram / TikTok)
                  </label>
                  <input
                    type="text"
                    value={socialLink}
                    onChange={(e) => setSocialLink(e.target.value)}
                    placeholder="instagram.com/tiemgom"
                    className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a39ab8] mb-1">
                  Mô tả sản phẩm & câu chuyện shop
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Chia sẻ ngắn về chất liệu thủ công, phong cách và các sản phẩm tiêu biểu của shop..."
                  rows={3}
                  className="w-full bg-[#12081f] border border-[#2e2344] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7520f7] transition resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-[#7520f7] hover:bg-[#5a12c6] text-white font-medium rounded-xl text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Sparkles className="w-4 h-4 animate-spin text-[#39d6cf]" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Gửi Hồ Sơ Mở Shop
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

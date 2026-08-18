import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { resetUserPassword, findUserByEmail } from "../lib/dbService";
import { Shield, ArrowRight, Sparkles, Store, Compass, Check, ChevronLeft } from "lucide-react";
import { ArcTopRight, RibbonLoop } from "../components/BrandShapes";

type AuthMode = "Select" | "UserForm" | "ShopForm";
type FormType = "Login" | "Signup" | "ForgotPassword" | "ResetPassword";

export default function AuthGateway() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshProfile, loginAsMockUser } = useAuth();

  const [mode, setMode] = useState<AuthMode>("Select");
  const [formType, setFormType] = useState<FormType>("Login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "shop") {
      setMode("ShopForm");
    } else if (urlMode === "user") {
      setMode("UserForm");
    }
  }, [searchParams]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const handleBackToSelect = () => {
    setMode("Select");
    setFormType("Login");
    resetForm();
  };

  const handleTestLogin = async (role: "User" | "Shop" | "Admin") => {
    setLoading(true);
    setError(null);
    try {
      const mockUid = role === "Admin" ? "admin_local" : role === "Shop" ? "shop_local" : "user_local";
      const mockEmail = role === "Admin" ? "admin@ticoolture.vn" : role === "Shop" ? "artisan@shop.vn" : "explorer@ticoolture.vn";
      const mockRole = role;

      if (loginAsMockUser) {
        await loginAsMockUser(mockUid, mockEmail, "password123", mockRole);
      } else {
        await refreshProfile();
      }

      if (role === "Shop") {
        navigate("/shop-dashboard");
      } else if (role === "Admin") {
        navigate("/user-profile");
      } else {
        navigate("/user-profile");
      }
    } catch (err: any) {
      console.error("Test login failed: ", err);
      setError("Không thể đăng nhập thử nghiệm.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (formType === "ForgotPassword") {
      if (!email) {
        setError("Vui lòng nhập địa chỉ email.");
        setLoading(false);
        return;
      }

      try {
        const existing = await findUserByEmail(email);
        if (!existing) {
          setError("Không tìm thấy tài khoản với email này.");
          setLoading(false);
          return;
        }

        setResetSent(true);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Không thể xử lý yêu cầu đặt lại mật khẩu.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (formType === "ResetPassword") {
      if (!password || !confirmPassword) {
        setError("Vui lòng nhập mật khẩu mới.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Mật khẩu xác nhận không khớp.");
        setLoading(false);
        return;
      }

      try {
        await resetUserPassword(resetEmail, password);
        setResetSuccess(true);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Không thể đặt lại mật khẩu.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (formType === "Signup" && password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      setLoading(false);
      return;
    }

    try {
      const mockUid = `usr_${Date.now()}`;
      if (formType === "Login") {
        const userData = await findUserByEmail(email);
        if (!userData) {
          setError("Không tìm thấy tài khoản. Vui lòng kiểm tra lại email.");
          setLoading(false);
          return;
        }
        if (userData.password && userData.password !== password) {
          setError("Mật khẩu không chính xác.");
          setLoading(false);
          return;
        }

        if (loginAsMockUser) {
          await loginAsMockUser(userData.id, userData.email, password, userData.role);
        } else {
          await refreshProfile();
        }

        if (mode === "ShopForm" || userData.role === "Shop") {
          navigate("/shop-dashboard");
        } else {
          navigate("/user-profile");
        }
      } else {
        let registerEmail = email;
        if (mode === "ShopForm" && !email.endsWith("@shop.vn") && !email.includes("@")) {
          setError("Tài khoản shop yêu cầu email hợp lệ.");
          setLoading(false);
          return;
        }

        const existing = await findUserByEmail(registerEmail);
        if (existing) {
          setError("Email này đã được đăng ký. Vui lòng đăng nhập.");
          setLoading(false);
          return;
        }

        if (loginAsMockUser) {
          await loginAsMockUser(mockUid, registerEmail, password, mode === "ShopForm" ? "Shop" : "User");
        } else {
          await refreshProfile();
        }

        if (mode === "ShopForm") {
          navigate("/shop-dashboard");
        } else {
          navigate("/user-profile");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Xác thực thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90dvh] bg-paper-warm flex items-center justify-center p-4 md:p-8 relative overflow-hidden select-none">
      
      {/* Brand Shapes background decoration */}
      <ArcTopRight
        className="pointer-events-none absolute -right-20 -top-20 z-0 opacity-15"
        style={{ width: "clamp(16rem, 36vw, 30rem)" }}
        fill="var(--color-wave)"
      />
      <RibbonLoop
        className="pointer-events-none absolute -left-20 -bottom-20 z-0 opacity-15"
        style={{ width: "clamp(16rem, 36vw, 30rem)" }}
        ribbon="var(--color-wave)"
        dot="var(--color-paper)"
      />

      <div className="relative z-10 w-full max-w-4xl">
        
        {/* ============ MODE: SELECT DOORWAY ============ */}
        {mode === "Select" ? (
          <div className="space-y-8">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5" /> Không gian văn hoá & phong cách
              </span>
              <h1 className="display text-3xl md:text-5xl normal-case font-medium leading-tight text-ink">
                Chào mừng tới Tí Coolture
              </h1>
              <p className="text-xs md:text-sm text-ink/75 leading-relaxed">
                Chọn không gian trải nghiệm phù hợp với hành trình của bạn tại Tí.
              </p>
            </div>

            {/* DOUBLE-BEZEL SPLIT DOORWAY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: Taste Hunter */}
              <div className="p-2 rounded-[2.5rem] bg-black/5 ring-1 ring-black/5 hover:-translate-y-1 hover:shadow-2xl transition-all duration-500">
                <div 
                  onClick={() => {
                    setMode("UserForm");
                    setFormType("Login");
                    resetForm();
                  }}
                  className="group bg-paper text-ink rounded-[2.125rem] p-6 md:p-8 border border-ink/5 cursor-pointer flex flex-col justify-between space-y-6 h-full"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand grid place-items-center">
                      <Compass className="w-6 h-6" />
                    </div>
                    <span className="label text-wave-ink font-semibold text-xs block">DÀNH CHO NGƯỜI YÊU NGHỆ THUẬT</span>
                    <h2 className="display text-2xl font-medium text-ink normal-case leading-tight">
                      Khám phá & Lưu tác phẩm
                    </h2>
                    <p className="text-xs text-ink/75 leading-relaxed">
                      Theo dõi các xưởng chế tác yêu thích, lưu danh sách sản phẩm độc bản và nhận thông báo khi có bộ sưu tập mới.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-ink/10 flex items-center justify-between">
                    <span className="text-xs font-semibold text-brand">Vào không gian khám phá</span>
                    <div className="w-8 h-8 rounded-full bg-brand text-paper grid place-items-center group-hover:translate-x-1 transition-transform">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Artisan Studio */}
              <div className="p-2 rounded-[2.5rem] bg-brand text-paper ring-1 ring-white/10 hover:-translate-y-1 hover:shadow-2xl transition-all duration-500 shadow-lg">
                <div 
                  onClick={() => {
                    setMode("ShopForm");
                    setFormType("Login");
                    resetForm();
                  }}
                  className="group bg-brand-deep rounded-[2.125rem] p-6 md:p-8 border border-white/15 cursor-pointer flex flex-col justify-between space-y-6 h-full"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-wave/20 text-wave grid place-items-center">
                      <Store className="w-6 h-6" />
                    </div>
                    <span className="label text-wave font-semibold text-xs block">DÀNH CHO XƯỞNG & NGHỆ NHÂN</span>
                    <h2 className="display text-2xl font-medium text-paper normal-case leading-tight">
                      Không gian Xưởng sáng tạo
                    </h2>
                    <p className="text-xs text-white/80 leading-relaxed">
                      Đăng tải tác phẩm, chia sẻ triết lý chế tác và kết nối với cộng đồng những người trân trọng giá trị bản địa.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/15 flex items-center justify-between">
                    <span className="text-xs font-semibold text-wave">Đăng nhập chủ xưởng</span>
                    <div className="w-8 h-8 rounded-full bg-wave text-ink grid place-items-center group-hover:translate-x-1 transition-transform">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Double-Bezel Test Credentials Utility */}
            <div className="p-1.5 rounded-[2rem] bg-black/5 ring-1 ring-black/5">
              <div className="rounded-[1.625rem] bg-paper p-5 text-center space-y-3 border border-ink/5">
                <p className="label text-ink/70 font-semibold">
                  ⚡ Đăng nhập nhanh để trải nghiệm (1-Click Demo):
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => handleTestLogin("User")}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-full border border-ink/10 text-xs font-semibold text-ink bg-paper-warm hover:bg-brand hover:text-paper transition-all shadow-xs"
                  >
                    👤 Người dùng mẫu (Explorer)
                  </button>
                  <button
                    onClick={() => handleTestLogin("Shop")}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-full border border-ink/10 text-xs font-semibold text-ink bg-paper-warm hover:bg-brand hover:text-paper transition-all shadow-xs"
                  >
                    🏪 Chủ xưởng mẫu (Artisan)
                  </button>
                  <button
                    onClick={() => handleTestLogin("Admin")}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-full bg-brand text-paper text-xs font-semibold hover:bg-brand-deep transition-all shadow-md shadow-brand/20"
                  >
                    🛡️ Quản trị viên (Admin)
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          
          /* ============ MODE: FORM CARD ============ */
          <div className="max-w-md mx-auto p-2 rounded-[2.5rem] bg-black/5 ring-1 ring-black/5 shadow-2xl">
            <div className="bg-paper text-ink rounded-[2.125rem] p-6 md:p-8 border border-ink/5 space-y-6">
              
              {/* Top bar with back button */}
              <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                <button
                  onClick={handleBackToSelect}
                  className="inline-flex items-center gap-1 text-xs text-ink/60 hover:text-brand transition-colors font-semibold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Quay lại</span>
                </button>

                <span className="label text-wave-ink text-[10px] font-semibold">
                  {mode === "ShopForm" ? "Xưởng sáng tạo" : "Người khám phá"}
                </span>
              </div>

              <div>
                <h2 className="display text-2xl normal-case font-medium text-ink">
                  {formType === "Login" && "Đăng nhập tài khoản"}
                  {formType === "Signup" && "Tạo tài khoản mới"}
                  {formType === "ForgotPassword" && "Quên mật khẩu"}
                  {formType === "ResetPassword" && "Đặt lại mật khẩu"}
                </h2>
                <p className="text-xs text-ink/60 mt-1">
                  {mode === "ShopForm" ? "Không gian quản lý tác phẩm và thông tin xưởng" : "Lưu trữ bộ sưu tập và tác phẩm yêu thích của bạn"}
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                  {error}
                </div>
              )}

              {formType === "ForgotPassword" ? (
                resetSent ? (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 p-5 text-xs space-y-3">
                    <p className="font-semibold text-emerald-800">✓ Đã gửi yêu cầu đặt lại</p>
                    <p>Yêu cầu đã được khởi tạo cho email <strong>{email}</strong>.</p>

                    <button
                      onClick={() => {
                        setResetEmail(email);
                        setFormType("ResetPassword");
                        setResetSent(false);
                      }}
                      className="w-full text-center rounded-full bg-emerald-600 text-white p-3 font-semibold text-xs hover:bg-emerald-700 transition-all shadow-xs"
                    >
                      Nhập mật khẩu mới
                    </button>

                    <button
                      onClick={() => { setFormType("Login"); resetForm(); setResetSent(false); }}
                      className="mt-2 block text-xs underline text-ink/60 hover:text-ink text-center"
                    >
                      ← Quay lại đăng nhập
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block label text-ink/70 font-semibold mb-1">
                        Địa chỉ Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="explorer@email.com"
                        className="w-full rounded-full border border-ink/10 px-4 py-3 bg-paper-warm focus:bg-paper focus:ring-2 focus:ring-brand/20 outline-none"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-full bg-brand text-paper py-3 px-6 font-semibold text-xs hover:bg-brand-deep transition-all flex items-center justify-center gap-2 shadow-md shadow-brand/20"
                    >
                      {loading ? "Đang xử lý..." : "Gửi yêu cầu đặt lại mật khẩu"}
                    </button>
                  </form>
                )
              ) : formType === "ResetPassword" ? (
                resetSuccess ? (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 p-5 text-xs space-y-3">
                    <p className="font-semibold text-emerald-800">✓ Đã cập nhật mật khẩu mới</p>
                    <p>Mật khẩu của bạn đã được cập nhật thành công.</p>
                    <button
                      onClick={() => { setFormType("Login"); resetForm(); setResetSuccess(false); }}
                      className="w-full rounded-full bg-brand text-paper py-3 font-semibold text-xs hover:bg-brand-deep transition-all"
                    >
                      Đăng nhập ngay
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block label text-ink/70 font-semibold mb-1">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-full border border-ink/10 px-4 py-3 bg-paper-warm focus:bg-paper focus:ring-2 focus:ring-brand/20 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block label text-ink/70 font-semibold mb-1">
                        Xác nhận mật khẩu
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-full border border-ink/10 px-4 py-3 bg-paper-warm focus:bg-paper focus:ring-2 focus:ring-brand/20 outline-none"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-full bg-brand text-paper py-3 px-6 font-semibold text-xs hover:bg-brand-deep transition-all shadow-md shadow-brand/20"
                    >
                      {loading ? "Đang lưu..." : "Xác nhận mật khẩu mới"}
                    </button>
                  </form>
                )
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block label text-ink/70 font-semibold mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={mode === "ShopForm" ? "artisan@shop.vn" : "explorer@email.com"}
                      className="w-full rounded-full border border-ink/10 px-4 py-3 bg-paper-warm focus:bg-paper focus:ring-2 focus:ring-brand/20 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block label text-ink/70 font-semibold">
                        Mật khẩu
                      </label>
                      {formType === "Login" && (
                        <button
                          type="button"
                          onClick={() => { setFormType("ForgotPassword"); setError(null); }}
                          className="text-[11px] text-brand hover:underline"
                        >
                          Quên mật khẩu?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-full border border-ink/10 px-4 py-3 bg-paper-warm focus:bg-paper focus:ring-2 focus:ring-brand/20 outline-none"
                      required
                    />
                  </div>

                  {formType === "Signup" && (
                    <div>
                      <label className="block label text-ink/70 font-semibold mb-1">
                        Xác nhận mật khẩu
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-full border border-ink/10 px-4 py-3 bg-paper-warm focus:bg-paper focus:ring-2 focus:ring-brand/20 outline-none"
                        required
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-full bg-brand text-paper py-3.5 px-6 font-semibold text-xs hover:bg-brand-deep transition-all flex items-center justify-center gap-2 shadow-md shadow-brand/20 hover:scale-[1.02] active:scale-98"
                  >
                    {loading ? (
                      <span>Đang xác thực...</span>
                    ) : (
                      <>
                        <span>{formType === "Login" ? "Đăng nhập" : "Đăng ký tài khoản"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Switch between Login and Signup */}
              <div className="pt-2 text-center text-xs text-ink/60">
                {formType === "Login" ? (
                  <p>
                    Chưa có tài khoản?{" "}
                    <button
                      onClick={() => {
                        setFormType("Signup");
                        setError(null);
                      }}
                      className="font-semibold text-brand hover:underline"
                    >
                      Đăng ký ngay
                    </button>
                  </p>
                ) : (
                  <p>
                    Đã có tài khoản?{" "}
                    <button
                      onClick={() => {
                        setFormType("Login");
                        setError(null);
                      }}
                      className="font-semibold text-brand hover:underline"
                    >
                      Đăng nhập
                    </button>
                  </p>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}

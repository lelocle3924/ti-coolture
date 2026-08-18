import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { resetUserPassword, findUserByEmail } from "../lib/dbService";
import { Shield, ArrowRight, Sparkles, Store, Compass } from "lucide-react";

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
    const actionMode = searchParams.get("mode");
    const actionEmail = searchParams.get("email");
    if (actionMode === "ResetPassword" && actionEmail) {
      setMode("UserForm");
      setFormType("ResetPassword");
      setResetEmail(actionEmail);
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
    resetForm();
  };

  const handleTestLogin = async (role: "Admin" | "Shop" | "User") => {
    setLoading(true);
    setError(null);
    let testEmail = "";

    if (role === "Admin") {
      testEmail = "admin@ticoolture.vn";
    } else if (role === "Shop") {
      testEmail = "testshop@shop.vn";
    } else {
      testEmail = "explorer@user.vn";
    }

    const mockUid = "mock_" + testEmail.replace(/[^a-zA-Z0-9]/g, "_");

    try {
      if (loginAsMockUser) {
        await loginAsMockUser(mockUid, testEmail, "mockpassword");
      } else {
        await refreshProfile();
      }

      if (role === "Shop") {
        navigate("/shop-dashboard");
      } else if (role === "Admin") {
        navigate("/shop-dashboard");
      } else {
        navigate("/user-profile");
      }
    } catch (err: any) {
      console.error("Test login failed: ", err);
      setError("Failed to execute quick login.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
        setError("Vui lòng nhập và xác nhận mật khẩu mới.");
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

    if (!email || !password) {
      setError("Vui lòng điền đầy đủ thông tin đăng nhập.");
      setLoading(false);
      return;
    }

    const mockUid = "mock_" + email.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");

    try {
      if (formType === "Login") {
        const userData = await findUserByEmail(email);
        if (!userData) {
          setError("Không tìm thấy tài khoản. Vui lòng đăng ký.");
          setLoading(false);
          return;
        }

        if (userData.password && userData.password !== password) {
          setError("Email hoặc mật khẩu không chính xác.");
          setLoading(false);
          return;
        }

        if (loginAsMockUser) {
          await loginAsMockUser(userData.id || mockUid, email, password);
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
          await loginAsMockUser(mockUid, registerEmail, password);
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
    <div className="min-h-[80vh] bg-paper-warm flex items-center justify-center px-4 py-16 select-none">
      <div className="w-full max-w-lg bg-paper rounded-3xl border border-ink/10 shadow-[0_20px_50px_rgba(117,32,247,0.08)] p-6 md:p-10 space-y-6">
        
        {/* Step 1: Mode Selection Gateway */}
        {mode === "Select" && (
          <div className="space-y-6">
            <div className="text-center space-y-2 pb-5 border-b border-ink/5">
              <span className="inline-flex items-center gap-1 rounded-full bg-wave/20 px-3 py-0.5 text-xs font-semibold text-wave-ink">
                <Sparkles className="w-3 h-3" /> Cổng kết nối Tí Coolture
              </span>
              <h1 className="display text-2xl md:text-3xl normal-case text-ink mt-2">
                Chọn vai trò của bạn
              </h1>
              <p className="text-xs text-ink/60">
                Đăng nhập để lưu tác phẩm yêu thích hoặc quản lý boutique nghệ thuật
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* User Option */}
              <button
                onClick={() => {
                  setMode("UserForm");
                  setFormType("Login");
                }}
                className="group rounded-2xl border border-ink/10 p-5 text-left bg-paper-warm hover:bg-brand hover:text-paper transition-all duration-200 flex items-start gap-4 shadow-xs"
              >
                <div className="p-3 rounded-xl bg-paper text-brand group-hover:bg-white/20 group-hover:text-paper transition-colors shrink-0">
                  <Compass className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">
                    Người khám phá (Cultural Explorer)
                  </h3>
                  <p className="text-xs text-ink/65 group-hover:text-white/80 mt-1 leading-relaxed">
                    Khám phá đồ thủ công, lưu danh sách wishlist, theo dõi lộ trình và ghi chú riêng.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 self-center text-ink/40 group-hover:text-paper group-hover:translate-x-1 transition-all" />
              </button>

              {/* Shop Option */}
              <button
                onClick={() => {
                  setMode("ShopForm");
                  setFormType("Login");
                }}
                className="group rounded-2xl border border-ink/10 p-5 text-left bg-paper-warm hover:bg-brand hover:text-paper transition-all duration-200 flex items-start gap-4 shadow-xs"
              >
                <div className="p-3 rounded-xl bg-paper text-brand group-hover:bg-white/20 group-hover:text-paper transition-colors shrink-0">
                  <Store className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">
                    Nghệ nhân & Local Shop
                  </h3>
                  <p className="text-xs text-ink/65 group-hover:text-white/80 mt-1 leading-relaxed">
                    Đăng ký thương hiệu, quản lý tác phẩm trưng bày, kết nối kênh mạng xã hội.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 self-center text-ink/40 group-hover:text-paper group-hover:translate-x-1 transition-all" />
              </button>
            </div>

            {/* Test Credentials Utility */}
            <div className="rounded-2xl border border-dashed border-ink/15 p-5 bg-paper-warm space-y-3">
              <p className="label text-ink/60 font-semibold text-center">
                ⚡ Đăng nhập nhanh để trải nghiệm (Demo)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleTestLogin("User")}
                  disabled={loading}
                  className="px-3 py-2 rounded-xl border border-ink/10 text-xs font-semibold text-ink bg-paper hover:bg-wave hover:text-ink transition-all shadow-xs"
                >
                  {loading ? "..." : "Khách xem"}
                </button>
                <button
                  onClick={() => handleTestLogin("Shop")}
                  disabled={loading}
                  className="px-3 py-2 rounded-xl border border-ink/10 text-xs font-semibold text-ink bg-paper hover:bg-wave hover:text-ink transition-all shadow-xs"
                >
                  {loading ? "..." : "Chủ shop"}
                </button>
                <button
                  onClick={() => handleTestLogin("Admin")}
                  disabled={loading}
                  className="px-3 py-2 rounded-xl border border-ink/10 text-xs font-semibold text-ink bg-paper hover:bg-wave hover:text-ink transition-all shadow-xs"
                >
                  {loading ? "..." : "Quản trị"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Form */}
        {mode !== "Select" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-ink/5">
              <div>
                <button
                  onClick={handleBackToSelect}
                  className="label text-ink/50 hover:text-brand transition-colors"
                >
                  ← Quay lại
                </button>
                <h2 className="display text-xl normal-case text-ink mt-1">
                  {formType === "ForgotPassword" ? "Đặt lại mật khẩu" : formType === "ResetPassword" ? "Mật khẩu mới" : (mode === "ShopForm" ? "Cổng thông tin Shop" : "Cổng thông tin Khách")}
                </h2>
              </div>
              
              {(formType === "Login" || formType === "Signup") && (
                <div className="flex rounded-full bg-paper-warm p-1 border border-ink/5 text-xs font-semibold">
                  <button
                    onClick={() => { setFormType("Login"); setError(null); }}
                    className={`px-3 py-1 rounded-full transition-all ${
                      formType === "Login" ? "bg-brand text-paper shadow-xs" : "text-ink/60 hover:text-ink"
                    }`}
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => { setFormType("Signup"); setError(null); }}
                    className={`px-3 py-1 rounded-full transition-all ${
                      formType === "Signup" ? "bg-brand text-paper shadow-xs" : "text-ink/60 hover:text-ink"
                    }`}
                  >
                    Đăng ký
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-3 text-xs">
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
                    className="w-full text-center rounded-xl bg-emerald-600 text-white p-2.5 font-semibold text-xs hover:bg-emerald-700 transition-all shadow-xs"
                  >
                    Chuyển đến màn hình nhập mật khẩu mới
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
                      className="w-full rounded-xl border border-ink/10 p-3 bg-paper-warm focus:bg-paper focus:ring-2 focus:ring-brand/20 outline-none"
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
                    className="w-full rounded-full bg-brand text-paper py-2.5 font-semibold text-xs hover:bg-brand-deep transition-all"
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
                      className="w-full rounded-xl border border-ink/10 p-3 bg-paper-warm focus:bg-paper focus:ring-2 focus:ring-brand/20 outline-none"
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
                      className="w-full rounded-xl border border-ink/10 p-3 bg-paper-warm focus:bg-paper focus:ring-2 focus:ring-brand/20 outline-none"
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
                    className="w-full rounded-xl border border-ink/10 p-3 bg-paper-warm focus:bg-paper focus:ring-2 focus:ring-brand/20 outline-none"
                    required
                  />
                  {mode === "ShopForm" && formType === "Signup" && (
                    <p className="text-[11px] text-ink/60 mt-1">
                      * Mẹo: Dùng email có đuôi <code className="bg-paper-warm px-1 rounded font-semibold text-brand">@shop.vn</code> để tự động kích hoạt tài khoản shop.
                    </p>
                  )}
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
                    className="w-full rounded-xl border border-ink/10 p-3 bg-paper-warm focus:bg-paper focus:ring-2 focus:ring-brand/20 outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-brand text-paper py-3 px-6 font-semibold text-xs hover:bg-brand-deep transition-all flex items-center justify-center gap-2 shadow-md shadow-brand/20 hover:scale-[1.02] active:scale-98"
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
          </div>
        )}

      </div>
    </div>
  );
}

/**
 * Đăng ký mở shop — /open-shop
 *
 * Chosen 26/08 out of the three sign-up studies: the letter.
 *
 * The team's note was that "Đăng ký mở shop" must stop sending shop owners to
 * the auth gateway. Registering interest is not signing in — there is no
 * account to create, no password to choose, and nothing on the site changes
 * for the person filling it in. Tí reads each one by hand and replies by
 * email; nothing is published automatically, which is what keeps the
 * catalogue curated.
 *
 * The form is a paragraph with blanks in it rather than a stack of fields.
 * Two consequences worth knowing: the visible labels are gone, so every blank
 * carries an aria-label instead, and the sentences wrap a lot at 390px — both
 * checked, both acceptable, neither free.
 */

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Send, Sparkles, X } from "lucide-react";
import { triggerWebhook } from "../lib/dbService";
import { NO_TRANSACTION } from "../lib/continuity";
import { supabase } from "../lib/supabaseClient";
import PolicyContent from "../components/PolicyContent";

/* ── the submission, shared ─────────────────────────────────────────────── */

export interface SignupFields {
  shopName: string;
  contactName: string;
  email: string;
  phone: string;
  area: string;
  channel: string;
  makes: string;
  links: string;
}

const EMPTY: SignupFields = {
  shopName: "",
  contactName: "",
  email: "",
  phone: "",
  area: "",
  channel: "",
  makes: "",
  links: "",
};

const LABELS: Record<keyof SignupFields, string> = {
  shopName: "Tên shop",
  contactName: "Người phụ trách",
  email: "Email",
  phone: "Số điện thoại",
  area: "Khu vực",
  channel: "Kênh đang bán",
  makes: "Shop làm gì",
  links: "Đường dẫn ảnh sản phẩm",
};

const REQUIRED: Array<keyof SignupFields> = ["shopName", "contactName", "email", "phone", "makes"];

function validate(v: SignupFields, only?: Array<keyof SignupFields>) {
  const errors: Partial<Record<keyof SignupFields, string>> = {};
  const check = (k: keyof SignupFields) => !only || only.includes(k);

  for (const k of REQUIRED) {
    if (check(k) && !v[k].trim()) errors[k] = "Chưa điền";
  }
  if (check("email") && v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim()))
    errors.email = "Email chưa đúng dạng";
  if (check("phone") && v.phone.trim() && !/^(\+?84|0)\d{8,10}$/.test(v.phone.replace(/[\s.-]/g, "")))
    errors.phone = "Số điện thoại chưa đúng dạng";
  return errors;
}

function useSignup() {
  const [values, setValues] = useState<SignupFields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFields, string>>>({});
  const [sent, setSent] = useState(false);

  const set = (k: keyof SignupFields, v: string) => {
    setValues((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  };

  const submit = async (only?: Array<keyof SignupFields>) => {
    const found = validate(values, only);
    const cleanEmail = values.email.trim().toLowerCase();

    if (cleanEmail && (!only || only.includes("email"))) {
      if (supabase) {
        try {
          const { data: staff } = await supabase
            .from("staff_members")
            .select("user_id")
            .eq("email", cleanEmail)
            .eq("is_active", true)
            .maybeSingle();

          if (staff) {
            found.email = "Email này đã thuộc Ban Quản Trị (Admin). Mỗi Gmail chỉ được đăng ký 1 vai trò duy nhất.";
          }

          const { data: existingShop } = await supabase
            .from("shop_invitations")
            .select("id")
            .eq("invited_email", cleanEmail)
            .maybeSingle();

          if (existingShop) {
            found.email = "Email này đã được cấp quyền quản lý cho một Shop. Mỗi Gmail chỉ được mở 1 shop duy nhất.";
          }
        } catch (e) {
          console.warn("OpenShop role check error:", e);
        }
      }
    }

    setErrors(found);
    if (Object.keys(found).length) return false;

    // Persist to Supabase partner_requests & localStorage for Admin review
    try {
      const payload = {
        shop_name: values.shopName.trim(),
        applicant_email: cleanEmail,
        applicant_name: values.contactName.trim() || null,
        phone_or_zalo: values.phone.trim() || null,
        social_link: values.channel.trim() || null,
        category: values.area.trim() || "Chung",
        description: (values.makes + (values.links ? ` - Ảnh: ${values.links}` : "")).trim() || null,
        status: "pending",
      };

      if (supabase) {
        await supabase.from("partner_requests").insert(payload);
      }

      const stored = JSON.parse(localStorage.getItem("ti_partner_requests") || "[]");
      stored.unshift({
        ...payload,
        id: `req-${Date.now()}`,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("ti_partner_requests", JSON.stringify(stored));
    } catch (e) {
      console.warn("Failed to persist partner request:", e);
    }

    triggerWebhook("SHOP_SIGNUP_SUBMITTED", { ...values, timestamp: new Date().toISOString() });
    setSent(true);
    return true;
  };

  return { values, set, errors, setErrors, sent, submit };
}

const AREA_HINTS = [
  "Quận 1",
  "Quận 3",
  "Chợ Lớn",
  "Bình Thạnh",
  "Gò Vấp",
  "Tân Bình",
  "Thủ Đức",
  "Hà Nội",
  "Đà Nẵng",
  "Hội An",
  "Đà Lạt",
  "Khác",
];

function Sent({ tone = "ink" }: { values?: SignupFields; tone?: "ink" | "paper" }) {
  const muted = tone === "paper" ? "text-white/70" : "text-ink/65";
  return (
    <div
      className={`mx-auto max-w-md space-y-6 rounded-[2rem] border p-8 md:p-10 shadow-2xl text-center transition-all duration-700 animate-in fade-in zoom-in-95 ${
        tone === "paper" ? "border-white/25 bg-brand-deep/90 text-paper" : "border-ink/10 bg-paper text-ink"
      }`}
    >
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl shadow-md transition-transform duration-500 animate-bounce bg-wave text-ink">
        <Check className="h-8 w-8 stroke-[3]" />
      </div>
      <div>
        <span className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand">
          <Sparkles className="h-3.5 w-3.5 text-wave" /> Gửi thành công!
        </span>
        <h2 className="display text-2xl normal-case md:text-3xl mt-1">Đã đăng ký thành công</h2>
        <p className={`mt-3 text-sm leading-relaxed ${muted}`}>
          Tí đã nhận được đơn mở shop của bạn và sẽ liên hệ phản hồi sớm nhất.
        </p>
      </div>
      <div className="pt-2">
        <Link
          to="/stores"
          viewTransition
          className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold shadow-sm transition-transform hover:scale-105 ${
            tone === "paper" ? "bg-wave text-ink" : "bg-brand text-paper"
          }`}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Về danh bạ shop
        </Link>
      </div>
    </div>
  );
}

function Field({
  name,
  values,
  errors,
  set,
  type = "text",
  placeholder,
  hint,
  list,
  rows,
}: {
  name: keyof SignupFields;
  values: SignupFields;
  errors: Partial<Record<keyof SignupFields, string>>;
  set: (k: keyof SignupFields, v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  list?: string;
  rows?: number;
}) {
  const id = `f-${name}`;
  const err = errors[name];
  const required = REQUIRED.includes(name);

  return (
    <p className="space-y-1.5">
      <label htmlFor={id} className="label block text-ink/55">
        {LABELS[name]}
        {required && <span className="text-brand"> *</span>}
      </label>
      {rows ? (
        <textarea
          id={id}
          rows={rows}
          value={values[name]}
          onChange={(e) => set(name, e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!err}
          aria-describedby={err ? `${id}-e` : undefined}
          className={`ti-field resize-y ${err ? "border-brand" : ""}`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={values[name]}
          onChange={(e) => set(name, e.target.value)}
          placeholder={placeholder}
          list={list}
          aria-invalid={!!err}
          aria-describedby={err ? `${id}-e` : undefined}
          className={`ti-field ${err ? "border-brand" : ""}`}
        />
      )}
      {err ? (
        <span id={`${id}-e`} className="block text-[11px] font-medium text-brand">
          {err}
        </span>
      ) : hint ? (
        <span className="block text-[11px] text-ink/45">{hint}</span>
      ) : null}
    </p>
  );
}

function AreaList() {
  return (
    <datalist id="areas">
      {AREA_HINTS.map((a) => (
        <option key={a} value={a} />
      ))}
    </datalist>
  );
}

function Blank({
  name,
  values,
  set,
  errors,
  width,
  placeholder,
  type = "text",
}: {
  name: keyof SignupFields;
  values: SignupFields;
  set: (k: keyof SignupFields, v: string) => void;
  errors: Partial<Record<keyof SignupFields, string>>;
  width: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={values[name]}
      onChange={(e) => set(name, e.target.value)}
      placeholder={placeholder}
      aria-label={LABELS[name]}
      aria-invalid={!!errors[name]}
      style={{ width }}
      className={`ti-blank ${errors[name] ? "border-brand bg-brand/10" : ""}`}
    />
  );
}

export default function OpenShop() {
  const { values, set, errors, sent, submit } = useSignup();
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const missing = useMemo(
    () => Object.entries(errors).filter(([, v]) => !!v).map(([k]) => LABELS[k as keyof SignupFields]),
    [errors]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) {
      setTermsError(true);
      return;
    }
    await submit();
  };

  return (
    <div data-surface="light" className="min-h-[100dvh] bg-paper-warm text-ink">
      <AreaList />

      <div className="mx-auto max-w-3xl px-5 py-12 md:py-20">
        {sent ? (
          <Sent values={values} />
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <h1 className="display text-3xl normal-case md:text-5xl text-brand">
              Dear Tí Coolture,
            </h1>

            <div className="mt-10 space-y-7 text-lg leading-[2.6] md:text-xl md:leading-[2.8]">
              <p>
                Mình là{" "}
                <Blank
                  name="contactName"
                  values={values}
                  set={set}
                  errors={errors}
                  width="14ch"
                  placeholder="tên bạn"
                />
                , email mình qua{" "}
                <Blank
                  name="email"
                  type="email"
                  values={values}
                  set={set}
                  errors={errors}
                  width="18ch"
                  placeholder="email của bạn"
                />{" "}
                hoặc gọi số{" "}
                <Blank
                  name="phone"
                  type="tel"
                  values={values}
                  set={set}
                  errors={errors}
                  width="14ch"
                  placeholder="số điện thoại"
                />.
              </p>
              <p>
                Shop mình tên là{" "}
                <Blank
                  name="shopName"
                  values={values}
                  set={set}
                  errors={errors}
                  width="16ch"
                  placeholder="tên shop"
                />
                , ở{" "}
                <Blank
                  name="area"
                  values={values}
                  set={set}
                  errors={errors}
                  width="14ch"
                  placeholder="khu vực"
                />.
              </p>
              <p>
                Mọi người thường mua đồ của tụi mình qua trang{" "}
                <Blank
                  name="channel"
                  values={values}
                  set={set}
                  errors={errors}
                  width="22ch"
                  placeholder="đường dẫn trang IG/FB/TikTok"
                />.
              </p>
            </div>

            <div className="mt-10 space-y-2">
              <label htmlFor="makes" className="label block text-ink font-semibold">
                Kể Tí về bạn nhé <span className="text-brand">*</span>
              </label>
              <textarea
                id="makes"
                rows={5}
                value={values.makes}
                onChange={(e) => set("makes", e.target.value)}
                placeholder="Kể ngắn gọn về mặt hàng chủ đạo và phong cách của shop nhé: Sản phẩm chính, chất liệu, khoảng giá tham khảo..."
                aria-invalid={!!errors.makes}
                className={`ti-field resize-y bg-paper text-base leading-relaxed ${
                  errors.makes ? "border-brand" : ""
                }`}
              />
            </div>

            {missing.length > 0 && (
              <p role="alert" className="mt-5 border border-brand bg-brand/8 px-4 py-3 text-xs text-brand-deep">
                Còn thiếu: {missing.join(", ")}.
              </p>
            )}

            <div className="mt-8 space-y-3 rounded-2xl border border-ink/10 bg-paper p-5">
              <p className="text-xs text-ink/70">
                Bạn vui lòng đọc kỹ điều khoản và điều kiện trước khi đăng ký nha
              </p>
              <label className="flex items-center gap-3 cursor-pointer text-xs font-medium text-ink select-none">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => {
                    setAgreedTerms(e.target.checked);
                    if (e.target.checked) setTermsError(false);
                  }}
                  className="h-4 w-4 rounded border-ink/20 text-brand focus:ring-brand cursor-pointer"
                />
                <span>
                  Tôi đồng ý với{" "}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="font-semibold text-brand underline underline-offset-4 hover:text-brand-deep cursor-pointer"
                  >
                    Điều khoản &amp; Điều kiện
                  </button>
                </span>
              </label>
              {termsError && (
                <p role="alert" className="text-xs text-brand font-medium">
                  Vui lòng chọn đồng ý với Điều khoản &amp; Điều kiện trước khi gửi đơn.
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-ink/15 pt-8">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-brand bg-brand px-8 py-3.5 text-xs font-semibold text-paper shadow-md transition-all hover:bg-brand-deep hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>Gửi cho Tí</span>
              </button>
              <p className="max-w-xs text-[11px] leading-relaxed text-ink/50">
                Tí đọc duyệt hồ sơ và gửi thông báo qua email trong khoảng 5 ngày làm việc.
              </p>
            </div>
          </form>
        )}
      </div>

      {showTermsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl bg-paper p-6 md:p-8 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h3 className="display text-xl normal-case font-medium">Điều khoản &amp; Điều kiện</h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink/5 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="h-5 w-5 text-ink/60" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              <PolicyContent initialTab="terms" showTabs={true} />
            </div>
            <div className="pt-3 border-t border-ink/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="rounded-full border border-ink/20 px-5 py-2 text-xs font-medium text-ink hover:bg-ink/5 cursor-pointer"
              >
                Đóng (X)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgreedTerms(true);
                  setTermsError(false);
                  setShowTermsModal(false);
                }}
                className="rounded-full bg-brand px-6 py-2 text-xs font-semibold text-paper hover:bg-brand-deep cursor-pointer"
              >
                Tôi đồng ý &amp; Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

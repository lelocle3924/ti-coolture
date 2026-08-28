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

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { triggerWebhook } from "../lib/dbService";
import { NO_TRANSACTION } from "../lib/continuity";

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
  shopName: "Tên xưởng",
  contactName: "Người phụ trách",
  email: "Email",
  phone: "Số điện thoại",
  area: "Khu vực",
  channel: "Kênh đang bán",
  makes: "Xưởng làm gì",
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

  const submit = (only?: Array<keyof SignupFields>) => {
    const found = validate(values, only);
    setErrors(found);
    if (Object.keys(found).length) return false;
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

function Sent({ values, tone = "ink" }: { values: SignupFields; tone?: "ink" | "paper" }) {
  const muted = tone === "paper" ? "text-white/70" : "text-ink/65";
  return (
    <div
      className={`mx-auto max-w-lg space-y-5 border p-8 ${
        tone === "paper" ? "border-white/25" : "border-ink/15 bg-paper"
      }`}
    >
      <span
        className={`grid h-11 w-11 place-items-center ${
          tone === "paper" ? "bg-wave text-ink" : "bg-brand text-paper"
        }`}
      >
        <Check className="h-5 w-5 stroke-[3]" />
      </span>
      <h2 className="display text-2xl normal-case">Tí nhận được rồi</h2>
      <p className={`text-sm leading-relaxed ${muted}`}>
        Đăng ký của <strong>{values.shopName || "xưởng"}</strong> đã gửi tới ban tuyển chọn. Tí đọc
        tay từng hồ sơ và trả lời qua email <strong>{values.email}</strong> trong khoảng 5 ngày làm
        việc.
      </p>
      <ul className={`space-y-1.5 text-xs leading-relaxed ${muted}`}>
        <li>· Không có tài khoản nào được tạo, và bạn không cần đăng nhập.</li>
        <li>· Nếu hợp, Tí hẹn một buổi xem hàng và xin ảnh chụp thật.</li>
        <li>· {NO_TRANSACTION}</li>
      </ul>
      <Link
        to="/stores"
        viewTransition
        className={`inline-flex items-center gap-2 text-xs font-semibold underline underline-offset-4 ${
          tone === "paper" ? "text-wave" : "text-brand"
        }`}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Về danh bạ xưởng
      </Link>
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
  const missing = useMemo(
    () => Object.entries(errors).filter(([, v]) => !!v).map(([k]) => LABELS[k as keyof SignupFields]),
    [errors]
  );

  return (
    <div data-surface="light" className="min-h-[100dvh] bg-paper-warm text-ink">
      <AreaList />

      <div className="mx-auto max-w-3xl px-5 py-12 md:py-20">
        {sent ? (
          <Sent values={values} />
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            noValidate
          >
            <p className="label text-wave-ink">Gửi Tí</p>
            <h1 className="display mt-2 text-3xl normal-case md:text-5xl">Xưởng mình muốn tham gia</h1>

            <div className="mt-10 space-y-7 text-lg leading-[2.6] md:text-xl md:leading-[2.8]">
              <p>
                Xưởng của mình tên là{" "}
                <Blank name="shopName" values={values} set={set} errors={errors} width="14ch" placeholder="tên xưởng" />
                , làm ở{" "}
                <Blank name="area" values={values} set={set} errors={errors} width="11ch" placeholder="khu vực" />.
              </p>
              <p>
                Mình là{" "}
                <Blank name="contactName" values={values} set={set} errors={errors} width="11ch" placeholder="tên bạn" />
                , liên lạc qua{" "}
                <Blank
                  name="email"
                  type="email"
                  values={values}
                  set={set}
                  errors={errors}
                  width="18ch"
                  placeholder="email"
                />{" "}
                hoặc{" "}
                <Blank
                  name="phone"
                  type="tel"
                  values={values}
                  set={set}
                  errors={errors}
                  width="13ch"
                  placeholder="số điện thoại"
                />.
              </p>
              <p>
                Khách đang đặt hàng của mình ở{" "}
                <Blank name="channel" values={values} set={set} errors={errors} width="16ch" placeholder="kênh bán" />
                , và ảnh sản phẩm mình để ở{" "}
                <Blank name="links" values={values} set={set} errors={errors} width="16ch" placeholder="đường dẫn ảnh" />.
              </p>
            </div>

            <div className="mt-10 space-y-2">
              <label htmlFor="makes" className="label block text-ink/55">
                Xưởng mình làm <span className="text-brand">*</span>
              </label>
              <textarea
                id="makes"
                rows={5}
                value={values.makes}
                onChange={(e) => set("makes", e.target.value)}
                placeholder="Kể ngắn gọn: làm gì, bằng chất liệu gì, mỗi mẻ bao nhiêu, giá tham khảo khoảng bao nhiêu…"
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

            <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-ink/15 pt-8">
              <button
                type="submit"
                className="border border-brand bg-brand px-10 py-3.5 text-xs font-semibold text-paper transition-colors hover:bg-brand-deep"
              >
                Gửi cho Tí
              </button>
              <p className="max-w-xs text-[11px] leading-relaxed text-ink/50">
                Không tạo tài khoản, không mật khẩu. Tí đọc tay và trả lời qua email trong khoảng 5
                ngày làm việc.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

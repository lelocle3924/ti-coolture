/**
 * Đăng ký mở xưởng — three directions.
 *
 * The team's note: the button must stop sending shop owners to the auth
 * gateway. Registering interest is not signing in — there is no account to
 * create, no password to choose, and nothing on the site changes for the
 * person filling it in. All three directions are the same submission:
 *
 *   tên xưởng · người phụ trách · email · số điện thoại · khu vực ·
 *   kênh đang bán · làm gì · (tuỳ chọn) đường dẫn ảnh
 *
 * and the same close: Tí reads it by hand and replies by email. Nothing is
 * published automatically, which is what keeps the catalogue curated.
 *
 * What differs: whether the form is met all at once, in three steps, or as a
 * letter you fill in mid-sentence — that is, how much is asked of someone
 * before they can start, and how much they can see of where it is going.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { triggerWebhook } from "../../lib/dbService";
import { LabBar, NO_TRANSACTION } from "./shared";

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
        to="/lab/shops/1"
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
          className={`lab-field resize-y ${err ? "border-brand" : ""}`}
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
          className={`lab-field ${err ? "border-brand" : ""}`}
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

/* ═══════════════════════════════════════════════════════════════════════════
   1 · MỘT TRANG — One page
   Everything is visible at once, with the shop card the answers will become
   assembling itself beside the form. Nothing is hidden behind a next button.
   ═══════════════════════════════════════════════════════════════════════════ */

export function OpenOne() {
  const { values, set, errors, sent, submit } = useSignup();

  return (
    <div className="min-h-[100dvh] bg-brand text-paper">
      <LabBar study="open" index={1} />
      <AreaList />

      <header className="mx-auto max-w-6xl px-5 pb-10 pt-10 md:px-8 md:pt-16">
        <p className="label text-wave">Dành cho xưởng</p>
        <h1 className="display mt-2 max-w-2xl text-4xl leading-[1.05] normal-case md:text-6xl">
          Mở xưởng trên Tí
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80">
          Điền một lần, không cần tài khoản. Tí đọc tay từng hồ sơ và trả lời qua email.
        </p>
      </header>

      <div className="bg-paper text-ink">
        <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
          {sent ? (
            <Sent values={values} />
          ) : (
            <div className="grid gap-12 lg:grid-cols-12">
              <form
                className="space-y-8 lg:col-span-7"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                noValidate
              >
                <section className="space-y-4">
                  <h2 className="border-b border-ink/15 pb-2 text-sm font-semibold">Liên hệ</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field name="contactName" values={values} errors={errors} set={set} placeholder="Tên bạn" />
                    <Field name="phone" values={values} errors={errors} set={set} type="tel" placeholder="09xx xxx xxx" />
                  </div>
                  <Field
                    name="email"
                    values={values}
                    errors={errors}
                    set={set}
                    type="email"
                    placeholder="ten@email.com"
                    hint="Tí trả lời qua email này."
                  />
                </section>

                <section className="space-y-4">
                  <h2 className="border-b border-ink/15 pb-2 text-sm font-semibold">Xưởng</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field name="shopName" values={values} errors={errors} set={set} placeholder="Tên xưởng" />
                    <Field
                      name="area"
                      values={values}
                      errors={errors}
                      set={set}
                      list="areas"
                      placeholder="Quận / thành phố"
                    />
                  </div>
                  <Field
                    name="channel"
                    values={values}
                    errors={errors}
                    set={set}
                    placeholder="instagram.com/… hoặc số Zalo"
                    hint="Nơi khách đang đặt hàng của bạn. Tí dẫn khách về đúng kênh đó."
                  />
                  <Field
                    name="makes"
                    values={values}
                    errors={errors}
                    set={set}
                    rows={4}
                    placeholder="Xưởng làm gì, làm bằng chất liệu gì, mỗi mẻ bao nhiêu…"
                  />
                  <Field
                    name="links"
                    values={values}
                    errors={errors}
                    set={set}
                    placeholder="Drive, Instagram, Behance…"
                    hint="Không bắt buộc. Nếu chưa có ảnh chụp kỹ, Tí sẽ hẹn chụp."
                  />
                </section>

                <div className="space-y-3 border-t border-ink/15 pt-6">
                  <button
                    type="submit"
                    className="w-full border border-brand bg-brand px-6 py-3.5 text-xs font-semibold text-paper transition-colors hover:bg-brand-deep sm:w-auto sm:px-10"
                  >
                    Gửi đăng ký
                  </button>
                  <p className="text-[11px] leading-relaxed text-ink/50">
                    Không tạo tài khoản, không mật khẩu. {NO_TRANSACTION}
                  </p>
                </div>
              </form>

              {/* what the answers become */}
              <aside className="space-y-6 lg:col-span-5">
                <div className="lg:sticky lg:top-14 space-y-6">
                  <div>
                    <h2 className="label pb-3 text-ink/45">Hồ sơ của bạn sẽ trông như thế này</h2>
                    <div className="border border-ink/15 bg-paper-warm">
                      <div className="grid aspect-[21/9] place-items-center border-b border-ink/10 text-[11px] text-ink/35">
                        ẢNH BÌA 21:9 — Tí chụp hoặc bạn gửi
                      </div>
                      <div className="space-y-1.5 p-4">
                        <p className="display text-xl normal-case">
                          {values.shopName || "Tên xưởng"}
                        </p>
                        <p className="text-xs leading-relaxed text-ink/60">
                          {values.makes || "Một dòng về những gì xưởng làm."}
                        </p>
                        <p className="label pt-1 text-wave-ink">
                          {values.area || "Khu vực"} · {values.channel || "kênh bán"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-ink/15 pt-6 text-xs leading-relaxed text-ink/65">
                    <p className="label text-ink/45">Tí tìm gì</p>
                    <ul className="space-y-1.5">
                      <li>· Làm thật, làm tay, hoặc thiết kế riêng — không bán lại hàng có sẵn.</li>
                      <li>· Có kênh để khách nhắn thẳng: Instagram, TikTok, Facebook hay Zalo.</li>
                      <li>· Nói được sản phẩm làm ra sao và giá tham khảo bao nhiêu.</li>
                    </ul>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · BA BƯỚC — Three steps
   Three short screens, each asking one kind of question, with a review
   before anything is sent. Least on screen at any moment.
   ═══════════════════════════════════════════════════════════════════════════ */

const STEPS: Array<{ title: string; note: string; fields: Array<keyof SignupFields> }> = [
  {
    title: "Liên hệ",
    note: "Tí trả lời qua email, và gọi nếu cần xem hàng.",
    fields: ["contactName", "email", "phone"],
  },
  {
    title: "Xưởng",
    note: "Tên và nơi làm, để khách biết tìm bạn ở đâu.",
    fields: ["shopName", "area", "channel"],
  },
  {
    title: "Sản phẩm",
    note: "Làm gì và có ảnh chưa. Chưa có ảnh cũng gửi được.",
    fields: ["makes", "links"],
  },
];

export function OpenTwo() {
  const { values, set, errors, setErrors, sent, submit } = useSignup();
  const [step, setStep] = useState(0);
  const [review, setReview] = useState(false);

  const current = STEPS[step];

  const next = () => {
    const found = validate(values, current.fields);
    setErrors(found);
    if (Object.keys(found).length) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else setReview(true);
  };

  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <LabBar study="open" index={2} />
      <AreaList />

      <div className="mx-auto max-w-2xl px-5 py-12 md:py-20">
        {sent ? (
          <Sent values={values} />
        ) : (
          <>
            <header className="space-y-3">
              <p className="label text-wave-ink">Đăng ký mở xưởng</p>
              <h1 className="display text-3xl normal-case md:text-5xl">
                {review ? "Xem lại trước khi gửi" : current.title}
              </h1>
              <p className="text-sm text-ink/60">{review ? "Sửa được bất kỳ dòng nào." : current.note}</p>
            </header>

            {/* progress */}
            <ol className="flex items-center gap-2 py-8">
              {STEPS.map((s, i) => {
                const state = review || i < step ? "done" : i === step ? "now" : "todo";
                return (
                  <li key={s.title} className="flex flex-1 items-center gap-2">
                    <button
                      onClick={() => {
                        if (state === "done") {
                          setReview(false);
                          setStep(i);
                        }
                      }}
                      disabled={state === "todo"}
                      className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${
                        state === "now"
                          ? "text-brand"
                          : state === "done"
                            ? "text-ink/70 hover:text-brand"
                            : "text-ink/35"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 place-items-center border text-[10px] ${
                          state === "now"
                            ? "border-brand bg-brand text-paper"
                            : state === "done"
                              ? "border-brand text-brand"
                              : "border-ink/25"
                        }`}
                      >
                        {state === "done" ? <Check className="h-3 w-3 stroke-[3]" /> : i + 1}
                      </span>
                      <span className="hidden sm:inline">{s.title}</span>
                    </button>
                    {i < STEPS.length - 1 && <span className="h-px flex-1 bg-ink/15" />}
                  </li>
                );
              })}
            </ol>

            {review ? (
              <div className="space-y-6">
                <dl className="border-t border-ink/12">
                  {(Object.keys(LABELS) as Array<keyof SignupFields>).map((k) => (
                    <div
                      key={k}
                      className="flex items-baseline justify-between gap-4 border-b border-ink/12 py-2.5"
                    >
                      <dt className="label text-ink/50">{LABELS[k]}</dt>
                      <dd className="text-right text-xs">
                        {values[k] || <span className="text-ink/35">— để trống —</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setReview(false);
                      setStep(0);
                    }}
                    className="border border-ink/20 px-5 py-3 text-xs font-semibold text-ink/70 hover:border-brand hover:text-brand"
                  >
                    Sửa lại
                  </button>
                  <button
                    onClick={() => {
                      if (!submit()) {
                        setReview(false);
                        setStep(0);
                      }
                    }}
                    className="border border-brand bg-brand px-8 py-3 text-xs font-semibold text-paper hover:bg-brand-deep"
                  >
                    Gửi đăng ký
                  </button>
                </div>
                <p className="text-[11px] text-ink/50">Không tạo tài khoản, không mật khẩu.</p>
              </div>
            ) : (
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  next();
                }}
                noValidate
              >
                {current.fields.map((name) => (
                  <div key={name}>
                  <Field
                    name={name}
                    values={values}
                    errors={errors}
                    set={set}
                    type={name === "email" ? "email" : name === "phone" ? "tel" : "text"}
                    list={name === "area" ? "areas" : undefined}
                    rows={name === "makes" ? 4 : undefined}
                    placeholder={
                      name === "channel"
                        ? "instagram.com/… hoặc số Zalo"
                        : name === "links"
                          ? "Drive, Instagram, Behance… (không bắt buộc)"
                          : undefined
                    }
                  />
                  </div>
                ))}

                <div className="flex items-center justify-between gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 disabled:opacity-30"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Quay lại
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 border border-brand bg-brand px-7 py-3 text-xs font-semibold text-paper hover:bg-brand-deep"
                  >
                    {step === STEPS.length - 1 ? "Xem lại" : "Tiếp"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LÁ THƯ — The Letter
   The form is a paragraph with blanks in it. Fewest visible controls of the
   three; the page reads as something a person wrote, not a system asked for.
   ═══════════════════════════════════════════════════════════════════════════ */

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
      className={`lab-blank ${errors[name] ? "border-brand bg-brand/10" : ""}`}
    />
  );
}

export function OpenThree() {
  const { values, set, errors, sent, submit } = useSignup();
  const missing = useMemo(
    () => Object.entries(errors).filter(([, v]) => !!v).map(([k]) => LABELS[k as keyof SignupFields]),
    [errors]
  );

  return (
    <div className="min-h-[100dvh] bg-paper-warm text-ink">
      <LabBar study="open" index={3} />
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
                className={`lab-field resize-y bg-paper text-base leading-relaxed ${
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

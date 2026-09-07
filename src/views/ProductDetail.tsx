/**
 * Trang chi tiết sản phẩm — three directions.
 *
 * Shared by all three:
 *
 *   · the product description is on the page. It was missing entirely; the
 *     data had no short_desc_vi at all until the catalogue extension wrote
 *     one. Long copy collapses behind a measured "… Xem thêm" — measured, so
 *     a short description never shows a control that expands nothing.
 *   · the hero renders on the FIRST paint, from the catalogue's handoff, so
 *     the clicked thumbnail has something to morph into. Without that the
 *     browser snapshots a loading spinner and all you get is the page-level
 *     zoom the team reported.
 *   · price note and the no-transaction line appear verbatim.
 *   · no double bezels, no drop shadows outside the modal — hairlines carry
 *     the structure, as on Direction C.
 *
 * What differs: what the visitor meets first (a plate, a full-bleed opening
 * frame, or a specification), where the order action lives, and how much of
 * the page is reading versus looking.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Copy, Check, ExternalLink, X } from "lucide-react";
import {
  fetchProductById,
  fetchProductsStore,
  fetchStoreById,
  incrementProductClick,
  triggerWebhook,
} from "../lib/dbService";
import type { Product, StoreProfile } from "../types";
import SaveButton from "../components/SaveButton";
import {
  Clamp,
  ContinuityLink,
  HERO_NAME,
  NO_TRANSACTION,
  PRICE_NOTE,
  formatPrice,
  readHandoff,
} from "../lib/continuity";

/* ── data ───────────────────────────────────────────────────────────────── */

function useProductPage(productId: string | undefined) {
  // Painted immediately if the visitor came from a catalogue card.
  const [product, setProduct] = useState<Product | null>(() => readHandoff(productId));
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [siblings, setSiblings] = useState<Product[]>([]);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let alive = true;
    setProduct(readHandoff(productId));
    setResolved(false);
    if (!productId) return;

    fetchProductById(productId).then(async (p) => {
      if (!alive) return;
      setProduct(p);
      setResolved(true);
      if (!p) return;
      const [s, all] = await Promise.all([
        fetchStoreById(p.storeId),
        fetchProductsStore(p.storeId),
      ]);
      if (!alive) return;
      setStore(s);
      setSiblings(all.filter((x) => x.id !== p.id).slice(0, 4));
    });

    return () => {
      alive = false;
    };
  }, [productId]);

  return { product, store, siblings, resolved };
}

/* ── the order moment, identical in all three ───────────────────────────── */

function useInquiry(product: Product | null, store: StoreProfile | null) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const channels = useMemo(() => {
    const s = store?.socials ?? {};
    return (
      [
        ["Instagram", s.instagram],
        ["TikTok", s.tiktok],
        ["Facebook", s.facebook],
        ["Threads", s.threads],
      ] as const
    )
      .filter(([, url]) => !!url)
      .map(([platform, url]) => ({ platform, url: url as string }));
  }, [store]);

  const message = product
    ? `Chào ${store?.name ?? "shop"}! Mình thấy "${product.name}" trên Tí Coolture ` +
      `(https://ticoolture.vn/products/${product.id}) và muốn hỏi thêm ạ. ` +
      `Sản phẩm còn không, và mình đặt như thế nào ạ? Cảm ơn shop!`
    : "";

  const launch = (channel: { platform: string; url: string }) => {
    if (!product) return;
    incrementProductClick(product.id);
    triggerWebhook("SOCIAL_OUTBOUND_CLICK", {
      productId: product.id,
      platform: channel.platform,
      timestamp: new Date().toISOString(),
    });
    const base = channel.url.startsWith("http") ? channel.url : `https://${channel.url}`;
    const url = `${base}${base.includes("?") ? "&" : "?"}utm_source=ticoolture&utm_medium=product`;
    navigator.clipboard
      ?.writeText(message)
      .then(() => setCopied(true))
      .finally(() => window.open(url, "_blank", "noopener,noreferrer"));
  };

  return { open, setOpen, copied, setCopied, channels, message, launch };
}

type Inquiry = ReturnType<typeof useInquiry>;

function InquiryModal({ inquiry, storeName }: { inquiry: Inquiry; storeName: string }) {
  if (!inquiry.open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg space-y-5 border border-ink/10 bg-paper p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-ink/12 pb-3">
          <h2 className="text-sm font-semibold">Tin nhắn soạn sẵn gửi {storeName}</h2>
          <button onClick={() => inquiry.setOpen(false)} aria-label="Đóng">
            <X className="h-4 w-4 text-ink/50" />
          </button>
        </div>
        <p className="border border-ink/12 bg-paper-warm p-4 text-xs leading-relaxed text-ink/75">
          {inquiry.message}
        </p>
        <div className="space-y-2">
          {inquiry.channels.length === 0 && (
            <p className="text-xs text-ink/55">Xưởng chưa khai báo kênh liên hệ nào.</p>
          )}
          {inquiry.channels.map((c) => (
            <button
              key={c.platform}
              onClick={() => inquiry.launch(c)}
              className="flex w-full items-center justify-between border border-ink/15 px-4 py-3 text-xs font-semibold text-ink transition-colors hover:border-brand hover:bg-brand hover:text-paper"
            >
              <span>
                {inquiry.copied ? "Đã chép — mở" : "Chép tin nhắn & mở"} {c.platform}
              </span>
              {inquiry.copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-ink/50">{NO_TRANSACTION}</p>
      </div>
    </div>
  );
}

/* ── small shared parts ─────────────────────────────────────────────────── */

function Crumbs({ product, index }: { product: Product; index: 1 | 2 | 3 }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-[11px] text-current opacity-60">
      <Link to={`/products`} viewTransition className="hover:opacity-100">
        Sản phẩm
      </Link>
      <span>›</span>
      <span>{product.category}</span>
      <span>›</span>
      <span className="opacity-80">{product.name}</span>
    </nav>
  );
}

function SpecTable({
  product,
  store,
  tone = "ink",
}: {
  product: Product;
  store: StoreProfile | null;
  tone?: "ink" | "paper";
}) {
  const rows: Array<[string, string]> = [
    ["Chất liệu", product.material || "—"],
    ["Kích thước", product.size || "—"],
    ["Danh mục", product.category],
    ["Xưởng", product.storeName],
    ["Khu vực", store?.address || "—"],
    ["Mã sản phẩm", product.id.replace(/^prod-/, "")],
  ];
  const line = tone === "paper" ? "border-white/15" : "border-ink/12";
  const key = tone === "paper" ? "text-white/55" : "text-ink/50";

  return (
    <dl className={`border-t ${line}`}>
      {rows.map(([k, v]) => (
        <div key={k} className={`flex items-baseline justify-between gap-4 border-b ${line} py-2.5`}>
          <dt className={`label ${key}`}>{k}</dt>
          <dd className="text-right text-xs font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Siblings({
  siblings,
  storeName,
  index,
}: {
  siblings: Product[];
  storeName: string;
  index: 1 | 2 | 3;
}) {
  if (!siblings.length) return null;
  return (
    <section className="space-y-5">
      <div className="flex items-baseline justify-between gap-4 border-b border-current/15 pb-3">
        <h2 className="display text-xl normal-case">Cũng từ {storeName}</h2>
        <Link
          to={`/products`}
          viewTransition
          className="flex items-center gap-1 text-[11px] font-semibold opacity-70 hover:opacity-100"
        >
          Xem tất cả <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4">
        {siblings.map((s) => (
          <div key={s.id}>
            <SiblingCard product={s} index={index} />
          </div>
        ))}
      </div>
    </section>
  );
}

function SiblingCard({ product, index }: { product: Product; index: 1 | 2 | 3 }) {
  const ref = useRef<HTMLImageElement>(null);
  return (
    <ContinuityLink
      product={product}
      to={`/products/${product.id}`}
      imgRef={ref}
      className="group block"
    >
      <div className="aspect-square overflow-hidden rounded-[1.25rem] bg-current/5">
        <img
          ref={ref}
          src={product.images?.[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <h3 className="pt-2 text-xs leading-snug">{product.name}</h3>
      <p className="pt-0.5 text-xs font-semibold opacity-70">{formatPrice(product.price)}</p>
    </ContinuityLink>
  );
}

function NotFound({ index }: { index: 1 | 2 | 3 }) {
  return (
    <div className="grid min-h-[60dvh] place-items-center bg-paper px-6 text-center text-ink">
      <div className="space-y-4">
        <h1 className="display text-2xl normal-case">Không tìm thấy sản phẩm</h1>
        <Link
          to={`/products`}
          viewTransition
          className="inline-block border border-brand bg-brand px-5 py-2.5 text-xs font-semibold text-paper"
        >
          Về danh mục
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   1 · TRƯNG BÀY — The Plate
   The image holds still while the text scrolls past it. Reading column on
   the right, in one order: who made it, what it is, what it costs, what it
   is made of, how to ask for it.
   ═══════════════════════════════════════════════════════════════════════════ */

export default function ProductDetail() {
  const { productId } = useParams();
  const { product, store, siblings, resolved } = useProductPage(productId);
  const inquiry = useInquiry(product, store);
  const [active, setActive] = useState(0);

  useEffect(() => setActive(0), [productId]);

  if (!product) return resolved ? <NotFound index={1} /> : <div className="min-h-[60dvh] bg-paper" />;
  const images = product.images?.length ? product.images : [""];

  return (
    <div data-surface="light" className="min-h-[100dvh] bg-paper text-ink">
      <InquiryModal inquiry={inquiry} storeName={store?.name ?? product.storeName} />

      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">
        <Crumbs product={product} index={1} />
      </div>

      <main className="mx-auto grid max-w-6xl gap-10 px-5 pb-24 md:px-8 lg:grid-cols-12 lg:gap-14">
        {/* the plate */}
        <section className="lg:col-span-7">
          <div className="lg:sticky lg:top-14">
            <div className="flex gap-3">
              {images.length > 1 && (
                <div className="hidden w-16 shrink-0 flex-col gap-2 md:flex">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      aria-label={`Ảnh ${i + 1}`}
                      className={`aspect-square overflow-hidden rounded-xl border transition-colors ${
                        active === i ? "border-brand" : "border-ink/12 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <figure className="min-w-0 flex-1">
                <div className="aspect-square overflow-hidden rounded-[1.75rem] bg-paper-warm">
                  <img
                    key={active}
                    src={images[active]}
                    alt={product.name}
                    data-ti-hero={active === 0 ? "" : undefined}
                    style={active === 0 ? { viewTransitionName: HERO_NAME } : undefined}
                    className="h-full w-full object-cover"
                  />
                </div>
                <figcaption className="pt-2 text-[11px] text-ink/45">
                  Ảnh {active + 1}/{images.length} · ảnh mẫu, chưa có ảnh thật
                </figcaption>
              </figure>
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto md:hidden">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border ${
                      active === i ? "border-brand" : "border-ink/12"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* the reading column */}
        <section className="space-y-8 lg:col-span-5">
          <div className="flex items-center justify-between gap-4 border-b border-ink/12 pb-4">
            <Link to={`/stores/${product.storeId}`} viewTransition className="group flex items-center gap-3">
              <img
                src={product.storeLogo}
                alt=""
                className="h-10 w-10 border border-ink/10 object-cover"
              />
              <span>
                <span className="label block text-wave-ink">Xưởng chế tác</span>
                <span className="text-sm font-semibold group-hover:text-brand">
                  {product.storeName}
                </span>
              </span>
            </Link>
            {/* Was a 40px square whose state was a bare useState — pressing
                it coloured the icon and saved nothing (07/09). It is the
                shared control now, on the page's paper rather than on a
                photograph. */}
            <SaveButton product={product} ground="onSurface" />
          </div>

          <div className="space-y-3">
            <h1 className="display text-3xl leading-tight normal-case md:text-4xl">{product.name}</h1>
            <p className="text-2xl font-semibold text-brand">{formatPrice(product.price)}</p>
            <p className="text-[11px] text-ink/50">{PRICE_NOTE}</p>
          </div>

          <div className="space-y-2">
            <h2 className="label text-ink/45">Mô tả</h2>
            <Clamp
              text={product.description}
              lines={4}
              className="text-sm leading-relaxed text-ink/80"
            />
          </div>

          <SpecTable product={product} store={store} />

          <div className="space-y-3">
            <button
              onClick={() => inquiry.setOpen(true)}
              className="flex w-full items-center justify-between border border-brand bg-brand px-5 py-3.5 text-xs font-semibold text-paper transition-colors hover:bg-brand-deep"
            >
              <span>Nhắn xưởng để đặt</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
            <p className="text-[11px] leading-relaxed text-ink/50">{NO_TRANSACTION}</p>
          </div>
        </section>
      </main>

      <div className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <Siblings siblings={siblings} storeName={product.storeName} index={1} />
      </div>
    </div>
  );
}


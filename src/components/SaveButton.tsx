import { Heart } from "lucide-react";
import { useSavedProducts } from "../lib/useSavedProducts";
import type { Product } from "../types";

/**
 * Save to the wishlist. One control, every place a product image appears.
 *
 * Team 07/09: "cần đồng bộ nút save to wishlist ở khắp mọi nơi mà nút đó xuất
 * hiện (cũng chính là khắp mọi nơi mà có hình ảnh sản phẩm)."
 *
 * There were two of them and they agreed on nothing. The catalogue's was a
 * round translucent pill floating on the photograph; the product page's was a
 * 40px square with a hairline border, and its state was a bare useState that
 * touched no store at all — pressing it coloured the icon and saved nothing.
 * What's in store, the collections and the shop pages had none.
 *
 * So there is one now. It is a circle everywhere, because the shape has to
 * survive sitting on an arbitrary photograph and a square with a border does
 * not. Two grounds, not two shapes:
 *
 *   · "onImage"   — the default. Translucent paper over the photograph,
 *                   blurred, sized to a 44px tap target with a smaller
 *                   visible disc inside it.
 *   · "onSurface" — on paper rather than on a picture, so it takes the
 *                   hairline the page around it is drawn with. Same circle,
 *                   same icon, same states.
 *
 * The saved set comes from useSavedProducts, so this works signed out and the
 * nav's count moves the moment it is pressed, from whichever page pressed it.
 */
export default function SaveButton({
  product,
  ground = "onImage",
  /** Reveal only on hover of an ancestor marked `group/tile`. */
  revealOnHover = false,
  onToggled,
  className = "",
}: {
  product: Pick<Product, "id" | "name">;
  ground?: "onImage" | "onSurface";
  revealOnHover?: boolean;
  /** Told what the product's state became, for a page that wants to say so. */
  onToggled?: (saved: boolean) => void;
  className?: string;
}) {
  const saved = useSavedProducts();
  const isSaved = saved.has(product.id);

  const disc =
    ground === "onImage"
      ? isSaved
        ? "bg-brand text-wave shadow-md scale-110"
        : "bg-paper/85 text-ink/70 backdrop-blur-md group-hover/heart:bg-brand group-hover/heart:text-paper"
      : isSaved
        ? "bg-brand text-wave shadow-sm scale-105"
        : "border border-ink/15 bg-paper text-ink/55 group-hover/heart:border-brand group-hover/heart:text-brand";

  return (
    <button
      type="button"
      onClick={async (e) => {
        /* The tile around this is usually a link or a button of its own, and
           on a draggable track it is also a gesture surface. Neither should
           see this press. */
        e.preventDefault();
        e.stopPropagation();
        /* Two statements, and it matters. `onToggled?.(await toggle(id))`
           reads as if it always toggles and only sometimes reports, but an
           optional call short-circuits its *arguments* too: with no onToggled
           passed, the await is never evaluated and nothing is saved. Every
           surface except the catalogue passes no callback, so every one of
           them silently did nothing. */
        const nowSaved = await saved.toggle(product.id);
        onToggled?.(nowSaved);
      }}
      aria-label={isSaved ? `Bỏ lưu ${product.name}` : `Lưu ${product.name} vào danh sách`}
      aria-pressed={isSaved}
      /* 44px of target around a smaller disc: the touch area is the button,
         the circle is only what you can see of it. */
      className={`group/heart grid h-11 w-11 touch-manipulation place-items-center transition-opacity duration-300 ${
        revealOnHover && !isSaved
          ? "opacity-0 focus-visible:opacity-100 group-hover/tile:opacity-100"
          : "opacity-100"
      } ${className}`}
    >
      <span
        className={`grid h-8 w-8 place-items-center rounded-full transition-all duration-300 ${disc}`}
      >
        <Heart className={`h-4 w-4 ${isSaved ? "fill-wave stroke-wave" : ""}`} />
      </span>
    </button>
  );
}

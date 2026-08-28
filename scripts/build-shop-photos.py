"""
Build public/shop-photos/ from the raw shop photography drop.

Neither folder is in the repo — they are assets, not code (team decision,
28/08) — so this script is the reproducible part. Run it once after getting
the photo drop, and src/lib/mock/realShops.ts finds everything it expects.

    pip install pillow
    python scripts/build-shop-photos.py

Input, exactly as the shops sent it:

    Ảnh up shop/<Shop Name>/<product number>/<whatever>.jpg

Output, which realShops.ts addresses by convention rather than by manifest:

    public/shop-photos/<shop-slug>/<product-n>-<image-i>.webp

Why it is not raw: the drop is ~100MB of Instagram-resolution JPEG (mostly
1080x1440), and none of it is ever displayed above ~560px. 720px WebP at q70
is 6.1MB for the same 186 images and stays sharp at every size the site
renders them — product grid card, detail gallery, marquee tile, shop cover.
"""

import json
import os
import re
import shutil
import unicodedata

from PIL import Image, ImageOps

SRC = "Ảnh up shop"
OUT = "public/shop-photos"
MAX_EDGE = 720
QUALITY = 70


def slugify(name: str) -> str:
    """ASCII slug. Must agree with the slugs hardcoded in realShops.ts."""
    name = name.replace("đ", "d").replace("Đ", "D")
    name = "".join(
        c for c in unicodedata.normalize("NFD", name) if unicodedata.category(c) != "Mn"
    )
    return re.sub(r"-+", "-", re.sub(r"[^a-zA-Z0-9]+", "-", name).strip("-").lower())


def main() -> None:
    if not os.path.isdir(SRC):
        raise SystemExit(f"No photo drop at {SRC!r} — nothing to build.")

    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT, exist_ok=True)

    manifest: dict = {}
    written = 0
    total_bytes = 0

    for shop in sorted(os.listdir(SRC)):
        shop_dir = os.path.join(SRC, shop)
        if not os.path.isdir(shop_dir):
            continue

        slug = slugify(shop)
        manifest[slug] = {"name": shop, "products": []}
        os.makedirs(os.path.join(OUT, slug), exist_ok=True)

        products = sorted(
            d for d in os.listdir(shop_dir) if os.path.isdir(os.path.join(shop_dir, d))
        )
        for n, product in enumerate(products, start=1):
            product_dir = os.path.join(shop_dir, product)
            files = sorted(
                f
                for f in os.listdir(product_dir)
                if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
            )
            urls = []
            for i, filename in enumerate(files, start=1):
                # exif_transpose first: several of these are phone shots that
                # carry an orientation tag, and thumbnail() ignores it.
                image = ImageOps.exif_transpose(
                    Image.open(os.path.join(product_dir, filename))
                ).convert("RGB")
                image.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)

                rel = f"{slug}/{n}-{i}.webp"
                dest = os.path.join(OUT, rel)
                image.save(dest, "WEBP", quality=QUALITY, method=6)

                total_bytes += os.path.getsize(dest)
                written += 1
                urls.append("/shop-photos/" + rel)

            manifest[slug]["products"].append({"n": n, "images": urls})

    # Written for eyeballing only. realShops.ts does not read it — it derives
    # the same paths from the slug and the counts it carries, so the data stays
    # a plain module with no build step in front of it.
    with open("manifest.json", "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=1)

    print(
        f"{written} images -> {total_bytes / 1048576:.1f} MB "
        f"across {sum(len(v['products']) for v in manifest.values())} products "
        f"in {len(manifest)} shops"
    )


if __name__ == "__main__":
    main()

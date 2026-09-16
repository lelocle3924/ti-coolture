"""
Build public/shop-photos/ from the demo photographs.

Team 16/09: "Bỏ hết tất cả ảnh sản phẩm cũ, chỉ dùng các ảnh trong folder
/Ảnh up shop/foreign, vì ảnh trong đây tôi đã đảm bảo không dính bản quyền, an
toàn để làm demo." The shops' own photography is gone from the site; these are
the only photographs it shows.

The output IS in the repo, otherwise a clone shows the catalogue as grey
plates. The source folder is not (it sits under the ignored "Ảnh up shop/").

    pip install pillow
    python scripts/build-shop-photos.py

Input, one flat folder:

    Ảnh up shop/foreign/<whatever>.jpg

Output, which src/lib/mock/realShops.ts addresses by name:

    public/shop-photos/<first 8 characters of the file name>.webp

The source files are named by hash, so eight characters are unique and stay
the same when the folder is rebuilt. The script prints each photograph's
built size; realShops.ts carries those numbers in PHOTO_SIZES.

Why it is not raw: the photographs are up to 1200x1800 and none is displayed
above ~560px. 720px WebP at q70 stays sharp at every size the site renders
them — product grid card, detail gallery, marquee tile, shop cover.
"""

import json
import os
import shutil

from PIL import Image, ImageOps

SRC = os.path.join("Ảnh up shop", "foreign")
OUT = os.path.join("public", "shop-photos")
MAX_EDGE = 720
QUALITY = 70


def main() -> None:
    if not os.path.isdir(SRC):
        raise SystemExit(f"No photographs at {SRC!r} — nothing to build.")

    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT, exist_ok=True)

    sizes: dict = {}
    total_bytes = 0
    for filename in sorted(os.listdir(SRC)):
        if not filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            continue
        # exif_transpose first: a phone shot can carry an orientation tag, and
        # thumbnail() ignores it.
        image = ImageOps.exif_transpose(Image.open(os.path.join(SRC, filename))).convert("RGB")
        image.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)

        key = filename[:8]
        if key in sizes:
            raise SystemExit(f"Two source files start with {key!r}; rename one.")
        dest = os.path.join(OUT, f"{key}.webp")
        image.save(dest, "WEBP", quality=QUALITY, method=6)
        sizes[key] = [image.width, image.height]
        total_bytes += os.path.getsize(dest)

    print(json.dumps(sizes, indent=1))
    print(f"{len(sizes)} photographs -> {total_bytes / 1048576:.1f} MB")


if __name__ == "__main__":
    main()

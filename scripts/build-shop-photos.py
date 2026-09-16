"""
Build public/shop-photos/ from the demo photographs.

Team 16/09: "Bỏ hết tất cả ảnh sản phẩm cũ, chỉ dùng các ảnh trong folder
/Ảnh up shop/foreign, vì ảnh trong đây tôi đã đảm bảo không dính bản quyền, an
toàn để làm demo." The shops' own photography is gone from the site; these are
the only photographs it shows.

The output IS in the repo, otherwise a clone shows the catalogue as grey
plates. The source folder is not (it sits under the ignored "Ảnh up shop/").

    pip install pillow
    python scripts/build-shop-photos.py [source folder] [output folder] > sizes.json

Input, one flat folder:

    Ảnh up shop/foreign/<whatever>.jpg

Output, which src/lib/mock/realShops.ts addresses by name:

    public/shop-photos/<eight hex characters>.webp

A file already named by a 32-character hash keeps its first eight characters,
which is what the first 29 photographs are called. Any other name — "_ (7)",
"Instagram", a title in Russian — gives no usable URL, so the eight characters
come from the SHA-1 of the file's bytes instead: stable across rebuilds, and
unique. The sizes go to stdout as JSON; realShops.ts carries them in
PHOTO_SIZES.

Size: 640px on the long edge at WebP q60 (16/09, "nén lại chút"). Nothing is
displayed above ~560px, and against 720px at q70 it is a quarter lighter —
2.6MB down to 1.9MB for 75 photographs.
"""

import hashlib
import json
import os
import re
import shutil
import sys

from PIL import Image, ImageOps

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join("Ảnh up shop", "foreign")
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join("public", "shop-photos")
MAX_EDGE = 640
QUALITY = 60


def photo_key(filename: str) -> str:
    stem = os.path.splitext(filename)[0]
    if re.fullmatch(r"[0-9a-f]{32}", stem):
        return stem[:8]
    with open(os.path.join(SRC, filename), "rb") as fh:
        return hashlib.sha1(fh.read()).hexdigest()[:8]


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

        key = photo_key(filename)
        if key in sizes:
            raise SystemExit(f"Two photographs map to {key!r}; one is probably a duplicate.")
        dest = os.path.join(OUT, f"{key}.webp")
        image.save(dest, "WEBP", quality=QUALITY, method=6)
        sizes[key] = [image.width, image.height]
        total_bytes += os.path.getsize(dest)

    print(json.dumps(dict(sorted(sizes.items())), indent=1))
    print(f"{len(sizes)} photographs -> {total_bytes / 1048576:.1f} MB", file=sys.stderr)


if __name__ == "__main__":
    main()

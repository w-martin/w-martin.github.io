"""Build the dragon-head favicon from the head artwork in dragon-source.png.

Run: uv run --with pillow --with numpy python tools/favicon/make_favicon.py [--install | --restore]

Two tones keep the eye, snout and crest readable at 16px: the head's own shading is thresholded into
a light shape over a mid-blue silhouette, on a deep-blue rounded square. Candidates are written to
tools/favicon/out/; --install copies them over public/favicon.ico and public/apple-touch-icon.png, and
--restore puts back the previous icons kept in tools/favicon/original/.
"""

import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
OUT = HERE / "out"

BG = (22, 50, 79)
DARK = (66, 110, 168)
LIGHT = (226, 238, 255)


def head_masks() -> tuple[Image.Image, Image.Image]:
    size = 720
    rgba = (
        Image.open(HERE / "dragon-source.png")
        .convert("RGBA")
        .resize((size, size), Image.LANCZOS)
    )
    a = np.asarray(rgba).astype(float)
    head = a[..., 3] / 255 > 0.5
    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    smooth = np.asarray(
        Image.fromarray(lum.astype(np.uint8)).filter(ImageFilter.GaussianBlur(5))
    ).astype(float)
    bright = (smooth > np.percentile(lum[head], 45)) & head
    silhouette = (
        Image.fromarray((head * 255).astype(np.uint8))
        .filter(ImageFilter.GaussianBlur(7))
        .point(lambda v: 255 if v > 120 else 0)
    )
    light = (
        Image.fromarray((bright & (np.asarray(silhouette) > 0)).astype(np.uint8) * 255)
        .filter(ImageFilter.GaussianBlur(3))
        .point(lambda v: 255 if v > 128 else 0)
    )
    box = silhouette.getbbox()
    return silhouette.crop(box), light.crop(box)


def build(
    size: int,
    silhouette: Image.Image,
    light: Image.Image,
    pad: float = 0.16,
    radius: float = 0.22,
) -> Image.Image:
    big = size * 4
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle(
        [0, 0, big - 1, big - 1], radius=int(big * radius), fill=BG + (255,)
    )
    avail = big * (1 - 2 * pad)
    w, h = silhouette.size
    scale = min(avail / w, avail / h)
    dims = (max(1, int(w * scale)), max(1, int(h * scale)))
    ox, oy = (big - dims[0]) // 2, (big - dims[1]) // 2
    for mask, colour in ((silhouette, DARK), (light, LIGHT)):
        layer = Image.new("RGBA", dims, colour + (255,))
        layer.putalpha(mask.resize(dims, Image.LANCZOS))
        img.alpha_composite(layer, (ox, oy))
    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(exist_ok=True)
    silhouette, light = head_masks()
    build(256, silhouette, light).save(
        OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
    )
    build(180, silhouette, light).save(OUT / "apple-touch-icon.png")
    print("wrote", *(p.name for p in sorted(OUT.iterdir())))
    if "--restore" in sys.argv:
        for name in ("favicon.ico", "apple-touch-icon.png"):
            shutil.copy(HERE / "original" / name, ROOT / "public" / name)
        print("restored the original icons into public/")
    if "--install" in sys.argv:
        shutil.copy(OUT / "favicon.ico", ROOT / "public" / "favicon.ico")
        shutil.copy(
            OUT / "apple-touch-icon.png", ROOT / "public" / "apple-touch-icon.png"
        )
        print("installed into public/")


if __name__ == "__main__":
    main()

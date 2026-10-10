"""Build the animated-effect assets: dragon eyelids, guitar masks, and effects.json.

Positions are stored as % of the cover.
"""

import base64
import io
import json
import sys
from pathlib import Path

import numpy as np
import shapes
from PIL import Image, ImageDraw, ImageFilter

Image.MAX_IMAGE_PIXELS = None
FULL = 3000
OUT_SIZE = 1000
GUITAR_SIZE = 500


def poly_mask(polys, blur=0.0):
    m = Image.new("L", (FULL, FULL), 0)
    d = ImageDraw.Draw(m)
    for p in polys:
        d.polygon(p, fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m


def lid_layer(src: Image.Image) -> Image.Image:
    rgb = np.asarray(src.convert("RGB")).astype(float)
    out = np.zeros((FULL, FULL, 4), dtype=np.uint8)
    rng = np.random.default_rng(7)
    for poly in shapes.DRAGON_EYES:
        mask = poly_mask([poly]).filter(ImageFilter.MaxFilter(21))
        outer = np.asarray(mask.filter(ImageFilter.MaxFilter(91))) > 0
        inner = np.asarray(mask.filter(ImageFilter.MaxFilter(37))) > 0
        ring = rgb[outer & ~inner]
        lum = ring.mean(1)
        pale = ring[lum > np.percentile(lum, 25)]
        base, sd = np.median(pale, 0), pale.std(0).mean()

        ys = [p[1] for p in poly]
        y0, y1 = min(ys), max(ys)
        grad = (
            np.clip((np.arange(FULL) - y0) / max(y1 - y0, 1), 0, 1)[:, None, None]
            * 0.16
            + 0.86
        )
        fill = base[None, None, :] * grad + rng.normal(0, sd * 0.6, (FULL, FULL, 1))
        fill = np.clip(fill, 0, 255)

        soft = np.asarray(mask.filter(ImageFilter.GaussianBlur(3))).astype(float) / 255
        rgba = np.dstack([fill, soft * 255]).astype(np.uint8)

        left = min(poly, key=lambda p: p[0])
        right = max(poly, key=lambda p: p[0])
        mid = ((left[0] + right[0]) / 2, (y0 + y1) / 2 + (y1 - y0) * 0.22)
        line = Image.new("L", (FULL, FULL), 0)
        d = ImageDraw.Draw(line)
        pts = []
        for t in np.linspace(0, 1, 40):
            x = (1 - t) ** 2 * left[0] + 2 * (1 - t) * t * mid[0] + t**2 * right[0]
            y = (1 - t) ** 2 * left[1] + 2 * (1 - t) * t * mid[1] + t**2 * right[1]
            pts.append((x, y))
        d.line(pts, fill=255, width=9, joint="curve")
        la = np.asarray(line.filter(ImageFilter.GaussianBlur(1.6))).astype(float) / 255
        navy = np.array([34, 44, 108], float)
        for c in range(3):
            rgba[..., c] = (rgba[..., c] * (1 - la) + navy[c] * la).astype(np.uint8)
        rgba[..., 3] = np.maximum(rgba[..., 3], (la * 255).astype(np.uint8))
        out = np.where(rgba[..., 3:4] > out[..., 3:4], rgba, out)
    return Image.fromarray(out, "RGBA")


def guitar_mask(name: str, src: Image.Image, key: int, max_sat: float) -> Image.Image:
    body, neck = shapes.GUITARS[name]
    lum = np.asarray(src.convert("L")).astype(int)
    sat = np.asarray(src.convert("HSV").split()[1]) / 255
    body_m = (np.asarray(poly_mask([body])) > 0) & (lum > key) & (sat < max_sat)
    neck_m = np.asarray(poly_mask([neck])) > 0
    m = Image.fromarray(((body_m | neck_m) * 255).astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(3)
    )
    return m


def _poly(points, size=1000) -> np.ndarray:
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).polygon(points, fill=255)
    return np.asarray(m) > 0


def _stroke(points, width, size=1000) -> np.ndarray:
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.line(points, fill=255, width=width, joint="curve")
    for x, y in (points[0], points[-1]):
        d.ellipse(
            [x - width / 2, y - width / 2, x + width / 2, y + width / 2], fill=255
        )
    return np.asarray(m) > 0


def flight_layers(music: Path) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Foreground / mid-ground / background masks (1000px) for the dragon cover."""
    depth = np.load(
        Path(__file__).parent / "cache" / "flight-of-the-white-dragon-depth.npy"
    )
    near_lo, near_hi = shapes.FLIGHT_DEPTH
    deep = depth >= near_lo
    wings = (_poly(shapes.FLIGHT_LEFT_WING) | _poly(shapes.FLIGHT_RIGHT_WING)) & deep
    tail = np.zeros_like(deep)
    for pts, width in shapes.FLIGHT_TAIL:
        tail |= _stroke(pts, width)
    extras = np.zeros_like(deep)
    for poly in shapes.FLIGHT_FOREGROUND_EXTRAS:
        extras |= _poly(poly) & deep
    man = _poly(shapes.FLIGHT_MAN) & deep

    size = (1000, 1000)
    orig = np.asarray(
        Image.open(music / "flight-of-the-white-dragon.jpg").convert("RGB").resize(size)
    )
    plain = np.asarray(
        Image.open(music / "flight-of-the-white-dragon-wordless.jpg")
        .convert("RGB")
        .resize(size)
    )
    text = np.abs(orig.astype(int) - plain.astype(int)).max(2) > 40
    text = (
        np.asarray(
            Image.fromarray(text.astype(np.uint8) * 255).filter(
                ImageFilter.MaxFilter(9)
            )
        )
        > 0
    )

    fg = ((depth >= near_hi) & ~wings & ~tail) | man | extras | text
    mid = deep & ~fg & ~tail
    return fg, mid, ~(fg | mid)


def save_soft_mask(mask: np.ndarray, dest: Path, px: int = 125) -> None:
    soft = np.asarray(
        Image.fromarray(mask.astype(np.uint8) * 255).filter(
            ImageFilter.GaussianBlur(2.5)
        )
    )
    small = Image.fromarray(soft).resize((px, px), Image.LANCZOS)
    rgba = Image.new("RGBA", (px, px), (255, 255, 255, 0))
    rgba.putalpha(small)
    rgba.save(dest, "WEBP", lossless=True, method=6)


def placeholder(img: Image.Image) -> str:
    """A ~300 byte blurred stand-in, inlined so a cover never shows as an empty box."""
    buf = io.BytesIO()
    img.convert("RGB").resize((24, 24), Image.LANCZOS).save(
        buf, "WEBP", quality=40, method=6
    )
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def main(music: Path, out: Path) -> None:
    fx = {}
    flight = Image.open(music / "flight-of-the-white-dragon-wordless.jpg")
    ladder = Image.open(music / "the-ladder.jpg")
    srcs = {
        "the-ladder": (ladder, 110, 0.42),
        "flight-of-the-white-dragon": (flight, 150, 0.4),
    }

    lids = lid_layer(flight)
    lids.resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS).save(
        out / "flight-of-the-white-dragon-blink.webp", "WEBP", quality=90, method=6
    )

    fg, _mid, bg = flight_layers(music)
    # Snow in front of the mid-ground can drift anywhere the foreground doesn't cover; snow behind
    # it only shows where the far background is visible.
    save_soft_mask(~fg, out / "flight-of-the-white-dragon-snow-front.webp")
    save_soft_mask(bg, out / "flight-of-the-white-dragon-snow-back.webp")

    for name, (img, key, max_sat) in srcs.items():
        m = guitar_mask(name, img, key, max_sat)
        white = Image.new("RGBA", (FULL, FULL), (255, 255, 255, 0))
        white.putalpha(m)
        white.resize((GUITAR_SIZE, GUITAR_SIZE), Image.LANCZOS).save(
            out / f"{name}-guitar.webp", "WEBP", quality=85, method=6
        )
        gx, gy = shapes.GLASSES[name]
        fx[name] = {
            "glasses": {"x": round(gx / FULL * 100, 2), "y": round(gy / FULL * 100, 2)},
            "placeholder": placeholder(img),
        }
        if name == "flight-of-the-white-dragon":
            nx, ny = shapes.DRAGON_NOSTRIL
            fx[name]["breath"] = {
                "x": round(nx / FULL * 100, 2),
                "y": round(ny / FULL * 100, 2),
            }
    (out / "effects.json").write_text(json.dumps(fx, indent=2))
    print(json.dumps(fx))


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))

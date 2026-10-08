"""Build the particle masks: where embers/snow may be drawn on each cover.

Text is removed first (Flight: diff against the wordless art; Ladder: colour-keyed inside
hand-set boxes) so it doesn't bleed into the depth estimate, then far-background depth is
thresholded into a soft mask.
"""

import sys
from pathlib import Path

import cv2
import numpy as np
import torch
from PIL import Image
from transformers import pipeline

Image.MAX_IMAGE_PIXELS = None
MODEL = "depth-anything/Depth-Anything-V2-Small-hf"
SIZE = 1000
CACHE = Path(__file__).parent / "cache"
# Depth below which a pixel counts as far background (normalised 0..1), tuned by eye per cover.
ALLOWED_BELOW = {"the-ladder": 0.22, "flight-of-the-white-dragon": 0.3}
EDGE = 0.04
# The page samples the mask on a coarse grid; keep in step with MASK_PX in index.astro.
MASK_PX = 125


def odd(n: int) -> np.ndarray:
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * n + 1, 2 * n + 1))


def drop_small(mask: np.ndarray, min_area: int) -> np.ndarray:
    n, lab, stats, _ = cv2.connectedComponentsWithStats(
        mask.astype(np.uint8), connectivity=8
    )
    keep = np.zeros_like(mask)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= min_area:
            keep |= lab == i
    return keep


def ladder_text_mask(rgb: np.ndarray) -> np.ndarray:
    h, w, _ = rgb.shape
    s = w / 900
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)

    def region(x0, y0, x1, y1):
        m = np.zeros((h, w), bool)
        m[int(y0 * s) : int(y1 * s), int(x0 * s) : int(x1 * s)] = True
        return m

    logo = region(25, 15, 295, 140) & (rgb.min(2) > 185)
    box = region(600, 805, 870, 870)
    yellow = box & (r > 215) & (g > 140) & (b < 110)
    dark = box & (rgb.max(2) < 130)
    near_yellow = cv2.dilate(yellow.astype(np.uint8), odd(int(16 * s / 3.33))).astype(
        bool
    )
    title = yellow | (dark & near_yellow)
    m = drop_small(logo | title, int(30 * s / 3.33))
    return cv2.dilate(m.astype(np.uint8), odd(int(10 * s / 3.33))).astype(bool)


def flight_text_mask(orig: np.ndarray, wordless: np.ndarray) -> np.ndarray:
    d = np.abs(orig.astype(int) - wordless.astype(int)).max(2) > 40
    return cv2.dilate(d.astype(np.uint8), odd(4)).astype(bool)


def smoothstep(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
    t = np.clip((x - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def save(arr: np.ndarray, path: Path) -> None:
    Image.fromarray(arr).save(path, "WEBP", quality=88, method=6)


def main(src: Path, out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(exist_ok=True)
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    pipe = pipeline("depth-estimation", model=MODEL, device=device)
    load = lambda p: np.asarray(
        Image.open(p).convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
    )

    for name, below in ALLOWED_BELOW.items():
        orig = load(src / f"{name}.jpg")
        if name == "the-ladder":
            tmask = ladder_text_mask(
                np.asarray(Image.open(src / f"{name}.jpg").convert("RGB"))
            )
            tmask = (
                cv2.resize(
                    tmask.astype(np.uint8), (SIZE, SIZE), interpolation=cv2.INTER_AREA
                )
                > 0
            )
            clean = cv2.inpaint(
                orig, tmask.astype(np.uint8) * 255, 5, cv2.INPAINT_TELEA
            )
        else:
            clean = load(src / f"{name}-wordless.jpg")
            tmask = flight_text_mask(orig, clean)

        depth = np.asarray(
            pipe(Image.fromarray(clean))["predicted_depth"].squeeze().cpu(),
            dtype=np.float32,
        )
        depth = cv2.resize(depth, (SIZE, SIZE), interpolation=cv2.INTER_CUBIC)
        depth = (depth - depth.min()) / (depth.max() - depth.min())
        np.save(CACHE / f"{name}-depth.npy", depth)

        # Particles may only show where the scene is far away, and never over the logo/title.
        allowed = 1 - smoothstep(depth, below - EDGE, below + EDGE)
        text_pad = cv2.dilate(tmask.astype(np.uint8), odd(14)) > 0
        allowed = cv2.GaussianBlur(allowed * ~text_pad, (0, 0), 2.0)
        alpha = cv2.resize(allowed, (MASK_PX, MASK_PX), interpolation=cv2.INTER_AREA)
        rgba = np.dstack(
            [np.full(alpha.shape + (3,), 255, np.uint8), (alpha * 255).astype(np.uint8)]
        )
        Image.fromarray(rgba, "RGBA").save(
            out / f"{name}-particle-mask.webp", "WEBP", lossless=True, method=6
        )
        print(name, f"particles allowed over {(allowed > 0.5).mean():.0%} of the cover")


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))

"""Bake the paper textures into src/assets/paper-light.webp and paper-dark.webp.

Run: uv run --with pillow python tools/paper/make_paper.py

The texture is drawn once here, from SVG noise filters, and shipped as a small image tile: the browser
decodes it a single time instead of running the filters every time it repaints the page background
(after a theme change, on resize, on a slow phone). The layers are fine grain, horizontal fibres, a slow
mottling in warm brown and a light speckle, kept faint so body text stays above 6:1 against the darkest
pixel. The tile is stitched, so it repeats without seams, and is drawn at 2x so it stays crisp on dense
screens (CSS shows it at 160px). The dark tile is the faint light speckle over the charcoal base, baked
the same way and shown at 140px.
"""

import subprocess
import tempfile
from pathlib import Path

from PIL import Image

HERE = Path(__file__).parent
ASSETS = HERE.parent.parent / "src" / "assets"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SCALE = 2


def layer(name: str, freq: str, octaves: int, seed: int, matrix: str) -> str:
    return (
        f"<filter id='{name}' x='0' y='0' width='100%' height='100%'>"
        f"<feTurbulence type='fractalNoise' baseFrequency='{freq}' numOctaves='{octaves}' seed='{seed}' stitchTiles='stitch'/>"
        f"<feColorMatrix values='{matrix}'/></filter>"
    )


def rect(name: str, opacity: float) -> str:
    return (
        f"<rect width='100%' height='100%' filter='url(#{name})' opacity='{opacity}'/>"
    )


LIGHT_SIZE = 160
DARK_SIZE = 140

LIGHT_SVG = (
    f"<svg xmlns='http://www.w3.org/2000/svg' width='{LIGHT_SIZE}' height='{LIGHT_SIZE}'>"
    + layer("a", ".85", 3, 4, "0 0 0 0 .28 0 0 0 0 .22 0 0 0 0 .13 1.6 0 0 0 -.68")
    + layer("b", ".02 .55", 2, 9, "0 0 0 0 .3 0 0 0 0 .24 0 0 0 0 .14 1.5 0 0 0 -.64")
    + layer("c", ".011", 3, 2, "0 0 0 0 .4 0 0 0 0 .32 0 0 0 0 .18 1.7 0 0 0 -.72")
    + layer("d", ".9", 2, 11, "0 0 0 0 1 0 0 0 0 1 0 0 0 0 .97 1.5 0 0 0 -.7")
    + rect("c", 0.07)
    + rect("b", 0.1)
    + rect("a", 0.14)
    + rect("d", 0.3)
    + "</svg>"
)

DARK_SVG = (
    f"<svg xmlns='http://www.w3.org/2000/svg' width='{DARK_SIZE}' height='{DARK_SIZE}'>"
    + layer("n", ".9", 2, 4, "0 0 0 0 1 0 0 0 0 .96 0 0 0 0 .9 .2 0 0 0 -.06")
    + rect("n", 1)
    + "</svg>"
)


def bake(svg: str, base: str, size: int, out: Path) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        page = Path(tmp) / "paper.html"
        shot = Path(tmp) / "paper.png"
        page.write_text(
            f"<!doctype html><body style='margin:0;background:{base}'>{svg}</body>"
        )
        subprocess.run(
            [
                CHROME,
                "--headless=new",
                "--disable-gpu",
                "--hide-scrollbars",
                f"--window-size={size},{size}",
                f"--force-device-scale-factor={SCALE}",
                f"--screenshot={shot}",
                page.as_uri(),
            ],
            check=True,
            capture_output=True,
        )
        tile = Image.open(shot).convert("RGB").crop((0, 0, size * SCALE, size * SCALE))
    out.parent.mkdir(parents=True, exist_ok=True)
    tile.save(out, "WEBP", quality=90, method=6)
    print(f"{out.relative_to(HERE.parent.parent)}: {out.stat().st_size} bytes")


def main() -> None:
    bake(LIGHT_SVG, "#dfdfdc", LIGHT_SIZE, ASSETS / "paper-light.webp")
    bake(DARK_SVG, "#1e1b18", DARK_SIZE, ASSETS / "paper-dark.webp")


if __name__ == "__main__":
    main()

"""Render the SVG favicons with Chrome and write the icon files.

Run: uv run --with pillow python tools/favicon/make_eye.py [wisp|line|fire|ice] [--install]

Variants: "wisp" is the page's wisp as an icon; "line" is a line-art dragon; "fire" and "ice"
are dragon-eye alternatives. Candidates for every variant land in tools/favicon/out/<variant>/;
--install copies the chosen variant over public/favicon.ico and public/apple-touch-icon.png.
Needs Chrome (set CHROME to override).
"""

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
VARIANTS = {
    "wisp": "wisp.svg",
    "line": "dragon-line.svg",
    "fire": "eye-fire.svg",
    "ice": "eye-ice.svg",
}
CHROME = os.environ.get(
    "CHROME", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
)


def render(variant: str) -> Path:
    out = HERE / "out" / variant
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        shot = Path(tmp) / "eye.png"
        subprocess.run(
            [
                CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                "--default-background-color=00000000", "--window-size=512,512",
                f"--screenshot={shot}", (HERE / VARIANTS[variant]).as_uri(),
            ],
            check=True,
            capture_output=True,
        )  # fmt: skip
        art = Image.open(shot).convert("RGBA")
    art.resize((256, 256), Image.LANCZOS).save(
        out / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
    )
    art.resize((180, 180), Image.LANCZOS).save(out / "apple-touch-icon.png")
    return out


def main() -> None:
    variants = [a for a in sys.argv[1:] if a in VARIANTS] or ["line"]
    for variant in VARIANTS:
        out = render(variant)
        print("wrote", out.relative_to(ROOT))
    if "--install" in sys.argv:
        chosen = HERE / "out" / variants[0]
        for name in ("favicon.ico", "apple-touch-icon.png"):
            shutil.copy(chosen / name, ROOT / "public" / name)
        print(f"installed the {variants[0]} eye into public/")


if __name__ == "__main__":
    main()

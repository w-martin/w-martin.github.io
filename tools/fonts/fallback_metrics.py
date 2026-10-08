"""Metric overrides that make a local fallback font occupy the same space as a web font.

Run: uv run --with fonttools --with brotli python fallback_metrics.py
Prints CSS @font-face blocks for global.css; re-run if the fonts in build.py change.
Georgia and Arial ship with macOS and Windows, which is where the swap is most visible.
"""

from pathlib import Path

from fontTools.ttLib import TTFont

HERE = Path(__file__).parent
SUPPLEMENTAL = Path("/System/Library/Fonts/Supplemental")
# Relative English letter frequencies (a-z) plus space, to weight the average advance width.
FREQ = {
    " ": 18.0, "e": 10.2, "t": 7.5, "a": 6.5, "o": 6.2, "i": 5.7, "n": 5.7, "s": 5.3, "h": 5.0,
    "r": 4.9, "d": 3.5, "l": 3.3, "c": 2.4, "u": 2.3, "m": 2.0, "w": 1.9, "f": 1.9, "g": 1.7,
    "y": 1.6, "p": 1.5, "b": 1.2, "v": 0.8, "k": 0.6, "x": 0.1, "j": 0.1, "q": 0.1, "z": 0.1,
}  # fmt: skip


def metrics(path: Path, location=None):
    font = TTFont(path, lazy=False)
    if location and "fvar" in font:
        from fontTools.varLib import instancer

        font = instancer.instantiateVariableFont(font, location)
    upm = font["head"].unitsPerEm
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    total = sum(FREQ.values())
    avg = sum(f * hmtx[cmap[ord(c)]][0] for c, f in FREQ.items()) / total / upm
    hhea = font["hhea"]
    return {
        "avg": avg,
        "ascent": hhea.ascent / upm,
        "descent": -hhea.descent / upm,
        "gap": hhea.lineGap / upm,
    }


def block(name, local, web, fallback):
    s = web["avg"] / fallback["avg"]
    return (
        f'@font-face {{\n  font-family: "{name}";\n  src: local("{local}");\n'
        f"  size-adjust: {s * 100:.2f}%;\n"
        f"  ascent-override: {web['ascent'] / s * 100:.2f}%;\n"
        f"  descent-override: {web['descent'] / s * 100:.2f}%;\n"
        f"  line-gap-override: {web['gap'] / s * 100:.2f}%;\n}}\n"
    )


def main() -> None:
    merri = metrics(HERE / "src" / "merriweather-latin.woff2", {"wght": 400})
    opens = metrics(HERE / "src" / "opensans-latin.woff2", {"wght": 400})
    print(
        block(
            "Merriweather Fallback",
            "Georgia",
            merri,
            metrics(SUPPLEMENTAL / "Georgia.ttf"),
        )
    )
    print(
        block("Open Sans Fallback", "Arial", opens, metrics(SUPPLEMENTAL / "Arial.ttf"))
    )


if __name__ == "__main__":
    main()

"""Build the self-hosted web fonts from Google's Latin subsets.

Run: uv run --with fonttools --with brotli python build.py

Both families are SIL OFL 1.1. Merriweather declares a Reserved Font Name, so its derived
files are renamed ("Site Serif"); Open Sans declares none. Licence texts are copied to
public/fonts/ so they ship with the fonts.
"""

import io
import shutil
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = Path(__file__).parent
SRC = HERE / "src"
OUT = HERE.parent.parent / "src" / "assets" / "fonts"
PUBLIC = HERE.parent.parent / "public" / "fonts"

SOURCES = {
    "merriweather": "https://fonts.gstatic.com/s/merriweather/v33/u-4e0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiSeqqJ-mXq1Gi.woff2",
    "opensans": "https://fonts.gstatic.com/s/opensans/v44/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-mu0SC55I.woff2",
}
LICENCES = {
    "merriweather": "https://raw.githubusercontent.com/google/fonts/main/ofl/merriweather/OFL.txt",
    "opensans": "https://raw.githubusercontent.com/google/fonts/main/ofl/opensans/OFL.txt",
}
# Basic Latin, Latin-1 and the punctuation the site actually uses.
UNICODES = [
    *range(0x20, 0x7F),
    *range(0xA0, 0x100),
    0x131, 0x152, 0x153, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D,
    0x2022, 0x2026, 0x20AC, 0x2122, 0x2190, 0x2192, 0x2212,
]  # fmt: skip
FEATURES = ["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk"]


def fetch(url: str, dest: Path) -> None:
    if not dest.exists():
        dest.write_bytes(urllib.request.urlopen(url).read())


def instance(src: Path, wght) -> TTFont:
    # Round-trip through memory: subsetting right after instancing trips on lazy glyph data.
    font = TTFont(src, lazy=False)
    font.flavor = None
    font = instancer.instantiateVariableFont(font, {"wght": wght})
    buf = io.BytesIO()
    font.save(buf)
    buf.seek(0)
    return TTFont(buf, lazy=False)


def trim(font: TTFont, dest: Path) -> None:
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = FEATURES
    opts.hinting = False
    opts.name_IDs = ["*"]
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=UNICODES)
    sub.subset(font)
    font.flavor = "woff2"
    font.save(dest)
    print(f"{dest.name}: {dest.stat().st_size:,} B")


def rename(font: TTFont, style: str, bold: bool) -> None:
    names = font["name"]
    names.names = [n for n in names.names if n.nameID not in (16, 17, 21, 22, 25)]
    full = f"Site Serif {style}"
    values = {
        1: "Site Serif",
        2: style if style != "Regular" else "Regular",
        3: f"SiteSerif-{style};subset",
        4: full,
        6: f"SiteSerif-{style}",
    }
    for n in names.names:
        if n.nameID in values:
            n.string = values[n.nameID]
    font["OS/2"].usWeightClass = 700 if bold else 400
    font["OS/2"].fsSelection = (font["OS/2"].fsSelection & ~0x61) | (
        0x20 if bold else 0x40
    )
    font["head"].macStyle = 1 if bold else 0


def main() -> None:
    SRC.mkdir(exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for key, url in SOURCES.items():
        fetch(url, SRC / f"{key}-latin.woff2")
        fetch(LICENCES[key], SRC / f"OFL-{key}.txt")
        shutil.copy(SRC / f"OFL-{key}.txt", PUBLIC / f"OFL-{key}.txt")

    for weight, style in ((400, "Regular"), (700, "Bold")):
        font = instance(SRC / "merriweather-latin.woff2", weight)
        rename(font, style, weight == 700)
        trim(font, OUT / f"merriweather-{weight}.woff2")

    trim(
        instance(SRC / "opensans-latin.woff2", (400, 700)),
        OUT / "opensans-variable.woff2",
    )


if __name__ == "__main__":
    main()

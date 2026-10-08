"""Render each blog post's opening into small light/dark thumbnails.

Run after `npm run build`, whenever a post changes: python3 tools/thumbs/make_thumbs.py
Needs Chrome (set CHROME to override the path). Output: src/assets/thumbs/<post>-{light,dark}.webp

The thumbnails are committed, so the site build itself needs no browser.
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile
from html.parser import HTMLParser
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist"
OUT = ROOT / "src" / "assets" / "thumbs"

PAGE_W, PAGE_H = (
    440,
    550,
)  # the post body at this width, cropped to the 4:5 thumbnail ratio
THUMB = (192, 240)  # 3x the 64x80 CSS box
BG = {"light": "#fff", "dark": "#171717"}
VOID = {
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "source",
    "track",
    "wbr",
}
CHROME_PATHS = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "google-chrome",
    "chromium",
]


class PostBodies(HTMLParser):
    """Collects the inner HTML of each post's article body, keyed by post id."""

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.bodies: dict[str, str] = {}
        self.post = None
        self.depth = 0
        self.parts: list[str] = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if self.depth:
            self.parts.append(self.get_starttag_text())
            if tag not in VOID:
                self.depth += 1
        elif tag == "details" and (a.get("id") or "").startswith("post-"):
            self.post = a["id"][len("post-") :]
        elif (
            tag == "div"
            and self.post
            and "prose-headings:font-sans" in (a.get("class") or "")
        ):
            self.depth = 1
            self.parts = []

    def handle_endtag(self, tag):
        if not self.depth:
            return
        self.depth -= 1
        if self.depth == 0:
            self.bodies[self.post] = "".join(self.parts)
            self.post = None
        else:
            self.parts.append(f"</{tag}>")

    def handle_data(self, data):
        if self.depth:
            self.parts.append(data)

    def handle_entityref(self, name):
        if self.depth:
            self.parts.append(f"&{name};")

    def handle_charref(self, name):
        if self.depth:
            self.parts.append(f"&#{name};")


def find_chrome() -> str:
    for p in [os.environ.get("CHROME"), *CHROME_PATHS]:
        if p and (Path(p).exists() or shutil.which(p)):
            return p
    sys.exit("Chrome not found; set CHROME to its path")


def main() -> None:
    index = (DIST / "index.html").read_text()
    css = re.search(r'href="(/_astro/index[^"]+\.css)"', index).group(1)
    parser = PostBodies()
    parser.feed(index)
    if not parser.bodies:
        sys.exit("no posts found in dist/index.html; run `npm run build` first")

    chrome = find_chrome()
    OUT.mkdir(parents=True, exist_ok=True)
    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", "4577", "--directory", str(DIST)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        for post_id, body in parser.bodies.items():
            for theme, bg in BG.items():
                page = DIST / f"_thumb-{post_id}-{theme}.html"
                page.write_text(
                    f'<!doctype html><html lang="en" class="{"dark" if theme == "dark" else ""}"><head>'
                    f'<meta charset="utf-8"><link rel="stylesheet" href="{css}">'
                    f"<style>html,body{{margin:0;background:{bg}}}</style></head>"
                    f'<body class="font-serif text-body"><div style="width:{PAGE_W}px" '
                    f'class="prose prose-neutral dark:prose-invert max-w-none '
                    f'prose-headings:font-sans prose-a:text-accent">{body}</div></body></html>'
                )
                with tempfile.TemporaryDirectory() as tmp:
                    shot = Path(tmp) / "shot.png"
                    subprocess.run(
                        [
                            chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                            "--window-size=520,700", "--virtual-time-budget=4000",
                            f"--screenshot={shot}", f"http://localhost:4577/{page.name}",
                        ],
                        check=True,
                        capture_output=True,
                    )  # fmt: skip
                    img = Image.open(shot).convert("RGB").crop((0, 0, PAGE_W, PAGE_H))
                page.unlink()
                dest = OUT / f"{post_id}-{theme}.webp"
                img.resize(THUMB, Image.LANCZOS).save(
                    dest, "WEBP", quality=80, method=6
                )
                print(f"{dest.relative_to(ROOT)}: {dest.stat().st_size:,} B")
    finally:
        server.terminate()


if __name__ == "__main__":
    main()

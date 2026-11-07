#!/usr/bin/env python3
"""Makes every picture the site needs from logo.jpeg (the BAZNAS logo: an emblem and the wordmark on white).

    python3 scripts/make_icons.py

The logo is cut, scaled and placed, never redrawn: replace logo.jpeg, run this, and every picture follows. Needs Pillow (pip3 install pillow).
A small icon cannot show the wordmark, so the app icons use the emblem alone (found by looking for the blank band between it and the text);
the share image uses the whole logo and nothing else. Writes, in public/:
  logo.png                      the whole logo, cropped and square (for the pages)
  logo-mark.png                 the emblem alone, square (the sidebar and the login page)
  icons/icon-192.png, icon-512.png            the app icon (the emblem on white)
  icons/icon-maskable-512.png   the emblem inside the safe zone: Android crops it to a circle or squircle
  icons/apple-touch-icon.png    180x180
  icons/favicon-32.png, icons/favicon-16.png, and favicon.ico (16, 32, 48): round, the emblem on a white circle with a thin green ring
  og-image.png                  1200x675 (16:9): the whole logo on white, the picture shown when the address is shared
  manifest.webmanifest          the installable app (PWA)
and app/lib/icon-version.generated.ts: a hash of all of them, added as ?v=... to their addresses (cache busting: browsers keep old favicons).
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "logo.jpeg"
PUBLIC = ROOT / "public"
WHITE = (255, 255, 255)
GREEN = (6, 78, 59)        # #064e3b: the app's theme colour
INK = (20, 97, 63)         # the green of the wordmark
GOLD = (245, 184, 35)      # the rice in the emblem
SITE_NAME = "Pendis BAZNAS"


def content_mask(im: Image.Image):
    import numpy as np
    a = np.asarray(im.convert("RGB")).astype(int)
    return (255 * 3 - a.sum(axis=2)) > 60          # anything that is not (nearly) white


def bands(flags, min_gap):
    """[(start, end)] of runs of True in a 1-D list, joined when the gap between them is smaller than min_gap."""
    runs, start = [], None
    for i, f in enumerate(list(flags) + [False]):
        if f and start is None:
            start = i
        elif not f and start is not None:
            runs.append([start, i - 1])
            start = None
    merged = []
    for r in runs:
        if merged and r[0] - merged[-1][1] < min_gap:
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    return merged


def split_logo(im: Image.Image):
    """(whole logo box, emblem box): (x0, y0, x1, y1) of the content, and of the top part above the wordmark."""
    mask = content_mask(im)
    rows = mask.any(axis=1)
    rows_bands = bands(rows, min_gap=12)
    top, bottom = rows_bands[0][0], rows_bands[-1][1]
    emblem_rows = rows_bands[0]
    xs = mask[emblem_rows[0]:emblem_rows[1] + 1].any(axis=0).nonzero()[0]
    all_xs = mask.any(axis=0).nonzero()[0]
    return (all_xs.min(), top, all_xs.max() + 1, bottom + 1), (xs.min(), emblem_rows[0], xs.max() + 1, emblem_rows[1] + 1)


def square(im: Image.Image, box, size: int, fill: float, bg=WHITE) -> Image.Image:
    """The part of im inside box, scaled so its longer side is `fill` of a size x size square, centred on bg."""
    part = im.crop(box)
    scale = size * fill / max(part.size)
    part = part.resize((max(1, round(part.width * scale)), max(1, round(part.height * scale))), Image.LANCZOS)
    out = Image.new("RGB", (size, size), bg)
    out.paste(part, ((size - part.width) // 2, (size - part.height) // 2))
    return out


def circle_icon(im: Image.Image, box, size: int, fill: float = 0.68) -> Image.Image:
    """The emblem on a white circle with a thin green ring, transparent outside it (the favicon). Drawn at 8x and scaled down, so the edge is smooth at 16 px."""
    big = size * 8
    out = Image.new("RGBA", (big, big), (255, 255, 255, 0))
    ring = max(2, round(big * 0.055))        # a thin green ring: the circle shows on a white tab bar too
    ImageDraw.Draw(out).ellipse([0, 0, big - 1, big - 1], fill=WHITE + (255,), outline=GREEN + (255,), width=ring)
    part = im.crop(box)
    scale = big * fill / max(part.size)       # the emblem is not round: this keeps its corners inside the circle
    part = part.resize((max(1, round(part.width * scale)), max(1, round(part.height * scale))), Image.LANCZOS)
    out.paste(part, ((big - part.width) // 2, (big - part.height) // 2))
    return out.resize((size, size), Image.LANCZOS)


def font(size: int, bold=True):
    for path in ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/HelveticaNeue.ttc", "/Library/Fonts/Arial Bold.ttf",
                 "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def og_image(im: Image.Image, whole) -> Image.Image:
    """16:9 (1200x675): the whole logo, centred on white. The logo is enough: no extra words."""
    W, H = 1200, 675
    out = Image.new("RGB", (W, H), WHITE)
    logo = square(im, whole, H, 0.92)
    out.paste(logo, ((W - H) // 2, 0))
    return out


def main():
    im = Image.open(SRC).convert("RGB")
    whole, emblem = split_logo(im)
    (PUBLIC / "icons").mkdir(parents=True, exist_ok=True)

    square(im, whole, 512, 0.94).save(PUBLIC / "logo.png", optimize=True)
    square(im, emblem, 256, 0.94).save(PUBLIC / "logo-mark.png", optimize=True)
    for size in (192, 512):
        square(im, emblem, size, 0.82).save(PUBLIC / "icons" / f"icon-{size}.png", optimize=True)
    square(im, emblem, 512, 0.58).save(PUBLIC / "icons" / "icon-maskable-512.png", optimize=True)   # inside the safe zone (the middle 80% circle)
    square(im, emblem, 180, 0.82).save(PUBLIC / "icons" / "apple-touch-icon.png", optimize=True)
    for size in (16, 32):   # the favicon is a circle
        circle_icon(im, emblem, size).save(PUBLIC / "icons" / f"favicon-{size}.png", optimize=True)
    circle_icon(im, emblem, 256).save(PUBLIC / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    og_image(im, whole).save(PUBLIC / "og-image.png", optimize=True)

    manifest = {
        "name": "Pendis BAZNAS — Aplikasi Pendistribusian ZIS",
        "short_name": "Pendis BAZNAS",
        "description": "Registrasi permohonan bantuan, assessment lapangan, moderasi pimpinan, dan penyaluran ZIS BAZNAS Kabupaten Cianjur.",
        "lang": "id",
        "start_url": "./",
        "scope": "./",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#064e3b",
    }
    files = ["logo.png", "logo-mark.png", "favicon.ico", "og-image.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png",
             "icons/apple-touch-icon.png", "icons/favicon-16.png", "icons/favicon-32.png"]
    version = hashlib.sha1(b"".join((PUBLIC / f).read_bytes() for f in files)).hexdigest()[:8]
    manifest["icons"] = [
        {"src": f"icons/icon-192.png?v={version}", "sizes": "192x192", "type": "image/png", "purpose": "any"},
        {"src": f"icons/icon-512.png?v={version}", "sizes": "512x512", "type": "image/png", "purpose": "any"},
        {"src": f"icons/icon-maskable-512.png?v={version}", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
    ]
    (PUBLIC / "manifest.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (ROOT / "app" / "lib" / "icon-version.generated.ts").write_text(
        "// Written by scripts/make_icons.py: a hash of the icon files, added as ?v=... to their addresses so browsers fetch new ones.\n"
        f'export const ICON_VERSION = "{version}";\n', encoding="utf-8")
    print(f"emblem box {tuple(int(v) for v in emblem)}, whole logo box {tuple(int(v) for v in whole)}, version {version}")
    for f in files + ["manifest.webmanifest"]:
        print(f"  public/{f}: {(PUBLIC / f).stat().st_size} bytes")


if __name__ == "__main__":
    main()

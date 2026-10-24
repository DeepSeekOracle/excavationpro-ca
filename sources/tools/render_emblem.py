#!/usr/bin/env python3
"""Render LYGO TV emblem rasters from the harmonic-orbit geometry.

Not Mastercard: hollow phi-scaled orbits, cyan geodesic, vesica lens only.
Run from anywhere: python sources/tools/render_emblem.py
"""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PHI = (1.0 + math.sqrt(5.0)) / 2.0
NAVY = (5, 7, 13, 255)
NAVY_DEEP = (4, 10, 22, 255)
GOLD = (212, 160, 23, 255)
GOLD_HI = (240, 210, 120, 255)
AMBER = (232, 165, 75, 255)
CYAN = (125, 211, 252, 255)
CYAN_HOT = (56, 189, 248, 255)


def _ellipse(draw: ImageDraw.ImageDraw, cx: float, cy: float, r: float, **kw) -> None:
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), **kw)


def _ring(draw: ImageDraw.ImageDraw, cx: float, cy: float, r: float, width: float, fill) -> None:
    _ellipse(draw, cx, cy, r + width / 2.0, outline=fill, width=max(1, int(round(width))))


def _circle_mask(size: tuple[int, int], cx: float, cy: float, r: float) -> Image.Image:
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    _ellipse(d, cx, cy, r, fill=255)
    return m


def _glow(layer: Image.Image, radius: int) -> Image.Image:
    return layer.filter(ImageFilter.GaussianBlur(radius=radius))


def _font(size: int, names: tuple[str, ...]) -> ImageFont.ImageFont:
    roots = [Path(r"C:\Windows\Fonts"), Path("/usr/share/fonts")]
    files = []
    for n in names:
        files.extend((n, n.replace(".ttf", ".TTF"), n.replace(".otf", ".OTF")))
    for base in roots:
        if not base.is_dir():
            continue
        for n in files:
            p = base / n
            if p.is_file():
                try:
                    return ImageFont.truetype(str(p), size=size)
                except OSError:
                    continue
    return ImageFont.load_default()


def paint_mark(canvas: Image.Image, *, cx: float, cy: float, r: float, glow: bool = True) -> None:
    """Draw the LYGO TV mark: two phi-harmonic orbits, vesica lens, cyan geodesic."""
    w, h = canvas.size
    size = (w, h)
    c1 = (cx - r * 0.5, cy)
    c2 = (cx + r * 0.5, cy)
    r_in = r / PHI
    stroke = max(1.6, r * 0.055)
    stroke_in = max(1.2, r * 0.032)

    if glow:
        g = Image.new("RGBA", size, (0, 0, 0, 0))
        gd = ImageDraw.Draw(g)
        _ring(gd, c1[0], c1[1], r, stroke * 3.2, GOLD)
        _ring(gd, c2[0], c2[1], r, stroke * 3.2, AMBER)
        canvas.alpha_composite(_glow(g, max(4, int(r * 0.18))))

    ves = ImageChops.multiply(
        _circle_mask(size, c1[0], c1[1], r),
        _circle_mask(size, c2[0], c2[1], r),
    )
    lens = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(lens).bitmap((0, 0), ves, fill=(56, 189, 248, 70))
    if glow:
        lens = Image.alpha_composite(_glow(lens, max(3, int(r * 0.12))), lens)
    canvas.alpha_composite(lens)

    rings = Image.new("RGBA", size, (0, 0, 0, 0))
    rd = ImageDraw.Draw(rings)
    _ring(rd, c1[0], c1[1], r, stroke, GOLD)
    _ring(rd, c1[0], c1[1], r_in, stroke_in, GOLD_HI)
    _ring(rd, c2[0], c2[1], r, stroke, AMBER)
    _ring(rd, c2[0], c2[1], r_in, stroke_in, GOLD_HI)
    canvas.alpha_composite(rings)

    geo = Image.new("RGBA", size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(geo)
    x = cx
    y0, y1 = cy - r * 1.12, cy + r * 1.12
    gw = max(2, int(r * 0.045))
    gd.line((x, y0, x, y1), fill=CYAN_HOT, width=gw)
    # short gold lattice tick through the vesica (Truth × Light)
    tick = r * 0.28
    gd.line((cx - tick, cy, cx + tick, cy), fill=GOLD, width=max(1, gw - 1))
    if glow:
        blob = Image.new("RGBA", size, (0, 0, 0, 0))
        bd = ImageDraw.Draw(blob)
        bd.line((x, y0, x, y1), fill=CYAN, width=gw * 3)
        canvas.alpha_composite(_glow(blob, max(3, int(r * 0.08))))
    canvas.alpha_composite(geo)

    # unity node — small Δ in the vesica (not a filled Mastercard disc)
    node = Image.new("RGBA", size, (0, 0, 0, 0))
    nd = ImageDraw.Draw(node)
    s = r * 0.11
    tri = [(cx, cy - s), (cx - s * 0.92, cy + s * 0.72), (cx + s * 0.92, cy + s * 0.72)]
    nd.polygon(tri, outline=CYAN, width=max(1, int(r * 0.02)))
    canvas.alpha_composite(node)


def square_emblem(px: int, *, rounded: bool = True) -> Image.Image:
    im = Image.new("RGBA", (px, px), NAVY)
    # subtle radial
    overlay = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse((px * -0.1, px * -0.1, px * 1.1, px * 1.1), fill=(10, 22, 40, 90))
    im.alpha_composite(overlay)
    r = px * 0.248
    paint_mark(im, cx=px / 2.0, cy=px / 2.0, r=r, glow=px >= 160)
    if rounded and px >= 64:
        mask = Image.new("L", (px, px), 0)
        rad = max(8, int(px * 0.12))
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, px - 1, px - 1), radius=rad, fill=255)
        out = Image.new("RGBA", (px, px), (0, 0, 0, 0))
        out.paste(im, mask=mask)
        return out
    return im


def photo_field(px: int) -> Image.Image:
    im = Image.new("RGBA", (px, px), NAVY_DEEP)
    r = px * 0.26
    paint_mark(im, cx=px / 2.0, cy=px / 2.0, r=r, glow=True)
    return im


def social(px: int = 1080) -> Image.Image:
    im = Image.new("RGBA", (px, px), (0, 0, 0, 255))
    r = px * 0.168
    paint_mark(im, cx=px / 2.0, cy=px * 0.42, r=r, glow=True)
    d = ImageDraw.Draw(im)
    font = _font(int(px * 0.072), ("georgia.ttf", "Georgia.ttf", "times.ttf", "timesi.ttf"))
    text = "LYGO TV"
    bbox = d.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    d.text(((px - tw) / 2.0, px * 0.72), text, font=font, fill=GOLD)
    sub = _font(int(px * 0.028), ("segoeui.ttf", "seguisym.ttf", "arial.ttf"))
    cap = "Δ9  ·  φ  ·  144 / 432"
    bb = d.textbbox((0, 0), cap, font=sub)
    d.text(((px - (bb[2] - bb[0])) / 2.0, px * 0.82), cap, font=sub, fill=CYAN)
    return im


def og(w: int = 1280, h: int = 720) -> Image.Image:
    im = Image.new("RGBA", (w, h), NAVY_DEEP)
    # vignette
    vig = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vig)
    vd.ellipse((-w * 0.2, -h * 0.4, w * 0.9, h * 1.4), fill=(8, 18, 36, 110))
    im.alpha_composite(vig)
    r = h * 0.22
    paint_mark(im, cx=w * 0.28, cy=h * 0.50, r=r, glow=True)
    d = ImageDraw.Draw(im)
    title = _font(int(h * 0.13), ("georgia.ttf", "Georgia.ttf", "times.ttf"))
    d.text((w * 0.50, h * 0.38), "LYGO TV", font=title, fill=GOLD)
    urlf = _font(int(h * 0.038), ("segoeui.ttf", "arial.ttf", "calibri.ttf"))
    d.text((w * 0.50, h * 0.56), "chatagent.ca/sources", font=urlf, fill=(148, 163, 184, 255))
    mathf = _font(int(h * 0.032), ("segoeui.ttf", "seguisym.ttf", "arial.ttf"))
    d.text((w * 0.50, h * 0.64), "Δ9  ·  φ  ·  144 / 432", font=mathf, fill=CYAN)
    return im


def save_png(im: Image.Image, path: Path, *, rgb: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if rgb:
        bg = Image.new("RGB", im.size, NAVY[:3])
        bg.paste(im, mask=im.split()[-1] if im.mode == "RGBA" else None)
        bg.save(path, "PNG", optimize=True)
    else:
        im.save(path, "PNG", optimize=True)


def main() -> int:
    save_png(square_emblem(192), ROOT / "icon-192.png")
    save_png(square_emblem(512), ROOT / "icon-512.png")
    save_png(square_emblem(180), ROOT / "apple-touch.png")
    save_png(photo_field(894), ROOT / "emblem-photo.png", rgb=True)
    save_png(social(1080), ROOT / "emblem-social.png")
    og_im = og(1280, 720).convert("RGB")
    og_im.save(ROOT / "og-tv.jpg", "JPEG", quality=92, optimize=True, subsampling=1)
    print("wrote emblem rasters under", ROOT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

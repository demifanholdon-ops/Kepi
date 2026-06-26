#!/usr/bin/env python3
from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "images"
DOCS = ROOT / "docs"


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def blend(c1: tuple[int, int, int, int], c2: tuple[int, int, int, int], t: float) -> tuple[int, int, int, int]:
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(4))


def ensure_dirs() -> None:
    for sub in ["board", "characters", "enemies", "ui", "ending"]:
        (PUBLIC / sub).mkdir(parents=True, exist_ok=True)


def save(img: Image.Image, rel: str) -> str:
    out = PUBLIC / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, format="PNG", optimize=True)
    return str(out.relative_to(ROOT))


def new_canvas(size: tuple[int, int], transparent: bool = False, bg: tuple[int, int, int, int] | None = None) -> Image.Image:
    if transparent:
        return Image.new("RGBA", size, (0, 0, 0, 0))
    return Image.new("RGBA", size, bg or (255, 255, 255, 255))


def vertical_gradient(size: tuple[int, int], top: tuple[int, int, int, int], bottom: tuple[int, int, int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGBA", size)
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        c = blend(top, bottom, t)
        for x in range(w):
            px[x, y] = c
    return img


def radial_glow(size: tuple[int, int], center: tuple[float, float], inner: tuple[int, int, int, int], outer: tuple[int, int, int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    px = img.load()
    cx, cy = center
    maxd = math.hypot(max(cx, w - cx), max(cy, h - cy))
    for y in range(h):
        for x in range(w):
            d = math.hypot(x - cx, y - cy) / maxd
            if d > 1:
                continue
            t = d * d
            px[x, y] = blend(inner, outer, t)
    return img


def add_watercolor_blobs(img: Image.Image, rng: random.Random, palette: list[str], count: int = 60, blur: int = 22) -> Image.Image:
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay, "RGBA")
    w, h = img.size
    for _ in range(count):
        c = rgba(rng.choice(palette), rng.randint(18, 70))
        x = rng.randint(-80, w + 80)
        y = rng.randint(-80, h + 80)
        rw = rng.randint(int(w * 0.04), int(w * 0.22))
        rh = rng.randint(int(h * 0.03), int(h * 0.18))
        d.ellipse((x, y, x + rw, y + rh), fill=c)
        if rng.random() < 0.35:
            d.ellipse((x + rw * 0.15, y + rh * 0.15, x + rw * 0.85, y + rh * 0.82), fill=rgba(rng.choice(palette), rng.randint(10, 35)))
    overlay = overlay.filter(ImageFilter.GaussianBlur(blur))
    return Image.alpha_composite(img, overlay)


def add_grain(img: Image.Image, rng: random.Random, amount: int = 6500) -> Image.Image:
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay, "RGBA")
    w, h = img.size
    for _ in range(amount):
        x = rng.randint(0, w - 1)
        y = rng.randint(0, h - 1)
        a = rng.randint(5, 20)
        tone = rng.choice([(255, 255, 255, a), (0, 0, 0, a // 2 + 3)])
        d.point((x, y), fill=tone)
    return Image.alpha_composite(img, overlay)


def vignette(img: Image.Image, strength: int = 100) -> Image.Image:
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((-w * 0.08, -h * 0.08, w * 1.08, h * 1.08), fill=255)
    mask = ImageOps.invert(mask).filter(ImageFilter.GaussianBlur(strength))
    dark = Image.new("RGBA", (w, h), (18, 20, 28, 120))
    dark.putalpha(mask)
    return Image.alpha_composite(img, dark)


def line(draw: ImageDraw.ImageDraw, pts: list[tuple[float, float]], fill, width: int = 4) -> None:
    draw.line(pts, fill=fill, width=width, joint="curve")


def soft_shape(base: Image.Image, bbox, fill, outline=None, outline_width: int = 0, blur: int = 0) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    if outline and outline_width > 0:
        d.ellipse(bbox, fill=outline)
        inset = outline_width
        inner = (bbox[0] + inset, bbox[1] + inset, bbox[2] - inset, bbox[3] - inset)
        d.ellipse(inner, fill=fill)
    else:
        d.ellipse(bbox, fill=fill)
    if blur:
        layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)


def rounded_rect(layer: Image.Image, bbox, radius: int, fill, outline=None, outline_width: int = 0) -> None:
    d = ImageDraw.Draw(layer, "RGBA")
    d.rounded_rectangle(bbox, radius=radius, fill=fill, outline=outline, width=outline_width)


def add_circle_ring(draw: ImageDraw.ImageDraw, center: tuple[float, float], radius: float, fill, width: int = 6) -> None:
    x, y = center
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), outline=fill, width=width)


def draw_roundhouse_base(size: tuple[int, int], stage: int = 1, mode: str = "board") -> Image.Image:
    w, h = size
    rng = random.Random(1000 + stage * 37 + (0 if mode == "board" else 11 if mode == "battle" else 19))
    if mode == "ending":
        img = vertical_gradient(size, rgba("#2d3458"), rgba("#090b13"))
        img = add_watercolor_blobs(img, rng, ["#4e6e93", "#6f8ca2", "#d0b79a", "#7f4c54", "#1a2441"], 55, 26)
        d = ImageDraw.Draw(img, "RGBA")
        for y in range(int(h * 0.45), h, 6):
            t = (y - h * 0.45) / max(1, h * 0.55)
            wave = math.sin(t * 8 + stage) * 10 + math.sin(t * 21) * 5
            d.line((0, y + wave, w, y + wave + 12), fill=rgba("#163a5a", 70), width=3)
        # moon and sea glow
        d.ellipse((w * 0.7, h * 0.12, w * 0.84, h * 0.26), fill=rgba("#fff5d0", 170))
        d.ellipse((w * 0.67, h * 0.09, w * 0.87, h * 0.29), outline=rgba("#f6e3b1", 120), width=4)
        boat = [(w * 0.42, h * 0.63), (w * 0.56, h * 0.63), (w * 0.51, h * 0.70), (w * 0.45, h * 0.70)]
        d.polygon(boat, fill=rgba("#332728", 220), outline=rgba("#1a1112", 240))
        d.line((w * 0.49, h * 0.23, w * 0.49, h * 0.65), fill=rgba("#f1d9ac", 160), width=4)
        d.polygon([(w * 0.49, h * 0.26), (w * 0.60, h * 0.39), (w * 0.49, h * 0.39)], fill=rgba("#efe3c7", 155))
        return vignette(add_grain(img, rng, 4000), 80)

    img = vertical_gradient(size, rgba("#d8efe7"), rgba("#6d89a2"))
    if mode == "battle":
        img = vertical_gradient(size, rgba("#4b5f72"), rgba("#1b2232"))
    img = add_watercolor_blobs(img, rng, ["#f0e2c7", "#d9b78c", "#a0c7bf", "#6d8d96", "#4f5d6f", "#8c6d58"], 75, 28)
    d = ImageDraw.Draw(img, "RGBA")
    # distant hills
    hill_colors = [("#7b8d82", 78), ("#5f766f", 92), ("#3e4d58", 112)]
    for idx, (c, a) in enumerate(hill_colors):
        base_y = h * (0.45 + idx * 0.05)
        pts = [(0, h), (0, base_y)]
        for x in range(0, w + 80, 120):
            y = base_y - math.sin((x / w) * math.pi * (1.1 + idx * 0.2)) * (40 + idx * 16) - idx * 18
            pts.append((x, y))
        pts += [(w, h), (0, h)]
        d.polygon(pts, fill=rgba(c, a))
    # board floor
    floor = Image.new("RGBA", size, (0, 0, 0, 0))
    fd = ImageDraw.Draw(floor, "RGBA")
    fd.rectangle((0, h * 0.67, w, h), fill=rgba("#8e6d4a", 85))
    fd.arc((w * 0.05, h * 0.14, w * 0.95, h * 1.02), start=200, end=340, fill=rgba("#f0e0bb", 90), width=6)
    floor = floor.filter(ImageFilter.GaussianBlur(2))
    img = Image.alpha_composite(img, floor)

    cx, cy = w * 0.5, h * 0.53
    outer_r = min(w, h) * 0.28
    mid_r = outer_r * 0.72
    inner_r = outer_r * 0.42
    wall_color = {"board": "#8a6a54", "battle": "#5d4c44", "ending": "#76584f"}.get(mode, "#8a6a54")
    roof_color = {"board": "#b89267", "battle": "#7d5649", "ending": "#8f6e5a"}.get(mode, "#b89267")
    courtyard_color = "#d6c39d"
    ring_shadow = Image.new("RGBA", size, (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring_shadow, "RGBA")
    rd.ellipse((cx - outer_r - 18, cy - outer_r - 12, cx + outer_r + 18, cy + outer_r + 12), fill=rgba("#1c1a1a", 55))
    ring_shadow = ring_shadow.filter(ImageFilter.GaussianBlur(18))
    img = Image.alpha_composite(img, ring_shadow)

    d.ellipse((cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r), fill=rgba(wall_color, 228), outline=rgba("#382e27", 255), width=10)
    d.ellipse((cx - mid_r, cy - mid_r, cx + mid_r, cy + mid_r), fill=rgba("#a78a6a", 132), outline=rgba("#4b3a31", 200), width=7)
    d.ellipse((cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r), fill=rgba(courtyard_color, 240), outline=rgba("#79634f", 180), width=5)
    # inner rings / corridors
    for rr, col, wid in [(outer_r * 0.83, "#d7b78a", 12), (outer_r * 0.62, "#f5e8c8", 9), (outer_r * 0.50, "#8f6c56", 8)]:
        d.arc((cx - rr, cy - rr, cx + rr, cy + rr), 210, 330, fill=rgba(col, 165), width=wid)

    # roof tiles
    tiles = 34
    for i in range(tiles):
        ang = (i / tiles) * 2 * math.pi - math.pi / 2
        x1 = cx + math.cos(ang) * (outer_r * 0.91)
        y1 = cy + math.sin(ang) * (outer_r * 0.91)
        x2 = cx + math.cos(ang + 0.06) * (outer_r * 0.99)
        y2 = cy + math.sin(ang + 0.06) * (outer_r * 0.99)
        x3 = cx + math.cos(ang + 0.16) * (outer_r * 0.98)
        y3 = cy + math.sin(ang + 0.16) * (outer_r * 0.98)
        x4 = cx + math.cos(ang + 0.10) * (outer_r * 0.90)
        y4 = cy + math.sin(ang + 0.10) * (outer_r * 0.90)
        fill = blend(rgba(roof_color, 200), rgba("#f2deb5", 170), 0.2 if i % 2 else 0.05)
        d.polygon([(x1, y1), (x2, y2), (x3, y3), (x4, y4)], fill=fill, outline=rgba("#5c463c", 130))

    # board grid-ish ring markings
    for r, a in [(outer_r * 0.42, 75), (outer_r * 0.56, 60), (outer_r * 0.70, 55)]:
        d.arc((cx - r, cy - r, cx + r, cy + r), 0, 360, fill=rgba("#fff1d1", a), width=2)

    # courtyard / center
    d.ellipse((cx - inner_r * 0.36, cy - inner_r * 0.36, cx + inner_r * 0.36, cy + inner_r * 0.36), fill=rgba("#f2e4b9", 210), outline=rgba("#ab8d5f", 160), width=4)
    d.ellipse((cx - inner_r * 0.14, cy - inner_r * 0.14, cx + inner_r * 0.14, cy + inner_r * 0.14), fill=rgba("#d9c38c", 220))
    # lanterns and windows
    lantern_count = 12 if stage == 1 else 18 if stage == 2 else 24
    for i in range(lantern_count):
        ang = (i / lantern_count) * 2 * math.pi - math.pi / 2
        r = outer_r * 0.74
        x = cx + math.cos(ang) * r
        y = cy + math.sin(ang) * r
        d.ellipse((x - 12, y - 12, x + 12, y + 12), fill=rgba("#e1ac4c", 170))
        d.ellipse((x - 5, y - 5, x + 5, y + 5), fill=rgba("#fff1bc", 210))
    # stage-specific condition
    if stage <= 1:
        for ox, oy, r in [(cx - 210, cy - 60, 28), (cx + 170, cy + 40, 22), (cx - 40, cy + 170, 18)]:
            d.ellipse((ox - r, oy - r, ox + r, oy + r), fill=rgba("#231c1b", 210))
            d.line((ox - r - 8, oy - r, ox + r + 8, oy + r), fill=rgba("#4c3d37", 140), width=5)
        d.line((cx - 260, cy + 130, cx - 190, cy + 90), fill=rgba("#483e3a", 140), width=8)
        d.line((cx - 240, cy + 150, cx - 172, cy + 118), fill=rgba("#9f7d61", 120), width=6)
    elif stage == 2:
        for bx, by, bw, bh in [(cx - 235, cy - 80, 70, 38), (cx + 135, cy + 18, 52, 28), (cx - 20, cy + 150, 86, 28)]:
            d.rounded_rectangle((bx, by, bx + bw, by + bh), radius=10, fill=rgba("#d8c09d", 200), outline=rgba("#675241", 170), width=4)
        d.line((cx - 246, cy + 140, cx - 180, cy + 108), fill=rgba("#7b624f", 130), width=6)
    else:
        for i in range(14):
            ang = (i / 14) * 2 * math.pi - math.pi / 2
            x = cx + math.cos(ang) * outer_r * 0.95
            y = cy + math.sin(ang) * outer_r * 0.95
            d.ellipse((x - 7, y - 7, x + 7, y + 7), fill=rgba("#f5d889", 200))
        d.line((cx - 220, cy + 130, cx - 120, cy + 85), fill=rgba("#88b77b", 125), width=8)
        d.line((cx + 170, cy + 90, cx + 260, cy + 55), fill=rgba("#7dad76", 120), width=8)
        d.ellipse((cx - 80, cy - 130, cx - 20, cy - 80), fill=rgba("#6bb07d", 80))
        d.ellipse((cx + 50, cy - 130, cx + 110, cy - 78), fill=rgba("#6bb07d", 80))

    # subtle radial spokes on board background
    if mode == "board":
        spokes = 18
        for i in range(spokes):
            ang = (i / spokes) * 2 * math.pi
            x = cx + math.cos(ang) * outer_r * 1.08
            y = cy + math.sin(ang) * outer_r * 1.08
            d.line((cx, cy, x, y), fill=rgba("#fff4dc", 20), width=2)
        d.ellipse((cx - outer_r * 1.04, cy - outer_r * 1.04, cx + outer_r * 1.04, cy + outer_r * 1.04), outline=rgba("#fff2d6", 40), width=3)
    return vignette(add_grain(img, rng, 3000), 92)


def draw_board_background(stage: int) -> Image.Image:
    return draw_roundhouse_base((1600, 900), stage=stage, mode="board")


def draw_battle_background() -> Image.Image:
    img = draw_roundhouse_base((1600, 900), stage=2, mode="battle")
    d = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    # battle haze
    haze = Image.new("RGBA", img.size, (0, 0, 0, 0))
    hd = ImageDraw.Draw(haze, "RGBA")
    for x in range(0, w, 120):
        hd.polygon([(x, h * 0.08), (x + 60, h * 0.02), (x + 120, h * 0.08), (x + 95, h * 0.22), (x + 25, h * 0.22)], fill=rgba("#8f3d3c", 34))
    haze = haze.filter(ImageFilter.GaussianBlur(16))
    img = Image.alpha_composite(img, haze)
    d.rectangle((0, 0, w, 180), fill=rgba("#12202f", 92))
    d.rectangle((0, h - 160, w, h), fill=rgba("#2d1c18", 62))
    d.line((0, 185, w, 185), fill=rgba("#f5db9a", 52), width=4)
    return vignette(add_grain(img, random.Random(4802), 2600), 94)


def draw_ending_background() -> Image.Image:
    return draw_roundhouse_base((1600, 900), stage=3, mode="ending")


def draw_wind_wave_background() -> Image.Image:
    w, h = 1600, 900
    rng = random.Random(9011)
    img = vertical_gradient((w, h), rgba("#2a3a5a"), rgba("#09101d"))
    img = add_watercolor_blobs(img, rng, ["#6c8fb8", "#91adc0", "#d9c8a1", "#315678", "#5f7787"], 45, 30)
    d = ImageDraw.Draw(img, "RGBA")
    for y in range(int(h * 0.25), h, 22):
        wave1 = math.sin(y / 33.0) * 14
        d.line((0, y + wave1, w, y + wave1 + 12), fill=rgba("#5f8ea9", 68), width=5)
    for i in range(14):
        x = 100 + i * 110
        d.polygon([(x, 320), (x + 40, 305), (x + 110, 350), (x + 38, 372)], fill=rgba("#f0e0be", 120), outline=rgba("#f6edd8", 120))
    # floating letters / paper
    for i in range(30):
        x = rng.randint(0, w)
        y = rng.randint(0, h)
        sw = rng.randint(26, 64)
        sh = rng.randint(16, 42)
        a = rng.randint(65, 140)
        d.rounded_rectangle((x, y, x + sw, y + sh), radius=6, fill=rgba("#f5ebd7", a), outline=rgba("#c7b08a", a))
        d.line((x + 5, y + sh * 0.35, x + sw - 5, y + sh * 0.35), fill=rgba("#9d7a57", a), width=2)
    d.arc((w * 0.12, h * 0.45, w * 0.88, h * 1.02), 200, 340, fill=rgba("#f5e5b5", 95), width=10)
    return vignette(add_grain(img, rng, 3200), 90)


def draw_character(kind: str) -> Image.Image:
    size = (1024, 1280)
    img = new_canvas(size, transparent=True)
    rng = random.Random(hash(kind) & 0xFFFF)
    w, h = size
    cx = w * 0.5
    shoulder_y = 470
    hip_y = 840
    if kind in {"patriarch", "xiangxian", "teacher", "fengshui"}:
        aura = ["#ead8bb", "#c1d2d8", "#7f93ad", "#5a6d8a"]
    else:
        aura = ["#e6d0a8", "#b5cad0", "#7e9ab9", "#63757f"]
    img = add_watercolor_blobs(img, rng, aura, 18, 32)
    d = ImageDraw.Draw(img, "RGBA")
    # shadow
    d.ellipse((cx - 170, 1015, cx + 170, 1080), fill=rgba("#1a1010", 65))
    # body palette defaults
    skin = rgba("#d7b18f")
    line_c = rgba("#2f2732")
    blue = rgba("#5777a7")
    dark_blue = rgba("#334e78")
    indigo = rgba("#2f4469")
    brown = rgba("#7b614b")
    dark = rgba("#1c1d24")
    red = rgba("#a24d4b")
    gold = rgba("#c79a58")

    def face(x: float, y: float, r: int = 72, expression: str = "soft") -> None:
        d.ellipse((x - r, y - r, x + r, y + r), fill=skin, outline=line_c, width=6)
        # hair / ears
        d.ellipse((x - r - 10, y - 10, x + r + 10, y + r + 10), outline=rgba("#1a1417", 40), width=2)
        d.ellipse((x - r - 16, y - 10, x - r + 2, y + 20), fill=skin)
        d.ellipse((x + r - 2, y - 10, x + r + 16, y + 20), fill=skin)
        # eyes
        d.ellipse((x - 32, y - 8, x - 22, y + 2), fill=line_c)
        d.ellipse((x + 22, y - 8, x + 32, y + 2), fill=line_c)
        if expression == "warm":
            d.arc((x - 20, y + 18, x + 20, y + 38), 10, 170, fill=line_c, width=4)
        elif expression == "stern":
            d.line((x - 18, y + 22, x + 18, y + 18), fill=line_c, width=4)
        else:
            d.arc((x - 18, y + 14, x + 18, y + 34), 20, 160, fill=line_c, width=4)

    def long_robe(top_color, bottom_color, sleeve_color=None, wide=False):
        sleeve_color = sleeve_color or top_color
        # robe body
        d.polygon([(cx - 170, shoulder_y), (cx + 170, shoulder_y), (cx + 220, hip_y + 240), (cx - 220, hip_y + 240)], fill=top_color, outline=line_c)
        d.polygon([(cx - 155, shoulder_y + 40), (cx + 155, shoulder_y + 40), (cx + 182, hip_y + 250), (cx - 182, hip_y + 250)], fill=bottom_color)
        # sleeves
        s = 250 if wide else 190
        d.polygon([(cx - 170, shoulder_y + 18), (cx - 320, shoulder_y + 70), (cx - 260, shoulder_y + 150), (cx - 120, shoulder_y + 120)], fill=sleeve_color, outline=line_c)
        d.polygon([(cx + 170, shoulder_y + 18), (cx + 320, shoulder_y + 70), (cx + 260, shoulder_y + 150), (cx + 120, shoulder_y + 120)], fill=sleeve_color, outline=line_c)
        d.line((cx - 240, shoulder_y + 120, cx - 302, shoulder_y + 170), fill=line_c, width=14)
        d.line((cx + 240, shoulder_y + 120, cx + 302, shoulder_y + 170), fill=line_c, width=14)
        # lower hems
        d.line((cx - 150, hip_y + 206, cx - 110, hip_y + 360), fill=line_c, width=14)
        d.line((cx + 150, hip_y + 206, cx + 110, hip_y + 360), fill=line_c, width=14)

    def short_jacket(body_color, pants_color, accent=None):
        accent = accent or body_color
        d.rounded_rectangle((cx - 175, shoulder_y - 12, cx + 175, hip_y - 30), radius=40, fill=body_color, outline=line_c, width=4)
        d.line((cx - 10, shoulder_y - 10, cx - 10, hip_y - 20), fill=rgba("#e6d7b4"), width=3)
        d.line((cx - 180, shoulder_y + 30, cx + 180, shoulder_y + 30), fill=rgba("#d8c0a0"), width=4)
        d.polygon([(cx - 120, hip_y - 20), (cx - 10, hip_y - 20), (cx - 45, 1110), (cx - 155, 1110)], fill=pants_color, outline=line_c)
        d.polygon([(cx + 10, hip_y - 20), (cx + 120, hip_y - 20), (cx + 155, 1110), (cx + 45, 1110)], fill=pants_color, outline=line_c)
        # arms
        d.line((cx - 170, shoulder_y + 36, cx - 280, shoulder_y + 110), fill=line_c, width=14)
        d.line((cx + 170, shoulder_y + 36, cx + 270, shoulder_y + 108), fill=line_c, width=14)

    def hat_bamboo():
        d.ellipse((cx - 190, 130, cx + 190, 270), fill=rgba("#b88f59", 235), outline=line_c, width=5)
        d.ellipse((cx - 160, 155, cx + 160, 245), fill=rgba("#d4b072", 220))
        for i in range(-8, 9):
            x = cx + i * 18
            d.line((x, 160, x - 20, 246), fill=rgba("#7a563a", 110), width=3)
        d.rectangle((cx - 170, 220, cx + 170, 262), fill=rgba("#1d1b21", 190))

    def hat_round():
        d.ellipse((cx - 170, 130, cx + 170, 260), fill=rgba("#b79160", 240), outline=line_c, width=5)
        d.arc((cx - 120, 150, cx + 120, 235), 200, 340, fill=rgba("#6f533d", 70), width=5)

    def cap_square(color=dark):
        d.rounded_rectangle((cx - 140, 130, cx + 140, 230), radius=20, fill=color, outline=line_c, width=5)
        d.rectangle((cx - 110, 120, cx + 110, 150), fill=color)

    def taoist_cap():
        d.rounded_rectangle((cx - 135, 128, cx + 135, 220), radius=70, fill=rgba("#1e2028"), outline=line_c, width=5)
        d.arc((cx - 100, 132, cx + 100, 208), 200, 340, fill=rgba("#8893a2", 70), width=4)

    def add_prop_scroll():
        d.line((cx + 220, shoulder_y + 120, cx + 300, shoulder_y + 240), fill=line_c, width=10)
        d.rounded_rectangle((cx + 235, shoulder_y + 215, cx + 355, shoulder_y + 275), radius=16, fill=rgba("#f0e2c3"), outline=line_c, width=4)

    if kind == "farmer":
        img = add_watercolor_blobs(img, rng, ["#8aa6c3", "#405c82", "#a8946a"], 8, 24)
        hat_bamboo()
        face(cx, 330, 80, "warm")
        short_jacket(indigo, rgba("#334b63"))
        d.line((cx + 220, shoulder_y + 150, cx + 290, 730), fill=line_c, width=16)
        d.line((cx - 220, shoulder_y + 150, cx - 280, 710), fill=line_c, width=16)
        d.line((cx + 250, 710, cx + 350, 640), fill=rgba("#7b5a3d"), width=18)
        d.line((cx + 350, 640, cx + 410, 570), fill=rgba("#7b5a3d"), width=12)
        d.line((cx + 345, 585, cx + 405, 595), fill=rgba("#7b5a3d"), width=10)
        d.line((cx + 220, 760, cx + 80, 980), fill=line_c, width=18)
        d.line((cx - 220, 760, cx - 80, 980), fill=line_c, width=18)
        d.line((cx + 80, 980, cx + 150, 980), fill=line_c, width=18)
        d.line((cx - 80, 980, cx - 150, 980), fill=line_c, width=18)
    elif kind == "guard":
        img = add_watercolor_blobs(img, rng, ["#6b8398", "#b29a6c", "#8a4f4d"], 10, 26)
        d.ellipse((cx - 200, 150, cx + 200, 350), fill=rgba("#a68955", 180), outline=line_c, width=5)
        d.ellipse((cx - 170, 175, cx + 170, 310), fill=rgba("#d0b06f", 155))
        d.rectangle((cx - 190, 290, cx + 190, 350), fill=rgba("#18263a", 210))
        face(cx, 340, 78, "stern")
        short_jacket(dark_blue, rgba("#2d3645"))
        d.rectangle((cx + 150, shoulder_y + 20, cx + 205, shoulder_y + 70), fill=rgba("#a54a49", 230))
        d.line((cx + 250, shoulder_y + 100, cx + 250, 760), fill=line_c, width=18)
        d.line((cx + 250, 760, cx + 340, 970), fill=rgba("#4a3b2d"), width=20)
        d.line((cx + 250, 530, cx + 350, 510), fill=rgba("#4a3b2d"), width=16)
        d.line((cx + 350, 510, cx + 410, 450), fill=rgba("#4a3b2d"), width=12)
        d.line((cx - 220, 740, cx - 90, 980), fill=line_c, width=18)
        d.line((cx + 60, 740, cx + 0, 980), fill=line_c, width=18)
        d.line((cx - 90, 980, cx - 20, 980), fill=line_c, width=18)
    elif kind == "shuike":
        img = add_watercolor_blobs(img, rng, ["#8ca9c2", "#7c8b6c", "#b9d0d5"], 12, 26)
        hat_round()
        face(cx, 340, 78, "warm")
        d.rounded_rectangle((cx - 170, 420, cx + 170, 850), radius=56, fill=rgba("#5778a2", 235), outline=line_c, width=4)
        d.line((cx - 10, 425, cx - 10, 850), fill=rgba("#edd2a2"), width=3)
        d.line((cx - 250, 500, cx - 330, 650), fill=line_c, width=14)
        d.line((cx + 250, 500, cx + 330, 650), fill=line_c, width=14)
        d.line((cx - 320, 650, cx - 420, 650), fill=line_c, width=16)
        d.line((cx + 330, 650, cx + 430, 650), fill=line_c, width=16)
        d.line((cx - 395, 650, cx - 450, 580), fill=rgba("#7f5c3e"), width=14)
        d.line((cx + 405, 650, cx + 460, 580), fill=rgba("#7f5c3e"), width=14)
        d.rounded_rectangle((cx - 470, 580, cx - 350, 690), radius=12, fill=rgba("#9b6d43", 220), outline=line_c, width=4)
        d.rounded_rectangle((cx + 350, 580, cx + 470, 690), radius=12, fill=rgba("#9b6d43", 220), outline=line_c, width=4)
        d.rounded_rectangle((cx - 78, 690, cx + 78, 770), radius=16, fill=rgba("#6c4f3f", 220), outline=line_c, width=4)
        d.line((cx - 260, 860, cx - 140, 1080), fill=line_c, width=18)
        d.line((cx + 260, 860, cx + 140, 1080), fill=line_c, width=18)
        d.line((cx - 140, 1080, cx - 70, 1080), fill=line_c, width=18)
        d.line((cx + 140, 1080, cx + 70, 1080), fill=line_c, width=18)
    elif kind == "teacher":
        img = add_watercolor_blobs(img, rng, ["#92a7c6", "#d5c39f", "#7784a4"], 10, 24)
        cap_square(rgba("#b8a59a"))
        face(cx, 330, 78, "calm")
        long_robe(dark_blue, rgba("#415d84"), sleeve_color=rgba("#4f6a91"))
        add_prop_scroll()
        d.line((cx - 250, 690, cx - 180, 900), fill=line_c, width=16)
        d.line((cx + 250, 690, cx + 180, 900), fill=line_c, width=16)
        d.line((cx - 180, 900, cx - 110, 900), fill=line_c, width=16)
        d.line((cx + 180, 900, cx + 110, 900), fill=line_c, width=16)
        d.line((cx - 105, 450, cx + 105, 450), fill=rgba("#efe0b7"), width=4)
    elif kind == "xiangxian":
        img = add_watercolor_blobs(img, rng, ["#7d8da8", "#baa27b", "#9a6d58"], 12, 24)
        d.rounded_rectangle((cx - 120, 135, cx + 120, 240), radius=28, fill=rgba("#75675a"), outline=line_c, width=5)
        face(cx, 335, 80, "soft")
        long_robe(rgba("#42587f"), rgba("#324861"), sleeve_color=rgba("#506a95"), wide=False)
        d.rectangle((cx + 220, 510, cx + 360, 570), fill=rgba("#ead8bf"), outline=line_c, width=4)
        d.line((cx + 290, 505, cx + 260, 375), fill=line_c, width=6)
        d.line((cx + 286, 575, cx + 248, 710), fill=line_c, width=6)
        d.line((cx - 260, 760, cx - 135, 980), fill=line_c, width=18)
        d.line((cx + 260, 760, cx + 135, 980), fill=line_c, width=18)
        d.line((cx - 135, 980, cx - 60, 980), fill=line_c, width=18)
        d.line((cx + 135, 980, cx + 60, 980), fill=line_c, width=18)
    elif kind == "fengshui":
        img = add_watercolor_blobs(img, rng, ["#90a6bb", "#6d7c8b", "#b68a6f"], 12, 26)
        taoist_cap()
        face(cx, 330, 78, "mystic")
        long_robe(rgba("#607795"), rgba("#3d5069"), sleeve_color=rgba("#506d8a"), wide=True)
        # yin-yang on chest
        d.ellipse((cx - 70, 500, cx + 70, 640), outline=rgba("#e4dfcd"), width=5)
        d.arc((cx - 52, 520, cx + 52, 620), 50, 230, fill=rgba("#f3e2ae"), width=12)
        d.arc((cx - 52, 520, cx + 52, 620), 230, 410, fill=rgba("#1b1d22"), width=12)
        d.ellipse((cx - 280, 475, cx - 190, 565), fill=rgba("#ece1c6"), outline=line_c, width=4)
        d.ellipse((cx + 190, 475, cx + 280, 565), fill=rgba("#ece1c6"), outline=line_c, width=4)
        d.line((cx - 330, 640, cx - 190, 580), fill=line_c, width=12)
        d.line((cx + 330, 640, cx + 190, 580), fill=line_c, width=12)
        d.line((cx - 250, 760, cx - 150, 980), fill=line_c, width=18)
        d.line((cx + 250, 760, cx + 150, 980), fill=line_c, width=18)
        d.line((cx - 150, 980, cx - 80, 980), fill=line_c, width=18)
        d.line((cx + 150, 980, cx + 80, 980), fill=line_c, width=18)
        # compass and staff
        d.ellipse((cx + 220, 520, cx + 330, 630), outline=rgba("#e0c184"), width=5)
        d.line((cx + 275, 500, cx + 275, 655), fill=rgba("#e0c184"), width=4)
        d.line((cx + 220, 575, cx + 330, 575), fill=rgba("#e0c184"), width=4)
        d.line((cx + 250, 535, cx + 300, 625), fill=rgba("#e0c184"), width=4)
        d.line((cx + 300, 535, cx + 250, 625), fill=rgba("#e0c184"), width=4)
    elif kind == "patriarch":
        img = add_watercolor_blobs(img, rng, ["#8a8f9e", "#63758c", "#c9b08e"], 10, 22)
        cap_square(dark)
        face(cx, 325, 78, "stern")
        long_robe(rgba("#17161d"), rgba("#24222b"), sleeve_color=rgba("#131318"), wide=True)
        d.line((cx - 230, 500, cx - 330, 560), fill=line_c, width=14)
        d.line((cx + 230, 500, cx + 330, 560), fill=line_c, width=14)
        d.line((cx - 330, 560, cx - 380, 700), fill=line_c, width=14)
        d.line((cx + 330, 560, cx + 380, 700), fill=line_c, width=14)
        d.line((cx - 250, 740, cx - 140, 980), fill=line_c, width=20)
        d.line((cx + 250, 740, cx + 140, 980), fill=line_c, width=20)
        d.line((cx - 140, 980, cx - 60, 980), fill=line_c, width=20)
        d.line((cx + 140, 980, cx + 60, 980), fill=line_c, width=20)
        # staff and seal
        d.line((cx + 330, 500, cx + 370, 930), fill=rgba("#574332"), width=12)
        d.ellipse((cx + 310, 465, cx + 390, 545), fill=rgba("#b2b2ad"), outline=line_c, width=4)
        d.rounded_rectangle((cx - 100, 640, cx - 20, 700), radius=12, fill=rgba("#6a4d3a"), outline=line_c, width=4)
    else:
        face(cx, 330, 78, "warm")
        short_jacket(blue, rgba("#34495f"))
    # shared features for all
    d.ellipse((cx - 64, 278, cx - 50, 292), fill=rgba("#1d1b22", 110))
    d.ellipse((cx + 50, 278, cx + 64, 292), fill=rgba("#1d1b22", 110))
    return img.filter(ImageFilter.GaussianBlur(0.2))


def draw_enemy(kind: str) -> Image.Image:
    size = (1024, 1280)
    img = new_canvas(size, transparent=True)
    rng = random.Random((hash(kind) ^ 0xBEEF) & 0xFFFF)
    w, h = size
    cx = w * 0.5
    img = add_watercolor_blobs(img, rng, ["#9eb3be", "#6f8190", "#ba6c5e", "#6a777f"], 16, 28)
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse((cx - 180, 1010, cx + 180, 1080), fill=rgba("#101112", 78))
    line_c = rgba("#1d1e22")
    cold = rgba("#7c8b95")
    red = rgba("#b3433f")
    rust = rgba("#8d4c3f")
    paper = rgba("#d6cbb0")
    stone = rgba("#8a8d92")
    darkstone = rgba("#51555d")
    if kind == "qianhai-stele":
        d.polygon([(cx - 170, 210), (cx + 90, 210), (cx + 120, 980), (cx - 190, 980)], fill=stone, outline=line_c)
        d.polygon([(cx - 200, 160), (cx + 120, 160), (cx + 160, 230), (cx - 160, 230)], fill=darkstone, outline=line_c)
        for y in range(320, 860, 110):
            d.rectangle((cx - 130, y, cx + 20, y + 34), fill=rgba("#b84e46", 160))
        for i in range(8):
            d.line((cx - 120 + i * 18, 260, cx - 150 + i * 18, 900), fill=rgba("#2f3135", 120), width=4)
        d.line((cx - 80, 950, cx - 150, 1080), fill=line_c, width=18)
        d.line((cx + 40, 950, cx + 120, 1080), fill=line_c, width=18)
        d.ellipse((cx - 70, 410, cx + 35, 505), outline=rgba("#e7ddd0", 95), width=4)
    elif kind == "luyin-clerk":
        d.rounded_rectangle((cx - 175, 250, cx + 175, 940), radius=20, fill=darkstone, outline=line_c, width=5)
        d.rounded_rectangle((cx - 145, 210, cx + 145, 280), radius=18, fill=rgba("#4f4a54"), outline=line_c, width=5)
        d.polygon([(cx - 230, 350), (cx + 230, 350), (cx + 150, 470), (cx - 150, 470)], fill=cold, outline=line_c)
        d.rectangle((cx - 110, 430, cx + 110, 670), fill=rgba("#d5d8db", 160))
        d.ellipse((cx - 75, 455, cx + 75, 605), fill=rgba("#c14b44", 180))
        d.text((cx - 55, 510), "", fill=(0, 0, 0, 0))
        d.line((cx - 250, 540, cx - 175, 540), fill=line_c, width=16)
        d.line((cx + 175, 540, cx + 250, 540), fill=line_c, width=16)
        d.polygon([(cx - 295, 520), (cx - 225, 540), (cx - 295, 560)], fill=rgba("#c7b08a", 220))
        d.polygon([(cx + 295, 520), (cx + 225, 540), (cx + 295, 560)], fill=rgba("#c7b08a", 220))
        d.line((cx - 150, 935, cx - 110, 1080), fill=line_c, width=18)
        d.line((cx + 150, 935, cx + 110, 1080), fill=line_c, width=18)
    elif kind == "zhuzai-contract":
        d.rounded_rectangle((cx - 130, 220, cx + 130, 930), radius=28, fill=paper, outline=line_c, width=5)
        d.rectangle((cx - 140, 300, cx + 140, 360), fill=rgba("#f1e2bf"))
        d.rectangle((cx - 140, 770, cx + 140, 830), fill=rgba("#f1e2bf"))
        for yy in range(370, 760, 80):
            d.line((cx - 80, yy, cx + 80, yy), fill=rgba("#2d2a2f", 140), width=5)
        chain = [(cx - 230, 420), (cx - 280, 520), (cx - 210, 620), (cx - 260, 730), (cx - 190, 840)]
        line(d, chain, rgba("#7a7f87"), 10)
        chain2 = [(cx + 230, 420), (cx + 280, 520), (cx + 210, 620), (cx + 260, 730), (cx + 190, 840)]
        line(d, chain2, rgba("#7a7f87"), 10)
        d.polygon([(cx - 75, 120), (cx + 75, 120), (cx + 40, 205), (cx - 40, 205)], fill=rgba("#6b4f39"), outline=line_c)
        d.ellipse((cx - 50, 500, cx + 50, 585), fill=rgba("#d14f45", 160))
        d.line((cx - 190, 650, cx - 280, 800), fill=line_c, width=18)
        d.line((cx + 190, 650, cx + 280, 800), fill=line_c, width=18)
    elif kind == "ehu-mountain":
        pts = [(cx - 260, 940), (cx - 220, 730), (cx - 140, 560), (cx - 20, 370), (cx + 90, 520), (cx + 200, 700), (cx + 280, 940)]
        d.polygon(pts, fill=stone, outline=line_c)
        d.polygon([(cx - 250, 940), (cx - 200, 700), (cx - 120, 640), (cx - 80, 710), (cx - 150, 940)], fill=darkstone)
        d.polygon([(cx - 20, 370), (cx + 120, 390), (cx + 210, 540), (cx + 70, 590), (cx - 10, 500)], fill=rgba("#a5a8ab", 240), outline=line_c)
        d.polygon([(cx - 55, 520), (cx + 70, 545), (cx + 110, 650), (cx + 10, 760), (cx - 95, 700)], fill=rgba("#a45644", 255), outline=line_c)
        d.polygon([(cx - 70, 560), (cx + 10, 590), (cx - 20, 655), (cx - 95, 635)], fill=rgba("#111114", 255))
        d.polygon([(cx + 15, 595), (cx + 90, 625), (cx + 45, 690), (cx - 15, 670)], fill=rgba("#111114", 255))
        d.line((cx - 130, 830, cx - 220, 980), fill=line_c, width=18)
        d.line((cx + 130, 830, cx + 220, 980), fill=line_c, width=18)
    elif kind == "redhead-ship":
        d.polygon([(cx - 270, 760), (cx - 150, 520), (cx + 140, 520), (cx + 260, 760), (cx + 150, 920), (cx - 160, 920)], fill=rgba("#5f5461", 250), outline=line_c)
        d.polygon([(cx - 100, 520), (cx + 20, 390), (cx + 160, 470), (cx + 130, 600), (cx + 10, 630)], fill=rgba("#b53d3c", 255), outline=line_c)
        for i in range(6):
            x = cx - 190 + i * 70
            d.rounded_rectangle((x, 610, x + 44, 680), radius=10, fill=rgba("#d4c7aa", 190), outline=rgba("#382d31", 150), width=3)
        for i in range(4):
            x = cx - 140 + i * 90
            d.polygon([(x, 250), (x + 65, 460), (x + 12, 460)], fill=rgba("#ebe1c8", 160), outline=line_c)
        for i in range(5):
            d.line((cx - 230 + i * 90, 790, cx - 170 + i * 90, 930), fill=line_c, width=14)
        d.line((cx - 220, 780, cx + 220, 780), fill=rgba("#a3413d", 90), width=6)
    elif kind == "melee-fire":
        flame = [
            (cx, 240), (cx + 90, 330), (cx + 160, 450), (cx + 190, 580),
            (cx + 160, 720), (cx + 70, 840), (cx, 920), (cx - 80, 840),
            (cx - 170, 720), (cx - 200, 580), (cx - 160, 460), (cx - 80, 330)
        ]
        d.polygon(flame, fill=rgba("#c34138", 245), outline=line_c)
        d.polygon([(cx - 120, 450), (cx + 120, 450), (cx + 150, 710), (cx - 150, 710)], fill=rgba("#f07d3e", 210))
        d.polygon([(cx - 70, 520), (cx + 70, 520), (cx + 95, 660), (cx - 95, 660)], fill=rgba("#ffb14b", 230))
        # tools
        d.line((cx - 190, 650, cx - 320, 540), fill=line_c, width=16)
        d.polygon([(cx - 345, 520), (cx - 305, 500), (cx - 290, 545), (cx - 330, 565)], fill=rgba("#8f6b4a", 230), outline=line_c)
        d.line((cx + 190, 650, cx + 320, 540), fill=line_c, width=16)
        d.polygon([(cx + 305, 495), (cx + 345, 520), (cx + 330, 565), (cx + 290, 545)], fill=rgba("#8f6b4a", 230), outline=line_c)
        d.line((cx - 120, 900, cx - 230, 1080), fill=line_c, width=18)
        d.line((cx + 120, 900, cx + 230, 1080), fill=line_c, width=18)
    return img.filter(ImageFilter.GaussianBlur(0.3))


def icon_canvas() -> Image.Image:
    img = new_canvas((256, 256), transparent=True)
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse((12, 12, 244, 244), fill=rgba("#d8c7a5", 35), outline=rgba("#f4e0b3", 110), width=4)
    d.ellipse((34, 34, 222, 222), outline=rgba("#9b7b57", 50), width=3)
    return img


def draw_icon(kind: str) -> Image.Image:
    img = icon_canvas()
    d = ImageDraw.Draw(img, "RGBA")
    # Shared brush ring
    d.ellipse((22, 22, 234, 234), fill=rgba("#2d4f72", 28))
    if kind == "coin":
        d.ellipse((58, 72, 198, 198), fill=rgba("#d9a93c"), outline=rgba("#6a4c18"), width=7)
        d.ellipse((86, 100, 170, 184), fill=rgba("#f3d57e"), outline=rgba("#8c6a2e"), width=4)
        d.arc((80, 92, 176, 192), 30, 330, fill=rgba("#7a581b"), width=8)
        d.line((110, 62, 146, 62), fill=rgba("#f6e29a"), width=8)
    elif kind == "population":
        for x in [74, 128, 182]:
            d.ellipse((x - 18, 78, x + 18, 114), fill=rgba("#ebe1c8"), outline=rgba("#5f5c63"), width=3)
            d.rounded_rectangle((x - 24, 112, x + 24, 178), radius=14, fill=rgba("#6f8fb2"), outline=rgba("#324d74"), width=3)
        d.arc((54, 170, 202, 222), 200, 340, fill=rgba("#324d74"), width=5)
    elif kind == "kebi":
        d.rounded_rectangle((56, 72, 200, 182), radius=16, fill=rgba("#f4e3c0"), outline=rgba("#6b4f35"), width=5)
        d.polygon([(60, 78), (128, 134), (196, 78)], fill=rgba("#e5ceb1"), outline=rgba("#6b4f35"))
        d.ellipse((108, 118, 148, 158), fill=rgba("#b84a46"), outline=rgba("#6f2928"), width=4)
        d.line((76, 140, 108, 140), fill=rgba("#8a6a4b"), width=4)
        d.line((148, 140, 180, 140), fill=rgba("#8a6a4b"), width=4)
        d.line((92, 106, 100, 98), fill=rgba("#6b4f35"), width=4)
        d.line((156, 106, 148, 98), fill=rgba("#6b4f35"), width=4)
    elif kind == "sangzi":
        d.rectangle((92, 146, 164, 194), fill=rgba("#7a5a3f"), outline=rgba("#4f3927"), width=4)
        d.arc((68, 150, 188, 208), 200, 340, fill=rgba("#4f3927"), width=4)
        d.line((128, 150, 128, 90), fill=rgba("#5f8f58"), width=5)
        d.ellipse((104, 74, 150, 110), fill=rgba("#6ebc69"), outline=rgba("#356a38"), width=3)
        d.arc((102, 80, 148, 118), 200, 350, fill=rgba("#356a38"), width=4)
    elif kind == "survival":
        d.polygon([(128, 44), (190, 68), (180, 150), (128, 210), (76, 150), (66, 68)], fill=rgba("#7f96a8"), outline=rgba("#31455a"), width=5)
        d.rectangle((96, 102, 160, 178), fill=rgba("#e8ded1"), outline=rgba("#31455a"), width=4)
        d.line((94, 136, 162, 136), fill=rgba("#d1b17f"), width=6)
        d.line((128, 100, 128, 176), fill=rgba("#d1b17f"), width=6)
    elif kind == "homeRepair":
        d.polygon([(64, 128), (128, 74), (192, 128)], fill=rgba("#8d6e56"), outline=rgba("#45352a"), width=5)
        d.rectangle((78, 128, 178, 196), fill=rgba("#e6d8be"), outline=rgba("#45352a"), width=5)
        d.polygon([(128, 76), (170, 108), (128, 140), (86, 108)], fill=rgba("#b99e7b"), outline=rgba("#45352a"), width=4)
        d.line((104, 168, 104, 196), fill=rgba("#45352a"), width=5)
        d.line((162, 160, 198, 124), fill=rgba("#6f4f37"), width=8)
        d.line((184, 108, 208, 84), fill=rgba("#6f4f37"), width=8)
    elif kind == "return-ticket":
        d.rounded_rectangle((54, 78, 202, 180), radius=18, fill=rgba("#eadfca"), outline=rgba("#5d4732"), width=5)
        for x in [84, 116, 148, 180]:
            d.line((x, 78, x, 180), fill=rgba("#d7c29a"), width=2)
        d.arc((84, 100, 164, 172), 20, 340, fill=rgba("#b74541"), width=7)
        d.polygon([(180, 96), (214, 118), (180, 140)], fill=rgba("#b74541"))
    elif kind == "shop":
        d.polygon([(60, 108), (196, 108), (178, 74), (78, 74)], fill=rgba("#c54d46"), outline=rgba("#573127"), width=5)
        d.rectangle((72, 108, 184, 188), fill=rgba("#f0e0b9"), outline=rgba("#573127"), width=5)
        d.line((72, 148, 184, 148), fill=rgba("#573127"), width=4)
        d.rectangle((104, 136, 152, 188), fill=rgba("#7f93b1"), outline=rgba("#573127"), width=4)
    elif kind == "refresh":
        d.arc((60, 56, 200, 196), 35, 300, fill=rgba("#6f8fb2"), width=12)
        d.polygon([(192, 106), (220, 104), (204, 128)], fill=rgba("#6f8fb2"))
        d.polygon([(66, 146), (44, 164), (74, 174)], fill=rgba("#6f8fb2"))
    elif kind == "level-up-population":
        for x in [90, 128, 166]:
            d.ellipse((x - 14, 84, x + 14, 112), fill=rgba("#ebe1c8"), outline=rgba("#47505b"), width=3)
            d.rounded_rectangle((x - 18, 110, x + 18, 168), radius=12, fill=rgba("#7c8fc0"), outline=rgba("#324d74"), width=3)
        d.polygon([(128, 54), (146, 82), (110, 82)], fill=rgba("#7aab67"), outline=rgba("#335935"))
        d.rectangle((124, 82, 132, 196), fill=rgba("#7aab67"))
    elif kind == "back":
        d.line((170, 128, 90, 128), fill=rgba("#5b6a7b"), width=12)
        d.polygon([(92, 128), (126, 100), (126, 156)], fill=rgba("#5b6a7b"))
    elif kind == "ending-gesture":
        d.arc((72, 82, 172, 196), 140, 340, fill=rgba("#6c8193"), width=11)
        d.line((104, 152, 126, 136), fill=rgba("#6c8193"), width=8)
        d.line((126, 136, 152, 144), fill=rgba("#6c8193"), width=8)
        d.line((136, 94, 136, 140), fill=rgba("#c7a25c"), width=8)
        d.polygon([(136, 74), (150, 92), (122, 92)], fill=rgba("#c7a25c"))
        for p in [(182, 76), (196, 98), (172, 112)]:
            d.line((p[0], p[1], p[0] + 12, p[1] - 8), fill=rgba("#f2ddb2"), width=4)
    else:
        d.ellipse((72, 72, 184, 184), outline=rgba("#6c8193"), width=8)
    return img.filter(ImageFilter.GaussianBlur(0.2))


def draw_ending_asset(kind: str) -> Image.Image:
    rng = random.Random((hash(kind) ^ 0x1234) & 0xFFFF)
    if kind == "real-letter-bg":
        img = vertical_gradient((1600, 900), rgba("#efe4c5"), rgba("#d8c29a"))
        img = add_watercolor_blobs(img, rng, ["#b29a70", "#e6d6b0", "#a67d58", "#7a5d45"], 50, 28)
        d = ImageDraw.Draw(img, "RGBA")
        for i in range(12):
            y = 120 + i * 55
            d.line((140, y, 1460, y), fill=rgba("#8b6f4f", 50), width=3)
        for box in [(110, 110, 420, 320), (1140, 80, 1470, 330), (680, 450, 980, 760)]:
            d.rounded_rectangle(box, radius=26, fill=rgba("#f7ecd0", 145), outline=rgba("#7b5e44", 120), width=6)
        d.ellipse((1180, 120, 1320, 260), fill=rgba("#b9443f", 88))
        d.ellipse((1188, 128, 1312, 252), outline=rgba("#f1dfbe", 120), width=4)
        return vignette(add_grain(img, rng, 2500), 90)
    if kind == "envelope-frame":
        img = new_canvas((1400, 900), transparent=True)
        d = ImageDraw.Draw(img, "RGBA")
        d.rounded_rectangle((120, 110, 1280, 790), radius=30, fill=rgba("#efe2c0", 108), outline=rgba("#7d6044", 220), width=8)
        d.polygon([(260, 240), (700, 520), (1140, 240)], fill=rgba("#f7eed8", 176), outline=rgba("#7d6044", 220))
        d.polygon([(260, 240), (700, 520), (700, 710), (260, 340)], fill=rgba("#d9c3a3", 170), outline=rgba("#7d6044", 220))
        d.polygon([(1140, 240), (700, 520), (700, 710), (1140, 340)], fill=rgba("#e7d6b8", 170), outline=rgba("#7d6044", 220))
        d.line((260, 240, 700, 520), fill=rgba("#7d6044", 220), width=8)
        d.line((1140, 240, 700, 520), fill=rgba("#7d6044", 220), width=8)
        return img.filter(ImageFilter.GaussianBlur(0.4))
    if kind == "wind-scatter-letters":
        img = vertical_gradient((1600, 900), rgba("#2b3553"), rgba("#0a0d16"))
        img = add_watercolor_blobs(img, rng, ["#5f7d98", "#91abc2", "#d5c0a1", "#8a5b59"], 35, 26)
        d = ImageDraw.Draw(img, "RGBA")
        for i in range(42):
            x = rng.randint(-50, 1650)
            y = rng.randint(120, 830)
            sw = rng.randint(20, 58)
            sh = rng.randint(12, 38)
            rot = rng.random() * 0.5
            d.rounded_rectangle((x, y, x + sw, y + sh), radius=4, fill=rgba("#efe4ce", rng.randint(55, 150)), outline=rgba("#a48a62", rng.randint(60, 120)))
            d.line((x + 4, y + sh * 0.4, x + sw - 4, y + sh * 0.4), fill=rgba("#9c7d59", rng.randint(50, 90)), width=2)
        d.arc((100, 200, 1500, 980), 190, 330, fill=rgba("#f4dfaa", 90), width=12)
        return vignette(add_grain(img, rng, 2500), 88)
    if kind == "bullet-time-highlight":
        img = new_canvas((1200, 1200), transparent=True)
        d = ImageDraw.Draw(img, "RGBA")
        d.ellipse((170, 170, 1030, 1030), fill=rgba("#f4e0b8", 40))
        d.ellipse((260, 260, 940, 940), outline=rgba("#f2d18b", 200), width=16)
        d.ellipse((340, 340, 860, 860), outline=rgba("#fff4df", 150), width=10)
        for a in range(0, 360, 18):
            ang = math.radians(a)
            x1 = 600 + math.cos(ang) * 240
            y1 = 600 + math.sin(ang) * 240
            x2 = 600 + math.cos(ang) * 450
            y2 = 600 + math.sin(ang) * 450
            d.line((x1, y1, x2, y2), fill=rgba("#f7e9b8", 90), width=4)
        for _ in range(26):
            x = rng.randint(230, 970)
            y = rng.randint(230, 970)
            d.ellipse((x, y, x + 18, y + 18), fill=rgba("#ffd66e", 150))
        return img.filter(ImageFilter.GaussianBlur(0.4))
    if kind == "subtitle-mask":
        img = vertical_gradient((1600, 320), rgba("#000000", 0), rgba("#121319", 220))
        img = add_watercolor_blobs(img, rng, ["#262a38", "#1a1e29", "#4f4d56"], 14, 16)
        d = ImageDraw.Draw(img, "RGBA")
        d.line((0, 40, 1600, 40), fill=rgba("#f3dfb7", 42), width=4)
        d.line((0, 280, 1600, 280), fill=rgba("#f3dfb7", 36), width=3)
        return img.filter(ImageFilter.GaussianBlur(1.2))
    return new_canvas((800, 600), transparent=True)


def make_seamless_paper(size: tuple[int, int] = (1024, 1024)) -> Image.Image:
    w, h = size
    rng = random.Random(12021)
    base = vertical_gradient(size, rgba("#f4ead3"), rgba("#ead8b8"))
    d = ImageDraw.Draw(base, "RGBA")
    # soft paper fibers
    for _ in range(2200):
        x = rng.randrange(w)
        y = rng.randrange(h)
        shade = rng.randint(-12, 12)
        a = rng.randint(8, 28)
        d.point((x, y), fill=(240 + shade, 230 + shade, 208 + shade, a))
    for _ in range(150):
        x = rng.randint(0, w - 1)
        y = rng.randint(0, h - 1)
        length = rng.randint(30, 160)
        width = rng.randint(1, 3)
        color = rgba(rng.choice(["#c9b18a", "#f7edd9", "#d8c39b", "#bca47d"]), rng.randint(18, 48))
        d.line((x, y, x + length, y + rng.randint(-8, 8)), fill=color, width=width)
    for _ in range(26):
        x = rng.randint(0, w - 1)
        y = rng.randint(0, h - 1)
        rw = rng.randint(80, 220)
        rh = rng.randint(30, 120)
        d.ellipse((x, y, x + rw, y + rh), fill=rgba("#efe1bf", rng.randint(8, 24)))
    # make the tile more seamless by mirroring edge strips inward
    edge = 64
    left = base.crop((0, 0, edge, h)).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    right = base.crop((w - edge, 0, w, h))
    base.paste(left, (w - edge, 0), left)
    base.paste(right.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (0, 0), right.transpose(Image.Transpose.FLIP_LEFT_RIGHT))
    top = base.crop((0, 0, w, edge)).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    bottom = base.crop((0, h - edge, w, h))
    base.paste(top, (0, h - edge), top)
    base.paste(bottom.transpose(Image.Transpose.FLIP_TOP_BOTTOM), (0, 0), bottom.transpose(Image.Transpose.FLIP_TOP_BOTTOM))
    return vignette(add_grain(base, rng, 1800), 24)


def draw_ui_texture(kind: str) -> Image.Image:
    if kind == "frame-wood":
        img = new_canvas((512, 512), transparent=True)
        d = ImageDraw.Draw(img, "RGBA")
        d.rounded_rectangle((20, 20, 492, 492), radius=28, fill=rgba("#6a4a31", 240), outline=rgba("#3d2a1e"), width=6)
        d.rounded_rectangle((44, 44, 468, 468), radius=18, fill=rgba("#8a6545", 255), outline=rgba("#4a3426"), width=4)
        d.rounded_rectangle((72, 72, 440, 440), radius=14, fill=rgba("#f4ead4", 0))
        # carved joinery corners
        for x, y, sx, sy in [(20, 20, 1, 1), (492, 20, -1, 1), (20, 492, 1, -1), (492, 492, -1, -1)]:
            pts = [(x, y), (x + 52 * sx, y), (x + 28 * sx, y + 28 * sy), (x, y + 52 * sy)]
            d.polygon(pts, fill=rgba("#4d3527"))
            d.line((x, y, x + 52 * sx, y), fill=rgba("#d6b48b"), width=4)
            d.line((x, y, x, y + 52 * sy), fill=rgba("#d6b48b"), width=4)
        for yy in range(82, 432, 42):
            d.line((54, yy, 458, yy), fill=rgba("#5f412d", 55), width=2)
        return img.filter(ImageFilter.GaussianBlur(0.35))
    if kind == "paper-cream":
        return make_seamless_paper((1024, 1024))
    if kind == "paper-letter-edge":
        img = new_canvas((1024, 256), transparent=True)
        d = ImageDraw.Draw(img, "RGBA")
        d.rounded_rectangle((16, 24, 1008, 232), radius=28, fill=rgba("#f7edd6", 255), outline=rgba("#8b6c4a", 135), width=5)
        for x in range(0, 1024, 58):
            d.line((x, 18 + (x % 3) * 2, x + 18, 232 - (x % 5) * 2), fill=rgba("#c8aa7a", 48), width=3)
        for x in range(80, 980, 96):
            d.line((x, 52, x + 14, 190), fill=rgba("#866144", 66), width=2)
        d.line((0, 58, 1024, 54), fill=rgba("#6f533b", 42), width=4)
        d.line((0, 208, 1024, 212), fill=rgba("#6f533b", 36), width=3)
        return img.filter(ImageFilter.GaussianBlur(0.45))
    if kind == "button-wood-normal":
        img = new_canvas((256, 96), transparent=True)
        d = ImageDraw.Draw(img, "RGBA")
        d.rounded_rectangle((4, 4, 252, 92), radius=24, fill=rgba("#8a623e"), outline=rgba("#4a3324"), width=5)
        d.rounded_rectangle((10, 10, 246, 86), radius=20, fill=rgba("#9c744d"), outline=rgba("#684a33"), width=2)
        for y in range(18, 84, 8):
            d.line((18, y, 238, y + 6), fill=rgba("#6e4c34", 36), width=2)
        d.line((20, 16, 236, 16), fill=rgba("#e3c79f", 48), width=4)
        return img.filter(ImageFilter.GaussianBlur(0.25))
    if kind == "button-wood-hover":
        img = draw_ui_texture("button-wood-normal").copy()
        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(overlay, "RGBA")
        d.rounded_rectangle((6, 6, 250, 90), radius=22, fill=rgba("#d4a366", 32))
        d.line((20, 18, 236, 18), fill=rgba("#fff0cf", 90), width=5)
        return Image.alpha_composite(img, overlay)
    if kind == "button-wood-disabled":
        img = draw_ui_texture("button-wood-normal").copy()
        gray = Image.new("RGBA", img.size, rgba("#7f7469", 120))
        return Image.alpha_composite(img, gray)
    if kind == "hud-tag":
        img = new_canvas((192, 64), transparent=True)
        d = ImageDraw.Draw(img, "RGBA")
        d.rounded_rectangle((4, 4, 188, 60), radius=18, fill=rgba("#7a5a3b"), outline=rgba("#443024"), width=4)
        d.rounded_rectangle((10, 10, 182, 54), radius=14, fill=rgba("#9d7a52"), outline=rgba("#5a402f"), width=2)
        d.line((14, 14, 178, 14), fill=rgba("#e1c79c", 62), width=4)
        return img.filter(ImageFilter.GaussianBlur(0.2))
    if kind == "shop-slot":
        img = new_canvas((128, 128), transparent=True)
        d = ImageDraw.Draw(img, "RGBA")
        d.rounded_rectangle((6, 6, 122, 122), radius=20, fill=rgba("#a98960"), outline=rgba("#5b3f2d"), width=4)
        d.rounded_rectangle((14, 14, 114, 114), radius=16, fill=rgba("#d8bf92"), outline=rgba("#6c5037"), width=2)
        d.line((18, 18, 110, 110), fill=rgba("#f4e4c5", 50), width=3)
        d.line((110, 18, 18, 110), fill=rgba("#7d5c41", 24), width=2)
        return img.filter(ImageFilter.GaussianBlur(0.15))
    if kind == "vignette-warm":
        w, h = 1920, 1080
        img = new_canvas((w, h), transparent=True)
        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        d = ImageDraw.Draw(overlay, "RGBA")
        d.rectangle((0, 0, w, h), fill=rgba("#261810", 0))
        for i in range(6):
            inset = 22 + i * 22
            alpha = 34 - i * 4
            d.rectangle((inset, inset, w - inset, h - inset), outline=rgba("#f3d39b", alpha), width=14)
        # soften center to transparent
        center = Image.new("L", (w, h), 0)
        cd = ImageDraw.Draw(center)
        cd.ellipse((w * 0.08, h * 0.06, w * 0.92, h * 0.94), fill=180)
        center = ImageOps.invert(center).filter(ImageFilter.GaussianBlur(120))
        warm = Image.new("RGBA", (w, h), rgba("#8a5d31", 180))
        warm.putalpha(center)
        return Image.alpha_composite(img, warm)
    if kind == "divider-wood":
        img = new_canvas((512, 16), transparent=True)
        d = ImageDraw.Draw(img, "RGBA")
        d.rounded_rectangle((0, 2, 512, 14), radius=8, fill=rgba("#7a573c"), outline=rgba("#4a3424"), width=2)
        d.line((8, 8, 504, 8), fill=rgba("#d9bb8c", 60), width=2)
        d.line((0, 12, 512, 12), fill=rgba("#3d2a1f", 70), width=1)
        return img.filter(ImageFilter.GaussianBlur(0.15))
    return new_canvas((256, 256), transparent=True)


def generate_all() -> list[tuple[str, str]]:
    ensure_dirs()
    generated: list[tuple[str, str]] = []

    board_assets = [
        ("board/kepi_tulou-board-main.png", draw_board_background(2)),
        ("board/kepi_tulou-stage1-broken.png", draw_board_background(1)),
        ("board/kepi_tulou-stage2-repair.png", draw_board_background(2)),
        ("board/kepi_tulou-stage3-renewed.png", draw_board_background(3)),
        ("board/kepi_battle-background.png", draw_battle_background()),
    ]
    ending_assets = [
        ("ending/kepi_ending-background.png", draw_ending_background()),
        ("ending/kepi_wind-wave-background.png", draw_wind_wave_background()),
        ("ending/kepi_real-letter-bg.png", draw_ending_asset("real-letter-bg")),
        ("ending/kepi_envelope-frame.png", draw_ending_asset("envelope-frame")),
        ("ending/kepi_wind-scatter-letters.png", draw_ending_asset("wind-scatter-letters")),
        ("ending/kepi_bullet-time-highlight.png", draw_ending_asset("bullet-time-highlight")),
        ("ending/kepi_subtitle-mask.png", draw_ending_asset("subtitle-mask")),
    ]
    char_assets = [
        ("characters/kepi_farmer.png", draw_character("farmer")),
        ("characters/kepi_guard.png", draw_character("guard")),
        ("characters/kepi_shuike.png", draw_character("shuike")),
        ("characters/kepi_teacher.png", draw_character("teacher")),
        ("characters/kepi_xiangxian.png", draw_character("xiangxian")),
        ("characters/kepi_fengshui.png", draw_character("fengshui")),
        ("characters/kepi_patriarch.png", draw_character("patriarch")),
    ]
    enemy_assets = [
        ("enemies/kepi_qianhai-stele.png", draw_enemy("qianhai-stele")),
        ("enemies/kepi_luyin-clerk.png", draw_enemy("luyin-clerk")),
        ("enemies/kepi_zhuzai-contract.png", draw_enemy("zhuzai-contract")),
        ("enemies/kepi_ehu-mountain.png", draw_enemy("ehu-mountain")),
        ("enemies/kepi_redhead-ship.png", draw_enemy("redhead-ship")),
        ("enemies/kepi_melee-fire.png", draw_enemy("melee-fire")),
    ]
    ui_assets = [
        ("ui/kepi_icon-coin.png", draw_icon("coin")),
        ("ui/kepi_icon-population.png", draw_icon("population")),
        ("ui/kepi_icon-kebi.png", draw_icon("kebi")),
        ("ui/kepi_icon-sangzi.png", draw_icon("sangzi")),
        ("ui/kepi_icon-survival.png", draw_icon("survival")),
        ("ui/kepi_icon-home-repair.png", draw_icon("homeRepair")),
        ("ui/kepi_icon-return-ticket.png", draw_icon("return-ticket")),
        ("ui/kepi_icon-shop.png", draw_icon("shop")),
        ("ui/kepi_icon-refresh.png", draw_icon("refresh")),
        ("ui/kepi_icon-upgrade-population.png", draw_icon("level-up-population")),
        ("ui/kepi_icon-back.png", draw_icon("back")),
        ("ui/kepi_ending-gesture.png", draw_icon("ending-gesture")),
        ("ui/kepi_ui_frame-wood.png", draw_ui_texture("frame-wood")),
        ("ui/kepi_ui_paper-cream.png", draw_ui_texture("paper-cream")),
        ("ui/kepi_ui_paper-letter-edge.png", draw_ui_texture("paper-letter-edge")),
        ("ui/kepi_ui_button-wood-normal.png", draw_ui_texture("button-wood-normal")),
        ("ui/kepi_ui_button-wood-hover.png", draw_ui_texture("button-wood-hover")),
        ("ui/kepi_ui_button-wood-disabled.png", draw_ui_texture("button-wood-disabled")),
        ("ui/kepi_ui_hud-tag.png", draw_ui_texture("hud-tag")),
        ("ui/kepi_ui_shop-slot.png", draw_ui_texture("shop-slot")),
        ("ui/kepi_ui_vignette-warm.png", draw_ui_texture("vignette-warm")),
        ("ui/kepi_ui_divider-wood.png", draw_ui_texture("divider-wood")),
    ]
    all_assets = board_assets + char_assets + enemy_assets + ui_assets + ending_assets
    for rel, img in all_assets:
        generated.append((rel, save(img, rel)))
    return generated


def write_manifest(items: list[tuple[str, str]]) -> None:
    lines = [
        "# 《客批》生成 PNG 资源索引 v1",
        "",
        "> 更新：2026-06-25",
        "> 说明：本索引对应脚本 `scripts/generate_kepi_png_assets.py` 生成的位图资源。",
        "",
        "## Board",
    ]
    for rel, _ in items:
        if rel.startswith("board/"):
            lines.append(f"- `{rel}`")
    lines += ["", "## Characters"]
    for rel, _ in items:
        if rel.startswith("characters/"):
            lines.append(f"- `{rel}`")
    lines += ["", "## Enemies"]
    for rel, _ in items:
        if rel.startswith("enemies/"):
            lines.append(f"- `{rel}`")
    lines += ["", "## UI"]
    for rel, _ in items:
        if rel.startswith("ui/"):
            lines.append(f"- `{rel}`")
    lines += ["", "## Ending"]
    for rel, _ in items:
        if rel.startswith("ending/"):
            lines.append(f"- `{rel}`")
    lines += ["", f"共生成 {len(items)} 张 PNG。"]
    (DOCS / "kepi_generated-assets-index_v1.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    items = generate_all()
    write_manifest(items)
    print(f"generated {len(items)} PNG assets")
    for rel, abs_rel in items:
        print(abs_rel)


if __name__ == "__main__":
    main()

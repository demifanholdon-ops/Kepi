#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "images"


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    h = hex_color.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def blend(a, b, t: float):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(4))


def gradient(size, top, bottom):
    w, h = size
    img = Image.new("RGBA", size)
    px = img.load()
    for y in range(h):
        c = blend(top, bottom, y / max(1, h - 1))
        for x in range(w):
            px[x, y] = c
    return img


def paper_grain(img: Image.Image, seed: int, amount: int = 3600) -> Image.Image:
    rng = random.Random(seed)
    d = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    for _ in range(amount):
        x = rng.randrange(w)
        y = rng.randrange(h)
        a = rng.randint(4, 18)
        d.point((x, y), fill=rng.choice([(255, 250, 230, a), (62, 45, 34, a // 2)]))
    return img


def blobs(img: Image.Image, seed: int, palette: list[str], count: int, blur: int) -> Image.Image:
    rng = random.Random(seed)
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    w, h = img.size
    for _ in range(count):
        x = rng.randint(-100, w)
        y = rng.randint(-80, h)
        rw = rng.randint(70, 360)
        rh = rng.randint(40, 240)
        d.ellipse((x, y, x + rw, y + rh), fill=rgba(rng.choice(palette), rng.randint(16, 72)))
    return Image.alpha_composite(img, layer.filter(ImageFilter.GaussianBlur(blur)))


def opaque(img: Image.Image, bg="#f2ead8") -> Image.Image:
    out = Image.new("RGBA", img.size, rgba(bg))
    out.alpha_composite(img)
    out.putalpha(255)
    return out


def force_opaque(img: Image.Image) -> Image.Image:
    out = img.convert("RGBA")
    out.putalpha(255)
    return out


def fit_alpha_subject(img: Image.Image, size=(1024, 1280), fill_ratio: float = 0.82) -> Image.Image:
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return img.resize(size, Image.Resampling.LANCZOS)
    crop = img.crop(bbox)
    scale = min(size[0] * 0.84 / crop.size[0], size[1] * fill_ratio / crop.size[1])
    resized = crop.resize((max(1, int(crop.size[0] * scale)), max(1, int(crop.size[1] * scale))), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    out.alpha_composite(resized, ((size[0] - resized.size[0]) // 2, int(size[1] * 0.08)))
    return out


def save(img: Image.Image, rel: str) -> None:
    out = PUBLIC / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, format="PNG", optimize=True)


def tulou_scene(stage: int, battle: bool = False) -> Image.Image:
    w, h = 1600, 900
    seed = 3000 + stage * 97 + (111 if battle else 0)
    sky_top = "#cce8df" if not battle else "#546577"
    sky_bottom = "#f4dfbc" if not battle else "#222638"
    img = gradient((w, h), rgba(sky_top), rgba(sky_bottom))
    img = blobs(img, seed, ["#f4d7a4", "#a6c9bd", "#799aa5", "#d8b98c", "#6f7f75"], 70, 42)
    d = ImageDraw.Draw(img, "RGBA")

    # distant mountains and morning mist
    for i, (base, col, a) in enumerate([(430, "#6f877a", 80), (492, "#52676b", 74), (548, "#8d8b73", 54)]):
        pts = [(0, h), (0, base)]
        for x in range(0, w + 120, 120):
            y = base - math.sin((x / w) * math.pi * (1.15 + i * 0.2)) * (55 + i * 24)
            y += math.sin(x / 91 + i) * 16
            pts.append((x, y))
        pts += [(w, h), (0, h)]
        d.polygon(pts, fill=rgba(col, a))
    for y in [235, 305, 380, 610]:
        d.ellipse((-180, y - 46, w + 180, y + 78), fill=rgba("#fff1d9", 26 if not battle else 14))

    # board ground
    d.rectangle((0, 610, w, h), fill=rgba("#8b6d4c", 118 if not battle else 140))
    d.ellipse((190, 520, 1410, 970), fill=rgba("#d7bf8f", 128 if not battle else 70))
    d.ellipse((260, 560, 1340, 910), outline=rgba("#fff1c9", 64), width=6)

    cx, cy = 800, 490
    outer, mid, inner = 326, 242, 128
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow, "RGBA")
    sd.ellipse((cx - outer - 36, cy - outer + 28, cx + outer + 36, cy + outer + 72), fill=rgba("#1e1714", 68))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(28)))
    d = ImageDraw.Draw(img, "RGBA")

    wall = "#8c664b" if stage != 1 else "#695849"
    roof = "#b77a4d" if stage != 1 else "#70584c"
    if battle:
        wall, roof = "#514842", "#69463e"
    d.ellipse((cx - outer, cy - outer, cx + outer, cy + outer), fill=rgba(wall, 238), outline=rgba("#33271f"), width=12)
    d.ellipse((cx - outer + 28, cy - outer + 28, cx + outer - 28, cy + outer - 28), outline=rgba("#e4c08b", 160), width=28)
    d.ellipse((cx - mid, cy - mid, cx + mid, cy + mid), fill=rgba("#a7815e", 228), outline=rgba("#48362d"), width=8)
    d.ellipse((cx - inner, cy - inner, cx + inner, cy + inner), fill=rgba("#e8d7ad", 242), outline=rgba("#7d624c"), width=7)
    d.ellipse((cx - 38, cy - 38, cx + 38, cy + 38), fill=rgba("#c7a06a"), outline=rgba("#71543b"), width=4)

    # roof tiles, corridors, rooms
    for i in range(52):
        a0 = (i / 52) * math.tau
        a1 = ((i + 0.75) / 52) * math.tau
        pts = [
            (cx + math.cos(a0) * (outer - 18), cy + math.sin(a0) * (outer - 18)),
            (cx + math.cos(a0) * (outer - 74), cy + math.sin(a0) * (outer - 74)),
            (cx + math.cos(a1) * (outer - 74), cy + math.sin(a1) * (outer - 74)),
            (cx + math.cos(a1) * (outer - 18), cy + math.sin(a1) * (outer - 18)),
        ]
        fill = blend(rgba(roof, 210), rgba("#eed2a0", 180), 0.18 if i % 2 else 0.04)
        d.polygon(pts, fill=fill, outline=rgba("#513b2e", 86))
    for rr, color, width in [(292, "#f4d59a", 5), (210, "#f8e5bc", 5), (168, "#6e513d", 4)]:
        d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=rgba(color, 110), width=width)
    for i in range(28):
        ang = i / 28 * math.tau
        x = cx + math.cos(ang) * 202
        y = cy + math.sin(ang) * 202
        d.rounded_rectangle((x - 8, y - 12, x + 8, y + 12), radius=4, fill=rgba("#f1d48d", 145), outline=rgba("#4a3427", 80), width=1)
    for i in range(16):
        ang = i / 16 * math.tau
        x1 = cx + math.cos(ang) * 135
        y1 = cy + math.sin(ang) * 135
        x2 = cx + math.cos(ang) * 212
        y2 = cy + math.sin(ang) * 212
        d.line((x1, y1, x2, y2), fill=rgba("#4d3a2d", 70), width=3)

    if stage == 1:
        for bx, by, r in [(638, 392, 28), (973, 582, 35), (810, 735, 26), (564, 568, 18)]:
            d.ellipse((bx - r, by - r, bx + r, by + r), fill=rgba("#2e2926", 172))
            d.line((bx - r, by, bx + r, by - r * 0.7), fill=rgba("#a28566", 110), width=5)
        for x0, y0, x1, y1 in [(500, 690, 640, 620), (1010, 380, 1100, 320), (760, 242, 845, 312)]:
            d.line((x0, y0, x1, y1), fill=rgba("#3b3028", 120), width=8)
    elif stage == 2:
        for x, y, ww, hh in [(555, 580, 150, 48), (907, 370, 126, 42), (724, 720, 160, 46)]:
            d.rounded_rectangle((x, y, x + ww, y + hh), radius=10, fill=rgba("#e0c39a", 210), outline=rgba("#604833", 140), width=4)
            d.line((x + 16, y + hh / 2, x + ww - 16, y + hh / 2), fill=rgba("#6f5339", 90), width=2)
        for x in [565, 618, 965, 1016]:
            d.line((x, 520, x + 14, 660), fill=rgba("#5d4733", 118), width=5)
    else:
        for i in range(24):
            ang = i / 24 * math.tau
            x = cx + math.cos(ang) * 318
            y = cy + math.sin(ang) * 318
            d.ellipse((x - 9, y - 9, x + 9, y + 9), fill=rgba("#ffd783", 190))
        for box in [(500, 670, 620, 730), (1010, 625, 1140, 700), (700, 250, 820, 305)]:
            d.ellipse(box, fill=rgba("#74a96b", 92))

    if battle:
        d.rectangle((0, 0, w, h), fill=rgba("#172033", 68))
        for i in range(8):
            x = 120 + i * 190
            d.polygon([(x, 150), (x + 50, 110), (x + 110, 170), (x + 80, 255), (x + 20, 240)], fill=rgba("#a7443d", 46))
    # warm key light + darker right bottom
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow, "RGBA")
    gd.ellipse((-280, -220, 940, 560), fill=rgba("#fff0c3", 58 if not battle else 26))
    gd.ellipse((780, 420, 1900, 1180), fill=rgba("#1c1a22", 52 if not battle else 96))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(70)))
    return force_opaque(paper_grain(opaque(img), seed, 4200))


def enemy_canvas(seed: int) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", (1024, 1280), (0, 0, 0, 0))
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow, "RGBA")
    sd.ellipse((320, 1044, 704, 1120), fill=rgba("#151215", 58))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(8)))
    return img, ImageDraw.Draw(img, "RGBA")


def sketch_lines(d: ImageDraw.ImageDraw, seed: int, bbox, color="#202027", n=18):
    rng = random.Random(seed)
    x0, y0, x1, y1 = bbox
    for _ in range(n):
        x = rng.randint(int(x0), int(x1))
        y = rng.randint(int(y0), int(y1))
        d.line((x, y, x + rng.randint(-32, 32), y + rng.randint(24, 98)), fill=rgba(color, rng.randint(45, 120)), width=rng.randint(2, 5))


def draw_enemy(kind: str) -> Image.Image:
    img, d = enemy_canvas(abs(hash(kind)) & 0xFFFF)
    cx = 512
    line = rgba("#202029")
    cold = rgba("#7f8e98")
    red = rgba("#b6433e")
    paper = rgba("#e5d7b8")
    if kind == "qianhai-stele":
        d.rounded_rectangle((330, 210, 680, 980), radius=24, fill=rgba("#7f858b"), outline=line, width=9)
        d.polygon([(300, 160), (704, 160), (748, 236), (344, 236)], fill=rgba("#4f555d"), outline=line)
        for y in range(318, 845, 92):
            d.rounded_rectangle((382, y, 610, y + 38), radius=7, fill=rgba("#b8433d", 150), outline=rgba("#612b2b", 110), width=3)
        for x in [392, 456, 520, 584]:
            d.line((x, 285, x - 42, 920), fill=rgba("#2b2e34", 120), width=4)
        d.line((405, 970, 342, 1116), fill=line, width=19)
        d.line((608, 970, 690, 1116), fill=line, width=19)
        sketch_lines(d, 4, (350, 250, 650, 930), "#e2d6c0", 22)
    elif kind == "luyin-clerk":
        d.rounded_rectangle((314, 250, 710, 930), radius=28, fill=rgba("#56606a"), outline=line, width=9)
        d.rounded_rectangle((344, 170, 680, 268), radius=20, fill=rgba("#3f424d"), outline=line, width=8)
        d.polygon([(258, 348), (766, 348), (650, 494), (374, 494)], fill=cold, outline=line)
        d.rounded_rectangle((374, 440, 650, 670), radius=12, fill=rgba("#d5d7d6", 185), outline=line, width=5)
        d.ellipse((446, 486, 578, 620), fill=rgba("#b9423e", 170), outline=rgba("#702c2a", 120), width=5)
        d.line((314, 565, 210, 565), fill=line, width=17)
        d.line((710, 565, 814, 565), fill=line, width=17)
        d.polygon([(188, 542), (250, 565), (188, 590)], fill=paper, outline=line)
        d.polygon([(836, 542), (774, 565), (836, 590)], fill=paper, outline=line)
        d.line((386, 928, 338, 1110), fill=line, width=19)
        d.line((638, 928, 682, 1110), fill=line, width=19)
        sketch_lines(d, 8, (360, 300, 680, 900), "#22252d", 24)
    elif kind == "zhuzai-contract":
        d.rounded_rectangle((340, 190, 684, 938), radius=35, fill=paper, outline=line, width=9)
        d.rectangle((326, 280, 698, 352), fill=rgba("#f5e8c9"), outline=line)
        d.rectangle((326, 776, 698, 848), fill=rgba("#f5e8c9"), outline=line)
        for y in range(380, 740, 64):
            d.line((404, y, 620, y + 12), fill=rgba("#4d4036", 140), width=6)
        for pts in [[(300, 440), (218, 535), (298, 630), (226, 760), (318, 884)], [(724, 440), (806, 535), (726, 630), (798, 760), (706, 884)]]:
            d.line(pts, fill=rgba("#6f7881"), width=14, joint="curve")
            for x, y in pts[1:-1]:
                d.ellipse((x - 17, y - 17, x + 17, y + 17), outline=line, width=5)
        d.ellipse((450, 506, 574, 630), fill=rgba("#b9433e", 142), outline=rgba("#702d2a", 100), width=5)
        d.line((370, 916, 302, 1096), fill=line, width=19)
        d.line((654, 916, 728, 1096), fill=line, width=19)
    elif kind == "ehu-mountain":
        pts = [(244, 950), (286, 708), (376, 536), (500, 292), (626, 520), (744, 712), (806, 950)]
        d.polygon(pts, fill=rgba("#7e8586"), outline=line)
        d.polygon([(262, 950), (330, 690), (430, 620), (478, 742), (400, 950)], fill=rgba("#525b60"))
        d.polygon([(502, 292), (642, 362), (706, 520), (570, 592), (492, 472)], fill=rgba("#a2a7a7"), outline=line)
        mouth = [(376, 580), (532, 556), (648, 644), (584, 780), (418, 748), (324, 660)]
        d.polygon(mouth, fill=rgba("#a24a40"), outline=line)
        d.polygon([(392, 616), (482, 626), (450, 704), (354, 688)], fill=rgba("#121217"))
        d.polygon([(524, 632), (620, 666), (560, 740), (488, 718)], fill=rgba("#121217"))
        for x, y in [(438, 520), (590, 540)]:
            d.ellipse((x - 22, y - 18, x + 22, y + 18), fill=rgba("#f0d4a3"), outline=line, width=4)
        d.line((368, 900, 274, 1096), fill=line, width=20)
        d.line((660, 900, 750, 1096), fill=line, width=20)
        for _ in range(35):
            x = random.Random(_).randint(292, 742)
            y = random.Random(_ + 2).randint(400, 910)
            d.line((x, y, x + 24, y + 10), fill=rgba("#d7ba7d", 70), width=3)
    elif kind == "redhead-ship":
        d.polygon([(220, 750), (330, 500), (690, 500), (814, 750), (690, 930), (328, 930)], fill=rgba("#5d5360"), outline=line)
        d.polygon([(350, 504), (486, 324), (700, 438), (648, 624), (432, 640)], fill=rgba("#b9423d"), outline=line)
        d.line((512, 250, 512, 914), fill=rgba("#34272a"), width=10)
        for x in [330, 424, 518, 612]:
            d.polygon([(x, 250), (x + 76, 470), (x + 14, 470)], fill=rgba("#f0e1c2", 158), outline=line)
        for i in range(6):
            x = 284 + i * 78
            d.rounded_rectangle((x, 610, x + 50, 688), radius=10, fill=rgba("#d8c9a8", 170), outline=line, width=4)
        for x in [292, 385, 478, 571, 664]:
            d.line((x, 792, x + 58, 930), fill=line, width=15)
        d.line((246, 778, 778, 778), fill=rgba("#b3403a", 150), width=10)
    elif kind == "melee-fire":
        flame = [(512, 214), (636, 348), (722, 520), (740, 688), (666, 842), (512, 966), (348, 840), (284, 682), (306, 508), (396, 350)]
        d.polygon(flame, fill=rgba("#be3d36"), outline=line)
        d.polygon([(412, 430), (612, 430), (660, 728), (512, 862), (366, 724)], fill=rgba("#ec7742", 225))
        d.polygon([(456, 530), (568, 530), (606, 688), (512, 786), (420, 688)], fill=rgba("#ffd05d", 230))
        for x0, sign in [(318, -1), (706, 1)]:
            d.line((x0, 670, x0 + 150 * sign, 536), fill=line, width=17)
            d.polygon([(x0 + 170 * sign, 506), (x0 + 112 * sign, 500), (x0 + 116 * sign, 568), (x0 + 176 * sign, 566)], fill=rgba("#8e6441"), outline=line)
        d.line((392, 900, 288, 1110), fill=line, width=20)
        d.line((632, 900, 744, 1110), fill=line, width=20)
    return fit_alpha_subject(img.filter(ImageFilter.GaussianBlur(0.2)))


def recolor_xiangxian_to_patriarch() -> None:
    src = PUBLIC / "characters" / "kepi_xiangxian.png"
    dst = PUBLIC / "characters" / "kepi_patriarch.png"
    img = Image.open(src).convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            # Preserve warm skin and paper; darken blue robe into clan elder formal robe.
            if b > r + 8 and b > g + 4 and y > 250:
                px[x, y] = (max(18, int(r * 0.28)), max(18, int(g * 0.28)), max(24, int(b * 0.34)), a)
            elif y > 480 and r < 170 and b > 65:
                px[x, y] = (int(r * 0.45), int(g * 0.42), int(b * 0.5), a)
    d = ImageDraw.Draw(img, "RGBA")
    # square black formal cap and elder staff; painterly but readable.
    d.rounded_rectangle((432, 70, 610, 128), radius=18, fill=rgba("#191820", 245), outline=rgba("#08080b"), width=4)
    d.rectangle((462, 48, 584, 78), fill=rgba("#121219", 248))
    d.line((815, 410, 862, 1110), fill=rgba("#4c3523"), width=13)
    d.ellipse((794, 374, 874, 454), fill=rgba("#8e7e68"), outline=rgba("#1c1614"), width=5)
    img.save(dst, format="PNG", optimize=True)


def ending_assets() -> None:
    # Main ending: three-layer sea mist / ship / letters.
    w, h = 1600, 900
    rng = random.Random(811)
    img = gradient((w, h), rgba("#273858"), rgba("#0b101c"))
    img = blobs(img, 811, ["#56799a", "#d8c29a", "#8a5a58", "#2b4b68"], 50, 38)
    d = ImageDraw.Draw(img, "RGBA")
    for y in range(460, h, 18):
        d.line((0, y + math.sin(y / 31) * 12, w, y + math.sin(y / 27) * 8), fill=rgba("#7190a6", 64), width=4)
    d.ellipse((1060, 100, 1300, 330), fill=rgba("#fff1bf", 132))
    d.polygon([(655, 575), (880, 575), (820, 660), (700, 660)], fill=rgba("#2a2021", 232), outline=rgba("#100b0d"), width=4)
    d.line((760, 250, 760, 604), fill=rgba("#f1d8a4", 158), width=6)
    d.polygon([(762, 265), (960, 445), (762, 450)], fill=rgba("#efe0c4", 148), outline=rgba("#8f7054", 90))
    for _ in range(22):
        x, y = rng.randint(80, 1500), rng.randint(250, 760)
        sw, sh = rng.randint(36, 90), rng.randint(20, 54)
        d.rounded_rectangle((x, y, x + sw, y + sh), radius=5, fill=rgba("#f1e2c8", rng.randint(70, 145)), outline=rgba("#a88b64", 80))
    save(force_opaque(paper_grain(opaque(img, "#1d263b"), 811, 2500)), "ending/kepi_ending-background.png")

    # Wave background
    img = gradient((w, h), rgba("#31456a"), rgba("#070d17"))
    img = blobs(img, 812, ["#6e91b1", "#3c6686", "#d1bd96", "#1a2e48"], 45, 34)
    d = ImageDraw.Draw(img, "RGBA")
    for y in range(260, h, 24):
        d.line((0, y + math.sin(y / 36) * 20, w, y + math.sin(y / 29) * 17), fill=rgba("#86abc0", 76), width=6)
    for x in range(-60, w, 118):
        d.polygon([(x, 330), (x + 46, 304), (x + 116, 352), (x + 36, 380)], fill=rgba("#f0e1c3", 110), outline=rgba("#f6edd8", 90))
    save(force_opaque(paper_grain(opaque(img, "#17243a"), 812, 2500)), "ending/kepi_wind-wave-background.png")

    # Other ending layer assets stay UI-like but more polished.
    gen = load_old_generator()
    for rel, kind in [
        ("ending/kepi_real-letter-bg.png", "real-letter-bg"),
        ("ending/kepi_envelope-frame.png", "envelope-frame"),
        ("ending/kepi_wind-scatter-letters.png", "wind-scatter-letters"),
        ("ending/kepi_bullet-time-highlight.png", "bullet-time-highlight"),
        ("ending/kepi_subtitle-mask.png", "subtitle-mask"),
    ]:
        img = gen.draw_ending_asset(kind)
        if kind in {"real-letter-bg", "wind-scatter-letters"}:
            img = force_opaque(opaque(img))
        save(img, rel)


def load_old_generator():
    spec = importlib.util.spec_from_file_location("kepi_gen", ROOT / "scripts" / "generate_kepi_png_assets.py")
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def ui_textures() -> None:
    gen = load_old_generator()
    for rel, kind in [
        ("ui/kepi_ui_frame-wood.png", "frame-wood"),
        ("ui/kepi_ui_paper-cream.png", "paper-cream"),
        ("ui/kepi_ui_paper-letter-edge.png", "paper-letter-edge"),
        ("ui/kepi_ui_button-wood-normal.png", "button-wood-normal"),
        ("ui/kepi_ui_button-wood-hover.png", "button-wood-hover"),
        ("ui/kepi_ui_button-wood-disabled.png", "button-wood-disabled"),
        ("ui/kepi_ui_hud-tag.png", "hud-tag"),
        ("ui/kepi_ui_shop-slot.png", "shop-slot"),
        ("ui/kepi_ui_vignette-warm.png", "vignette-warm"),
        ("ui/kepi_ui_divider-wood.png", "divider-wood"),
    ]:
        img = gen.draw_ui_texture(kind)
        if kind == "paper-cream":
            img = force_opaque(opaque(img))
        save(img, rel)


def effects_assets() -> None:
    # Transparent gameplay effect layers, static PNG sources for animation.
    def canvas(size=(512, 512)):
        return Image.new("RGBA", size, (0, 0, 0, 0))

    img = canvas()
    d = ImageDraw.Draw(img, "RGBA")
    for r, a in [(210, 36), (150, 70), (86, 130)]:
        d.ellipse((256 - r, 256 - r, 256 + r, 256 + r), outline=rgba("#f6d37d", a), width=10)
    for i in range(12):
        ang = i / 12 * math.tau
        x1, y1 = 256 + math.cos(ang) * 70, 256 + math.sin(ang) * 70
        x2, y2 = 256 + math.cos(ang) * 225, 256 + math.sin(ang) * 225
        d.line((x1, y1, x2, y2), fill=rgba("#fff0b6", 120), width=5)
    d.polygon([(256, 80), (306, 202), (438, 204), (332, 282), (370, 418), (256, 338), (142, 418), (180, 282), (74, 204), (206, 202)], fill=rgba("#f7c85c", 120), outline=rgba("#7d5b25", 120))
    save(img.filter(ImageFilter.GaussianBlur(0.4)), "effects/kepi_effect-star-up.png")

    img = canvas()
    d = ImageDraw.Draw(img, "RGBA")
    d.arc((78, 78, 434, 434), 25, 315, fill=rgba("#5f88aa", 210), width=22)
    d.polygon([(398, 232), (464, 232), (428, 292)], fill=rgba("#5f88aa", 210))
    d.arc((128, 128, 384, 384), 210, 520, fill=rgba("#f5d495", 115), width=10)
    save(img, "effects/kepi_effect-shop-refresh.png")

    img = canvas()
    d = ImageDraw.Draw(img, "RGBA")
    d.rounded_rectangle((116, 166, 396, 344), radius=22, fill=rgba("#f3e2c4", 190), outline=rgba("#866546", 180), width=8)
    d.polygon([(124, 174), (256, 270), (388, 174)], fill=rgba("#e2caa8", 145), outline=rgba("#866546", 120))
    d.ellipse((222, 242, 290, 310), fill=rgba("#b84742", 150), outline=rgba("#6e2d2a", 150), width=5)
    for x, y in [(82, 120), (420, 140), (80, 384), (430, 372)]:
        d.line((x, y, 256, 254), fill=rgba("#fff0be", 70), width=5)
    save(img, "effects/kepi_effect-shuike-letter-pickup.png")

    img = canvas()
    d = ImageDraw.Draw(img, "RGBA")
    d.polygon([(128, 250), (256, 140), (384, 250)], fill=rgba("#8a6545", 210), outline=rgba("#4e3829", 210), width=7)
    d.rectangle((154, 250, 358, 386), fill=rgba("#eadbbb", 205), outline=rgba("#4e3829", 210), width=7)
    d.line((296, 180, 406, 98), fill=rgba("#725138", 220), width=18)
    d.line((384, 80, 442, 134), fill=rgba("#725138", 220), width=18)
    d.ellipse((90, 340, 150, 400), fill=rgba("#74aa65", 120))
    save(img, "effects/kepi_effect-home-repair.png")

    img = gradient((1600, 900), rgba("#e9d8b8"), rgba("#b5c3a4"))
    img = blobs(img, 919, ["#f5e6c8", "#8eb08a", "#d0a76b", "#6c88a0"], 50, 36)
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse((390, 190, 1210, 760), fill=rgba("#efe1bf", 150), outline=rgba("#8b6a45", 120), width=8)
    for x in [560, 720, 880, 1040]:
        d.ellipse((x - 34, 360, x + 34, 428), fill=rgba("#d7b18f"), outline=rgba("#3b2b25"), width=4)
        d.rounded_rectangle((x - 46, 430, x + 46, 580), radius=22, fill=rgba("#486b91"), outline=rgba("#28344b"), width=4)
    d.polygon([(760, 260), (840, 260), (870, 342), (730, 342)], fill=rgba("#9b714f"), outline=rgba("#4c3628"), width=4)
    save(force_opaque(paper_grain(img, 919, 2600)), "effects/kepi_event-public-welfare.png")

    img = canvas()
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse((82, 82, 430, 430), fill=rgba("#5e7894", 44), outline=rgba("#d7be7d", 150), width=9)
    for i in range(8):
        ang = i / 8 * math.tau
        d.line((256, 256, 256 + math.cos(ang) * 180, 256 + math.sin(ang) * 180), fill=rgba("#e8d39a", 80), width=5)
    d.ellipse((188, 188, 324, 324), outline=rgba("#1f2830", 150), width=6)
    d.arc((200, 200, 312, 312), 90, 270, fill=rgba("#f1e5c2", 160), width=14)
    d.arc((200, 200, 312, 312), 270, 90, fill=rgba("#18202a", 160), width=14)
    save(img, "effects/kepi_effect-fengshui-buff-tile.png")

    img = canvas((1024, 1024))
    d = ImageDraw.Draw(img, "RGBA")
    rng = random.Random(928)
    for _ in range(18):
        x, y = rng.randint(80, 850), rng.randint(120, 780)
        sw, sh = rng.randint(90, 190), rng.randint(48, 108)
        d.rounded_rectangle((x, y, x + sw, y + sh), radius=8, fill=rgba("#efe1c3", rng.randint(85, 170)), outline=rgba("#9a7b58", 120), width=3)
        d.line((x + 12, y + sh * 0.42, x + sw - 12, y + sh * 0.42), fill=rgba("#8d7054", 85), width=3)
    save(img.filter(ImageFilter.GaussianBlur(0.2)), "effects/kepi_effect-ending-letter-variant.png")

    img = canvas()
    d = ImageDraw.Draw(img, "RGBA")
    d.polygon([(108, 236), (256, 92), (404, 236), (344, 270), (430, 420), (264, 338), (96, 420), (168, 270)], fill=rgba("#b6403a", 160), outline=rgba("#40282b", 150), width=8)
    for i in range(9):
        ang = (i / 9) * math.tau
        d.line((256, 256, 256 + math.cos(ang) * 226, 256 + math.sin(ang) * 226), fill=rgba("#c84f44", 105), width=8)
    save(img.filter(ImageFilter.GaussianBlur(0.4)), "effects/kepi_effect-forgotten-attack.png")

    img = canvas((1600, 900))
    d = ImageDraw.Draw(img, "RGBA")
    rng = random.Random(930)
    for _ in range(90):
        x, y = rng.randint(0, 1600), rng.randint(0, 900)
        r = rng.randint(2, 10)
        d.ellipse((x - r, y - r, x + r, y + r), fill=rgba("#f5e6bf", rng.randint(20, 78)))
    for _ in range(22):
        x, y = rng.randint(-80, 1600), rng.randint(120, 820)
        d.ellipse((x, y, x + rng.randint(140, 360), y + rng.randint(24, 78)), fill=rgba("#d7e0dc", rng.randint(18, 50)))
    save(img.filter(ImageFilter.GaussianBlur(1.2)), "effects/kepi_effect-mist-particles.png")


def main() -> None:
    recolor_xiangxian_to_patriarch()
    for rel, stage in [
        ("board/kepi_tulou-board-main.png", 2),
        ("board/kepi_tulou-stage1-broken.png", 1),
        ("board/kepi_tulou-stage2-repair.png", 2),
        ("board/kepi_tulou-stage3-renewed.png", 3),
    ]:
        save(tulou_scene(stage), rel)
    save(tulou_scene(2, battle=True), "board/kepi_battle-background.png")
    for rel, kind in [
        ("enemies/kepi_qianhai-stele.png", "qianhai-stele"),
        ("enemies/kepi_luyin-clerk.png", "luyin-clerk"),
        ("enemies/kepi_zhuzai-contract.png", "zhuzai-contract"),
        ("enemies/kepi_ehu-mountain.png", "ehu-mountain"),
        ("enemies/kepi_redhead-ship.png", "redhead-ship"),
        ("enemies/kepi_melee-fire.png", "melee-fire"),
    ]:
        save(draw_enemy(kind), rel)
    ending_assets()
    ui_textures()
    effects_assets()
    print("regenerated static PNG assets")


if __name__ == "__main__":
    main()

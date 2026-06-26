#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
REMOVE_KEY = Path.home() / ".codex" / "skills" / ".system" / "imagegen" / "scripts" / "remove_chroma_key.py"


def fit_rgba(src: Path, dst: Path, size: tuple[int, int], transparent: bool) -> None:
    img = Image.open(src).convert("RGBA")
    if transparent:
        alpha = img.getchannel("A")
        bbox = alpha.getbbox()
        if bbox:
            pad = max(img.size) // 18
            x0 = max(0, bbox[0] - pad)
            y0 = max(0, bbox[1] - pad)
            x1 = min(img.size[0], bbox[2] + pad)
            y1 = min(img.size[1], bbox[3] + pad)
            img = img.crop((x0, y0, x1, y1))
        canvas = Image.new("RGBA", size, (0, 0, 0, 0))
        scale = min(size[0] / img.size[0], size[1] / img.size[1]) * 0.98
        resized = img.resize((max(1, int(img.size[0] * scale)), max(1, int(img.size[1] * scale))), Image.Resampling.LANCZOS)
        canvas.alpha_composite(resized, ((size[0] - resized.size[0]) // 2, (size[1] - resized.size[1]) // 2))
        canvas.save(dst, format="PNG", optimize=True)
        return

    fitted = Image.new("RGBA", size, (0, 0, 0, 0))
    scale = max(size[0] / img.size[0], size[1] / img.size[1])
    resized = img.resize((max(1, int(img.size[0] * scale)), max(1, int(img.size[1] * scale))), Image.Resampling.LANCZOS)
    left = max(0, (resized.size[0] - size[0]) // 2)
    top = max(0, (resized.size[1] - size[1]) // 2)
    fitted.alpha_composite(resized.crop((left, top, left + size[0], top + size[1])), (0, 0))
    fitted.save(dst, format="PNG", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", required=True)
    parser.add_argument("--dst", required=True)
    parser.add_argument("--size", required=True, help="WIDTHxHEIGHT")
    parser.add_argument("--transparent", action="store_true")
    args = parser.parse_args()
    w, h = map(int, args.size.lower().split("x"))
    src = Path(args.src)
    dst = Path(args.dst)
    dst.parent.mkdir(parents=True, exist_ok=True)

    if args.transparent:
        tmp = dst.with_suffix(".chromakey.png")
        subprocess.run(
            [
                sys.executable,
                str(REMOVE_KEY),
                "--input",
                str(src),
                "--out",
                str(tmp),
                "--auto-key",
                "border",
                "--soft-matte",
                "--transparent-threshold",
                "12",
                "--opaque-threshold",
                "220",
                "--despill",
            ],
            check=True,
        )
        fit_rgba(tmp, dst, (w, h), True)
        tmp.unlink(missing_ok=True)
        return

    fit_rgba(src, dst, (w, h), False)


if __name__ == "__main__":
    main()

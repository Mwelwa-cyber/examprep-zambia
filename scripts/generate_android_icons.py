#!/usr/bin/env python3
"""Generate Android launcher icons from the ZedExams logo."""

import os
from PIL import Image, ImageDraw, ImageOps

LOGO_PATH = "/home/user/Zedexams/public/zedexams-logo.png"
RES_DIR = "/home/user/Zedexams/android/app/src/main/res"

DENSITIES = {
    "mdpi":    48,
    "hdpi":    72,
    "xhdpi":   96,
    "xxhdpi":  144,
    "xxxhdpi": 192,
}

FOREGROUND_SIZES = {
    "mdpi":    108,
    "hdpi":    162,
    "xhdpi":   216,
    "xxhdpi":  324,
    "xxxhdpi": 432,
}

BG_COLOR = (255, 255, 255, 255)  # white background


def find_emblem_bottom(img: Image.Image) -> int:
    """Find the y-coordinate where the circular emblem ends (before the text).

    Scans for the first wide horizontal gap (mostly white/transparent rows)
    after the top 30% of the image, which separates the emblem from the text.
    """
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    start_y = int(img.height * 0.30)  # skip top margin
    gap_rows = 0

    for y in range(start_y, img.height):
        non_white = sum(
            1 for x in range(img.width)
            if pixels[x, y][3] > 10 and not (
                pixels[x, y][0] > 240 and pixels[x, y][1] > 240 and pixels[x, y][2] > 240
            )
        )
        if non_white < img.width * 0.02:  # row is >98% empty
            gap_rows += 1
            if gap_rows >= 3:  # 3 consecutive near-empty rows = gap found
                return y - gap_rows
        else:
            gap_rows = 0

    return img.height  # no gap found — use full height


def crop_to_emblem(img: Image.Image, padding_ratio: float = 0.04) -> Image.Image:
    """Crop image to just the circular emblem, excluding text below it."""
    rgba = img.convert("RGBA")
    pixels = rgba.load()

    emblem_bottom = find_emblem_bottom(rgba)
    emblem_region = rgba.crop((0, 0, img.width, emblem_bottom))

    # Find tight bounding box of non-white content within that region
    non_bg = Image.new("L", emblem_region.size, 0)
    mask = non_bg.load()
    ep = emblem_region.load()
    for y in range(emblem_region.height):
        for x in range(emblem_region.width):
            pr, pg, pb, pa = ep[x, y]
            if pa > 10 and not (pr > 240 and pg > 240 and pb > 240):
                mask[x, y] = 255

    bbox = non_bg.getbbox()
    if not bbox:
        return emblem_region

    pad_x = int((bbox[2] - bbox[0]) * padding_ratio)
    pad_y = int((bbox[3] - bbox[1]) * padding_ratio)
    bbox = (
        max(0, bbox[0] - pad_x),
        max(0, bbox[1] - pad_y),
        min(emblem_region.width, bbox[2] + pad_x),
        min(emblem_region.height, bbox[3] + pad_y),
    )
    return emblem_region.crop(bbox)


def make_square_icon(logo_cropped: Image.Image, size: int) -> Image.Image:
    """Create a square icon with the logo centered on a white background."""
    icon = Image.new("RGBA", (size, size), BG_COLOR)

    # Fit logo within 80% of icon area
    max_dim = int(size * 0.80)
    logo_copy = logo_cropped.copy()
    logo_copy.thumbnail((max_dim, max_dim), Image.LANCZOS)

    offset_x = (size - logo_copy.width) // 2
    offset_y = (size - logo_copy.height) // 2
    icon.paste(logo_copy, (offset_x, offset_y), logo_copy)
    return icon


def make_round_icon(logo_cropped: Image.Image, size: int) -> Image.Image:
    """Create a circular icon."""
    square = make_square_icon(logo_cropped, size)

    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)

    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    result.paste(square, (0, 0), mask)
    return result


def make_foreground_icon(logo_cropped: Image.Image, size: int) -> Image.Image:
    """Create adaptive icon foreground (logo in center 66% safe zone)."""
    fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    safe = int(size * 0.66)
    logo_copy = logo_cropped.copy()
    logo_copy.thumbnail((safe, safe), Image.LANCZOS)

    offset_x = (size - logo_copy.width) // 2
    offset_y = (size - logo_copy.height) // 2
    fg.paste(logo_copy, (offset_x, offset_y), logo_copy)
    return fg


def save_png(img: Image.Image, path: str) -> None:
    img.convert("RGBA").save(path, "PNG", optimize=True)
    print(f"  Wrote {path}  ({img.width}x{img.height})")


def main():
    logo = Image.open(LOGO_PATH).convert("RGBA")
    print(f"Loaded logo: {logo.size}")

    logo_cropped = crop_to_emblem(logo)
    print(f"Emblem-only crop: {logo_cropped.size}")

    for density, size in DENSITIES.items():
        out_dir = os.path.join(RES_DIR, f"mipmap-{density}")
        os.makedirs(out_dir, exist_ok=True)

        square = make_square_icon(logo_cropped, size)
        save_png(square, os.path.join(out_dir, "ic_launcher.png"))

        round_icon = make_round_icon(logo_cropped, size)
        save_png(round_icon, os.path.join(out_dir, "ic_launcher_round.png"))

    for density, size in FOREGROUND_SIZES.items():
        out_dir = os.path.join(RES_DIR, f"mipmap-{density}")
        fg = make_foreground_icon(logo_cropped, size)
        save_png(fg, os.path.join(out_dir, "ic_launcher_foreground.png"))

    print("\nDone! All icons generated.")


if __name__ == "__main__":
    main()

"""
Generates icons/icon128.png — the Chrome Web Store icon for UTC Clock & Epoch Converter.

Canvas: 128x128 px total, 16 px transparent padding on each side → 96x96 px content area.
Design: dark rounded square, amber "UTC" label, amber badge pill showing sample time.
Works on both light and dark backgrounds via a subtle white rim on the rounded square.
"""

from PIL import Image, ImageDraw, ImageFont

# ── Dimensions ────────────────────────────────────────────────────────────────
TOTAL   = 128
PAD     = 16
CONTENT = TOTAL - 2 * PAD   # 96

# Content area corners
X0, Y0 = PAD, PAD
X1, Y1 = PAD + CONTENT, PAD + CONTENT
CX      = TOTAL // 2         # horizontal centre

# ── Colors ────────────────────────────────────────────────────────────────────
BG_DARK = (13, 13, 13, 255)          # #0d0d0d  — rounded square fill
AMBER   = (255, 171, 0, 255)         # #ffab00  — UTC text + badge bg
BLACK   = (0, 0, 0, 255)
RIM     = (255, 255, 255, 45)        # subtle white rim → visible on dark bg

RADIUS  = 20

# ── Font loading ─────────────────────────────────────────────────────────────
def load_font(paths_and_sizes):
    """Try each (path, size[, index]) tuple; return first that loads."""
    for entry in paths_and_sizes:
        path, size = entry[0], entry[1]
        idx = entry[2] if len(entry) > 2 else 0
        try:
            return ImageFont.truetype(path, size, index=idx)
        except Exception:
            pass
    return ImageFont.load_default()

# Bold sans-serif for "UTC"
font_utc = load_font([
    ('/System/Library/Fonts/HelveticaNeue.ttc', 30, 1),     # Helvetica Neue Bold
    ('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 30),
    ('/System/Library/Fonts/SFNS.ttf', 30),
    ('/System/Library/Fonts/Helvetica.ttc', 30, 1),
])

# Monospace for the badge time (mirrors the extension's font-family: monospace)
font_badge = load_font([
    ('/System/Library/Fonts/SFNSMono.ttf', 22),
    ('/System/Library/Fonts/Menlo.ttc', 22),
    ('/System/Library/Fonts/Monaco.ttf', 22),
    ('/System/Library/Fonts/Supplemental/Andale Mono.ttf', 22),
])

# ── Draw ──────────────────────────────────────────────────────────────────────
img  = Image.new('RGBA', (TOTAL, TOTAL), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# White rim (1 px outset) for visibility on dark backgrounds
draw.rounded_rectangle([X0 - 1, Y0 - 1, X1 + 1, Y1 + 1], radius=RADIUS + 1, fill=RIM)

# Main dark rounded square
draw.rounded_rectangle([X0, Y0, X1, Y1], radius=RADIUS, fill=BG_DARK)

# ── "UTC" label ───────────────────────────────────────────────────────────────
utc_text = "UTC"
bb = draw.textbbox((0, 0), utc_text, font=font_utc)
tw, th = bb[2] - bb[0], bb[3] - bb[1]
tx = CX - tw // 2 - bb[0]
ty = Y0 + 10 - bb[1]
draw.text((tx, ty), utc_text, font=font_utc, fill=AMBER)

# ── Badge pill ────────────────────────────────────────────────────────────────
badge_text = "14:30"
bb2  = draw.textbbox((0, 0), badge_text, font=font_badge)
bw   = bb2[2] - bb2[0]
bh   = bb2[3] - bb2[1]

H_PAD, V_PAD = 10, 6
pill_w = bw + 2 * H_PAD
pill_h = bh + 2 * V_PAD
pill_x = CX - pill_w // 2
pill_y = Y0 + 48            # vertically below "UTC"

draw.rounded_rectangle(
    [pill_x, pill_y, pill_x + pill_w, pill_y + pill_h],
    radius=pill_h // 2,
    fill=AMBER,
)

# Badge text (black, centred inside pill)
draw.text(
    (pill_x + H_PAD - bb2[0], pill_y + V_PAD - bb2[1]),
    badge_text,
    font=font_badge,
    fill=BLACK,
)

# ── Save ──────────────────────────────────────────────────────────────────────
import os
os.makedirs('icons', exist_ok=True)
out = 'icons/icon128.png'
img.save(out, 'PNG')
print(f"Saved {out}  ({TOTAL}x{TOTAL} px, content {CONTENT}x{CONTENT} px, pad {PAD} px)")

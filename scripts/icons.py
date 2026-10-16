#!/usr/bin/env python3
"""Regenerates the site icons in static/ from the "MB" logo mark (dev-only).

Letters are real Montserrat ExtraBold outlines (not <text>), so the icons look
the same everywhere, even where the web font is not available.

    pip install fonttools brotli cairosvg pillow
    python3 scripts/icons.py

Output: favicon.svg, favicon.ico (16/32/48), apple-touch-icon.png (180, opaque),
icon-192.png, icon-512.png, icon-maskable-512.png.
"""
from io import BytesIO
from pathlib import Path

import cairosvg
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / 'static'
FONT = ROOT / 'static/assets/fonts/montserrat-latin-800-normal.woff2'

DARK = '#1c1a19'   # --text (light theme)
LIGHT = '#f6f3ee'  # --bg (light theme)
DARK_MODE_BG = '#f1ece6'  # --text (dark theme)
DARK_MODE_FG = '#121111'  # --bg (dark theme)


def mb_path(size, cap_ratio):
    """SVG path data for "MB", centred in a size x size box, cap height = size * cap_ratio."""
    font = TTFont(FONT)
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font['head'].unitsPerEm
    cap = font['OS/2'].sCapHeight or 700
    scale = size * cap_ratio / cap
    spacing = 0.02 * upm  # letter-spacing: .02em, as on the site

    names = [cmap[ord(ch)] for ch in 'MB']
    # ink bounds of the word, to centre it optically rather than by advance widths
    x = 0
    xmin, xmax = None, None
    for name in names:
        g = glyphs[name]
        from fontTools.pens.boundsPen import BoundsPen
        bp = BoundsPen(glyphs)
        g.draw(bp)
        b = bp.bounds
        xmin = x + b[0] if xmin is None else min(xmin, x + b[0])
        xmax = x + b[2] if xmax is None else max(xmax, x + b[2])
        x += g.width + spacing
    width = (xmax - xmin) * scale
    ox = (size - width) / 2 - xmin * scale
    oy = (size + cap * scale) / 2

    pen = SVGPathPen(glyphs)
    x = 0
    for name in names:
        g = glyphs[name]
        # font units are y-up; SVG is y-down
        tp = TransformPen(pen, (scale, 0, 0, -scale, ox + x * scale, oy))
        g.draw(tp)
        x += g.width + spacing
    return pen.getCommands()


def svg(size, *, shape, cap_ratio, bg=DARK, fg=LIGHT, dark_mode=False):
    d = mb_path(size, cap_ratio)
    r = size / 2
    back = (f'<circle class="b" cx="{r}" cy="{r}" r="{r}"/>' if shape == 'circle'
            else f'<rect class="b" width="{size}" height="{size}"/>')
    style = f'.b{{fill:{bg}}}.f{{fill:{fg}}}'
    if dark_mode:
        style += f'@media (prefers-color-scheme:dark){{.b{{fill:{DARK_MODE_BG}}}.f{{fill:{DARK_MODE_FG}}}}}'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">'
            f'<style>{style}</style>{back}<path class="f" d="{d}"/></svg>')


def png(svg_text, px, *, opaque=False):
    data = cairosvg.svg2png(bytestring=svg_text.encode(), output_width=px, output_height=px)
    im = Image.open(BytesIO(data)).convert('RGBA')
    if opaque:
        im = im.convert('RGB')
    return im


def main():
    # browser tab: round mark like the header logo; follows the system theme
    tab = svg(64, shape='circle', cap_ratio=0.30, dark_mode=True)
    (STATIC / 'favicon.svg').write_text(tab + '\n', encoding='utf-8')

    # favicon.ico: 16, 32, 48; slightly bigger letters so they survive 16 px
    ico_svg = svg(64, shape='circle', cap_ratio=0.34)
    base = png(ico_svg, 256)
    base.save(STATIC / 'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])

    # iOS home screen: square, opaque, full bleed - iOS rounds the corners itself
    png(svg(180, shape='square', cap_ratio=0.28), 180, opaque=True).save(STATIC / 'apple-touch-icon.png', optimize=True)

    # Android / PWA (site.webmanifest)
    round_svg = svg(512, shape='circle', cap_ratio=0.30)
    png(round_svg, 192).save(STATIC / 'icon-192.png', optimize=True)
    png(round_svg, 512).save(STATIC / 'icon-512.png', optimize=True)
    # maskable: full bleed, letters inside the 80% safe zone
    png(svg(512, shape='square', cap_ratio=0.24), 512, opaque=True).save(STATIC / 'icon-maskable-512.png', optimize=True)
    print('Icons written to static/')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Generates icon.png (512x512) for the extension: a document whose citation
line ends in the blue evidence marker. Drawn at 4x and downscaled."""
from PIL import Image, ImageDraw, ImageFilter

S = 4  # supersample factor
W = 512 * S

img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# Background: rounded square, vertical navy gradient
bg = Image.new("RGBA", (W, W), (0, 0, 0, 0))
gd = ImageDraw.Draw(bg)
top, bot = (30, 41, 82), (13, 18, 38)
for y in range(W):
    t = y / W
    gd.line([(0, y), (W, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(top, bot)))
mask = Image.new("L", (W, W), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, W, W], radius=int(W * 0.22), fill=255)
img.paste(bg, (0, 0), mask)

# Page shadow
shadow = Image.new("RGBA", (W, W), (0, 0, 0, 0))
ImageDraw.Draw(shadow).rounded_rectangle(
    [int(W * 0.20), int(W * 0.16), int(W * 0.72), int(W * 0.86)],
    radius=int(W * 0.035), fill=(0, 0, 0, 110))
shadow = shadow.filter(ImageFilter.GaussianBlur(int(W * 0.02)))
img.alpha_composite(shadow, (int(W * 0.015), int(W * 0.02)))

# Page
d = ImageDraw.Draw(img)
page = [int(W * 0.20), int(W * 0.16), int(W * 0.72), int(W * 0.86)]
d.rounded_rectangle(page, radius=int(W * 0.035), fill=(245, 247, 252, 255))

# Text lines on the page
line_x0 = int(W * 0.26)
line_x1 = int(W * 0.66)
lh = int(W * 0.028)
gray = (168, 176, 192, 255)
ys = [0.24, 0.31, 0.38, 0.45, 0.56, 0.63]
widths = [1.0, 0.86, 0.94, 0.60, 1.0, 0.78]
for y, wfrac in zip(ys, widths):
    yy = int(W * y)
    d.rounded_rectangle([line_x0, yy, line_x0 + int((line_x1 - line_x0) * wfrac), yy + lh],
                        radius=lh // 2, fill=gray)

# The citation line: blue, ending right where the evidence marker sits
blue = (59, 130, 246, 255)
cy = int(W * 0.735)
d.rounded_rectangle([line_x0, cy, int(W * 0.60), cy + lh],
                    radius=lh // 2, fill=blue)

# Evidence marker: big blue triangle right after the citation line, overlapping the page edge
tri_cx, tri_cy = int(W * 0.735), cy + lh // 2
tr = int(W * 0.115)
tri = [(tri_cx - int(tr * 0.62), tri_cy - tr),
       (tri_cx - int(tr * 0.62), tri_cy + tr),
       (tri_cx + tr, tri_cy)]
glow = Image.new("RGBA", (W, W), (0, 0, 0, 0))
ImageDraw.Draw(glow).polygon(tri, fill=(96, 165, 250, 200))
glow = glow.filter(ImageFilter.GaussianBlur(int(W * 0.025)))
img.alpha_composite(glow)
d = ImageDraw.Draw(img)
d.polygon(tri, fill=(96, 165, 250, 255))
inner = [(tri_cx - int(tr * 0.40), tri_cy - int(tr * 0.62)),
         (tri_cx - int(tr * 0.40), tri_cy + int(tr * 0.62)),
         (tri_cx + int(tr * 0.62), tri_cy)]
d.polygon(inner, fill=(219, 234, 254, 255))

img = img.resize((512, 512), Image.LANCZOS)
img.save(__file__.replace("icon.py", "icon.png"))
print("wrote icon.png")

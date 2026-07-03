"""Render a consistent set of moon-phase images from one full-moon photo.

Model: a pixel is lit where the surface normal faces the sun.
  normal n = (x, y, z),  z = sqrt(1 - x^2 - y^2)
  sun    s = (sin p, 0, -cos p),  p = phase angle (0=new, pi=full)
  lit where n . s = x*sin p - z*cos p > 0
The terminator is softened; the dark side keeps a faint earthshine glow.
"""

import math
import numpy as np
from PIL import Image, ImageFilter

SRC = "assets/_src/fullmoon.jpg"
OUT = "assets/phases"
SIZE = 480          # output square size (px; displayed ~120-240px)
MARGIN = 1.06       # disc padding inside the square

# ---- 1. locate the moon disc in the source photo ----------------------------
src = Image.open(SRC).convert("RGB")
arr = np.asarray(src).astype(np.float32)
lum = arr.mean(axis=2)
mask = lum > 40                      # moon is bright on a near-black sky
ys, xs = np.nonzero(mask)
cx, cy = xs.mean(), ys.mean()
# radius from the bright-pixel spread (robust to a few stray hot pixels)
r = math.sqrt(mask.sum() / math.pi) * 1.02

# ---- 2. crop a centered square around the disc and resize --------------------
half = r * MARGIN
box = (int(cx - half), int(cy - half), int(cx + half), int(cy + half))
disc = src.crop(box).resize((SIZE, SIZE), Image.LANCZOS)
moon = np.asarray(disc).astype(np.float32)

# ---- 3. per-pixel geometry --------------------------------------------------
lin = (np.arange(SIZE) + 0.5) / SIZE * 2 - 1     # -1..1
X, Y = np.meshgrid(lin, lin)
Yg = -Y                                           # image y grows downward
rr = X * X + Yg * Yg
inside = rr <= 1.0
Z = np.sqrt(np.clip(1 - rr, 0, 1))

# soft circular edge (anti-aliased disc alpha)
edge = 1.4 / SIZE
disc_alpha = np.clip((1.0 - np.sqrt(rr)) / edge, 0, 1)

PHASES = [
    ("new",              0),
    ("waxing-crescent",  45),
    ("first-quarter",    90),
    ("waxing-gibbous",   135),
    ("full",             180),
    ("waning-gibbous",   225),
    ("last-quarter",     270),
    ("waning-crescent",  315),
]

# cool, very dark earthshine tint for the shadowed side
EARTH = np.array([26, 30, 44], np.float32)

for name, deg in PHASES:
    p = math.radians(deg)
    ndots = X * math.sin(p) - Z * math.cos(p)     # n . s
    soft = 0.06                                     # terminator softness
    lit = np.clip(ndots / soft + 0.5, 0, 1)        # smooth 0..1 across terminator
    lit = lit[..., None]

    # lit side = photo; dark side = faint earthshine + a whisper of the texture
    earth = EARTH[None, None, :] + moon * 0.05
    out = moon * lit + earth * (1 - lit)

    rgb = np.clip(out, 0, 255).astype(np.uint8)
    a = np.clip(disc_alpha * 255, 0, 255).astype(np.uint8)
    img = Image.fromarray(np.dstack([rgb, a]), "RGBA")
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    img.save(f"{OUT}/{name}.webp", quality=82, method=6)
    print("wrote", name, f"({deg}deg)")

print("done")

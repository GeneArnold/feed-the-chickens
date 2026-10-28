# Paints plain grass over the bottom of a background picture (the fence some came with): from `cut`
# down, each column takes the usual colour of the grass just above it, blended in at the seam.
#   python3 tools/nofence.py <in.png> <out.jpg> <cut>
import sys

from PIL import Image

src, dst, cut = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src).convert("RGB")
w, h = im.size
px = im.load()
out = im.copy()
o = out.load()
medians = []
for x in range(w):
    col = sorted(px[x, y] for y in range(cut - 60, cut))
    medians.append(col[len(col) // 2])  # the median skips the odd grass tuft
# smoothed side to side, so the strip has no streaks
R = 40
smooth = [tuple(sum(c[i] for c in medians[max(0, x - R):x + R + 1]) / len(medians[max(0, x - R):x + R + 1]) for i in range(3)) for x in range(w)]
for x in range(w):
    grass = smooth[x]
    for y in range(cut - 20, h):
        a = min(1, (y - (cut - 20)) / 20)
        r, g, b = px[x, y]
        o[x, y] = tuple(round(c * (1 - a) + gc * a) for c, gc in zip((r, g, b), grass))
out.save(dst, quality=84, optimize=True, progressive=True)

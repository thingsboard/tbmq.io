# python3 diffrows.py <before.png> <after.png> [out.png] — the vertical bands where two shots differ, with their x-extent.
# With out.png, saves the first band below the first screen side by side (before | after).
import sys

from PIL import Image, ImageChops

a = Image.open(sys.argv[1]).convert('RGB')
b = Image.open(sys.argv[2]).convert('RGB')
w, h = min(a.width, b.width), min(a.height, b.height)
diff = ImageChops.difference(a.crop((0, 0, w, h)), b.crop((0, 0, w, h))).convert('L').point(lambda v: 255 if v > 24 else 0)
bands = []
start = None
for y in range(h):
    row = diff.crop((0, y, w, y + 1)).getbbox()
    if row and start is None:
        start = y
    if not row and start is not None:
        if y - start > 0:
            bands.append((start, y))
        start = None
if start is not None:
    bands.append((start, h))
# Merge bands closer than 12px.
merged = []
for s, e in bands:
    if merged and s - merged[-1][1] < 12:
        merged[-1] = (merged[-1][0], e)
    else:
        merged.append((s, e))
for s, e in merged:
    box = diff.crop((0, s, w, e)).getbbox()
    print(f'rows {s}-{e} x {box[0]}-{box[2]}')
if len(sys.argv) > 3:
    deep = [m for m in merged if m[0] > 940]
    if deep:
        s, e = deep[0]
        s, e = max(0, s - 20), min(h, e + 20)
        out = Image.new('RGB', (w * 2 + 10, e - s), (255, 0, 255))
        out.paste(a.crop((0, s, w, e)), (0, 0))
        out.paste(b.crop((0, s, w, e)), (w + 10, 0))
        out.save(sys.argv[3])

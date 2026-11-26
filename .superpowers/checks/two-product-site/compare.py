# python3 compare.py <beforeDir> <afterDir> — for each shot present in both, where do the pages differ?
# Prints page size and the vertical extent of the differing rows, so "only the header changed" is visible at a glance.
import os
import sys

from PIL import Image, ImageChops

before_dir, after_dir = sys.argv[1], sys.argv[2]
for name in sorted(os.listdir(before_dir)):
    after_path = os.path.join(after_dir, name)
    if not name.endswith('.png') or not os.path.exists(after_path):
        continue
    a = Image.open(os.path.join(before_dir, name)).convert('RGB')
    b = Image.open(after_path).convert('RGB')
    note = '' if a.size == b.size else f' SIZE {a.size} -> {b.size}'
    h = min(a.height, b.height)
    w = min(a.width, b.width)
    diff = ImageChops.difference(a.crop((0, 0, w, h)), b.crop((0, 0, w, h))).convert('L').point(lambda v: 255 if v > 24 else 0)
    box = diff.getbbox()
    # Rows that differ outside the top bar.
    below = diff.crop((0, 100, w, h))
    hist = below.histogram()
    changed = hist[255] / max(1, below.width * below.height)
    print(f'{name:44s} bbox={box} below-bar-diff={changed:.2%}{note}')

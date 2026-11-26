# python3 crop.py <in.png> <out.png> <x> <y> <w> <h> — cut a region out of a full-page shot for a closer look.
import sys

from PIL import Image

src, dst, x, y, w, h = sys.argv[1], sys.argv[2], *map(int, sys.argv[3:7])
Image.open(src).crop((x, y, x + w, y + h)).save(dst)

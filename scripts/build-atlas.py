"""Pack the Discord icon library into one texture.

116 separate PNGs is 116 requests, 116 decodes and 116 GPU textures for a
canvas that draws maybe forty glyphs at a time. One atlas is one of each, and
it stays in cache across every mockup the tool ever renders.

Each tile keeps its own artwork size and sits centred in a 48px cell. The
gutter is not decoration: the browser samples the atlas at a fractional scale
for every icon drawn at anything other than 32px, and without clear space
around a tile that sampling reaches into its neighbour.

Run from the repository root:

    python3 scripts/build-atlas.py

Reads the un-matted tiles in `art/discord-*` and writes `public/discord/
atlas.png` with `src/discord/atlas.json`, which is what the renderer imports.
The tiles themselves are never served.
"""

import json, os, struct, zlib

CELL = 48
COLS = 12

def read(p):
    d = open(p, "rb").read()
    i, idat = 8, b""
    while i < len(d):
        ln = struct.unpack(">I", d[i:i + 4])[0]
        typ, data = d[i + 4:i + 8], d[i + 8:i + 8 + ln]
        i += 12 + ln
        if typ == b"IHDR":
            w, h, bd, ct = struct.unpack(">IIBB", data[:10])
        elif typ == b"IDAT":
            idat += data
    raw = zlib.decompress(idat)
    ch = {0: 1, 2: 3, 4: 2, 6: 4}[ct]
    stride = w * ch
    out, prev, pos = bytearray(), bytearray(stride), 0
    for _ in range(h):
        f = raw[pos]; pos += 1
        line = bytearray(raw[pos:pos + stride]); pos += stride
        for x in range(stride):
            a = line[x - ch] if x >= ch else 0
            b = prev[x]
            c = prev[x - ch] if x >= ch else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + (a + b) // 2) & 255
            elif f == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        out += line
        prev = line
    return w, h, ch, bytes(out)

def write(p, w, h, rgba):
    raw = b"".join(b"\x00" + rgba[y * w * 4:(y + 1) * w * 4] for y in range(h))
    def chunk(tag, payload):
        return (struct.pack(">I", len(payload)) + tag + payload
                + struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF))
    open(p, "wb").write(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b""))

def chroma(w, h, ch, px):
    """The largest gap between a solid pixel's channels: 0 for a grey glyph."""
    best = 0
    for i in range(w * h):
        if ch == 4 and px[i * ch + 3] < 200:
            continue
        c = px[i * ch:i * ch + 3]
        best = max(best, max(c) - min(c))
    return best

ART = "art"
GROUPS = ("icons", "badges", "status", "server")
tiles = []
for sub in GROUPS:
    d = os.path.join(ART, "discord-" + sub)
    for fn in sorted(os.listdir(d)):
        if fn.endswith(".png"):
            tiles.append((sub, fn[:-4], os.path.join(d, fn)))

rows = (len(tiles) + COLS - 1) // COLS
W, H = COLS * CELL, rows * CELL
buf = bytearray(W * H * 4)
index = {}

for n, (sub, name, path) in enumerate(tiles):
    w, h, ch, px = read(path)
    col, row = n % COLS, n // COLS
    ox = col * CELL + (CELL - w) // 2
    oy = row * CELL + (CELL - h) // 2
    for y in range(h):
        for x in range(w):
            s = (y * w + x) * ch
            d = ((oy + y) * W + (ox + x)) * 4
            if ch == 4:
                buf[d:d + 4] = px[s:s + 4]
            else:
                buf[d] = buf[d + 1] = buf[d + 2] = px[s]
                buf[d + 3] = 255
    index.setdefault(sub, {})[name] = {
        "x": ox, "y": oy, "w": w, "h": h,
        "flat": chroma(w, h, ch, px) <= 14,
    }

write("public/discord/atlas.png", W, H, bytes(buf))
meta = {"width": W, "height": H, "tiles": index}
open("src/discord/atlas.json", "w").write(json.dumps(meta, indent=1, sort_keys=True) + "\n")
print(f"{len(tiles)} tiles -> {W}x{H}, "
      f"{os.path.getsize('public/discord/atlas.png') // 1024}KB")

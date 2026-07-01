#!/usr/bin/env python3
"""Finalize the Sunrise icon at 16/48/128 into icons/. No deps."""
import struct, zlib, math, os
HERE = os.path.dirname(os.path.abspath(__file__))
ICONS = os.path.join(HERE, "..", "icons")

def png(w, h, px):
    def chunk(t, d): c = t + d; return struct.pack(">I", len(d)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w): raw += bytes(px[y*w+x])
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)) + \
           chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")

def lerp(a, b, t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(len(a)))
BG1, BG2 = (124,111,240), (91,75,214)

def base(size, x, y):
    cx = cy = size/2; radius = size*0.22
    dx = max(abs(x-cx)-(size/2-radius), 0); dy = max(abs(y-cy)-(size/2-radius), 0)
    if dx*dx+dy*dy > radius*radius: return False, (0,0,0,0)
    return True, lerp(BG1, BG2, y/size)

def sunrise(size, x, y, bg):
    cx = size*0.5; horizon = size*0.64; r = size*0.26
    SUN1, SUN2 = (255, 211, 107), (255, 150, 60)
    rw = max(size*0.012, 0.6)
    for k in range(-3, 4):
        ang = math.radians(90 + k*26)
        for t in range(1, 5):
            rr = r + size*0.03 + t*size*0.03
            rx = cx + math.cos(ang)*rr; ry = horizon - math.sin(ang)*rr
            if abs(x-rx) < rw and abs(y-ry) < rw:
                return lerp(SUN1, (255,255,255), 0.2)
    d = math.hypot(x-cx, y-horizon)
    if y <= horizon and d <= r:
        return lerp(SUN2, SUN1, 1-(y/horizon))
    if abs(y-horizon) < max(size*0.02, 0.7):
        return (255,255,255)
    return bg

def make(size):
    px = []
    for y in range(size):
        for x in range(size):
            inb, col = base(size, x, y)
            if not inb: px.append((0,0,0,0)); continue
            c = sunrise(size, x, y, col)
            px.append((c[0], c[1], c[2], 255))
    return png(size, size, px)

for s in (16, 48, 128):
    open(os.path.join(ICONS, f"icon{s}.png"), "wb").write(make(s))
    print(f"wrote icons/icon{s}.png")

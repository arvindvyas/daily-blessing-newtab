#!/usr/bin/env python3
"""Generate neutral, multi-faith icon concepts (128px) on the brand purple tile. No deps."""
import struct, zlib, math, os
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "icon_concepts")
os.makedirs(OUT, exist_ok=True)

def png(w, h, px):
    def chunk(t, d): c = t + d; return struct.pack(">I", len(d)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w): raw += bytes(px[y*w+x])
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)) + \
           chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")

def lerp(a, b, t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(len(a)))
BG1, BG2 = (124,111,240), (91,75,214)   # brand purple

def base(size, x, y):
    """rounded-rect purple bg mask + gradient color; returns (in_tile, color)"""
    cx = cy = size/2; radius = size*0.22
    dx = max(abs(x-cx)-(size/2-radius), 0); dy = max(abs(y-cy)-(size/2-radius), 0)
    if dx*dx+dy*dy > radius*radius: return False, (0,0,0,0)
    return True, lerp(BG1, BG2, y/size)

def save(name, fn, size=128):
    px = []
    for y in range(size):
        for x in range(size):
            inb, col = base(size, x, y)
            if not inb: px.append((0,0,0,0)); continue
            c = fn(size, x, y, col)
            px.append((c[0], c[1], c[2], 255))
    open(os.path.join(OUT, name), "wb").write(png(size, size, px))
    print("wrote", name)

# ---- A: Sunrise ----
def sunrise(size, x, y, bg):
    cx = size*0.5; horizon = size*0.64; r = size*0.26
    SUN1, SUN2 = (255, 211, 107), (255, 150, 60)
    # rays
    for k in range(-3, 4):
        ang = math.radians(90 + k*26)
        for t in range(1, 5):
            rx = cx + math.cos(ang)*(r+size*0.03+t*size*0.03)
            ry = horizon - math.sin(ang)*(r+size*0.03+t*size*0.03)
            if abs(x-rx) < size*0.012 and abs(y-ry) < size*0.012:
                return lerp(SUN1, (255,255,255), 0.2)
    d = math.hypot(x-cx, y-horizon)
    if y <= horizon and d <= r:
        return lerp(SUN2, SUN1, 1-(y/horizon))
    if abs(y-horizon) < size*0.02:  # horizon line
        return (255,255,255)
    return bg

# ---- B: Diya (lamp + flame) ----
def diya(size, x, y, bg):
    cx = size*0.5
    FL1, FL2 = (255, 224, 130), (255, 138, 40)
    # flame teardrop centered ~0.42
    fy = size*0.40;
    fx = x-cx; fyy = y-fy
    # teardrop: ellipse widening downward, pointed top
    w = size*0.11; h = size*0.20
    if fyy > -h and fyy < h:
        wr = w * (0.4 + 0.6*((fyy+h)/(2*h)))  # narrow at top
        if fx*fx/(wr*wr) + 0 <= 1 and abs(fx) <= wr:
            return lerp(FL1, FL2, (fyy+h)/(2*h))
    # lamp base: shallow bowl at 0.66
    by = size*0.68
    if y > by and y < by+size*0.10:
        halfw = size*0.20*(1-(y-by)/(size*0.12))
        if abs(x-cx) < halfw:
            return lerp((214,161,90),(150,110,60), (y-by)/(size*0.10))
    return bg

# ---- C: Lotus ----
def lotus(size, x, y, bg):
    cx = size*0.5; cy = size*0.66
    P1, P2 = (255,255,255), (223, 214, 255)
    petals = 0
    for k in range(-2, 3):
        ang = math.radians(90 + k*30)
        # petal as rotated ellipse from center
        px_ = cx; py_ = cy
        dxr = x-px_; dyr = y-py_
        # rotate point into petal frame
        ca, sa = math.cos(ang), math.sin(ang)
        u = dxr*ca + (-dyr)*sa
        v = dxr*sa + (-dyr)*ca
        pl = size*0.30; pw = size*0.075
        if v > 0 and (u*u)/(pw*pw) + ((v-pl*0.5)*(v-pl*0.5))/((pl*0.5)*(pl*0.5)) <= 1:
            petals += 1
    if petals:
        return lerp(P2, P1, min(1, petals*0.5))
    return bg

save("A_sunrise.png", sunrise)
save("B_diya.png", diya)
save("C_lotus.png", lotus)

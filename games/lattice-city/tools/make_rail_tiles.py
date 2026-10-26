"""Regenerate the rail track sprites for Lattice City.

Why this exists
---------------
city.js draws every tile sprite as a 128x128 box at a fixed anchor
(`drawImage(img, s.x, s.y - GROUND_OFFSET * zoom, TW * zoom, TW * zoom)`).
The rail sprites shipped as 128x64 canvases, so the renderer stretched each one
to double height and the track read as a raised ramp instead of lying flat on
the ground like the road pieces. Their internal band angle (~0.75:1) also did
not match the tile grid (2:1), so neighbouring pieces would not have joined even
after re-padding.

This script draws the 11 rail track sprites at 128x128 with the same
ground-diamond registration as every other tile in the library:

    diamond   N(64,64)  E(128,96)  S(64,128)  W(0,96)
    centre    C(64,96)
    arm ends  the four edge midpoints, one per neighbour:
                bit 1  up-right   (96,80)    view(0,-1)
                bit 2  down-right (96,112)   view(1,0)
                bit 4  down-left  (32,112)   view(0,1)
                bit 8  up-left    (32,80)    view(-1,0)

A straight piece runs centre-to-centre with its neighbour, crossing the shared
edge at the edge midpoint, so tiled runs join seamlessly. Every band is cut
square at the edge midpoint, so the join matches the neighbour's cut exactly.

Usage:  python tools/make_rail_tiles.py            (writes assets/tiles/gen/)
        python tools/make_rail_tiles.py --check    (report sizes only)
"""

from __future__ import annotations

import argparse
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

W = H = 128
S = 4  # supersample factor: draw big, shrink with area average for soft pixels
CX, CY = 64.0, 96.0  # tile centre
ARM_LEN = math.hypot(32, 16)  # 35.78: centre to edge midpoint

# unit vectors, centre -> edge midpoint
DIRS = {
    "N": (2 / math.sqrt(5), -1 / math.sqrt(5)),   # bit 1, up-right
    "E": (2 / math.sqrt(5), 1 / math.sqrt(5)),    # bit 2, down-right
    "S": (-2 / math.sqrt(5), 1 / math.sqrt(5)),   # bit 4, down-left
    "W": (-2 / math.sqrt(5), -1 / math.sqrt(5)),  # bit 8, up-left
}
OPPOSITE = {"N": "S", "S": "N", "E": "W", "W": "E"}

# edge midpoints in sprite coordinates (where tracks must connect)
EDGE_MID = {
    "N": (96.0, 80.0),
    "E": (96.0, 112.0),
    "S": (32.0, 112.0),
    "W": (32.0, 80.0),
}

# palette sampled from the shipped rail art
BALLAST = (142, 138, 124)
BALLAST_DARK = (104, 100, 88)
BALLAST_LIGHT = (170, 166, 150)
TIE = (150, 102, 68)
TIE_DARK = (104, 66, 42)
RAIL = (58, 50, 62)
RAIL_HI = (158, 160, 172)
RAIL_LO = (30, 24, 34)

# shape tuning (sprite pixels)
BALLAST_HW = 12.0   # half width of the gravel bed
RAIL_OFF = 6.0      # rail centreline offset from track centre
RAIL_HW = 1.35      # rail half thickness
TIE_HALF = 9.5      # sleeper half length
TIE_THICK = 1.7
TIE_GAP = 10.5      # sleeper spacing along the track
CURVE_SCALE = 0.88  # turns: narrow the bed a touch so the inside does not pinch


def diamond_points() -> list[tuple[float, float]]:
    return [(64, 64), (128, 96), (64, 128), (0, 96)]


def corner_mask() -> Image.Image:
    """Diamond interior = 255 (opaque), four corners = 0 (transparent).

    The outline is stroked so the mask reaches a few pixels PAST the diamond edge.
    A band clipped exactly on the edge gets an oblique slice there (the edge and
    the track cross at ~53 degrees), which reads as a step at every tile seam.
    Letting the square cap sit just outside instead gives a butt joint that the
    neighbour's identical cap meets exactly.
    """
    m = Image.new("L", (W * S, H * S), 0)
    d = ImageDraw.Draw(m)
    pts = scaled(diamond_points())
    d.polygon(pts, fill=255)
    d.line(pts + [pts[0]], fill=255, width=int(2 * EXT * S), joint="curve")
    # threshold to binary so edge midpoints stay fully opaque
    return m.point(lambda x: 255 if x > 128 else 0)


CORNER_MASK = None


def get_corner_mask():
    global CORNER_MASK
    if CORNER_MASK is None:
        CORNER_MASK = corner_mask()
    return CORNER_MASK


def arm_end(arm: str) -> tuple[float, float]:
    return EDGE_MID[arm]


def quad_bezier(p0, p1, p2, steps=56):
    out = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        out.append((u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
                    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]))
    return out


def paths_for(arms: list[str]) -> list[list[tuple[float, float]]]:
    """One or two centre-lines; each arm ends square at its edge midpoint."""
    C = (CX, CY)
    if len(arms) == 1:
        return [[arm_end(arms[0]), C]]
    if len(arms) == 2:
        a, b = arms
        if OPPOSITE[a] == b:
            return [[arm_end(a), arm_end(b)]]
        # turn: tangent-continuous bend, control at the tile centre
        return [quad_bezier(arm_end(a), C, arm_end(b))]
    # one straight run per opposite pair: a 4-arm crossing needs BOTH diagonals,
    # an L/T needs the straight run plus a stub from the centre
    out: list[list[tuple[float, float]]] = []
    done: set[str] = set()
    for a in arms:
        if a in done:
            continue
        b = OPPOSITE[a]
        if b in arms:
            out.append([arm_end(a), arm_end(b)])
            done.add(a)
            done.add(b)
    for a in arms:
        if a in done:
            continue
        out.append([arm_end(a), C])
        done.add(a)
    return out


def is_turn(paths) -> bool:
    return len(paths) == 1 and len(paths[0]) > 2


def offset_poly(pts, off, hw):
    """Strip polygon following `pts`, offset sideways by `off`, half width `hw`."""
    left, right = [], []
    n = len(pts)
    for i, (x, y) in enumerate(pts):
        j = min(i, n - 2)
        tx, ty = pts[j + 1][0] - pts[j][0], pts[j + 1][1] - pts[j][1]
        m = math.hypot(tx, ty) or 1.0
        nx, ny = -ty / m, tx / m
        left.append((x + nx * (off + hw), y + ny * (off + hw)))
        right.append((x + nx * (off - hw), y + ny * (off - hw)))
    return left + right[::-1]


def scaled(pts, k: float = S):
    return [(x * k, y * k) for x, y in pts]


EXT = 4.5  # run the track past the edge midpoint so neighbours overlap


def extend(path, ext: float = EXT):
    """Push both ends of a centre-line outward along their tangent.

    The corner mask cuts the sprite at the diamond edge, which passes through the
    edge midpoint. Without this the band stops exactly on that cut and two tiles
    can leave a hairline seam -- which is why an earlier version stamped opacity
    circles at the joints, and those circles came out black.
    """
    if len(path) < 2:
        return list(path)
    out = list(path)
    x0, y0 = out[0]
    x1, y1 = out[1]
    dx, dy = x0 - x1, y0 - y1
    m = math.hypot(dx, dy) or 1.0
    out[0] = (x0 + dx / m * ext, y0 + dy / m * ext)
    xn, yn = out[-1]
    xp, yp = out[-2]
    dx, dy = xn - xp, yn - yp
    m = math.hypot(dx, dy) or 1.0
    out[-1] = (xn + dx / m * ext, yn + dy / m * ext)
    return out


def walk(path, step):
    """Points every `step` along a polyline, with the local direction."""
    segs = []
    total = 0.0
    for i in range(len(path) - 1):
        dx = path[i + 1][0] - path[i][0]
        dy = path[i + 1][1] - path[i][1]
        L = math.hypot(dx, dy)
        if L:
            segs.append((path[i], (dx / L, dy / L), L))
            total += L
    out = []
    t = step * 0.5
    while t < total:
        acc = 0.0
        for (px, py), (ux, uy), L in segs:
            if t <= acc + L:
                d = t - acc
                out.append(((px + ux * d, py + uy * d), (ux, uy)))
                break
        acc += L
        t += step
    return out


def make_tile(arms: list[str], rng: random.Random) -> Image.Image:
    ss = W * S
    paths = [extend(p) for p in paths_for(arms)]
    turn = is_turn(paths)
    hw = BALLAST_HW * (CURVE_SCALE if turn else 1.0)
    tie_half = TIE_HALF * (CURVE_SCALE if turn else 1.0)

    # ballast bed: one strip per path, extending to edge midpoints
    bed = Image.new("L", (ss, ss), 0)
    bd = ImageDraw.Draw(bed)
    for p in paths:
        bd.polygon(scaled(offset_poly(p, 0.0, hw)), fill=255)
    # center disc for junctions (not straight/curve)
    if len(arms) != 2:
        bd.ellipse([(CX - hw) * S, (CY - hw) * S, (CX + hw) * S, (CY + hw) * S], fill=255)
    # explicitly stamp opaque at each connected edge midpoint
    for a in arms:
        ex, ey = EDGE_MID[a]
        bd.ellipse([(ex - hw - 2) * S, (ey - hw - 2) * S,
                    (ex + hw + 2) * S, (ey + hw + 2) * S], fill=255)

    img = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    img.paste(Image.new("RGBA", (ss, ss), BALLAST + (255,)), (0, 0), bed)

    # gravel tooth, strictly inside the bed
    px = img.load()
    mpx = bed.load()
    for _ in range(3200):
        x = rng.randrange(ss)
        y = rng.randrange(ss)
        if mpx[x, y] < 255:
            continue
        blob = rng.choice((BALLAST_DARK, BALLAST_DARK, BALLAST_LIGHT))
        r = rng.randint(1, 2) * S
        for ox in range(-r, r + 1):
            for oy in range(-r, r + 1):
                if ox * ox + oy * oy > r * r:
                    continue
                xx, yy = x + ox, y + oy
                if 0 <= xx < ss and 0 <= yy < ss and mpx[xx, yy] == 255:
                    base = px[xx, yy]
                    px[xx, yy] = tuple(int(base[i] * 0.6 + blob[i] * 0.4) for i in range(3)) + (255,)

    d = ImageDraw.Draw(img)

    # sleepers
    for p in paths:
        for (sx, sy), (ux, uy) in walk(p, TIE_GAP):
            nx, ny = -uy, ux
            quad = [
                (sx + nx * tie_half, sy + ny * tie_half),
                (sx + nx * tie_half + ux * TIE_THICK, sy + ny * tie_half + uy * TIE_THICK),
                (sx - nx * tie_half + ux * TIE_THICK, sy - ny * tie_half + uy * TIE_THICK),
                (sx - nx * tie_half, sy - ny * tie_half),
            ]
            d.polygon(scaled(quad), fill=TIE)
            d.line(scaled([quad[3], quad[2]]), fill=TIE_DARK, width=max(1, S // 3))

    # rails: steel line, dark underside, bright top edge
    for p in paths:
        for off in (-RAIL_OFF, RAIL_OFF):
            d.polygon(scaled(offset_poly(p, off, RAIL_HW)), fill=RAIL)
            d.polygon(scaled(offset_poly(p, off + RAIL_HW * 0.5, RAIL_HW * 0.5)), fill=RAIL_LO)
            d.polygon(scaled(offset_poly(p, off - RAIL_HW * 0.5, RAIL_HW * 0.5)), fill=RAIL_HI)

    # grow the band by half a final pixel so two neighbouring tiles overlap at the
    # cut instead of meeting on a hard AA boundary
    img.putalpha(img.getchannel("A").filter(ImageFilter.MaxFilter(5)))

    # clip only the corner triangles (outside the diamond) using isometric mask
    corner_mask_ss = get_corner_mask().resize((ss, ss), Image.NEAREST)
    img.putalpha(Image.composite(img.getchannel("A"), Image.new("L", (ss, ss), 0), corner_mask_ss))

    # downscale to final size
    img = img.resize((W, H), Image.BOX)

    return img


TILES = {
    "rail_straight_ns": ["N", "S"],
    "rail_straight_ew": ["E", "W"],
    "rail_curve_ne": ["N", "E"],
    "rail_curve_es": ["E", "S"],
    "rail_curve_sw": ["S", "W"],
    "rail_curve_wn": ["W", "N"],
    "rail_tee_nes": ["N", "E", "S"],
    "rail_tee_ewn": ["E", "W", "N"],
    "rail_tee_nsw": ["N", "S", "W"],
    "rail_tee_ews": ["E", "W", "S"],
    "rail_cross": ["N", "E", "S", "W"],
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(os.path.dirname(os.path.dirname(
        os.path.abspath(__file__))), "assets", "tiles", "gen"))
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    if args.check:
        for name in sorted(TILES):
            p = os.path.join(args.out, name + ".png")
            print(name, Image.open(p).size if os.path.exists(p) else "MISSING")
        return
    os.makedirs(args.out, exist_ok=True)
    for name, arms in TILES.items():
        rng = random.Random(abs(hash(name)) & 0xFFFF)
        img = make_tile(arms, rng)
        path = os.path.join(args.out, name + ".png")
        img.save(path)
        print("wrote", path, img.size)


if __name__ == "__main__":
    main()
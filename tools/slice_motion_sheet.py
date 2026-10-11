"""モーションのシート画像（コマを1列に並べた生成画像）を、アプリ用のコマに切り出す。

  python3 tools/slice_motion_sheet.py <シート画像> <種目ID> [--axis x|y] [--anchor center|front]

- 白背景を透過にする（外周からつながる白と、体のすき間に閉じた白を抜く）
- 生成画像に描かれてしまった細い線（床線・コマの仕切り線）を消す（体と重なる部分は残す）
- コマごとに「床に着いている部分」の中心をそろえて、同じ大きさの正方形キャンバスに置く
  （そろえないと再生したときに足が動いてガタつく）
- src/assets/motions/<種目ID>/01.webp, 02.webp ... に保存する

--axis は コマが横に並んでいれば x（既定）、縦に積まれていれば y。
--anchor は そろえる基準。center（既定）は床に着く部分全体の中心、
front は いちばん前（画面右）の接地点（ランジの前足・腹筋の足先など、動かない足が前にある種目）。
"""
import argparse
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

BG_LEVEL = 240     # これより明るい無彩色を背景候補とみなす
POCKET_LEVEL = 245 # 体のすき間に閉じた白（腕と胴の間など）
POCKET_MIN = 120   # これより小さい白い点は体の模様として残す
FOOT_BAND = 24     # 床から何pxを「接地部分」とみなすか
PAD = 0.06         # キャンバスの余白（一辺に対する割合）


def background_mask(rgb):
    g = rgb.mean(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    light = (g >= BG_LEVEL) & (sat < 18)
    h, w = light.shape
    bg = np.zeros_like(light)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if light[y, x] and not bg[y, x]:
                bg[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if light[y, x] and not bg[y, x]:
                bg[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and light[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True; q.append((ny, nx))
    # 閉じた白いすき間
    pocket = (g >= POCKET_LEVEL) & (sat < 18) & ~bg
    seen = np.zeros_like(pocket)
    for y0, x0 in zip(*np.nonzero(pocket)):
        if seen[y0, x0]:
            continue
        comp = []; q = deque([(y0, x0)]); seen[y0, x0] = True
        while q:
            y, x = q.popleft(); comp.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and pocket[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; q.append((ny, nx))
        if len(comp) >= POCKET_MIN:
            ys, xs = zip(*comp); bg[list(ys), list(xs)] = True
    return bg


def remove_lines(bg, min_ratio=0.5, thick=3, probe=5):
    """幅の半分以上続く細い横線（床線）を背景にする。線の上に体が乗っている列は残す。
    bg を書き換え、消した行の位置を返す。縦線は転置した配列を渡す"""
    fg = ~bg
    h, w = fg.shape
    removed = []
    for y in range(probe, h - probe):
        row = fg[y]
        if row.sum() < min_ratio * w:
            continue
        # 上下 probe px が背景なら「細い線」とみなす列
        thin = row & bg[y - probe] & bg[y + probe]
        if thin.sum() < min_ratio * w:
            continue
        for yy in range(max(0, y - thick), min(h, y + thick + 1)):
            bg[yy, thin] = True
        removed.append(y)
    return removed


def segments(occupied, gap=20):
    idx = np.nonzero(occupied)[0]
    segs, start, prev = [], idx[0], idx[0]
    for i in idx[1:]:
        if i - prev > gap:
            segs.append((start, prev)); start = i
        prev = i
    segs.append((start, prev))
    return segs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('sheet'); ap.add_argument('motion_id')
    ap.add_argument('--axis', choices=['x', 'y'], default='x')
    ap.add_argument('--anchor', choices=['center', 'front'], default='center')
    ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', 'src', 'assets', 'motions'))
    args = ap.parse_args()

    rgb = np.asarray(Image.open(args.sheet).convert('RGB')).astype(int)
    bg = background_mask(rgb)
    if remove_lines(bg):
        print('横線（床線）を除去')
    if remove_lines(bg.T):  # 転置ビューなので bg 自体が書き換わる
        print('縦線（仕切り線）を除去')
    axis = 0 if args.axis == 'x' else 1
    panels = segments((~bg).any(axis=axis))
    # コマごとに描かれた短い床線も消す
    for a, b in panels:
        sub = bg[:, a:b + 1] if args.axis == 'x' else bg[a:b + 1, :]
        if remove_lines(sub):
            print(f'コマ {a}-{b} の床線を除去')
    fg = ~bg

    frames = []
    for a, b in panels:
        sub = fg[:, a:b + 1] if args.axis == 'x' else fg[a:b + 1, :]
        ys, xs = np.nonzero(sub)
        if args.axis == 'x':
            xs = xs + a
        else:
            ys = ys + a
        bottom = ys.max()
        foot = xs[ys >= bottom - FOOT_BAND]
        anchor = foot.max() if args.anchor == 'front' else (foot.min() + foot.max()) / 2
        frames.append(dict(x0=xs.min(), x1=xs.max(), y0=ys.min(), y1=bottom, ax=anchor))
        print(f'panel {len(frames)}: x {xs.min()}-{xs.max()} y {ys.min()}-{bottom} 接地中心 x={anchor:.0f}')

    left = max(f['ax'] - f['x0'] for f in frames)
    right = max(f['x1'] - f['ax'] for f in frames)
    up = max(f['y1'] - f['y0'] for f in frames)
    span = max(left + right, up)
    size = int(round(span / (1 - 2 * PAD)))
    gx = (size - (left + right)) / 2 + left   # 接地中心の x
    gy = (size + up) / 2                       # 床の y

    alpha = np.where(bg, 0, 255).astype(np.uint8)
    rgba = np.dstack([rgb.astype(np.uint8), alpha])
    sheet = Image.fromarray(rgba, 'RGBA')

    out_dir = os.path.join(args.out, args.motion_id)
    os.makedirs(out_dir, exist_ok=True)
    for i, f in enumerate(frames, 1):
        crop = sheet.crop((int(f['x0']), int(f['y0']), int(f['x1']) + 1, int(f['y1']) + 1))
        canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        canvas.paste(crop, (int(round(gx - (f['ax'] - f['x0']))), int(round(gy - (f['y1'] - f['y0'])))), crop)
        path = os.path.join(out_dir, f'{i:02d}.webp')
        canvas.save(path, 'WEBP', quality=90, method=6)
        print('saved', os.path.normpath(path), canvas.size)


if __name__ == '__main__':
    sys.exit(main())

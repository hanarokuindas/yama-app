"""届いた画像素材を、アプリで使える形（背景を抜いた WebP）に変換する。

  python3 tools/prepare_assets.py icon  <入力.png> <出力.webp> [一辺px]   … ステッカー調アイコン
  python3 tools/prepare_assets.py part  <入力.png> <出力.webp> [長辺px]   … 白い背景に置いた部品（看板など）
  python3 tools/prepare_assets.py paper <入力.png> <出力.webp> [長辺px]   … 白い背景に置いた白っぽい部品（写真フレーム）
  python3 tools/prepare_assets.py card  <入力.png> <出力.webp> [長辺px]   … 灰色の机に置いた紙（四角く切り抜く）
  python3 tools/prepare_assets.py photo <入力.png> <出力.webp> [長辺px]   … 背景・ルート図（縮小するだけ）

icon : 白いフチ（ステッカーの縁）は残し、その外の白と薄い影だけを透明にする。
       フチの外側が背景と同じ白で区別できない所があるので、絵の本体（輪郭線や色のある部分）を
       同じ幅だけ太らせた形をフチとして使う。フチの幅は、影がある所から測る。
part : 本体（色のある部分）はそのまま、すぐそばの灰色の影は半透明の黒、それ以外の白は透明にする。
"""
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def load(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.int16)


def edge_connected(candidate):
    """candidate（True/False）のうち、画像の縁とつながっている部分"""
    h, w = candidate.shape
    pad = np.ones((h + 2, w + 2), dtype=np.uint8) * 255
    pad[1:-1, 1:-1] = np.where(candidate, 255, 0)
    im = Image.fromarray(pad, 'L').copy()  # 配列から作った画像は書き換えできないので複製する
    ImageDraw.floodfill(im, (0, 0), 128)
    return (np.asarray(im) == 128)[1:-1, 1:-1]


def dilate_plus(m):
    o = m.copy()
    o[1:] |= m[:-1]; o[:-1] |= m[1:]; o[:, 1:] |= m[:, :-1]; o[:, :-1] |= m[:, 1:]
    return o


def dilate_square(m):
    o = dilate_plus(m)
    o[1:, 1:] |= m[:-1, :-1]; o[1:, :-1] |= m[:-1, 1:]; o[:-1, 1:] |= m[1:, :-1]; o[:-1, :-1] |= m[1:, 1:]
    return o


def distance_from(mask, steps):
    """mask からの距離（八角形で近似）。steps より遠い所は steps+1"""
    d = np.full(mask.shape, steps + 1, dtype=np.int16)
    d[mask] = 0
    cur = mask
    for k in range(1, steps + 1):
        cur = dilate_square(cur) if k % 2 else dilate_plus(cur)
        d[cur & (d > k)] = k
    return d


def save(rgba, out, size):
    im = Image.fromarray(rgba.astype(np.uint8), 'RGBA')
    if size:
        scale = size / max(im.size)
        if scale < 1:
            im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    im.save(out, 'WEBP', quality=90, method=6)
    print(f'{out}  {im.size[0]}x{im.size[1]}')


def trim(rgba, pad=4):
    a = rgba[:, :, 3]
    ys, xs = np.nonzero(a > 8)
    y0, y1 = max(0, ys.min() - pad), min(a.shape[0], ys.max() + pad + 1)
    x0, x1 = max(0, xs.min() - pad), min(a.shape[1], xs.max() + pad + 1)
    return rgba[y0:y1, x0:x1]


def do_icon(src, out, size=384):
    work = 512
    im = Image.open(src).convert('RGB').resize((work, work), Image.LANCZOS)
    rgb = np.asarray(im).astype(np.int16)
    v = rgb.mean(axis=2)
    s = rgb.max(axis=2) - rgb.min(axis=2)
    # 絵の本体：輪郭線（暗い）か色のある部分。穴は埋める
    core = (v < 150) | (s >= 30)
    core = ~edge_connected(~core)
    d = distance_from(core, 40)
    # フチの外の薄い影（灰色）。本体から少し離れた所だけを見る
    ring = (s < 15) & (v < 246) & (v > 140) & (d >= 6) & (d <= 40)
    width = int(np.percentile(d[ring], 3)) if ring.sum() > 40 else 15
    mask = d <= max(4, width - 1)
    alpha = Image.fromarray((mask * 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(0.7))
    rgba = np.dstack([rgb, np.asarray(alpha)])
    print(f'  フチの幅 {width}px（{work}px換算）')
    save(rgba, out, size)


def do_part(src, out, size=1400, paper=False):
    """白い背景に置いた部品。本体はそのまま、すぐそばの灰色の影は半透明の黒、それ以外は透明にする。
    paper=True は白い紙のような本体（写真フレーム）。色では背景と分けられないので、明るさで分ける"""
    rgb = load(src)
    v = rgb.mean(axis=2)
    s = rgb.max(axis=2) - rgb.min(axis=2)
    if paper:
        bg = edge_connected((v >= 250) & (s < 12))
        body = ~bg & ~(edge_connected(bg | ((s < 14) & (v < 240))) & ~bg)
    else:
        # 木や紙のリボンなど色のある本体。穴は埋める
        body = ~edge_connected(~((s >= 16) | (v < 120)))
    # 影として残すのは本体のすぐそばの灰色だけ（離れた所のうっすらした汚れは消す）
    reach = max(8, round(max(v.shape) * 0.02))
    near = distance_from(body, reach) <= reach
    shadow = near & ~body & (s < 16) & (v < 245)
    alpha = np.zeros(v.shape)
    alpha[body] = 255
    alpha[shadow] = np.clip((250 - v[shadow]) * 2.2, 0, 200)
    color = rgb.copy()
    color[shadow] = 0
    a = Image.fromarray(alpha.astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(0.6))
    rgba = trim(np.dstack([color, np.asarray(a)]))
    save(rgba, out, size)


def do_card(src, out, size=1000):
    """灰色の机に置いた紙のカード：色のある紙の範囲を四角く切り抜く"""
    rgb = load(src)
    s = rgb.max(axis=2) - rgb.min(axis=2)
    paper = s > 12
    rows = np.nonzero(paper.mean(axis=1) > 0.3)[0]
    cols = np.nonzero(paper.mean(axis=0) > 0.3)[0]
    y0, y1, x0, x1 = rows.min() + 3, rows.max() - 3, cols.min() + 3, cols.max() - 3
    crop = rgb[y0:y1, x0:x1]
    rgba = np.dstack([crop, np.full(crop.shape[:2], 255)])
    save(rgba, out, size)


def do_photo(src, out, size=1920):
    rgb = load(src)
    rgba = np.dstack([rgb, np.full(rgb.shape[:2], 255)])
    save(rgba, out, size)


if __name__ == '__main__':
    mode, src, out = sys.argv[1:4]
    size = int(sys.argv[4]) if len(sys.argv) > 4 else None
    fn = {
        'icon': do_icon, 'part': do_part, 'card': do_card, 'photo': do_photo,
        'paper': lambda a, b, c=512: do_part(a, b, c, paper=True),
    }[mode]
    fn(src, out, size) if size else fn(src, out)

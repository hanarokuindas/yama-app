"""アルバムの「マップ」に使う日本地図（都道府県ごとのSVGパス）を作る。

  python3 tools/build_japan_map.py <polbnda_jpn.shp> <polbnda_jpn.dbf> src/data/japanMap.json

元データ：国土地理院「地球地図日本」（2016）の行政界（市区町村のポリゴン、経緯度）。
npm の jpn-atlas パッケージの build/ に入っているものを使った。
市区町村を都道府県ごとにまとめ、隣り合う市区町村が共有する辺を消して都道府県の輪郭にする。
座標は格子に丸めて点を減らす（隣の県と同じ点に丸まるので、すき間ができない）。
沖縄・奄美と小笠原は、地図の空いている所に小さな枠で入れる。
"""
import json
import math
import struct
import sys

GRID = 0.025            # 経緯度を丸める格子（度）
LON0, LAT0 = 137.0, 37.0
COS0 = math.cos(math.radians(LAT0))
SCALE = 50              # 1度あたりの大きさ（SVG の単位）

PREF_NAMES = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県',
    '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
    '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
    '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県',
    '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
]
# 隣の県と同じ色にならないように選ぶ、やわらかい色
PALETTE = ['#c8dc8c', '#f4c99b', '#a9d4e6', '#e9b9c9', '#d8c7ea', '#f2e29a', '#b9e0c4']

# 本土の範囲と、小さな枠に入れる島の範囲（経度・緯度）。枠は本土の座標系のどこに置くか
MAIN = dict(lon=(128.4, 149.2), lat=(30.0, 45.7))
INSETS = [
    # 沖縄・奄美（左上の日本海の空いている所へ）
    dict(name='沖縄・奄美', lon=(122.8, 131.4), lat=(24.0, 29.0), at=(128.6, 45.4), scale=0.85),
    # 小笠原（右下の太平洋へ）
    dict(name='小笠原', lon=(140.8, 142.4), lat=(26.4, 27.8), at=(144.0, 33.6), scale=1.4),
]


def read_dbf(path):
    f = open(path, 'rb')
    hdr = f.read(32)
    n, hlen, rlen = struct.unpack('<IHH', hdr[4:12])
    fields = []
    while True:
        d = f.read(32)
        if d[0] == 0x0D:
            break
        fields.append((d[:11].split(b'\0')[0].decode(), d[16]))
    f.seek(hlen)
    rows = []
    for _ in range(n):
        rec = f.read(rlen)
        pos, row = 1, {}
        for name, ln in fields:
            row[name] = rec[pos:pos + ln].decode('utf-8', 'replace').strip()
            pos += ln
        rows.append(row)
    return rows


def read_shp(path):
    data = open(path, 'rb').read()
    pos = 100
    shapes = []
    while pos < len(data):
        _, clen = struct.unpack('>II', data[pos:pos + 8])
        content = data[pos + 8:pos + 8 + clen * 2]
        pos += 8 + clen * 2
        stype = struct.unpack('<i', content[:4])[0]
        if stype == 0:
            shapes.append([])
            continue
        nparts, npts = struct.unpack('<ii', content[36:44])
        parts = list(struct.unpack('<%di' % nparts, content[44:44 + 4 * nparts]))
        off = 44 + 4 * nparts
        pts = struct.unpack('<%dd' % (2 * npts), content[off:off + 16 * npts])
        pts = [(pts[2 * i], pts[2 * i + 1]) for i in range(npts)]
        parts.append(npts)
        shapes.append([pts[parts[i]:parts[i + 1]] for i in range(nparts)])
    return shapes


def q(p):
    return (round(p[0] / GRID), round(p[1] / GRID))


def quantize_ring(ring):
    out = []
    for p in ring:
        g = q(p)
        if not out or out[-1] != g:
            out.append(g)
    if len(out) > 1 and out[0] == out[-1]:
        out.pop()
    return out


def outline(rings):
    """同じ県の市区町村の輪を合わせ、内側の共有辺を消して輪郭の輪にする"""
    edges = {}
    for ring in rings:
        n = len(ring)
        for i in range(n):
            a, b = ring[i], ring[(i + 1) % n]
            if a == b:
                continue
            if edges.get((b, a), 0) > 0:      # 隣の市区町村と共有する辺（向きが逆）は消える
                edges[(b, a)] -= 1
            else:
                edges[(a, b)] = edges.get((a, b), 0) + 1
    nxt = {}
    for (a, b), c in edges.items():
        for _ in range(c):
            nxt.setdefault(a, []).append(b)
    result = []
    while nxt:
        start = next(iter(nxt))
        ring = [start]
        cur = start
        while True:
            lst = nxt.get(cur)
            if not lst:
                break
            b = lst.pop()
            if not lst:
                del nxt[cur]
            if b == start:
                break
            ring.append(b)
            cur = b
        if len(ring) >= 3:
            result.append(ring)
    return result


def place(lon, lat):
    """経緯度を本土の座標へ。枠に入れる島はその枠の位置へ移す"""
    for ins in INSETS:
        if ins['lon'][0] <= lon <= ins['lon'][1] and ins['lat'][0] <= lat <= ins['lat'][1]:
            cx = (ins['lon'][0] + ins['lon'][1]) / 2
            cy = (ins['lat'][0] + ins['lat'][1]) / 2
            w = (ins['lon'][1] - ins['lon'][0]) * ins['scale']
            h = (ins['lat'][1] - ins['lat'][0]) * ins['scale']
            lon = ins['at'][0] + w / 2 + (lon - cx) * ins['scale']
            lat = ins['at'][1] - h / 2 + (lat - cy) * ins['scale']
            return lon, lat
    if not (MAIN['lon'][0] <= lon <= MAIN['lon'][1] and MAIN['lat'][0] <= lat <= MAIN['lat'][1]):
        return None
    return lon, lat


def to_xy(lon, lat):
    return ((lon - MAIN['lon'][0]) * COS0 * SCALE, (MAIN['lat'][1] - lat) * SCALE)


def main(shp, dbf, out):
    rows = read_dbf(dbf)
    shapes = read_shp(shp)
    # 市区町村コードが無い島（UNK）は、都道府県名から県を決める
    code_of_name = {r['nam']: int(r['adm_code'][:2]) for r in rows if r['adm_code'][:2].isdigit()}
    by_pref = {}
    for row, rings in zip(rows, shapes):
        code = int(row['adm_code'][:2]) if row['adm_code'][:2].isdigit() else code_of_name[row['nam']]
        for ring in rings:
            qr = quantize_ring(ring)
            if len(qr) >= 3:
                by_pref.setdefault(code, []).append(qr)

    # 隣り合う県（共有する点がある県）
    point_prefs = {}
    outlines = {}
    for code, rings in by_pref.items():
        outlines[code] = outline(rings)
        for ring in outlines[code]:
            for p in ring:
                point_prefs.setdefault(p, set()).add(code)
    adj = {c: set() for c in outlines}
    for prefs in point_prefs.values():
        for a in prefs:
            adj[a] |= prefs - {a}
    colors = {}
    for code in sorted(outlines, key=lambda c: -len(adj[c])):
        used = {colors[n] for n in adj[code] if n in colors}
        colors[code] = next(i for i in range(len(PALETTE)) if i not in used)

    prefs = []
    for code in sorted(outlines):
        parts = []
        for ring in outlines[code]:
            pts = []
            for g in ring:
                pl = place(g[0] * GRID, g[1] * GRID)
                if pl is None:
                    pts = None
                    break
                x, y = to_xy(*pl)
                pts.append('%.1f %.1f' % (x, y))
            if pts and len(pts) >= 3:
                parts.append('M' + 'L'.join(pts) + 'Z')
        prefs.append({'code': code, 'name': PREF_NAMES[code - 1], 'color': PALETTE[colors[code]], 'd': ''.join(parts)})

    w = (MAIN['lon'][1] - MAIN['lon'][0]) * COS0 * SCALE
    h = (MAIN['lat'][1] - MAIN['lat'][0]) * SCALE
    insets = []
    for ins in INSETS:
        x0, y0 = to_xy(ins['at'][0], ins['at'][1])
        insets.append({'name': ins['name'], 'x': round(x0, 1), 'y': round(y0, 1),
                       'w': round((ins['lon'][1] - ins['lon'][0]) * ins['scale'] * COS0 * SCALE, 1),
                       'h': round((ins['lat'][1] - ins['lat'][0]) * ins['scale'] * SCALE, 1)})
    data = {
        'source': '国土地理院「地球地図日本」（2016）を加工して作成',
        'width': round(w, 1), 'height': round(h, 1),
        'projection': {'lon0': MAIN['lon'][0], 'lat1': MAIN['lat'][1], 'cos': COS0, 'scale': SCALE},
        'insets': insets,
        'prefectures': prefs,
    }
    json.dump(data, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(out, sum(len(p['d']) for p in prefs), 'chars', len(prefs), 'prefectures')


if __name__ == '__main__':
    main(*sys.argv[1:4])

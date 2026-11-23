"""コース情報・装備の表から、アプリのデータ（src/data/courses.json・src/data/items.json）を作る。

  python3 tools/import_courses.py <コース情報・土産.xlsx> <各コース装備表.xlsx> src/data

元データ（Googleドライブ「2024山ゲーム/2507～埋め込み用」）
  260531コース情報・土産.xlsx … 山ごとのシート（A八ヶ岳・E高尾・D箱根）。1行が1コース
      [1] ゲームの段取り（エリアとレベル・時短・アイテム数多・マッチ数）と限定アイテム
      [3] コース名・所在地・スタート/ゴール・所要時間・距離・カロリー・難易度・体力度・紹介文
      [4] おみやげ（名前と値段）  [6] ルート定数（消費カロリー＝ルート定数×体重）  [8] 時間  [9] 距離
  260820各コース装備表.xlsx … 山ごとのシート。行が装備（75種・行の色がカテゴリ）、列がコース
      セルの色：カテゴリの色＝必要、黒＝不要、灰色＝季節によって必要（一問一答 2026-11-23）

ふもとの里山（テスト用・リリース時に消す）は表に無いので、今の courses.json から引き継ぐ。
"""
import json
import re
import sys

import openpyxl

MOUNTAINS = [  # シート名（コース情報）, シート名（装備表）, アプリの山ID, 表示名
    ('A八ヶ岳', '八ヶ岳', 'yatsugatake', '八ヶ岳連峰'),
    ('E高尾', '高尾', 'takao', '高尾山'),
    ('D箱根', '箱根', 'hakone', '箱根山'),
]

# 装備表の行の色 → カテゴリ（抜粋；装備カテゴリ一覧.pdf）
CATEGORY_BY_COLOR = {
    'FFF0CCD9': 'ウエア',
    'FF8EAADB': '小物1',
    'FFC9FBFF': '小物2',
    'FFFFE598': '専門道具',
    'FF97C8CD': '快適用品',
    'FFF7CAAC': '食料',
    'FFC5E0B3': '救急品',
    'FFCCCCFF': 'その他',
}
NOT_NEEDED = 'FF262626'
SEASONAL = 'FF7F7F7F'

# いまのアプリの装備ID（持ち物を引き継ぐため、同じ物は同じIDにする）
OLD_IDS = {
    '半袖ベースレイヤー': 'base_layer_short', '長袖ベースレイヤー': 'base_layer_long', 'ミッドレイヤー': 'mid_layer',
    '夏山登山パンツ': 'pants_summer', '冬山登山パンツ': 'pants_winter', '登山用ソックス': 'socks',
    'トレッキングシューズ': 'shoes_trekking', 'ハイキングシューズ': 'shoes_hiking', 'グローブ': 'gloves',
    '帽子': 'hat', 'レインウエア上下': 'rainwear', 'バックパック': 'backpack', 'ごはん': 'food', '水分': 'water',
    '絆創膏と消毒液とテーピング': 'first_aid', '防水ヘッドライト': 'headlight', '山岳マップ': 'map',
    '健康保険証、身分証': 'insurance', '現金': 'coins', 'モバイルバッテリー': 'mobile_battery',
}

ICON_BY_CATEGORY = {'ウエア': 'wear', '小物1': 'gloves', '小物2': 'backpack', '専門道具': 'tools',
                    '快適用品': 'box', '食料': 'onigiri', '救急品': 'bandage', 'その他': 'card'}
ICONS = {
    '半袖ベースレイヤー': 'shirt', 'ミッドレイヤー': 'jacket', 'アウターレイヤー': 'jacket', '冬用アウターレイヤー': 'jacket',
    '夏山登山パンツ': 'pants', '冬山登山パンツ': 'pants', 'スパッツ': 'pants', '雪山用オーバーパンツ': 'pants',
    'レインウエア上下': 'raincoat', 'サポートタイツ': 'pants', '登山用ソックス': 'socks', '帽子': 'cap', 'ニットキャップ': 'cap',
    'ヘルメット': 'cap', 'トレッキングシューズ': 'shoes', '冬用トレッキングシューズ': 'shoes', 'ハイキングシューズ': 'boots',
    'シューズ替え紐': 'shoes', '山岳マップ': 'map', '懐中電灯': 'flashlight', '防水ヘッドライト': 'flashlight',
    'コンパス': 'map', '高度気圧計': 'ruler', 'ストック': 'walk', 'ピッケル': 'pickaxe', '防水腕時計': 'timer',
    'ごはん': 'onigiri', '水分': 'water', '行動食': 'dango', '非常食': 'onigiri', 'バーナー': 'fire', 'サプリメント': 'bandage',
    '登山計画書': 'doc', '健康保険証、身分証': 'card', '常備薬とお薬手帳': 'book', '現金': 'coin', '筆記具': 'doc',
    'モバイルバッテリー': 'battery', 'マルチツール': 'tools', 'フリント式ライター': 'fire', '小型発煙筒': 'fire',
    'ホイッスル': 'sound', '山岳保険': 'card', 'ビニール袋、ジップロック': 'trash', 'カイロ': 'fire',
}

# 何回の登山で消耗するか（一問一答 #11 をカテゴリに当てはめた。null は消耗しない）
USES_BY_CATEGORY = {'ウエア': 10, '小物1': 10, '小物2': 20, '専門道具': 10, '快適用品': 5, '食料': 1, '救急品': 1, 'その他': 10}
NEVER_WORN = {'登山計画書', '健康保険証、身分証', '常備薬とお薬手帳', '山岳保険'}

# 先輩のアドバイス。今のアプリにある20種は今の文を使い、ほかはこちらで書いた（あとで差し替え可）
NEW_ADVICE = {
    'アウターレイヤー': '風や雨から体を守るいちばん外側の上着だよ。山頂の風は思った以上に冷たいから、薄手でも1枚あると安心！',
    '冬用アウターレイヤー': '雪山や寒い季節には、防風・防水で保温力のある冬用の上着を。重ね着の一番外側にくるよ！',
    'スパッツ': '泥はねや小石が靴に入るのを防いでくれるよ。ぬかるみの多い道で大活躍！',
    '雪山用オーバーパンツ': '雪の中を歩くなら、パンツの上から重ねる防水のオーバーパンツが必要だよ。濡れると一気に冷えるからね！',
    'サポートタイツ': '膝や筋肉をサポートしてくれるタイツ。長い下り坂で脚が疲れにくくなるよ！',
    '冬用グローブ': '冬は指先からかじかむよ。防寒・防水の厚手グローブで手を守ろう！',
    'ヘルメット': '岩場や落石のあるコースではヘルメットを。頭を守るのは何より大事だよ！',
    'ニットキャップ': '寒い時期は頭から熱が逃げていくよ。耳まで覆えるニット帽があったかい！',
    'ネックウォーマー': '首元を温めるだけで体感温度がぐっと変わるよ。冬山や風の強い日に！',
    'サングラス': '標高が上がると紫外線が強くなるよ。雪山では照り返しで目を傷めるから必須だね！',
    'ゴーグル': '吹雪や強風の中では、サングラスより顔に密着するゴーグルが安心だよ！',
    '冬用トレッキングシューズ': '保温性があって、アイゼンも付けられる冬用の靴。雪道や凍った道ではこれ！',
    'ゲイター': '足首から下を覆って、雪や泥が靴に入るのを防ぐよ。雪山ではとくに大事！',
    'リュックサック': '短いハイキングなら小さめのリュックでもOK。背負いやすくて両手が空くものを選ぼうね！',
    'レインカバー': 'ザックの中身を雨から守るカバーだよ。着替えや食べ物が濡れると大変だからね！',
    'シューズ替え紐': '靴ひもが切れると歩けなくなっちゃう…！軽いから予備を1本入れておこう！',
    'サコッシュ、ウエストポーチ': '地図やスマホ、行動食など、すぐ出したい物を入れておくと便利だよ！',
    '熊除けアイテム': 'クマ鈴などで人がいることを知らせよう。出会わないようにするのがいちばんの対策だよ！',
    'ストック': '登りも下りも脚の負担を減らしてくれる心強い相棒！長いコースや下り坂でとくに助かるよ。',
    'ピッケル': '雪山で体を支えたり、滑ったときに止まるための道具だよ。使い方は練習してからね！',
    'チェーンスパイク': '靴に付ける滑り止め。うっすら雪が積もった道や凍った道で歩きやすくなるよ！',
    'アイゼン': '雪や氷の斜面を歩くための爪。本格的な雪山には欠かせないよ！',
    '懐中電灯': '予備の明かりにも。日が暮れるのは思っているより早いからね！',
    '防水腕時計': '時間の管理は安全登山の基本！スマホの電池を気にせず時間を確認できるよ。',
    'コンパス': '地図とセットで方角を確かめる道具。道に迷ったときに頼りになるよ！',
    'ビーコン': '雪崩に巻き込まれたときに居場所を知らせる道具だよ。雪山に入るならみんなで持とう！',
    '補修用テープ、細引きロープ': '靴やザックが壊れたときの応急処置に。細いロープもいろいろ使えるよ！',
    '高度気圧計': '今の標高や天気の変化がわかるよ。気圧が下がってきたら天気が崩れるサインかも！',
    'ビニール袋、ジップロック': 'ゴミを持ち帰ったり、濡れた物を分けたり。何枚かあると本当に便利！',
    'タオル': '汗を拭いたり、首に巻いて日よけにしたり。1枚あると何かと使えるよ！',
    'カイロ': '寒い日や休憩中に。冷えは体力を奪うから、ポケットに入れておこう！',
    '除菌ウェットティッシュ': '山には水道がないことも多いよ。食べる前に手をきれいにしよう！',
    '汗拭きシート': '汗をそのままにすると体が冷えちゃう。さっと拭くだけでさっぱりするよ！',
    'レジャーシート': '休憩やお昼ごはんのときに。地面が湿っていても座れるよ！',
    '保温瓶': '温かい飲み物があると、寒い山頂でほっとできるよ。冬はとくにおすすめ！',
    '行動食': '歩きながらこまめに食べるおやつだよ。ナッツやチョコ、ようかんでエネルギー補給！',
    '非常食': '予定どおりに下山できないときのための食べ物。食べずに持ち帰るのが理想だね！',
    'サプリメント': '長いコースでは、ミネラルやアミノ酸の補給が足のつり予防になるよ！',
    'バーナー': '山でお湯を沸かして、温かいごはんやコーヒーを。火の扱いには気を付けてね！',
    '薬': '頭痛薬や胃腸薬など、いざというときのための薬を少しだけ持っていこう！',
    'フェーストエイドキット': 'ガーゼや包帯、三角巾などの救急セット。ケガをしたときの応急処置に！',
    'かゆみ止め': '虫に刺されたときに。かゆいと歩くのに集中できないからね！',
    '虫除け': '夏の山は虫がいっぱい！ブヨやアブ、ヒルの対策にもなるよ。',
    '日焼け止め、リップクリーム': '山の紫外線は街よりずっと強いよ。唇も乾燥するからリップも忘れずに！',
    'エマージェンシーシート': '体温を保つための薄いシート。軽いからお守りがわりに入れておこう！',
    '携帯トイレ': '山にはトイレが少ないよ。山を汚さないために持っていこうね！',
    'トイレットペーパー': '山のトイレには紙がないことも。芯を抜いて袋に入れておくとコンパクトだよ！',
    '登山計画書': 'どのコースをいつ歩くかを書いて、家族や登山口に出しておこう。万が一のときに助けてもらえるよ！',
    '常備薬とお薬手帳': 'いつも飲んでいる薬は多めに持っていこう。お薬手帳があると救助のときに役立つよ！',
    '筆記具': 'メモや登山届の記入に。鉛筆なら雨でも書けるよ！',
    'マルチツール': 'ナイフやハサミがひとつになった道具。ちょっとした修理や調理に便利だよ！',
    'ホイッスル': '助けを呼ぶときは、声より笛のほうが遠くまで届くよ。ザックに付けておこう！',
    'フリント式ライター': '濡れても火がつく道具。寒さで体温を保ちたいときの最後の手段だよ！',
    '小型発煙筒': '遭難したとき、ヘリコプターなどに居場所を知らせるための道具だよ！',
    '山岳保険': '山でのケガや遭難救助の費用に備える保険だよ。入っておくと安心して登れるね！',
}

# 限定アイテム：表の書き方とアルバムの名前が違うもの
LIMITED_ALIAS = {'苔': '苔（倒木一面の苔）', '牛': '放牧牛', '桜': 'サクラ', '梅': 'ウメ', 'クマ': '金太郎のクマ',
                 '宿り石': '金太郎伝説の石', '阿弥陀如来': '阿弥陀如来像'}


def stars(text, label):
    m = re.search(label + r'\s*(★+)', text)
    return len(m.group(1)) if m else 1


def parse_info(text):
    lines = [l.strip() for l in text.split('\n')]
    head = [l for l in lines if l]
    title = head[0].lstrip('▮').strip()
    m = re.match(r'(.+?)（(.+?)）$', title)
    name, altitude = (m.group(1), m.group(2)) if m else (title, '')
    location, startgoal = head[1], head[2]
    stat = next((l for l in head if l.startswith('所要時間')), '')
    level = next((l for l in head if l.startswith('難易度')), '')
    idx = head.index(level) if level in head else 4
    prose = '\n'.join(head[idx + 1:])
    t = re.search(r'所要時間\s*([\d.]+)時間', stat)
    d = re.search(r'総距離\s*([\d.]+)', stat)
    k = re.search(r'消費カロリー\s*([\d,]+)', stat)
    return {
        'name': name, 'altitude': altitude, 'location': location,
        'startGoal': re.sub(r'\s+', ' ', startgoal.replace('スタート⇔ゴール', 'スタート⇔ゴール ').strip()),
        'hours': float(t.group(1)) if t else None, 'distance': float(d.group(1)) if d else None,
        'kcalText': int(k.group(1).replace(',', '')) if k else None,
        'difficulty': stars(level, '難易度'), 'stamina': stars(level, '体力度?'),
        'description': prose,
    }


def parse_game(text):
    stages, limited = [], []
    area_ids = {'岩場': 'rock', '登山道': 'trail', '草原': 'meadow'}
    after_limited = False
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        if '限定' in line:
            after_limited = True
            limited += re.findall(r'[「★]([^」]+)」?', line)
            continue
        m = re.match(r'[①-⑨]?\s*(岩場|登山道|草原)\s*(初級|中級|上級)(.*)', line)
        if m:
            mods = m.group(3)
            mc = re.search(r'マッチ数?(\d)', mods)
            stages.append({
                'area': area_ids[m.group(1)], 'level': {'初級': 1, '中級': 2, '上級': 3}[m.group(2)],
                'short': '時短' in mods, 'many': 'アイテム数多' in mods, 'match': int(mc.group(1)) if mc else 3,
            })
            continue
        if after_limited:
            limited += re.findall(r'「([^」]+)」', line) or ([line.lstrip('★')] if not re.search(r'[？?]', line) else [])
    return stages, limited


def parse_souvenirs(text):
    if not text:
        return '', []
    text = text.replace('　', ' ')
    tokens = [t.strip() for t in text.split('\n') if t.strip()]
    area, items, pending = '', [], None
    for t in tokens:
        m = re.match(r'^(.*?)\s*(\d[\d,]*)\s*$', t)
        if m and m.group(1):
            items.append({'name': m.group(1).strip(), 'price': int(m.group(2).replace(',', ''))})
            pending = None
        elif m and pending:
            items.append({'name': pending, 'price': int(m.group(2).replace(',', ''))})
            pending = None
        elif 'エリア' in t and not items:
            area = t
        else:
            pending = t
    return area, items


def round_to(x, n):
    return int(round(x / n) * n)


def main(course_xlsx, equip_xlsx, out_dir):
    enc = json.load(open(f'{out_dir}/encyclopedia.json', encoding='utf-8'))
    enc_by_name = {}
    for e in enc:
        if e.get('mountain'):
            enc_by_name[(e['mountain'], e['name'])] = e['id']
    old_courses = json.load(open(f'{out_dir}/courses.json', encoding='utf-8'))
    old_items = {i['id']: i for i in json.load(open(f'{out_dir}/items.json', encoding='utf-8'))}

    # ── 装備 ──
    ewb = openpyxl.load_workbook(equip_xlsx)
    ews = ewb['八ヶ岳']
    items, row_ids = [], {}
    for r in range(3, 78):
        label = ews.cell(r, 2).value
        if not label:
            continue
        first = label.split('\n')[0].replace('０', '0')
        m = re.match(r'(.+?)\s+(\d+)\s*$', first.replace('　', ' '))
        name, price = m.group(1).strip(), int(m.group(2))
        cat = CATEGORY_BY_COLOR[ews.cell(r, 2).fill.fgColor.rgb]
        iid = OLD_IDS.get(name) or f'eq{r - 2:02d}'
        old = old_items.get(iid)
        advice = old['advice'] if old else NEW_ADVICE.get(name, '')
        uses = None if name in NEVER_WORN else USES_BY_CATEGORY[cat]
        items.append({'id': iid, 'name': name, 'price': price, 'category': cat,
                      'icon': ICONS.get(name, old['icon'] if old else ICON_BY_CATEGORY[cat]),
                      'uses': uses, 'advice': advice})
        row_ids[name] = iid
    missing = [i['name'] for i in items if not i['advice']]
    if missing:
        print('アドバイス文が無い装備:', missing)

    # ── コース ──
    cwb = openpyxl.load_workbook(course_xlsx, data_only=True)
    # ふもとの里山（テスト用）は今のデータに、新しい形の項目を足して引き継ぐ
    courses = []
    for c in old_courses:
        if c['mountainId'] != 'satoyama':
            continue
        easy = c['difficulty'] <= 1
        courses.append({**c, 'no': len(courses) + 1, 'altitude': '', 'location': '架空の山（テスト用）', 'startGoal': '',
                        'hours': None, 'routeConst': round(c['calories'] / 60, 2), 'stamina': c['difficulty'],
                        'stages': [{'area': a, 'level': 1, 'short': False, 'many': False, 'match': 3}
                                   for a in (['trail', 'meadow'] if easy else ['rock', 'trail', 'meadow'])],
                        'limited': [], 'souvenirArea': '', 'souvenirs': [{'name': '里山のおにぎり', 'price': 100}],
                        'seasonalItems': [], 'requiredTotal': c['requiredStamina'] * 5})
    for sheet, esheet, mid, mname in MOUNTAINS:
        ws = cwb[sheet]
        es = ewb[esheet]
        n = 0
        for row in ws.iter_rows(min_row=3, values_only=True):
            v = [('' if c is None else str(c)) for c in row]
            if not v[3].strip() or not re.search(r'コース（[\d,/]', v[3]) and '横断歩道コース' not in v[3]:
                continue
            n += 1
            info = parse_info(v[3])
            if not info['name'] or info['name'] == 'コース':
                continue
            stages, limited_names = parse_game(v[1])
            area, souvenirs = parse_souvenirs(v[4])
            route_const = float(v[6]) if v[6] else round(info['kcalText'] / 60, 2)
            hours = float(v[8]) if v[8] else info['hours']
            distance = float(v[9]) if v[9] else info['distance']
            limited = []
            for ln in limited_names:
                key = LIMITED_ALIAS.get(ln, ln)
                sid = enc_by_name.get((mid, key))
                if sid:
                    limited.append(sid)
                else:
                    print(f'  限定アイテムが見つからない: {mname} {info["name"]} {ln}')
            # 必要装備（装備表の列＝コースの並び）
            required, seasonal = [], []
            col = 2 + n
            for r in range(3, 78):
                label = es.cell(r, 2).value
                if not label:
                    continue
                name = re.match(r'(.+?)\s+\d+\s*$', label.split('\n')[0].replace('０', '0').replace('　', ' ')).group(1).strip()
                base = es.cell(r, 2).fill.fgColor.rgb
                f = es.cell(r, col).fill
                c = f.fgColor.rgb if f.fill_type else None
                if c == base:
                    required.append(row_ids[name])
                elif c == SEASONAL:
                    seasonal.append(row_ids[name])
            d, s = info['difficulty'], info['stamina']
            alt_km = max([int(a.replace(',', '')) for a in re.findall(r'[\d,]{3,}', info['altitude'])] or [800]) / 1000
            # 必要な総合体力：難易度・体力度・時間・標高から決める（いろはの森で100、赤岳で約560）
            req_total = round_to(50 * (d + s) + 10 * (hours or 3) + 20 * alt_km - 30, 10)
            courses.append({
                'id': f'{mid}_{n:02d}', 'mountainId': mid, 'mountainName': mname, 'no': n,
                'name': info['name'], 'altitude': info['altitude'], 'location': info['location'],
                'startGoal': info['startGoal'], 'hours': hours, 'distance': distance,
                'duration': f'{hours:g}時間' if hours else '', 'routeConst': route_const,
                'calories': round(route_const * 60), 'difficulty': d, 'stamina': s,
                'description': info['description'], 'stages': stages, 'limited': limited,
                'souvenirArea': area, 'souvenirs': souvenirs,
                'requiredItems': required, 'seasonalItems': seasonal,
                'requiredTotal': req_total, 'reward': 600 + 200 * (d + s),
            })
    json.dump(courses, open(f'{out_dir}/courses.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump(items, open(f'{out_dir}/items.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    by_m = {}
    for c in courses:
        by_m.setdefault(c['mountainId'], []).append(c)
    for m, cs in by_m.items():
        print(m, len(cs), [(c['name'], len(c['stages']), c['requiredTotal'], len(c.get('requiredItems', []))) for c in cs])
    print('装備', len(items))


if __name__ == '__main__':
    main(*sys.argv[1:4])

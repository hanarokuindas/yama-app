import ast, json, re, sys
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation

ROOT, OUT = sys.argv[1], sys.argv[2]
rd = lambda p: open(f'{ROOT}/{p}', encoding='utf-8').read()

def lit(src, name):
    i = src.index(name); j = src.index('{', i); d = 0
    for k in range(j, len(src)):
        d += {'{': 1, '}': -1}.get(src[k], 0)
        if d == 0: return ast.literal_eval(src[j:k + 1])

def js_str(src, key_re):
    m = re.search(key_re + r"\s*'((?:[^'\\]|\\.)*)'", src)
    return m.group(1).replace('\\n', '\n') if m else ''

climb, maint, tut, intro, home, mnt = rd('src/pages/Climbing.jsx'), rd('src/pages/Maintenance.jsx'), rd('src/data/tutorial.js'), rd('src/components/IntroStory.jsx'), rd('src/pages/Home.jsx'), rd('src/data/mountains.js')
training = rd('src/pages/Training.jsx')

def blk(src, start, end):
    i = src.index(start); return src[i:src.index(end, i)]

rows = []  # 区分, 画面, 場面・項目, 今の文, 出どころ, 優先度, ファイル, 備考
A = rows.append
SELF, PART, TEST = '自作（仮）', '一部ラフ・一部自作', 'テスト用（リリース時に消す）'

# 山の紹介
for mid, nm in [('takao', '高尾山'), ('hakone', '箱根山')]:
    b = blk(mnt, f"id: '{mid}'", 'lat:')
    A(['山の紹介', '登山 山の紹介', f'{nm}のひとこと説明', js_str(b, 'intro:').replace('（仮の文）', ''), SELF, '高', 'src/data/mountains.js', '八ヶ岳はラフの文'])

# 登頂のひとこと
gods = blk(climb, 'const GODS = {', "const CONSOLE_TEXT")
for mid, nm in [('yatsugatake', 'ヤツガタケ'), ('takao', 'タカオ'), ('hakone', 'ハコネ')]:
    b = blk(gods, f'{mid}: {{', 'summit:') + blk(gods[gods.index(f'{mid}: {{'):], 'summit:', '\n')
    A(['山神のセリフ', '登山 登頂', f'{nm}の登頂のひとこと', js_str(b, 'summit:'), SELF, '高', 'src/pages/Climbing.jsx', 'ラフは「山神の全身とひとこと」とだけ'])
A(['山神のセリフ', '登山 登頂', 'ふもとの里山（先輩）の登頂のひとこと', js_str(gods[gods.index('satoyama'):], 'summit:'), TEST, '低', 'src/pages/Climbing.jsx', ''])
A(['山神のセリフ', '登山 お供えのあと', '山神のお礼', '（お土産の名前）をありがとう！\nご利益があるように見守っているよ', SELF, '中', 'src/pages/Climbing.jsx', '3柱共通。山神ごとに変えるなら3つ'])

# 山整備のひとこと
mg = blk(maint, 'const GODS = {', 'function Bar')
for mid, nm in [('yatsugatake', 'ヤツガタケ'), ('takao', 'タカオ'), ('hakone', 'ハコネ')]:
    b = mg[mg.index(f'{mid}: {{'):]
    b = b[:b.index('},')]
    for key, lab in [('good', 'ふつう（整備61%以上）'), ('bad', '荒れている（60%以下）')]:
        t = js_str(b, f'{key}:')
        src = 'ラフ' if '（仮の文）' not in t else SELF
        if src == 'ラフ': continue
        A(['山神のセリフ', '山整備 山を選んだ画面', f'{nm}のひとこと・{lab}', t.replace('（仮の文）', ''), SELF, '高', 'src/pages/Maintenance.jsx', '画面に「（仮の文）」と出ている'])

# 脱落・出来事
fails = blk(climb, 'const FAILS = {', '}\n\n')
for key, nm in [('stamina', '体力不足'), ('balance', 'バランス'), ('lost', '探索不足（ミニゲーム失敗）')]:
    line = [l for l in fails.split('\n') if l.strip().startswith(key)][0]
    t, x, h = js_str(line, 'title:'), js_str(line, 'text:'), js_str(line, 'hint:')
    A(['登山の脱落', '登山 脱落', f'{nm}：見出しの下の文', x, 'ラフ' if key == 'stamina' else SELF, '中', 'src/pages/Climbing.jsx', f'見出し「{t}」は一問一答で決定済み'] if key != 'stamina' else None) if key != 'stamina' else None
    A(['登山の脱落', '登山 なぐさめ', f'{nm}：5回続けて脱落したときのヒント', h, SELF, '中', 'src/pages/Climbing.jsx', ''])
rows[:] = [r for r in rows if r]
evs = blk(climb, 'const EVENTS = [', ']\n')
for l in evs.split('\n'):
    if "id: '" not in l: continue
    t, x = js_str(l, 'title:'), js_str(l, 'text:')
    src = 'ラフ' if l.find("'thunder'") >= 0 else SELF
    A(['出来事', '登山 ステージの合間', f'出来事「{t}」', f'{t}\n{x}', src if src != 'ラフ' else '一部ラフ・一部自作', '中', 'src/pages/Climbing.jsx', '雷はラフの文「急な雨…！雷も！これ以上は進めないよ」。倒木・増水・仲間の不調は一問一答の項目名から自作'])
A(['出来事', '登山 ステージの合間', 'よい出来事「山神のご利益」', '山神のご利益…！\n山の恵みで元気が出た！ 300pt と体力 +1 をもらったよ\nこのまま進もう', SELF, '中', 'src/pages/Climbing.jsx', '10月の修正指示の「ご利益」（出来事の1つ）'])
A(['出来事', '登山 ステージの合間', 'ご利益ではね返したとき', '（出来事）…！\nでも、ご利益ではね返した！ このまま進もう', SELF, '中', 'src/pages/Climbing.jsx', ''])

# お土産・ご利益・温泉
A(['お土産・ご利益', '登山 お土産屋', 'お供えの説明', 'お土産を買うと、（山神）へのお供えになるよ。\nその場で体力が上がって、次の登山の災害よけにもなるんだ', SELF, '中', 'src/pages/Climbing.jsx', ''])
A(['お土産・ご利益', '登山 お供えのあと', 'ご利益の説明', '滋養がついて体力もアップ！ 体幹・脚力・腕力 +（数）\n次の登山で、ステージの合間の災害を1回はね返せるよ', PART, '低', 'src/pages/Climbing.jsx', '1行目はラフの文'])
A(['お土産・ご利益', '登山 温泉', '温泉の説明', '入湯料 300pt で、登山で失った（数）のうち（数）ぶん回復するよ', SELF, '低', 'src/pages/Climbing.jsx', ''])

# オープニング・案内
A(['オープニング', 'オープニング', 'ヤツガタケ 2つめのセリフの2行目', 'ここの山々には、それぞれ山神が住んでいるんだ', SELF, '中', 'src/components/IntroStory.jsx', '1行目「わたしは八ヶ岳」はラフの文'])
A(['オープニング', 'オープニング', 'ヤツガタケ 最後のセリフ（はじめて）', 'そのまえに……\nきみのこと、教えてくれるかい？', SELF, '中', 'src/components/IntroStory.jsx', 'このあと名前と体重の入力'])
A(['オープニング', 'オープニング', 'ヤツガタケ 最後のセリフ（見直し）', 'それじゃあ、さっそく案内しよう', SELF, '低', 'src/components/IntroStory.jsx', 'メニューから見直したとき'])
for m in re.finditer(r"id: '(\w+)'[^\n]*\n\s*text: '((?:[^'\\]|\\.)*)'", tut):
    sid, t = m.group(1), m.group(2).replace('\\n', '\n')
    who = 'ヤツガタケ' if "speaker: 'yatsugatake'" in tut[m.start():m.end()] else '先輩'
    src = SELF
    note = ''
    if sid == 'goTraining': src, note = PART, '1行目はラフの先輩のあいさつ'
    if sid == 'gear': src, note = PART, '1行目はラフの先輩の文'
    if sid == 'pickArea': src, note = PART, 'ラフの山探索の初回説明をもとに書いた'
    A(['はじめての案内', '案内（チュートリアル）', f'{sid}（{who}）', t, src, '中', 'src/data/tutorial.js', note])

# ホームのカギ
for t in re.findall(r"locked\('([^']*)'\)", home):
    A(['ホーム', 'ホーム カギのアイコン', 'タップしたときの吹き出し', t, SELF, '低', 'src/pages/Home.jsx', ''])
A(['ホーム', 'ホーム カギのアイコン', '登山のカギ', '登山は、山探索Lv.3・総合体力20で解放されるよ（今：Lv.○・○）', SELF, '低', 'src/pages/Home.jsx', ''])

# トレーニング結果
A(['トレーニング', 'トレーニング 一覧', 'ふだんの先輩の吹き出し', '鍛えたいトレーニングを選んだら、\nモーションに合わせてやってみよう！', PART, '低', 'src/pages/Training.jsx', 'ラフ p28 のあいさつの一部'])
A(['トレーニング', 'トレーニング 一覧', '最後までやったときの先輩のコメント', '最後までよくがんばったね！', SELF, '中', 'src/pages/Training.jsx', 'ラフは先輩ミニ⑤⑦の指定だけ'])
A(['トレーニング', 'トレーニング 一覧', '途中でやめたときの先輩のコメント', '途中でやめちゃったね…\n次は最後までがんばってみよう！', SELF, '中', 'src/pages/Training.jsx', 'ラフは先輩ミニ⑧⑩の指定だけ'])
A(['AR撮影', 'AR撮影', '説明', 'カメラを起動して登頂スタンプ付きの写真を撮ろう。\nその山の全コースを登頂すると、山神が会いに来てくれるよ！', PART, '低', 'src/pages/AR.jsx', '2行目はラフ p104 の文をもとに'])
A(['山神のセリフ', '登山 登頂', '全コース登頂のお知らせ', '全コース登頂！ （山神）が会いに来てくれるよ。AR撮影で一緒に写真を撮ろう！', PART, '中', 'src/pages/Climbing.jsx', 'ラフ p104 の文をもとに'])

# 装備アドバイス
items = {i['name']: i for i in json.load(open(f'{ROOT}/src/data/items.json', encoding='utf-8'))}
adv = lit(rd('tools/import_courses.py'), 'NEW_ADVICE')

# ── 追加が必要なもの ──
need = [
    ['文', '山の紹介（高尾山・箱根山）', '登山の山の紹介画面に出す、県・標高の下のひとこと説明', '高', '八ヶ岳はラフにあり。今は仮の文'],
    ['文', '山神の登頂のひとこと（3柱）', '登頂画面で山神の全身と一緒に出すセリフ', '高', 'ラフは「山神の全身とひとこと」とだけ'],
    ['文', '山整備の山神のひとこと（4つ）', 'ヤツガタケ（ふつう・荒れている）、タカオ（荒れている）、ハコネ（ふつう）', '高', 'タカオ（ふつう）・ハコネ（荒れている）はラフにあり'],
    ['文', '新しい装備のアドバイス（55品）', '装備ショップで装備をタップしたときの先輩のアドバイス', '中', '「装備アドバイス」シートにあり'],
    ['文', '出来事の文（倒木・増水・仲間の不調）', '登山のステージの合間に起きる出来事の文', '中', '雷はラフの文あり'],
    ['文', '脱落の文とヒント', '体に異変・迷ったの下の文、5回続けて脱落したときのヒント', '中', ''],
    ['数字', '最初の案内の目標レベル', 'ラフ「山探索はLv.○○、トレーニングはLv.○○を目指してね」の○○', '中', '今は登山の解放条件（探索Lv3・総合体力20）を案内している'],
    ['絵', 'お土産の絵', 'お土産屋の看板に出すお土産の絵（コースごとに3品）', '中', '今はプレゼント箱のアイコンで代用'],
    ['絵', '山神の上半身の絵', '山の紹介画面の上半身', '低', '今は全身の絵の上の方を切り取って代用'],
    ['絵', '山の紹介のマップ', 'ラフの山の紹介マップ（県の位置）', '低', '今はアルバムの日本地図を流用'],
    ['資料', 'ラフの絵だけのページ', '261105ラフ更新版3座用.pdf の 47〜55・59・60・64・68〜70・72・76・80・82〜84・89・109ページ', '中', 'ファイルが35MBあり、この環境に取り込めず見られていない。10MB以下に分けてもらえれば読める'],
    ['仕様', 'AR撮影の画面', 'AR撮影の画面のラフ（山神の選び方・撮影後の流れ）', '低', '全コース登頂で山神と撮れるようにした。画面はまだ縦画面のまま'],
]

nums = [
    ['登山', '出来事の起きる割合', 'ステージの合間ごとに8%', 'src/pages/Climbing.jsx'],
    ['登山', '限定アイテムの出る割合', 'ステージごとに35%で1種', 'src/games/TripleMatchGame.jsx'],
    ['登山', 'バランスの基準', 'いちばん低い体力が総合体力の20%未満で脱落（体力面★1つごとに+5%）', 'src/pages/Climbing.jsx'],
    ['登山', 'ご利益で上がる体力', 'お土産の価格÷500（最低2）を体幹・脚力・腕力それぞれに', 'src/pages/Climbing.jsx'],
    ['登山', '脱落のポイント減少', '登頂ポイントの10%（最大500pt）', 'src/pages/Climbing.jsx'],
    ['登山', '疲労', '登頂＝推奨体力×0.1、脱落＝×0.02×進んだステージ数（企画書のまま）', 'src/pages/Climbing.jsx'],
    ['装備', '消耗する回数', '食料・救急品1回（毎回）、靴・バックパック（5品）20回、そのほか10回、保険証など4品は消えない（一問一答 #11）', 'tools/import_courses.py'],
    ['山整備', '労力', 'ゴミ拾い1・パトロール2・刈払い3・枝打ち4・登山道整備5・植林6・間伐8（荒廃中は2倍）。10月の一問一答 #5 の「くらい」の数字', 'src/data/maintenanceActivities.js'],
    ['登山', 'よい出来事「ご利益」', 'ステージの合間に6%。300pt と体力+1（3つとも）', 'src/pages/Climbing.jsx'],
    ['山整備', '資金・回復・作業時間', 'これまでの数字（ゴミ拾い1,000pt・+5%・30分 〜 間伐5,200pt・+40%・6時間）', 'src/data/maintenanceActivities.js'],
]

# ── 書き出し ──
HEAD = PatternFill('solid', fgColor='FF8A6A45')
FILL = PatternFill('solid', fgColor='FFFFF6D6')
thin = Side(style='thin', color='FFD9C7A5')
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
wrap = Alignment(wrap_text=True, vertical='top')

def sheet(ws, header, data, widths, fill_col=None):
    ws.append(header)
    for c in ws[1]:
        c.font = Font(bold=True, color='FFFFFFFF'); c.fill = HEAD; c.alignment = Alignment(vertical='center', wrap_text=True); c.border = BOX
    for r in data: ws.append(r)
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.alignment = wrap; c.border = BOX
            if fill_col is not None and c.column == fill_col: c.fill = FILL
    for i, w in enumerate(widths): ws.column_dimensions[chr(65 + i)].width = w
    ws.freeze_panes = 'A2'
    ws.auto_filter.ref = ws.dimensions

wb = Workbook()
ws = wb.active; ws.title = '仮の文'
sheet(ws, ['No', '区分', '画面', '場面・項目', '今の文', '出どころ', '優先度', '差し替え文（ここに記入）', 'ファイル', '備考'],
      [[i + 1, *r[:5], '', r[6], r[7]] for i, r in enumerate(rows)] if False else
      [[i + 1, r[0], r[1], r[2], r[3], r[4], r[5], '', r[6], r[7]] for i, r in enumerate(rows)],
      [5, 14, 20, 30, 50, 18, 7, 50, 28, 36], fill_col=8)

ws = wb.create_sheet('装備アドバイス')
data = []
for n, t in adv.items():
    it = items[n]
    data.append([len(data) + 1, it['category'], n, it['price'], t, '', it['id']])
sheet(ws, ['No', 'カテゴリ', '装備', '価格(pt)', '今のアドバイス（自作）', '差し替え文（ここに記入）', 'ID'], data, [5, 12, 26, 9, 60, 60, 8], fill_col=6)

ws = wb.create_sheet('追加が必要なもの')
sheet(ws, ['No', '種類', '項目', '中身', '優先度', '今の扱い', '届いたら（記入）'],
      [[i + 1, *r[:4], r[4], ''] for i, r in enumerate(need)], [5, 8, 30, 50, 7, 46, 30], fill_col=7)

ws = wb.create_sheet('仮の数字')
sheet(ws, ['No', '画面', '項目', '今の数字', 'ファイル', '変える場合（記入）'],
      [[i + 1, *r, ''] for i, r in enumerate(nums)], [5, 9, 24, 60, 32, 30], fill_col=6)

for ws in wb.worksheets:
    for r in range(2, ws.max_row + 1): ws.row_dimensions[r].height = None
wb.save(OUT)
print(len(rows), len(data), len(need), len(nums))

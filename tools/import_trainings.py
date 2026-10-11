"""トレーニング表（Excel）からアプリ用の種目データを作る。

  python3 tools/import_trainings.py <トレーニング表.xlsx>

「手本動画」シートの 動作番号・カテゴリ・回数／時間・種目名・参考動画・制作上の注意点 と、
「先輩コメント」シートの 先輩アドバイスコメント を読み、src/data/trainings.json に書き出す。

回数／時間の読み方（表の1行目の説明どおり）
  各15回（75秒）  … 左15回 → 切り替え10秒 → 右15回。左右それぞれ (75-10)/2 秒
  50回（45秒）＋（左右交互） … 左右順々に合計50回
  10回×2ｾｯﾄ（60秒） … セット1 → 休憩10秒 → セット2
  20秒×2ｾｯﾄ（60秒） … 20秒 → 休憩20秒 → 20秒（残りの秒数を休憩にあてる）
"""
import json
import os
import re
import sys
import unicodedata

import openpyxl

SWITCH_SEC = 10   # 左右の切り替え時間（表の指定）
SET_REST_SEC = 10 # 回数指定のセット間の休憩（表に指定がないので切り替えと同じにする）

# 表の種目名 → アプリ内のID（画像フォルダ名にも使う）
IDS = {
    'スクワット': 'squat', 'バウンドスクワット': 'bound_squat', 'スプリットスクワット': 'split_squat',
    'クロスバックランジ': 'cross_back_lunge', 'ニーアップ': 'knee_up', 'ヒールアップ': 'heel_up',
    'ヒップリフト': 'hip_lift', 'ファイアーハイドラント': 'fire_hydrant',
    'ワイドプッシュアップ': 'wide_pushup', 'ナロープッシュアップ': 'narrow_pushup',
    'アンクルタッチ': 'ankle_touch', 'レッグリフトクランチ': 'leg_lift_crunch', 'ニートゥチェスト': 'knee_to_chest',
    'レッグレイズ': 'leg_raise', 'V字キープ': 'v_sit', 'サイドクランチ': 'side_crunch',
    'コブラのポーズ': 'cobra', 'バッククロスクランチ': 'back_cross_crunch', 'バックスクイーズ': 'back_squeeze',
    'プランク': 'plank', 'スパイダープランク': 'spider_plank', 'ヒップツイストプランク': 'hip_twist_plank',
    'マウンテンクライマー': 'mountain_climber', '木のポーズ': 'tree_pose', '片足バランス': 'one_leg_balance',
    '肩甲骨ほぐし': 'scapula', '腕開き/胸ストレッチ': 'chest_open', '肩ストレッチ': 'shoulder_stretch',
    '脚ふり': 'leg_swing', '前腿ストレッチ': 'quad_stretch', '股関節回し': 'hip_circle',
    '首ストレッチ': 'neck_stretch', '腕脇腹ストレッチ': 'side_stretch', '肩入れ': 'shoulder_in',
    '背中ストレッチ': 'back_stretch', '内転筋ストレッチ': 'adductor_stretch', '脚パタパタ': 'leg_flap',
    'お尻ストレッチ': 'glute_stretch', '股関節ストレッチ': 'hip_stretch', 'アキレス腱ストレッチ': 'achilles_stretch',
    '前屈腿裏ストレッチ': 'hamstring_stretch',
}


def norm(s):
    """半角カナなどをそろえる。かっこは全角に戻す"""
    s = unicodedata.normalize('NFKC', str(s)).strip()
    return s.replace('(', '（').replace(')', '）')


def split_points(text):
    """「・」区切りや改行区切りの箇条を配列にする"""
    if not text:
        return []
    parts = re.split(r'[\n・]', str(text))
    return [p.strip() for p in parts if p.strip()]


def parse_name(raw):
    """'スプリットスクワット（左右）' → 名前・左右・補足"""
    s = norm(raw)
    side = None
    notes = []
    for m in re.findall(r'（([^）]*)）', s):
        if m == '左右交互':
            side = 'alt'
        elif m == '左右':
            side = 'lr'
        else:
            notes.append(m)
    name = re.sub(r'（[^）]*）', ' ', s).split()
    base = name[0]
    notes += name[1:]  # かっこの後ろの補足（立った姿勢で など）
    return base, side, ' '.join(notes)


def parse_phases(spec, side):
    s = norm(spec)
    m = re.match(r'^(各)?(\d+)(回|秒)(?:×(\d+)セット)?(?:（(\d+)秒）)?$', s)
    if not m:
        raise ValueError(f'回数／時間を読めません: {spec}')
    each, n, unit, sets, total = m.group(1), int(m.group(2)), m.group(3), m.group(4), m.group(5)
    total = int(total) if total else n
    reps = n if unit == '回' else None

    if each:  # 左右それぞれ
        work = (total - SWITCH_SEC) / 2
        return total, [
            {'label': '左', 'sec': work, 'reps': reps},
            {'label': '切り替え', 'sec': SWITCH_SEC, 'rest': True},
            {'label': '右', 'sec': work, 'reps': reps},
        ]
    if sets:
        sets = int(sets)
        if unit == '秒':
            work = n
            rest = (total - work * sets) / (sets - 1)
        else:
            rest = SET_REST_SEC
            work = (total - rest * (sets - 1)) / sets
        phases = []
        for i in range(sets):
            if i:
                phases.append({'label': '休憩', 'sec': rest, 'rest': True})
            phases.append({'label': f'{i + 1}セット目', 'sec': work, 'reps': reps})
        return total, phases
    return total, [{'label': '', 'sec': total, 'reps': reps}]


def main():
    wb = openpyxl.load_workbook(sys.argv[1], data_only=True)
    model, comments = wb['手本動画'], wb['先輩コメント']

    tips_by_name = {}
    for row in comments.iter_rows(min_row=3):
        name, tips = row[6].value, row[7].value
        if name and tips:
            tips_by_name[parse_name(name)[0]] = split_points(tips)

    out, group = [], norm(model['G2'].value)  # 最初の見出し（脚力）は表の見出し行にある
    for row in model.iter_rows(min_row=3):
        no, legs, arms, core, spec, raw = (row[i].value for i in (1, 2, 3, 4, 5, 6))
        if raw and not no:   # 見出し行（脚力・ヒップ…）
            group = norm(raw)
            continue
        if not raw or not spec:
            continue
        name, side, note = parse_name(raw)
        total, phases = parse_phases(spec, side)
        out.append({
            'id': IDS[name],
            'group': group,
            'name': name,
            'note': note,
            'side': side,
            'stats': [k for k, v in (('legs', legs), ('arms', arms), ('core', core)) if v],
            'spec': norm(spec),
            'total': total,
            'phases': phases,
            'tips': tips_by_name.get(name, []),
            'points': split_points(row[9].value),          # 制作上の注意点（画像づくり用）
            'ref': {'url': (row[7].value or '').split('\n')[0], 'at': row[8].value or ''},
            'motionCheck': row[0].value or '',              # モーション欄の印（△ など）
        })

    path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'trainings.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f'{len(out)} 種目を書き出しました → {os.path.normpath(path)}')


if __name__ == '__main__':
    main()

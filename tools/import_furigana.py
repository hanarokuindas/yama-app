"""フリガナ一覧.xlsx（Googleドライブ「2024山ゲーム/2507～埋め込み用」）から src/data/furigana.json を作る。

  python3 tools/import_furigana.py <フリガナ一覧.xlsx> src/data/furigana.json

表は「語、読み」が左から2列ずつ並んでいる。読みは漢字の部分だけ（例：溢れ → あふ）なので、
語を「漢字の部分」と「うしろの送りがな」に分けて [語, 漢字の部分, 読み] で保存する。
アプリでは、文章で最初に出てきたところの漢字の部分のあとに（読み）を付ける（一問一答 2026-11-23）。
"""
import json
import re
import sys

import openpyxl

KANA = re.compile(r'[ぁ-んァ-ヶー]+$')


def main(src, out):
    wb = openpyxl.load_workbook(src, data_only=True)
    pairs = {}
    for ws in wb.worksheets:
        for row in ws.iter_rows(values_only=True):
            cells = [('' if c is None else str(c).strip()) for c in row]
            for i in range(0, len(cells) - 1, 2):
                word, reading = cells[i], cells[i + 1]
                if not word or not reading or not re.search(r'[一-龥々]', word):
                    continue
                if not re.fullmatch(r'[ぁ-んー()（）]+', reading):
                    continue
                word = re.sub(r'^\(.+?\)', '', word)  # 「(天狗の)露地」のような補足は外す
                reading = re.sub(r'^\(.+?\)', '', reading).replace('(', '').replace(')', '')
                tail = KANA.search(word)
                kanji = word[:tail.start()] if tail else word
                if not re.fullmatch(r'[一-龥々ヶ・]+', kanji) or len(kanji) < 1:
                    continue
                pairs.setdefault(word, [word, kanji, reading])
    data = sorted(pairs.values(), key=lambda p: -len(p[0]))  # 長い語から当てる
    json.dump(data, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(out, len(data))


if __name__ == '__main__':
    main(*sys.argv[1:3])

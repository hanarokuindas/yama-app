import LIST from '../data/furigana.json'

/* フリガナ一覧の語に、文章で最初に出てきたところだけ「漢字（よみ）」の形で読みを付ける（一問一答 2026-11-23）。
   LIST は [語, 漢字の部分, 読み] で、長い語から並んでいる */
const isKanji = (c) => !!c && /[一-龥々ヶ]/.test(c)
const cache = new Map()

export function withFurigana(text) {
  if (!text) return text
  if (cache.has(text)) return cache.get(text)
  let out = text
  for (const [word, kanji, reading] of LIST) {
    let from = 0
    for (;;) {
      const i = out.indexOf(word, from)
      if (i < 0) break
      const end = i + kanji.length
      // 長い熟語の一部（前後に漢字が続く）には付けない。すでに読みが付いていれば付けない
      const inside = isKanji(out[i - 1]) || (word === kanji && isKanji(out[i + word.length]))
      if (!inside && out[end] !== '（' && out[end] !== '(') {
        out = `${out.slice(0, end)}（${reading}）${out.slice(end)}`
        break
      }
      from = i + 1
    }
  }
  cache.set(text, out)
  return out
}

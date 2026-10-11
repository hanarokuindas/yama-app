import { MOTION_IMAGES } from '../assets/motions'

/* トレーニングのお手本アニメ（画像コマのパラパラ再生）。
   画像は src/assets/motions/<種目ID>/01.webp, 02.webp ... （tools/slice_motion_sheet.py で作る）。

   seq   : 1回ぶんのコマの並び。i = 何枚目の画像か（0始まり）、w = 1回の中での長さの比、
           cue = そのコマのあいだに出す声かけ、flip = 左右反転して出す（左右交互の種目で反対側を見せる）
   cycle : キープ系（秒指定）の種目で、コマの並びを何秒で1周するか。
           回数指定の種目は「1回にかける秒数」（表の秒数 ÷ 回数）で1周する。
   左右（各〇回）の種目は、右側のときに画像全体を左右反転して見せる。 */

export const MOTIONS = {
  squat: {
    seq: [
      { i: 0, w: 0.6, cue: 'お尻を後ろに引いて' },
      { i: 1, w: 0.6, cue: 'ゆっくり下げて…' },
      { i: 2, w: 1.0, cue: '腿と床が平行になるまで' },
      { i: 1, w: 0.8, cue: 'お尻で上がる' },
    ],
  },
  bound_squat: {
    seq: [
      { i: 0, w: 0.7, cue: 'ワイドスタンスで構える' },
      { i: 1, w: 0.7, cue: '膝の高さまで腰を落とす' },
      { i: 2, w: 0.3, cue: 'バウンド 1' },
      { i: 1, w: 0.3, cue: 'バウンド 1' },
      { i: 2, w: 0.3, cue: 'バウンド 2' },
      { i: 1, w: 0.3, cue: 'バウンド 2' },
      { i: 2, w: 0.3, cue: 'バウンド 3' },
      { i: 1, w: 0.4, cue: 'バウンド 3' },
    ],
  },
  split_squat: {
    seq: [
      { i: 0, w: 0.6, cue: '前後に脚を大きく開く' },
      { i: 1, w: 0.6, cue: '真下にすとんと落とす' },
      { i: 2, w: 1.0, cue: '前の膝は90度' },
      { i: 1, w: 0.8, cue: '上半身は垂直のまま' },
    ],
  },
  cross_back_lunge: {
    seq: [
      { i: 0, w: 0.6, cue: '上半身は正面のまま' },
      { i: 1, w: 0.6, cue: '後ろに大きくクロス' },
      { i: 2, w: 1.0, cue: '垂直にダウン' },
      { i: 1, w: 0.8, cue: '両肩は床と平行に' },
    ],
  },
  knee_up: {
    seq: [
      { i: 0, w: 1, cue: '手は胸の高さで固定' },
      { i: 1, w: 1, cue: '膝を手にタッチ！' },
      { i: 0, w: 1, cue: '手は胸の高さで固定' },
      { i: 1, w: 1, cue: '膝を手にタッチ！', flip: true },
    ],
  },
  heel_up: {
    seq: [
      { i: 0, w: 0.6, cue: 'つま先は前に向ける' },
      { i: 1, w: 0.5, cue: '踵をしっかり上げる' },
      { i: 2, w: 0.9, cue: 'ふくらはぎをキュッと' },
      { i: 1, w: 0.6, cue: 'ゆっくり下ろす' },
    ],
  },
  plank: {
    cycle: 3,
    seq: [
      { i: 0, w: 1, cue: '肩の真下にひじ' },
      { i: 1, w: 1, cue: '頭から踵まで一直線に' },
    ],
  },
}

// 画像がそろっていてお手本アニメを出せる種目か
export function hasMotion(id) {
  const m = MOTIONS[id]
  const imgs = MOTION_IMAGES[id]
  return !!(m && imgs && m.seq.every((f) => imgs[f.i]))
}

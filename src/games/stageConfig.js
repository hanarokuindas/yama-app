/* ステージ定義（山探索）。レベルが上がるほど、お題・おじゃま・ハズレが増え、時間が短くなる。
   Lv1 はお題なし：同じ標本を3つずつそろえて、盤面を全部消せばクリア（そろえた標本はどれもアルバムの対象）
   Lv2 から「お題（ターゲット）」が出る（修正指示：お題は2ゲーム目くらいから）
   targetKinds : お題の種類数（0 ならお題なし）
   freeKinds   : お題なしのときの標本の種類数（3個ずつ）
   targetSets  : お題1種あたり何セット（＝3個）そろえるとクリアか
   decoyKinds  : おじゃまの種類数。3個ずつあり、そろえれば消せるがアルバムの対象にならない
   hazure      : ハズレの種類数。1〜2個しかなく、取るとトレイの枠をふさぐ（Lv3から）
   time        : 制限時間（秒） */
export function buildStage(level) {
  if (level <= 1) {
    return { targetKinds: 0, freeKinds: 6, targetSets: 1, decoyKinds: 0, hazure: 0, time: 100 }
  }
  const targetKinds = Math.min(3 + Math.floor((level - 1) / 2), 6)
  const targetSets = 1
  const decoyKinds = Math.min(9 + Math.floor(level / 2), 13)
  const hazure = level >= 3 ? Math.min(1 + Math.floor((level - 3) / 3), 3) : 0
  const time = Math.max(60, 100 - level * 4)
  return { targetKinds, freeKinds: 0, targetSets, decoyKinds, hazure, time }
}

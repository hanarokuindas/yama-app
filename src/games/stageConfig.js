/* ステージ定義（山探索）。レベルが上がるほど、ターゲット・おじゃま・ハズレが増え、時間が短くなる。
   targetKinds : ターゲット（3つそろえると図鑑に登録）の種類数
   targetSets  : ターゲット1種あたり何セット（＝3個）そろえるとクリアか
   decoyKinds  : おじゃまの種類数。3個ずつあり、そろえれば消せるが図鑑には登録されない
   hazure      : ハズレの種類数。1〜2個しかなく、取るとトレイの枠をふさぐ（Lv3から）
   time        : 制限時間（秒）
   標本の数は Lv1 で36個、Lv8 以降で約60個。上に重なって取れない標本が多くなりすぎないよう上限を設けている。 */
export function buildStage(level) {
  const targetKinds = Math.min(3 + Math.floor((level - 1) / 2), 6)
  const targetSets = 1
  const decoyKinds = Math.min(9 + Math.floor(level / 2), 13)
  const hazure = level >= 3 ? Math.min(1 + Math.floor((level - 3) / 3), 3) : 0
  const time = Math.max(60, 100 - level * 4)
  return { targetKinds, targetSets, decoyKinds, hazure, time }
}

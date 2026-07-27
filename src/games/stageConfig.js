/* ステージ定義：進むほど種類が増え、時間が短くなる */
export function buildStage(level) {
  const kinds = Math.min(3 + Math.floor(level / 2), 12)  // 同時に出る標本の種類数
  const sets = Math.min(2 + Math.floor(level / 2), 6)     // 各種を何セット(=3個)出すか
  const time = Math.max(55, 110 - level * 6)
  return { kinds, sets, time }
}


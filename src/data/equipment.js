/* 装備が何回の登山で消耗するか（一問一答 #11。仮の数字で、表が届いたら置き換える）。
   登山の回数は、登頂しても脱落しても1回と数える。null は消耗しない */
const USES_BY_CATEGORY = {
  食料: 1,
  救急: 1,
  ウェア: 10,
  小物: 10,
  道具: 10,
  シューズ: 20,
  バッグ: 20,
}
const USES_BY_ITEM = {
  insurance: null, // 健康保険証・身分証は消えない
  coins: 10,
}

export function itemUses(item) {
  if (item.id in USES_BY_ITEM) return USES_BY_ITEM[item.id]
  return USES_BY_CATEGORY[item.category] ?? 10
}

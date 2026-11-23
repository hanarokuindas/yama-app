/* 山整備の作業定義。duration は実時間の「分」。
   作業中はその山に登れない（議事録 2026-10-11）

   バランスの考え方（整備度は1日に5%下がる）
   - 大きな作業ほど 1%あたりのポイントは安い。そのかわり 1時間あたりの回復は少なく、山を長く閉じる
     → 「安く済ませて長く閉じる」か「高くても短く済ませる」かを選ぶ
   - 毎日ゴミ拾い1回（1,000pt）で1日の荒廃（5%）をちょうど取り戻せる
   - 収入の目安：山探索1回 約2,000〜3,000pt、デイリーミッション合計 1,800pt、登頂 400〜3,500pt
     いちばん大きな間伐（5,200pt）は山探索2回ぶんほど

   作業        ポイント  回復  時間     1%あたり  1時間あたり
   ゴミ拾い      1,000    +5%  30分       200pt     10.0%
   パトロール    1,600    +9%  1時間      178pt      9.0%
   刈払い        2,200   +13%  1時間30分  169pt      8.7%
   枝打ち        2,600   +16%  2時間      163pt      8.0%
   登山道整備    3,500   +23%  3時間      152pt      7.7%
   植林          4,500   +32%  4時間30分  141pt      7.1%
   間伐          5,200   +40%  6時間      130pt      6.7%  */
// 並びと名前・説明文は最新ラフ（2026-11 p107）どおり。費用・回復・時間はこれまでの数字のまま
// labor（労力）は一問一答 2026-10 #5 どおり（ゴミ拾い1 〜 間伐8）
export const ACTIVITIES = [
  { id: 'patrol', name: 'パトロール', icon: 'binoculars', cost: 1600, restore: 9, duration: 60, labor: 2,
    desc: '山に異常はないかな？困ってる人や悪いことをしてる人はいないかな？\n早期発見、未然防止を目指そう！' },
  { id: 'trash', name: 'ゴミ拾い', icon: 'trashbag', cost: 1000, restore: 5, duration: 30, labor: 1,
    desc: '人のゴミや落とし物は土に還らないしとてもやっかい！\n山に悪影響が出る前に回収してね！' },
  { id: 'grass', name: '刈払い', icon: 'brushcutter', cost: 2200, restore: 13, duration: 90, labor: 3,
    desc: '伸び放題な草や灌木はこまめに刈り取って！\nこれで小さな幼樹にも日差しが届くね！' },
  { id: 'branch', name: '枝打ち', icon: 'pruningsaw', cost: 2600, restore: 16, duration: 120, labor: 4,
    desc: '木の栄養が分散し過ぎないように枝を少し落とすよ！\n枯れた枝も切っておくと安全だね！' },
  { id: 'thinning', name: '間伐', icon: 'chainsaw', cost: 5200, restore: 40, duration: 360, labor: 8,
    desc: '密な森林は少し伐採して栄養バランスを整えよう！\n日光も入って下層植生と強い土壌が育つよ！' },
  { id: 'planting', name: '植林', icon: 'sapling', cost: 4500, restore: 32, duration: 270, labor: 6,
    desc: 'その山に合った苗木や種をバランスよく植えるよ！\nそこを間違えると必ず歪みが生まれるからね。' },
  { id: 'trail', name: '登山道整備', icon: 'pickaxe', cost: 3500, restore: 23, duration: 180, labor: 5,
    desc: '自然相手には定期的な整備が必要だ！\nたくさんの人が歩く登山道は山にとっても負荷大！メンテナンスしてね' },
]

/* 整備度の段階。表示・費用・登山の難しさはすべてここで決める
   良好（61%以上）  … 影響なし
   要注意（30〜60%）… 登山の必要体力 +20%
   荒廃（30%未満）  … 登山の必要体力 +50%、整備の費用10倍・効果半減（企画書p76） */
const RUINED_BELOW = 30
const CAUTION_UPTO = 60
// これより低い山は道が荒れすぎて登れない（一問一答 2026-10）
export const CLOSED_BELOW = 20

export function maintenanceState(level) {
  if (level > CAUTION_UPTO) return { key: 'good', label: '良好', color: '#27ae60', penalty: 0 }
  if (level >= RUINED_BELOW) return { key: 'caution', label: '要注意', color: '#f39c12', penalty: 0.2 }
  return { key: 'ruined', label: '荒廃中', color: '#e74c3c', penalty: 0.5 }
}

/** 整備度が低すぎて登れない */
export const isClosed = (maintenanceLevel) => maintenanceLevel < CLOSED_BELOW

/** 登山の必要体力（コース表の総合体力。整備度が低いと道が荒れて脱落しやすくなる） */
export function requiredStaminaFor(course, maintenanceLevel = 100) {
  const base = course.requiredTotal
  return Math.ceil(base * (1 + maintenanceState(maintenanceLevel).penalty))
}

/** 荒廃した山（30%未満）は費用が10倍（企画書p76） */
export function getCost(activity, maintenanceLevel) {
  return maintenanceLevel < RUINED_BELOW ? activity.cost * 10 : activity.cost
}

/** 労力（体力）：作業1回で体幹・脚力・腕力がこれだけずつ減る。荒廃した山は2倍（最新ラフ p3「荒れると消費量が倍増」） */
export function getLabor(activity, maintenanceLevel) {
  return maintenanceLevel < RUINED_BELOW ? activity.labor * 2 : activity.labor
}

/** 荒廃した山は効果が半減（整備度が小数にならないよう切り上げ） */
export function getRestore(activity, maintenanceLevel) {
  return maintenanceLevel < RUINED_BELOW ? Math.ceil(activity.restore * 0.5) : activity.restore
}

/** 「2時間30分」のような表示にする */
export function formatDuration(min) {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h && m) return `${h}時間${m}分`
  if (h) return `${h}時間`
  return `${m}分`
}

/** 作業の残り分数。作業していなければ 0 */
export function remainingMinutes(mountain) {
  if (!mountain?.workingUntil) return 0
  return Math.max(0, Math.ceil((new Date(mountain.workingUntil).getTime() - Date.now()) / 60000))
}

/** その山がいま整備作業中か（＝登山できないか） */
export function isUnderMaintenance(mountain) {
  return remainingMinutes(mountain) > 0
}

/** 残り時間を短縮するのに必要なポイント（1分 10pt） */
export function rushCost(mountain) {
  return remainingMinutes(mountain) * 10
}

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
   巡回          1,600    +9%  1時間      178pt      9.0%
   草刈り        2,200   +13%  1時間30分  169pt      8.7%
   枝切り        2,600   +16%  2時間      163pt      8.0%
   登山道整備    3,500   +23%  3時間      152pt      7.7%
   植栽          4,500   +32%  4時間30分  141pt      7.1%
   間伐          5,200   +40%  6時間      130pt      6.7%  */
export const ACTIVITIES = [
  { id: 'trash', name: 'ゴミ拾い', icon: 'trash', cost: 1000, restore: 5, duration: 30, desc: '山道のゴミを拾って清潔に！' },
  { id: 'patrol', name: '巡回', icon: 'footsteps', cost: 1600, restore: 9, duration: 60, desc: '山のパトロール！' },
  { id: 'grass', name: '草刈り', icon: 'grass', cost: 2200, restore: 13, duration: 90, desc: '登山道の草を刈る！' },
  { id: 'branch', name: '枝切り', icon: 'scissors', cost: 2600, restore: 16, duration: 120, desc: '危険な枝を除去！' },
  { id: 'trail', name: '登山道整備', icon: 'tools', cost: 3500, restore: 23, duration: 180, desc: '道の補修や整備！' },
  { id: 'planting', name: '植栽', icon: 'sprout', cost: 4500, restore: 32, duration: 270, desc: '木を植えて緑化！' },
  { id: 'thinning', name: '間伐', icon: 'log', cost: 5200, restore: 40, duration: 360, desc: '森を健康に保つ！' },
]

/* 整備度の段階。表示・費用・登山の難しさはすべてここで決める
   良好（61%以上）  … 影響なし
   要注意（30〜60%）… 登山の必要体力 +20%
   荒廃（30%未満）  … 登山の必要体力 +50%、整備の費用10倍・効果半減（企画書p76） */
const RUINED_BELOW = 30
const CAUTION_UPTO = 60

export function maintenanceState(level) {
  if (level > CAUTION_UPTO) return { key: 'good', label: '良好', color: '#27ae60', penalty: 0 }
  if (level >= RUINED_BELOW) return { key: 'caution', label: '要注意', color: '#f39c12', penalty: 0.2 }
  return { key: 'ruined', label: '荒廃中', color: '#e74c3c', penalty: 0.5 }
}

/** 登山の必要体力（整備度が低いと道が荒れて脱落しやすくなる） */
export function requiredStaminaFor(course, maintenanceLevel = 100) {
  const base = course.requiredStamina * 5
  return Math.ceil(base * (1 + maintenanceState(maintenanceLevel).penalty))
}

/** 荒廃した山（30%未満）は費用が10倍（企画書p76） */
export function getCost(activity, maintenanceLevel) {
  return maintenanceLevel < RUINED_BELOW ? activity.cost * 10 : activity.cost
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

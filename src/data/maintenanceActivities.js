/* 山整備の作業定義。duration は実時間の「分」。
   作業中はその山に登れない（議事録 2026-10-11） */
export const ACTIVITIES = [
  { id: 'trash', name: 'ゴミ拾い', icon: 'trash', cost: 1000, restore: 5, duration: 30, desc: '山道のゴミを拾って清潔に！' },
  { id: 'patrol', name: '巡回', icon: 'footsteps', cost: 10000, restore: 8, duration: 45, desc: '山のパトロール！' },
  { id: 'branch', name: '枝切り', icon: 'scissors', cost: 10000, restore: 10, duration: 60, desc: '危険な枝を除去！' },
  { id: 'grass', name: '草刈り', icon: 'grass', cost: 10000, restore: 10, duration: 60, desc: '登山道の草を刈る！' },
  { id: 'trail', name: '登山道整備', icon: 'tools', cost: 20000, restore: 20, duration: 120, desc: '道の補修や整備！' },
  { id: 'planting', name: '植栽', icon: 'sprout', cost: 80000, restore: 40, duration: 240, desc: '木を植えて緑化！' },
  { id: 'thinning', name: '間伐', icon: 'log', cost: 100000, restore: 50, duration: 360, desc: '森を健康に保つ！' },
]

/** 荒廃した山は費用が10倍 */
export function getCost(activity, maintenanceLevel) {
  return maintenanceLevel < 30 ? activity.cost * 10 : activity.cost
}

/** 荒廃した山は効果が半減 */
export function getRestore(activity, maintenanceLevel) {
  return maintenanceLevel < 30 ? activity.restore * 0.5 : activity.restore
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

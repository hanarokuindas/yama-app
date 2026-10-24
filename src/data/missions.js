import { MOUNTAIN_NAME } from './mountains'

/* 今日のミッション（修正指示：4つ・報酬はどれも +1,000pt）。
   climb は「今日の山」に1回登ると達成（登頂しても脱落しても1回） */
export const DAILY_MISSIONS = [
  { id: 'explore', label: '山探索をしよう', goal: 5, reward: 1000, icon: 'search' },
  { id: 'train', label: 'トレーニングをしよう', goal: 3, reward: 1000, icon: 'dumbbell' },
  { id: 'maintain', label: '山整備をしよう', goal: 3, reward: 1000, icon: 'chainsaw' },
  { id: 'climb', label: '山に出かけよう', goal: 1, reward: 1000, icon: 'hikinggear' },
]

export function todayString() {
  return new Date().toISOString().slice(0, 10)
}

/* 今日の山：解禁済みの山から、日付で決まった1つを選ぶ（同じ日なら何度開いても同じ山） */
export function pickMissionMountain(date, mountains) {
  const ids = Object.keys(MOUNTAIN_NAME).filter((id) => mountains[id]?.unlocked)
  if (ids.length === 0) return null
  let h = 0
  for (const ch of date) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return ids[h % ids.length]
}

/* 画面に出すミッション名。climb には今日の山の名前を入れる */
export function missionLabel(m, mountainId) {
  if (m.id === 'climb' && mountainId) return `${MOUNTAIN_NAME[mountainId]}に出かけよう`
  return m.label
}

import characters from '../data/characters.json'

// 時間帯を取得する関数
export function getTimeSlot() {
  const hour = new Date().getHours()
  if (hour >= 3 && hour < 9) return 'am3_9'
  if (hour >= 9 && hour < 17) return 'am9_pm4'
  if (hour >= 17 && hour < 22) return 'pm5_pm10'
  return 'pm10_am3'
}

// キャラクターのあいさつをランダムに取得する関数
export function getGreeting(characterId) {
  const character = characters[characterId]
  if (!character) return ''
  const timeSlot = getTimeSlot()
  const greetings = character.greetings[timeSlot]
  const randomIndex = Math.floor(Math.random() * greetings.length)
  return greetings[randomIndex]
}

// 解禁済みキャラクター一覧を取得
export function getUnlockedCharacters() {
  return Object.values(characters).filter(c => c.unlocked)
}

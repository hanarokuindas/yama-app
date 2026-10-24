import encyclopedia from './encyclopedia.json'
import courses from './courses.json'

/* アルバムの中身（修正指示：「山探索」と「登った山」の2つ） */

// 山探索の3エリア。山の固有種と「山の恵み」は登山の限定アイテムに回したので入れない
export const EXPLORE_AREAS = [
  { id: 'rock', name: '岩場', label: '岩場エリア', sub: '鉱物を見つけよう', icon: 'area_rock', verb: '見つけた' },
  { id: 'trail', name: '登山道', label: '登山道エリア', sub: '動物に出会おう', icon: 'area_trees', verb: '出会えた' },
  { id: 'meadow', name: '草原', label: '草原エリア', sub: '植物を観察しよう', icon: 'area_flowers', verb: '観察できた' },
]
export const AREA_BY_ID = Object.fromEntries(EXPLORE_AREAS.map((a) => [a.id, a]))

// 「登った山」に載る山（実在しないふもとの里山は載せない）。並びは修正指示の目次どおり
export const ALBUM_MOUNTAINS = [
  { id: 'yatsugatake', name: '八ヶ岳', lat: 35.9708, lon: 138.3703, peak: '赤岳 2,899m' },
  { id: 'takao', name: '高尾山', lat: 35.6251, lon: 139.2437, peak: '599m' },
  { id: 'hakone', name: '箱根連山', lat: 35.2333, lon: 139.0214, peak: '神山 1,438m' },
]
export const FUJI = { lat: 35.3606, lon: 138.7274 }

export const exploreSpecies = (areaId) => encyclopedia.filter((e) => e.area === areaId && !e.mountain)
export const limitedSpecies = (mountainId) => encyclopedia.filter((e) => e.mountain === mountainId)
export const mountainCourses = (mountainId) => courses.filter((c) => c.mountainId === mountainId)

export const ALBUM_SPECIES = [
  ...EXPLORE_AREAS.flatMap((a) => exploreSpecies(a.id)),
  ...ALBUM_MOUNTAINS.flatMap((m) => limitedSpecies(m.id)),
]
const ALBUM_IDS = new Set(ALBUM_SPECIES.map((e) => e.id))

/* アルバムコンプ率（％）と載っている数 */
export function albumProgress(discovered) {
  const got = discovered.filter((id) => ALBUM_IDS.has(id)).length
  return { got, total: ALBUM_SPECIES.length, rate: Math.round((got / ALBUM_SPECIES.length) * 100) }
}

/* アルバムに載る条件（一問一答 #10）：最初の2種は1回そろえたら載る。
   そのあとは、同じ種をゲームをまたいで合わせて3回そろえたら載る */
export const FREE_FIRST = 2
export const MATCHES_TO_REGISTER = 3
export function matchesNeeded(discoveredCount) {
  return discoveredCount < FREE_FIRST ? 1 : MATCHES_TO_REGISTER
}

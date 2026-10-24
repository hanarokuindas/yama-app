/* 登れる山の一覧（並びは難しさの順） */
export const MOUNTAINS = [
  { id: 'satoyama', name: 'ふもとの里山' },
  { id: 'takao', name: '高尾山' },
  { id: 'yatsugatake', name: '八ヶ岳連峰' },
  { id: 'hakone', name: '箱根山' },
]

export const MOUNTAIN_NAME = Object.fromEntries(MOUNTAINS.map((m) => [m.id, m.name]))

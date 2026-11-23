/* 装備が何回の登山で消耗するか。items.json の uses（tools/import_courses.py でカテゴリから決めた仮の数字）。
   登山の回数は、登頂しても脱落しても1回と数える。null は消耗しない */
export function itemUses(item) {
  return item.uses === undefined ? 10 : item.uses
}

/* 冬（12〜3月）は、装備表で灰色（季節によって必要）の装備も必要になる */
export function isWinter(date = new Date()) {
  const m = date.getMonth() + 1
  return m === 12 || m <= 3
}

export function requiredItemsFor(course, date = new Date()) {
  return [...(course.requiredItems || []), ...(isWinter(date) ? course.seasonalItems || [] : [])]
}

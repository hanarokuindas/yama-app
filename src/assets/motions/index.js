/* お手本アニメの画像コマ。
   src/assets/motions/<種目ID>/01.webp, 02.webp ... を置くと自動で読み込む。
   種目IDは src/data/trainings.json の id。コマの並びと声かけは src/data/motions.js に書く。 */
const files = import.meta.glob('./*/*.{png,webp}', { eager: true, import: 'default' })

export const MOTION_IMAGES = {}
for (const path of Object.keys(files).sort()) {
  const id = path.split('/')[1]
  ;(MOTION_IMAGES[id] ||= []).push(files[path])
}

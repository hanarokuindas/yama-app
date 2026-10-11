/* 手描きのモーションコマ（ドロップイン）。
   src/assets/motions/<メニューID>/01.webp, 02.webp ... を置くと、そのメニューは
   コードで描いた人物の代わりにこの絵をパラパラ再生する。
   枚数が docs/ASSET_BRIEF.md セクション6 の指定どおりなら声かけと同期し、
   違う場合は1周に均等に割り振る。 */
const files = import.meta.glob('./*/*.{png,webp}', { eager: true, import: 'default' })

export const MOTION_IMAGES = {}
for (const path of Object.keys(files).sort()) {
  const id = path.split('/')[1]
  ;(MOTION_IMAGES[id] ||= []).push(files[path])
}

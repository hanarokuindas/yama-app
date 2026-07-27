/* 標本スプライトの自動検出。
   src/assets/specimens/<図鑑ID>.png|webp を置くと、
   その種だけアイコン流用から本番スプライトへ自動で切り替わる。 */
const SPRITES = {
  ...import.meta.glob('../assets/specimens/*.png', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('../assets/specimens/*.webp', { eager: true, query: '?url', import: 'default' }),
}

export function specimenSprite(id) {
  return (
    SPRITES[`../assets/specimens/${id}.png`] ||
    SPRITES[`../assets/specimens/${id}.webp`] ||
    null
  )
}

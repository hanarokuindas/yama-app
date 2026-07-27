/* 外部生成のアイコン画像を自動検出する。
   src/assets/icons/<name>.png または .webp を置くと、
   GameIconの内蔵SVGより優先して使われる。 */
const IMAGE_OVERRIDES = {
  ...import.meta.glob('../assets/icons/*.png', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('../assets/icons/*.webp', { eager: true, query: '?url', import: 'default' }),
}

export function iconImageUrl(name) {
  return (
    IMAGE_OVERRIDES[`../assets/icons/${name}.png`] ||
    IMAGE_OVERRIDES[`../assets/icons/${name}.webp`] ||
    null
  )
}

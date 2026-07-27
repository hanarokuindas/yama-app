/* 演出用アセット。未配置でも動くように存在しなければ null を返す */
const FILES = import.meta.glob('./*.{png,webp}', { eager: true, query: '?url', import: 'default' })

const pick = (name) => FILES[`./${name}.webp`] || FILES[`./${name}.png`] || null

export const FX = {
  traySlot: pick('tray_slot'),
  sparkle: pick('fx_sparkle'),
  dust: pick('fx_dust'),
}

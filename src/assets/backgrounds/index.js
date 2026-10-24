/* 背景画像の一元管理 */
import homeMap from './bg_home_map.webp'
import intro from './bg_intro.webp'
import onsen from './bg_onsen.webp'
import shop from './bg_shop.webp'
import stageMeadow from './bg_stage_meadow.webp'
import stageRocky from './bg_stage_rocky.webp'
import stageTrail from './bg_stage_trail.webp'
import training from './bg_training.webp'

/* 横画面用に作り直した背景（届いたものから置き換わる）。
   src/assets/backgrounds/bg_home.webp などを置くと、ここに自動で入る */
const LANDSCAPE = import.meta.glob('./bg_*.webp', { eager: true, query: '?url', import: 'default' })
const pick = (name, fallback) => LANDSCAPE[`./${name}.webp`] || fallback

export const BG = {
  homeMap,
  home: pick('bg_home', homeMap),
  intro,
  onsen,
  shop,
  training,
  stage: {
    rocky: stageRocky,
    trail: stageTrail,
    meadow: stageMeadow,
  },
}

/* 画面全体を覆う背景レイヤーのstyleを作る（暗幕の濃さを調整可能） */
export function bgLayer(url, dim = 0.45) {
  return {
    position: 'absolute',
    inset: 0,
    backgroundImage: `linear-gradient(rgba(6,8,20,${dim}), rgba(6,8,20,${dim})), url(${url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    pointerEvents: 'none',
  }
}

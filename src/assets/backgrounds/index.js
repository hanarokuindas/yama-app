/* 背景画像の一元管理 */
import homeMap from './bg_home_map.webp'
import intro from './bg_intro.webp'
import onsen from './bg_onsen.webp'
import shop from './bg_shop.webp'
import stageMeadow from './bg_stage_meadow.webp'
import stageRocky from './bg_stage_rocky.webp'
import stageTrail from './bg_stage_trail.webp'
import training from './bg_training.webp'

export const BG = {
  homeMap,
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

/* 背景画像の一元管理（横画面用 1920x1072。tools/prepare_assets.py photo で変換） */
import home from './bg_home.webp'
import homeSakura from './bg_home_sakura.webp'
import homeAutumn from './bg_home_autumn.webp'
import homeWinter from './bg_home_winter.webp'
import intro from './bg_intro.webp'
import onsen from './bg_onsen.webp'
import shop from './bg_shop.webp'
import myroom from './bg_myroom.webp'
import training from './bg_training.webp'
import exploreRock from './bg_explore_rock.webp'
import exploreTrail from './bg_explore_trail.webp'
import exploreMeadow from './bg_explore_meadow.webp'
import forestGood from './bg_forest_good.webp'
import forestBad from './bg_forest_bad.webp'
import albumBook from './bg_album_book.webp'
import albumPaper from './bg_album_paper.webp'

/* ホームの背景は季節で変える：3〜4月は桜、10〜11月は紅葉、12〜2月は雪、それ以外は新緑 */
function seasonalHome(date = new Date()) {
  const m = date.getMonth() + 1
  if (m === 3 || m === 4) return homeSakura
  if (m === 10 || m === 11) return homeAutumn
  if (m === 12 || m <= 2) return homeWinter
  return home
}

export const BG = {
  home: seasonalHome(),
  homeGreen: home,
  intro,
  onsen,
  shop,
  myroom,
  training,
  forestGood,
  forestBad,
  albumBook,
  albumPaper,
  stage: {
    rocky: exploreRock,
    trail: exploreTrail,
    meadow: exploreMeadow,
  },
}

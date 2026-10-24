/* 八ヶ岳キャラ画像（元データ: 3119x4056 / 2540x2820 透過PNG → トリム+縮小WebP化済み） */
import ar01 from './yatsugatake_ar_01.webp'     // ARポーズ
import full01 from './yatsugatake_full_01.webp' // 全身①
import full02 from './yatsugatake_full_02.webp' // 全身②
import mini01 from './yatsugatake_mini_01.webp' // ミニ・口を開けて笑う
import mini02 from './yatsugatake_mini_02.webp' // ミニ・目を閉じて笑う
import mini03 from './yatsugatake_mini_03.webp' // ミニ・微笑み
import mini04 from './yatsugatake_mini_04.webp' // ミニ・目閉じ

export const yatsugatakeAR = { plain: ar01 }
export const yatsugatakeFull = { stand1: full01, stand2: full02 }
export const yatsugatakeMini = { laugh: mini01, smileClosed: mini02, smile: mini03, eyesClosed: mini04 }

/* シーン別の推奨ポーズ */
export const yatsugatakePose = {
  home: [mini01, mini02, mini03],
  intro: [full01, full02],
  ar: [ar01],
}

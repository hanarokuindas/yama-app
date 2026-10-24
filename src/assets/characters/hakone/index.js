/* 箱根キャラ画像（元データ: 1429x3184 / 2500x2500 透過PNG → トリム+縮小WebP化済み） */
import ar01 from './hakone_ar_01.webp'     // ARポーズ
import full01 from './hakone_full_01.webp' // 全身①
import full02 from './hakone_full_02.webp' // 全身②
import full03 from './hakone_full_03.webp' // 全身③
import mini01 from './hakone_mini_01.webp' // ミニ・歯を見せて笑う
import mini02 from './hakone_mini_02.webp' // ミニ・微笑み
import mini03 from './hakone_mini_03.webp' // ミニ・口を開けて笑う
import mini04 from './hakone_mini_04.webp' // ミニ・ウインク

export const hakoneAR = { plain: ar01 }
export const hakoneFull = { stand1: full01, stand2: full02, stand3: full03 }
export const hakoneMini = { grin: mini01, smile: mini02, laugh: mini03, wink: mini04 }

/* シーン別の推奨ポーズ */
export const hakonePose = {
  home: [mini01, mini02, mini03, mini04],
  intro: [full01, full02, full03],
  ar: [ar01],
}

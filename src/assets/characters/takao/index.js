/* 高尾キャラ画像（元データ: 約2900x4093透過PNG → トリム+縮小WebP化済み） */
import ar01 from './takao_ar_01.webp'     // ARポーズ・薄衣透過
import ar02 from './takao_ar_02.webp'     // ARポーズ
import full01 from './takao_full_01.webp' // 全身・腕組み①
import full02 from './takao_full_02.webp' // 全身・腕組み②
import full03 from './takao_full_03.webp' // 全身・ショール
import mini01 from './takao_mini_01.webp' // ミニ・微笑み
import mini02 from './takao_mini_02.webp' // ミニ・すまし
import mini03 from './takao_mini_03.webp' // ミニ・目閉じ
import mini04 from './takao_mini_04.webp' // ミニ・おどろき

export const takaoAR = { sheer: ar01, plain: ar02 }
export const takaoFull = { armsCrossed1: full01, armsCrossed2: full02, shawl: full03 }
export const takaoMini = { smile: mini01, calm: mini02, eyesClosed: mini03, surprised: mini04 }

/* シーン別の推奨ポーズ */
export const takaoPose = {
  home: [mini01, mini02, mini03],
  intro: [full01, full03],   // 山の初アクセス紹介
  ar: [ar01, ar02],          // AR撮影
  surprised: [mini04],
}

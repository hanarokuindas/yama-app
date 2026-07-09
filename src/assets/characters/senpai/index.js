/* 先輩キャラ画像（元データ: 3000x4000透過PNG → トリム+縮小WebP化済み） */
import full01 from './senpai_full_01.webp' // 全身・指さし
import full02 from './senpai_full_02.webp' // 全身・腕上げ
import mini01 from './senpai_mini_01.webp' // メガホン・目開き
import mini02 from './senpai_mini_02.webp' // メガホン・目閉じ
import mini03 from './senpai_mini_03.webp' // メガネ・腕組みスマイル
import mini04 from './senpai_mini_04.webp' // メガネ・ウインク
import mini05 from './senpai_mini_05.webp' // 腕組み・すまし
import mini06 from './senpai_mini_06.webp' // 腕組み・笑い
import mini07 from './senpai_mini_07.webp' // 腕組み・微笑み
import mini08 from './senpai_mini_08.webp' // ウインク・ガッツ
import mini09 from './senpai_mini_09.webp' // 笑顔・ガッツ
import mini10 from './senpai_mini_10.webp' // おどろき

export const senpaiFull = { pointing: full01, cheering: full02 }

export const senpaiMini = {
  megaphone: mini01,
  megaphoneShout: mini02,
  glassesSmile: mini03,
  glassesWink: mini04,
  armsCrossed: mini05,
  armsCrossedLaugh: mini06,
  armsCrossedSmile: mini07,
  winkCheer: mini08,
  smileCheer: mini09,
  surprised: mini10,
}

/* シーン別の推奨ポーズ */
export const senpaiPose = {
  home: [mini01, mini07, mini09, mini05],       // ホーム挨拶
  training: [mini08, mini09, mini02],            // 応援
  praise: [mini06, mini09, mini08],              // 成功・称賛
  think: [mini03, mini04, mini05],               // 解説・ガイド
  surprised: [mini10],
}

/* トレーニングのパラパラアニメ。キーポーズの間を数コマで補間して再生する。
   角度の決まりは utils/pose.js を参照（0=下, 90=前, 180=上, -90=後ろ）。

   view         : 'side'（右向き）/ 'front'（正面）
   floor        : 'mat'（床運動）/ 'ground'（立ち姿勢）
   scroll       : 地面を流して前に進んでいるように見せる
   count        : 1周で数える回数（0 なら数えない＝キープ系）
   unit         : 回数の単位
   art          : 手描きコマに差し替えたとき、各キーで何枚目の絵を出すか（docs/ASSET_BRIEF.md セクション6）
   keys[].steps : 直前のキーからこのポーズまで何コマで動くか
   keys[].hold  : このポーズで何コマ止まるか
   keys[].cue   : 動きに合わせて出す声かけ
   正面向きの左右は、画面を鏡に見立てて「見ている人にとっての左右」で声をかける */

const BODY_LEN = 48 + 36 + 35 // 胴＋もも＋すね

// 体をまっすぐにして、足首より rise だけ肩が高いときの胴と脚の角度
function plankLine(rise) {
  const a = (Math.asin(rise / BODY_LEN) * 180) / Math.PI
  return { torso: 90 + a, legs: -(90 - a) }
}

const STAND = {
  torso: 180, head: 180,
  arm: [6, 3], armB: [-6, -3],
  leg: [0, 0], legB: [0, 0],
}

/* ── スクワット ── */
const squat = {
  view: 'side', floor: 'ground', count: 1, unit: '回', art: [0, 1, 2, 1],
  keys: [
    { pose: { ...STAND, pin: ['ankleN', 104] }, steps: 4, hold: 3, cue: '上げて！' },
    { pose: { torso: 160, head: 166, arm: [62, 72], armB: [56, 66], leg: [48, -18], legB: [44, -18], pin: ['ankleN', 104] }, steps: 5, cue: 'ゆっくり下げて…' },
    { pose: { torso: 142, head: 150, arm: [92, 94], armB: [88, 90], leg: [84, -26], legB: [80, -26], pin: ['ankleN', 104] }, steps: 5, hold: 4, cue: 'ゆっくり下げて…' },
    { pose: { torso: 160, head: 166, arm: [62, 72], armB: [56, 66], leg: [48, -18], legB: [44, -18], pin: ['ankleN', 104] }, steps: 4, cue: '上げて！' },
  ],
}

/* ── プランク（キープ） ── */
const pk = plankLine(17)
const pkBreath = plankLine(15)
const plank = {
  view: 'side', floor: 'mat', count: 0, art: [0, 1],
  keys: [
    { pose: { torso: pk.torso, head: 96, arm: [0, 90], armB: [-3, 90], leg: [pk.legs, pk.legs], foot: 0, pin: ['elbowN', 140] }, steps: 6, hold: 8, cue: 'お腹に力を入れてキープ！' },
    { pose: { torso: pkBreath.torso, head: 93, arm: [0, 90], armB: [-3, 90], leg: [pkBreath.legs, pkBreath.legs], foot: 0, pin: ['elbowN', 140] }, steps: 6, hold: 8, cue: '息は止めずに、腰を落とさない' },
  ],
}

/* ── 腹筋 ── */
const SIT_LEGS = { leg: [140, 30], legB: [136, 28], foot: 90, footB: 90, pin: ['hip', 104] }
const situp = {
  view: 'side', floor: 'mat', count: 1, unit: '回', art: [0, 1, 2, 1],
  keys: [
    { pose: { ...SIT_LEGS, torso: -92, head: -96, arm: [94, 90], armB: [92, 88] }, steps: 4, hold: 3, cue: 'ゆっくり戻す' },
    { pose: { ...SIT_LEGS, torso: -122, head: -138, arm: [100, 92], armB: [98, 90] }, steps: 4, cue: '上体を起こして' },
    { pose: { ...SIT_LEGS, torso: -150, head: -170, arm: [108, 98], armB: [106, 96] }, steps: 4, hold: 4, cue: 'おへそをのぞきこむ' },
    { pose: { ...SIT_LEGS, torso: -122, head: -138, arm: [100, 92], armB: [98, 90] }, steps: 4, cue: 'ゆっくり戻す' },
  ],
}

/* ── ウォーキング（その場で歩く。地面が流れる） ── */
const WALK = { torso: 175, head: 178 }
const walk = {
  view: 'side', floor: 'ground', scroll: true, count: 2, unit: '歩', art: [0, 1, 2, 3],
  keys: [
    { pose: { ...WALK, leg: [26, 10], legB: [-22, -38], arm: [-28, -14], armB: [26, 52], foot: 112, footB: 20 }, steps: 3, cue: '腕をふって、リズムよく' },
    { pose: { ...WALK, leg: [0, 0], legB: [16, -40], arm: [-2, 6], armB: [2, 14], foot: 90, footB: 40 }, steps: 3, cue: '腕をふって、リズムよく' },
    { pose: { ...WALK, leg: [-22, -38], legB: [26, 10], arm: [26, 52], armB: [-28, -14], foot: 20, footB: 112 }, steps: 3, cue: '腕をふって、リズムよく' },
    { pose: { ...WALK, leg: [16, -40], legB: [0, 0], arm: [2, 14], armB: [-2, 6], foot: 40, footB: 90 }, steps: 3, cue: '腕をふって、リズムよく' },
  ],
}

/* ── ランジ（その場で前後に開いて沈む） ── */
const HANDS_ON_HIP = { arm: [-34, 58], armB: [-40, 52] }
const lunge = {
  view: 'side', floor: 'ground', count: 1, unit: '回', art: [0, 1, 2, 1],
  keys: [
    { pose: { torso: 180, head: 180, ...HANDS_ON_HIP, leg: [24, 0], legB: [-22, -30], footB: 40, pin: ['ankleN', 128] }, steps: 4, hold: 3, cue: '前の足で押し上げる' },
    { pose: { torso: 180, head: 182, ...HANDS_ON_HIP, leg: [48, -2], legB: [-16, -58], footB: 48, pin: ['ankleN', 128] }, steps: 4, cue: '背すじをのばして沈む' },
    { pose: { torso: 180, head: 182, ...HANDS_ON_HIP, leg: [74, -4], legB: [-8, -84], footB: 56, pin: ['ankleN', 128] }, steps: 4, hold: 4, cue: '背すじをのばして沈む' },
    { pose: { torso: 180, head: 182, ...HANDS_ON_HIP, leg: [48, -2], legB: [-16, -58], footB: 48, pin: ['ankleN', 128] }, steps: 4, cue: '前の足で押し上げる' },
  ],
}

/* ── 腕立て ── */
const puUp = plankLine(52 - 10)
const puMid = plankLine(40 - 10)
const puDown = plankLine(28 - 10)
const pushup = {
  view: 'side', floor: 'mat', count: 1, unit: '回', art: [0, 1, 2, 1],
  keys: [
    { pose: { torso: puUp.torso, head: 104, arm: [0, 0], armB: [-2, -2], leg: [puUp.legs, puUp.legs], foot: 0, pin: ['handN', 140] }, steps: 4, hold: 3, cue: '押し上げて！' },
    { pose: { torso: puMid.torso, head: 100, arm: [-44, 22], armB: [-46, 20], leg: [puMid.legs, puMid.legs], foot: 0, pin: ['handN', 140] }, steps: 4, cue: '胸をゆっくり下ろす' },
    { pose: { torso: puDown.torso, head: 96, arm: [-72, 36], armB: [-74, 34], leg: [puDown.legs, puDown.legs], foot: 0, pin: ['handN', 140] }, steps: 4, hold: 3, cue: '胸をゆっくり下ろす' },
    { pose: { torso: puMid.torso, head: 100, arm: [-44, 22], armB: [-46, 20], leg: [puMid.legs, puMid.legs], foot: 0, pin: ['handN', 140] }, steps: 4, cue: '押し上げて！' },
  ],
}

/* ── 首ストレッチ（正面） ── */
const FRONT = { torso: 180, armL: [-8, -4], armR: [8, 4], legL: [-4, 0], legR: [4, 0] }
const stretch_neck = {
  view: 'front', floor: 'ground', count: 0, art: [0, 1, 0, 2],
  keys: [
    { pose: { ...FRONT, head: 180 }, steps: 5, hold: 3, cue: 'ゆっくり正面に戻す' },
    { pose: { ...FRONT, head: 140, armL: [-14, -8] }, steps: 6, hold: 14, cue: '右へゆっくり倒す' },
    { pose: { ...FRONT, head: 180 }, steps: 5, hold: 3, cue: 'ゆっくり正面に戻す' },
    { pose: { ...FRONT, head: 220, armR: [14, 8] }, steps: 6, hold: 14, cue: '左へゆっくり倒す' },
  ],
}

/* ── 腿裏ストレッチ（長座の前屈） ── */
const SEAT = { leg: [90, 90], legB: [92, 92], foot: 180, footB: 180, pin: ['hip', 70] }
const stretch_leg = {
  view: 'side', floor: 'mat', count: 0, art: [0, 1],
  keys: [
    { pose: { ...SEAT, torso: 178, head: 180, arm: [70, 80], armB: [66, 76] }, steps: 6, hold: 6, cue: '背すじをのばして座る' },
    { pose: { ...SEAT, torso: 128, head: 118, arm: [72, 76], armB: [70, 74] }, steps: 8, hold: 18, cue: '息を吐きながら前へ' },
  ],
}

export const MOTIONS = {
  squat, plank, situp, walk, lunge, pushup, stretch_neck, stretch_leg,
}

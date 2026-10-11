/* トレーニングモーション用の2D人体ポーズ計算。
   ポーズは「各部位の向き（角度）」で書き、ここで関節の座標に変換する。

   角度はすべて絶対角度（度）で、0 = 真下、90 = 前（画面右）、180 = 真上、-90 = 後ろ（画面左）。
   横向き（side）の人物は画面右を向いている。正面（front）は画面右が人物の左手側。 */

export const BODY = {
  torso: 48, neck: 5, head: 12.5,
  upper: 27, fore: 25,
  thigh: 36, shin: 35, foot: 10,
  shoulderW: 13, hipW: 6,
}

export const VIEW = 200     // SVG の viewBox の一辺
export const GROUND = 176   // 一番低い関節が来る高さ
export const FRAME_MS = 110 // パラパラ1コマの長さ（約9コマ/秒）

const rad = (d) => (d * Math.PI) / 180
const dir = (d) => [Math.sin(rad(d)), Math.cos(rad(d))]
const add = (p, d, len) => [p[0] + d[0] * len, p[1] + d[1] * len]

function limb(origin, angles, l1, l2) {
  const joint = add(origin, dir(angles[0]), l1)
  return [joint, add(joint, dir(angles[1]), l2)]
}

// ポーズ → 関節座標。pin で指定した関節の x をそろえ、一番低い点を地面に下ろす
export function solvePose(pose, view = 'side') {
  const B = BODY
  const p = {}
  p.hip = [0, 0]
  p.shoulder = add(p.hip, dir(pose.torso), B.torso)
  p.head = add(p.shoulder, dir(pose.head ?? pose.torso), B.neck + B.head)

  if (view === 'front') {
    const side = dir(pose.torso + 90) // 人物の左手側
    p.shoulderL = add(p.shoulder, side, B.shoulderW)
    p.shoulderR = add(p.shoulder, side, -B.shoulderW)
    p.hipL = add(p.hip, side, B.hipW)
    p.hipR = add(p.hip, side, -B.hipW)
    ;[p.elbowL, p.handL] = limb(p.shoulderL, pose.armL, B.upper, B.fore)
    ;[p.elbowR, p.handR] = limb(p.shoulderR, pose.armR, B.upper, B.fore)
    ;[p.kneeL, p.ankleL] = limb(p.hipL, pose.legL, B.thigh, B.shin)
    ;[p.kneeR, p.ankleR] = limb(p.hipR, pose.legR, B.thigh, B.shin)
    p.toeL = add(p.ankleL, dir(-90), 7)
    p.toeR = add(p.ankleR, dir(90), 7)
  } else {
    const legF = pose.legB ?? pose.leg
    ;[p.elbowN, p.handN] = limb(p.shoulder, pose.arm, B.upper, B.fore)
    ;[p.elbowF, p.handF] = limb(p.shoulder, pose.armB ?? pose.arm, B.upper, B.fore)
    ;[p.kneeN, p.ankleN] = limb(p.hip, pose.leg, B.thigh, B.shin)
    ;[p.kneeF, p.ankleF] = limb(p.hip, legF, B.thigh, B.shin)
    p.toeN = add(p.ankleN, dir(pose.foot ?? pose.leg[1] + 90), B.foot)
    p.toeF = add(p.ankleF, dir(pose.footB ?? pose.foot ?? legF[1] + 90), B.foot)
  }

  const [pinName, pinX] = pose.pin ?? ['hip', VIEW / 2]
  const dx = pinX - p[pinName][0]
  const lowest = Math.max(...Object.entries(p).map(([k, v]) => (k === 'head' ? v[1] + B.head : v[1])))
  const dy = GROUND - lowest
  for (const k of Object.keys(p)) p[k] = [p[k][0] + dx, p[k][1] + dy]
  return p
}

// 2つのポーズの間を t (0..1) で補間する（数値と数値の配列だけ）
export function lerpPose(a, b, t) {
  const out = {}
  for (const k of Object.keys(a)) {
    const va = a[k]
    const vb = b[k] ?? va
    if (typeof va === 'number') out[k] = va + (vb - va) * t
    else if (Array.isArray(va) && typeof va[0] === 'number') out[k] = va.map((x, i) => x + (vb[i] - x) * t)
    else out[k] = va
  }
  return out
}

const ease = (t) => 0.5 - Math.cos(Math.PI * t) / 2

/* キーポーズ列 → 1コマずつのタイムライン。
   各キーは「直前のキーからの移り変わり（steps コマ）」→「そのポーズで止まる（hold コマ）」の順に並ぶ。
   key は手描きコマに差し替えたときに見せる絵の番号。 */
export function buildTimeline(motion) {
  const keys = motion.keys
  const frames = []
  keys.forEach((k, i) => {
    const prevIdx = (i - 1 + keys.length) % keys.length
    const steps = k.steps ?? 3
    for (let s = 1; s <= steps; s++) {
      frames.push({
        pose: lerpPose(keys[prevIdx].pose, k.pose, ease(s / steps)),
        cue: k.cue,
        key: s / steps >= 0.5 ? i : prevIdx,
      })
    }
    for (let h = 0; h < (k.hold ?? 0); h++) frames.push({ pose: k.pose, cue: k.cue, key: i })
  })
  // 1つ目のキーに着いたコマから再生する（1周 = 1回）
  return { frames, start: (keys[0].steps ?? 3) - 1 }
}

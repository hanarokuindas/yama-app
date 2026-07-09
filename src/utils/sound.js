/* WebAudio合成による効果音システム（音源ファイル不要） */
let ctx = null
let muted = false

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function setMuted(m) { muted = m }
export function isMuted() { return muted }

function tone({ freq = 440, dur = 0.15, type = 'sine', vol = 0.2, when = 0, slide = 0 }) {
  if (muted) return
  try {
    const c = ac()
    const t0 = c.currentTime + when
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur)
    gain.gain.setValueAtTime(vol, t0)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
    osc.connect(gain).connect(c.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.05)
  } catch { /* AudioContext不可の環境では無音 */ }
}

/* ─── 効果音プリセット ─── */
export const sfx = {
  // ボタンタップ
  tap() { tone({ freq: 880, dur: 0.06, type: 'triangle', vol: 0.12 }) },
  // 決定・確定
  confirm() {
    tone({ freq: 660, dur: 0.08, type: 'triangle', vol: 0.18 })
    tone({ freq: 990, dur: 0.12, type: 'triangle', vol: 0.15, when: 0.07 })
  },
  // キャンセル・閉じる
  cancel() { tone({ freq: 440, dur: 0.1, type: 'triangle', vol: 0.1, slide: -160 }) },
  // コイン・ポイント獲得
  coin() {
    tone({ freq: 1320, dur: 0.07, type: 'square', vol: 0.08 })
    tone({ freq: 1760, dur: 0.18, type: 'square', vol: 0.08, when: 0.06 })
  },
  // アイテムゲット
  item() {
    tone({ freq: 784, dur: 0.09, type: 'triangle', vol: 0.16 })
    tone({ freq: 988, dur: 0.09, type: 'triangle', vol: 0.16, when: 0.08 })
    tone({ freq: 1319, dur: 0.2, type: 'triangle', vol: 0.16, when: 0.16 })
  },
  // ミス・失敗
  miss() {
    tone({ freq: 220, dur: 0.2, type: 'sawtooth', vol: 0.1, slide: -80 })
  },
  // レベルアップ・登頂ファンファーレ
  fanfare() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319]
    notes.forEach((f, i) => tone({ freq: f, dur: i === notes.length - 1 ? 0.5 : 0.14, type: 'triangle', vol: 0.18, when: i * 0.12 }))
    notes.forEach((f, i) => tone({ freq: f / 2, dur: 0.14, type: 'sine', vol: 0.1, when: i * 0.12 }))
  },
  // ゲームクリア
  clear() {
    const notes = [659, 784, 988, 1319]
    notes.forEach((f, i) => tone({ freq: f, dur: 0.16, type: 'triangle', vol: 0.18, when: i * 0.1 }))
  },
  // ジャンプ・アクション
  jump() { tone({ freq: 300, dur: 0.15, type: 'square', vol: 0.08, slide: 400 }) },
  // カウントダウン
  tick() { tone({ freq: 1000, dur: 0.05, type: 'sine', vol: 0.12 }) },
  // スタート合図
  go() { tone({ freq: 1500, dur: 0.3, type: 'sine', vol: 0.16 }) },
}

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import GameIcon from '../components/GameIcon'
import Specimen from '../components/Specimen'
import { BG } from '../assets/backgrounds'
import { UI } from '../assets/ui'
import { FX } from '../assets/fx'
import { sfx } from '../utils/sound'
import { useGameStore } from '../stores/gameStore'
import { exploreSpecies, EXPLORE_AREAS } from '../data/album'
import { buildStage } from './stageConfig'
import { specimenSprite } from '../utils/specimenAssets'

/*
 * 山探索：トリプルマッチ（横画面）
 *
 * 同じ標本を3つそろえると消える。Lv1 は盤面を全部消せばクリア、Lv2 からは上に出る「お題」を全部そろえるとクリア。
 *   おじゃま … 3個ずつあり、そろえれば消せる（アルバムの対象にならない）
 *   ハズレ   … 1〜2個しかなく、取ると写真フレームをふさいだままになる（Lv3から）
 * 上に別の標本が重なっている標本は取れない。右の写真フレーム（7枠）が埋まるか時間切れで失敗。
 * そろえるたびの説明のポップは出さない（修正指示）。そろえた標本は onMatch で親に知らせる。
 */

const TRAY_SIZE = 7
const MATCH = 3
const REF_AREA = 640 * 280 // 基準の盤面の面積。盤面が大きい・小さいときは標本も同じ割合で大きく・小さくして、重なり具合（難しさ）をそろえる
const PIECE_R = 26         // 標本の見た目の半径(px)。scale を掛けて使う
const PIECE_PX = 56        // 標本の絵の大きさ(px)
const COVER = 0.85         // 中心同士がこの割合より近いと「上に重なっている」とみなす
const TARGET_POINT = 300
const FREE_POINT = 100     // お題なし（Lv1）でそろえたとき
const DECOY_POINT = 50
const TIME_BONUS = 15      // クリア時の残り1秒あたり
const BOOSTERS = { shutter: 1, undo: 1, shuffle: 1 }

const AREA_BG = { rock: BG.stage.rocky, trail: BG.stage.trail, meadow: BG.stage.meadow }
const AREA_NAME = Object.fromEntries(EXPLORE_AREAS.map((a) => [a.id, a.name]))

/* 決定的な疑似乱数（同じシードなら同じ配置） */
function makeRng(seed) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}

function shuffle(arr, rng) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 専用スプライトがある種は見た目が固有。無い種はアイコン流用なので、同じアイコンの種は同時に出さない
const lookOf = (sp) => (specimenSprite(sp.id) ? `sprite:${sp.id}` : `icon:${sp.icon}`)

/* お題（またはお題なしの標本）・おじゃま・ハズレを、見た目が重ならないように選ぶ */
function pickSpecies(area, stage, rng) {
  const used = new Set()
  const take = (list, n) => {
    const out = []
    for (const sp of list) {
      if (out.length >= n) break
      const look = lookOf(sp)
      if (used.has(look)) continue
      used.add(look)
      out.push(sp)
    }
    return out
  }
  const inArea = shuffle(exploreSpecies(area), rng)
  const main = take(inArea, stage.targetKinds || stage.freeKinds)
  // おじゃま・ハズレ：同じエリアの残り → ほかのエリアの順に選ぶ
  const others = EXPLORE_AREAS.filter((a) => a.id !== area).flatMap((a) => exploreSpecies(a.id))
  const rest = [...inArea, ...shuffle(others, rng)]
  const decoys = take(rest, stage.decoyKinds)
  const hazure = take(rest, stage.hazure)
  return { main, decoys, hazure }
}

function place(rng) {
  return {
    x: 6 + rng() * 88,          // %
    y: 9 + rng() * 82,          // %
    rot: (rng() - 0.5) * 40,    // deg
    depth: rng(),               // 奥行き（大きいほど上）
    scale: 0.88 + rng() * 0.26,
  }
}

/* 盤面の標本を生成。重なりと傾きで「山積み」を作る */
function buildPieces({ main, decoys, hazure }, stage, rng) {
  const bag = []
  main.forEach((sp) => { for (let i = 0; i < stage.targetSets * MATCH; i++) bag.push({ sp, role: 'main' }) })
  decoys.forEach((sp) => { for (let i = 0; i < MATCH; i++) bag.push({ sp, role: 'decoy' }) })
  hazure.forEach((sp) => { const n = rng() < 0.5 ? 1 : 2; for (let i = 0; i < n; i++) bag.push({ sp, role: 'hazure' }) })
  return shuffle(bag, rng).map((b, i) => ({ uid: i, ...b, ...place(rng) }))
}

/* 上に別の標本が重なっていて取れない標本の uid */
function coveredSet(pieces, fieldW, fieldH, k) {
  const covered = new Set()
  for (const a of pieces) {
    for (const b of pieces) {
      if (b.depth <= a.depth) continue
      const dx = ((a.x - b.x) / 100) * fieldW
      const dy = ((a.y - b.y) / 100) * fieldH
      const lim = COVER * PIECE_R * k * (a.scale + b.scale)
      if (dx * dx + dy * dy < lim * lim) { covered.add(a.uid); break }
    }
  }
  return covered
}

const mmss = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

export default function TripleMatchGame({ area, level, onEnd, onMatch, onQuit }) {
  const stage = useMemo(() => buildStage(level), [level])
  const freeMode = stage.targetKinds === 0 // お題なし（Lv1）
  const [setup] = useState(() => {
    const rng = makeRng(Math.floor(Math.random() * 1e9))
    const picked = pickSpecies(area, stage, rng)
    return { main: picked.main, pieces: buildPieces(picked, stage, rng) }
  })
  const mainIds = useMemo(() => new Set(setup.main.map((sp) => sp.id)), [setup])

  const settings = useGameStore((s) => s.settings)
  const setSettings = useGameStore((s) => s.setSettings)

  const [pieces, setPieces] = useState(setup.pieces)
  const [tray, setTray] = useState([])
  const [timeLeft, setTimeLeft] = useState(stage.time)
  const [score, setScore] = useState(0)
  const [cleared, setCleared] = useState({})   // お題ごとにそろえたセット数
  const [matched, setMatched] = useState([])   // アルバムの対象としてそろえた標本
  const [flyers, setFlyers] = useState([])     // 取ったときの土ぼこり
  const [left, setLeft] = useState(BOOSTERS)
  const [paused, setPaused] = useState(false)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const [result, setResult] = useState(null)   // { ok, reason, score, matched }
  const endedRef = useRef(false)
  const stopRef = useRef(false)
  const cbRef = useRef({ onEnd, onMatch })
  const fieldRef = useRef(null)
  const [field, setField] = useState({ w: 640, h: 280 })

  useEffect(() => { cbRef.current = { onEnd, onMatch } })
  useEffect(() => { stopRef.current = paused || confirmQuit }, [paused, confirmQuit])

  // 盤面の大きさ（重なり判定に使う）
  useEffect(() => {
    const el = fieldRef.current
    if (!el) return
    const update = () => setField({ w: el.clientWidth || 640, h: el.clientHeight || 280 })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const k = Math.max(0.75, Math.min(1.7, Math.sqrt((field.w * field.h) / REF_AREA)))
  const covered = useMemo(() => coveredSet(pieces, field.w, field.h, k), [pieces, field, k])
  // 重なり順（depth の小さい順に 1, 2, …）
  const layer = useMemo(() => {
    const order = [...pieces].sort((a, b) => a.depth - b.depth)
    return new Map(order.map((p, i) => [p.uid, i + 1]))
  }, [pieces])

  const targetsLeft = freeMode
    ? pieces.length + tray.length
    : setup.main.reduce((n, sp) => n + stage.targetSets - (cleared[sp.id] || 0), 0)

  /* ── 終了（1回だけ） ── */
  const end = useCallback((ok, reason, finalScore, finalMatched) => {
    if (endedRef.current) return
    endedRef.current = true
    setResult({ ok, reason, score: finalScore, matched: finalMatched })
  }, [])

  useEffect(() => {
    if (!result) return
    if (result.ok) sfx.fanfare(); else sfx.miss()
    const t = setTimeout(() => cbRef.current.onEnd(result), result.ok ? 1300 : 1000)
    return () => clearTimeout(t)
  }, [result])

  /* ── タイマー（一時停止中は止める） ── */
  useEffect(() => {
    const id = setInterval(() => {
      if (endedRef.current || stopRef.current) return
      setTimeLeft((t) => {
        if (t <= 1) return 0
        if (t <= 11) sfx.tick()
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (timeLeft === 0) end(false, 'time', score, matched)
  }, [timeLeft, score, matched, end])

  /* そろった（アルバムの対象ならポイントと記録） */
  const scoreMatch = useCallback((sp) => {
    if (mainIds.has(sp.id)) {
      setScore((s) => s + (freeMode ? FREE_POINT : TARGET_POINT))
      setCleared((c) => ({ ...c, [sp.id]: (c[sp.id] || 0) + 1 }))
      setMatched((m) => (m.some((x) => x.id === sp.id) ? m : [...m, sp]))
      cbRef.current.onMatch?.(sp)
      sfx.item()
    } else {
      setScore((s) => s + DECOY_POINT)
      sfx.coin()
    }
  }, [mainIds, freeMode])

  /* ── トレイ判定（3つそろう / 埋まる） ── */
  useEffect(() => {
    if (tray.length === 0 || endedRef.current) return
    const counts = {}
    tray.forEach((t) => { counts[t.sp.id] = (counts[t.sp.id] || 0) + 1 })
    const hit = Object.keys(counts).find((id) => counts[id] >= MATCH)

    if (hit) {
      const sp = tray.find((t) => t.sp.id === hit).sp
      const timer = setTimeout(() => {
        setTray((prev) => {
          let removed = 0
          return prev.filter((t) => !(t.sp.id === hit && removed++ < MATCH))
        })
        scoreMatch(sp)
      }, 220)
      return () => clearTimeout(timer)
    }

    if (tray.length >= TRAY_SIZE) {
      const timer = setTimeout(() => end(false, 'tray', score, matched), 500)
      return () => clearTimeout(timer)
    }
  }, [tray, scoreMatch, end, score, matched])

  /* ── クリア判定（残り時間ボーナスは1回だけ） ── */
  useEffect(() => {
    if (targetsLeft > 0 || endedRef.current) return
    const bonus = timeLeft * TIME_BONUS
    setScore((s) => s + bonus)
    end(true, 'clear', score + bonus, matched)
  }, [targetsLeft, timeLeft, score, matched, end])

  const busy = () => endedRef.current || paused || confirmQuit

  /* ── 標本をタップ ── */
  const pick = (piece) => {
    if (busy() || tray.length >= TRAY_SIZE) return
    if (covered.has(piece.uid)) { sfx.miss(); return }
    sfx.tap()
    setPieces((prev) => prev.filter((p) => p.uid !== piece.uid))
    setTray((prev) => [...prev, piece])
    const id = piece.uid
    setFlyers((f) => [...f, { id, x: piece.x, y: piece.y }])
    setTimeout(() => setFlyers((f) => f.filter((x) => x.id !== id)), 700)
  }

  /* ── ブースター ── */
  const consume = (key) => setLeft((l) => ({ ...l, [key]: l[key] - 1 }))
  // シャッターチャンス：1種類を盤面とトレイから全部消す。トレイにいちばん多い種、なければ残っているお題
  const doShutter = () => {
    if (left.shutter <= 0 || busy()) return
    const counts = {}
    tray.forEach((t) => { counts[t.sp.id] = (counts[t.sp.id] || 0) + 1 })
    let id = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]
    if (!id) {
      const remain = setup.main.filter((sp) => pieces.some((p) => p.sp.id === sp.id))
      id = remain[0]?.id || pieces[0]?.sp.id
    }
    if (!id) return
    const sp = [...tray, ...pieces].find((p) => p.sp.id === id).sp
    sfx.fanfare()
    consume('shutter')
    setPieces((prev) => prev.filter((p) => p.sp.id !== id))
    setTray((prev) => prev.filter((t) => t.sp.id !== id))
    const role = [...tray, ...pieces].find((p) => p.sp.id === id).role
    if (role !== 'hazure') scoreMatch(sp)
  }
  const doShuffle = () => {
    if (left.shuffle <= 0 || busy()) return
    sfx.confirm()
    consume('shuffle')
    const rng = makeRng(Date.now())
    setPieces((prev) => prev.map((p) => ({ ...p, ...place(rng), scale: p.scale })))
  }
  const doUndo = () => {
    if (left.undo <= 0 || tray.length === 0 || busy()) return
    sfx.cancel()
    consume('undo')
    const last = tray[tray.length - 1]
    setTray((prev) => prev.slice(0, -1))
    setPieces((prev) => [...prev, last])
  }

  const endText = result && (result.ok ? '探索成功！' : result.reason === 'tray' ? 'フレームがいっぱい…' : '時間切れ…')

  return (
    <div style={st.root}>
      <div style={{ ...st.bg, backgroundImage: `linear-gradient(rgba(239,228,207,0.38), rgba(239,228,207,0.38)), url(${AREA_BG[area]})` }} />

      {/* 上：探索Lv・ポイント・お題・残り時間 */}
      <div style={st.hud}>
        <div style={st.hudChip}>{AREA_NAME[area]}<span style={st.hudSub}>探索Lv.{level}</span></div>
        <div style={st.hudChip}>
          <GameIcon name="pcoin" size={20} />
          <span style={st.hudScore}>+{score.toLocaleString()}</span>
        </div>
        <div style={st.targets}>
          {freeMode ? (
            <span style={st.freeRule}>同じものを3つそろえて、ぜんぶ消そう！ のこり {pieces.length + tray.length}</span>
          ) : (
            <>
              <span style={st.targetLabel}>お題</span>
              {setup.main.map((sp) => {
                const done = (cleared[sp.id] || 0) >= stage.targetSets
                const got = (cleared[sp.id] || 0) * MATCH + tray.filter((t) => t.sp.id === sp.id).length
                return (
                  <div key={sp.id} style={{ ...st.targetChip, opacity: done ? 0.5 : 1 }} title={sp.name}>
                    <Specimen sp={sp} size={30} />
                    <span style={{ ...st.targetCount, color: done ? '#1a8a47' : 'var(--brown-text)' }}>
                      {done ? '✓' : stage.targetSets * MATCH - got}
                    </span>
                  </div>
                )
              })}
            </>
          )}
        </div>
        <div style={{ ...st.hudChip, ...st.timer, color: timeLeft <= 11 ? '#d0402b' : 'var(--brown-text)' }}>
          残り時間 <span style={st.timerNum}>{mmss(timeLeft)}</span>
        </div>
      </div>

      {/* 盤面（標本の山） */}
      <div style={st.field} ref={fieldRef}>
        {pieces.map((p) => {
          const blocked = covered.has(p.uid)
          return (
            <button
              key={p.uid}
              onClick={() => pick(p)}
              style={{
                ...st.piece,
                left: `${p.x}%`, top: `${p.y}%`,
                zIndex: layer.get(p.uid),
                transform: `translate(-50%,-50%) rotate(${p.rot}deg) scale(${p.scale * k})`,
                filter: blocked ? 'brightness(0.6) saturate(0.75)' : `saturate(1.15) brightness(${1 + p.depth * 0.06})`,
                cursor: blocked ? 'default' : 'pointer',
              }}
              aria-label={blocked ? `${p.sp.name}（下にあって取れない）` : p.sp.name}
            >
              <span style={st.pieceInner}><Specimen sp={p.sp} size={PIECE_PX} /></span>
            </button>
          )
        })}
        {flyers.map((f) => (
          FX.dust && <img key={f.id} src={FX.dust} alt="" style={{ ...st.dust, left: `${f.x}%`, top: `${f.y}%` }} />
        ))}
        {endText && <div style={st.endMsg}>{endText}</div>}
      </div>

      {/* 右：写真フレーム（7枠） */}
      <div style={st.tray}>
        {Array.from({ length: TRAY_SIZE }).map((_, i) => {
          const t = tray[i]
          const danger = tray.length >= TRAY_SIZE - 1 && !t
          return (
            <div key={i} style={{ ...st.slot, ...(danger ? st.slotDanger : null) }}>
              <span style={st.slotPaper} />
              {t && <span style={st.slotPic}><Specimen sp={t.sp} size={48} style={{ width: '100%', height: '100%' }} /></span>}
            </div>
          )
        })}
      </div>

      {/* 下：音・一時停止・やめる／ブースター */}
      <div style={st.bottom}>
        <div style={st.sysBtns}>
          <RoundBtn label={settings.sfxOn ? '音オン' : '音オフ'} onClick={() => setSettings({ sfxOn: !settings.sfxOn })}>
            <GameIcon name="speaker" size={26} style={{ opacity: settings.sfxOn ? 1 : 0.35 }} />
          </RoundBtn>
          <RoundBtn label="一時停止" onClick={() => { if (!endedRef.current) { sfx.tap(); setPaused(true) } }}>
            <span style={st.glyph}>❚❚</span>
          </RoundBtn>
          <RoundBtn label="やめる" onClick={() => { if (!endedRef.current) { sfx.tap(); setConfirmQuit(true) } }}>
            <span style={st.glyph}>×</span>
          </RoundBtn>
        </div>
        <div style={st.boosters}>
          <Booster label="シャッターチャンス" icon="camera" n={left.shutter} onClick={doShutter} />
          <Booster label="1つもどす" icon="box" n={left.undo} onClick={doUndo} disabled={!tray.length} />
          <Booster label="シャッフル" icon="sparkle" n={left.shuffle} onClick={doShuffle} />
        </div>
      </div>

      {(paused || confirmQuit) && (
        <div style={st.overlay}>
          <div style={st.pauseCard}>
            <div style={st.pauseTitle}>{confirmQuit ? '探索をやめる？' : '一時停止中'}</div>
            {confirmQuit && <p style={st.pauseText}>ここまでのポイントはもらえないよ</p>}
            <div style={st.pauseRow}>
              <button style={st.pauseSub} onClick={() => { sfx.confirm(); setPaused(false); setConfirmQuit(false) }}>つづける</button>
              <button style={st.pauseMain} onClick={() => { sfx.cancel(); endedRef.current = true; onQuit() }}>やめる</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RoundBtn({ label, onClick, children }) {
  return (
    <button style={st.roundBtn} onClick={onClick} aria-label={label} title={label}>{children}</button>
  )
}

function Booster({ label, icon, n, onClick, disabled = false }) {
  const off = n <= 0 || disabled
  return (
    <button style={{ ...st.booster, opacity: off ? 0.45 : 1 }} onClick={onClick} disabled={off}>
      <GameIcon name={icon} size={24} />
      <span style={st.boosterLabel}>{label}</span>
      <span style={st.boosterBadge}>{n}</span>
    </button>
  )
}

const FRAME_W = 'calc((100cqh - 3cqh - 6 * 0.8cqh) / 7 * 0.867)' // 写真フレームの幅（7枠が縦に収まる大きさ）

const st = {
  root: {
    position: 'relative', width: '100%', height: '100cqh',
    overflow: 'hidden', userSelect: 'none',
  },
  bg: { position: 'absolute', inset: 0, backgroundSize: 'cover', backgroundPosition: 'center' },

  hud: {
    position: 'absolute', top: '1.5cqh', left: '1.5cqw', right: `calc(${FRAME_W} + 2.5cqw)`, zIndex: 5,
    display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1cqw, 10px)',
    height: '9cqh',
  },
  hudChip: {
    display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
    background: 'rgba(250,244,232,0.92)', border: '2px solid var(--beige-edge)',
    borderRadius: 99, padding: '2px 12px', height: '100%',
    color: 'var(--brown-text)', fontSize: 'clamp(12px, 3.8cqh, 20px)', fontWeight: 800,
    boxShadow: '0 2px 6px rgba(60,40,20,0.15)',
  },
  hudSub: { fontSize: 'clamp(10px, 3cqh, 16px)', color: '#8b7a66' },
  hudScore: {
    color: 'var(--yamabuki)', textShadow: '0 0 2px #5a3a10, 0 0 2px #5a3a10',
    fontSize: 'clamp(13px, 4cqh, 22px)', minWidth: 30,
  },
  targets: {
    flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    overflow: 'hidden',
  },
  targetLabel: { color: 'var(--brown-text)', fontSize: 'clamp(11px, 3.4cqh, 18px)', fontWeight: 800, textShadow: '0 0 4px #fff, 0 0 4px #fff' },
  targetChip: {
    display: 'flex', alignItems: 'center', gap: 2,
    background: 'rgba(255,253,247,0.95)', border: '2px solid var(--beige-edge)', borderRadius: 12,
    padding: '0 6px 0 2px', height: '100%',
  },
  targetCount: { fontSize: 'clamp(12px, 3.6cqh, 19px)', fontWeight: 800, minWidth: 12, textAlign: 'center' },
  freeRule: {
    background: 'rgba(250,244,232,0.9)', border: '2px solid var(--beige-edge)', borderRadius: 99,
    padding: '3px 14px', color: 'var(--brown-text)', fontSize: 'clamp(11px, 3.4cqh, 18px)', fontWeight: 800,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  timer: { gap: 6 },
  timerNum: { fontSize: 'clamp(14px, 4.4cqh, 24px)', fontVariantNumeric: 'tabular-nums' },

  // zIndex で重なり順をこの中に閉じる
  field: {
    position: 'absolute', zIndex: 0,
    top: '12cqh', bottom: '15cqh', left: '1.5cqw', right: `calc(${FRAME_W} + 3cqw)`,
  },
  piece: {
    position: 'absolute', background: 'none', border: 'none',
    padding: 0, cursor: 'pointer', lineHeight: 0,
    transition: 'transform 0.35s cubic-bezier(.22,1,.36,1), filter 0.3s',
    WebkitTapHighlightColor: 'transparent',
  },
  pieceInner: {
    display: 'block',
    filter: 'drop-shadow(0 0 1.5px #fff) drop-shadow(0 3px 4px rgba(40,25,10,0.45))',
  },
  dust: {
    position: 'absolute', transform: 'translate(-50%,-50%)',
    width: 74, height: 74, pointerEvents: 'none', zIndex: 1000,
    animation: 'dustPuff 0.65s ease-out forwards',
  },
  endMsg: {
    position: 'absolute', inset: 0, zIndex: 1001, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 'clamp(24px, 9cqh, 52px)', fontWeight: 800,
    textShadow: '0 0 4px var(--beige-dark), 0 0 4px var(--beige-dark), 0 0 20px rgba(248,181,0,0.9)',
    animation: 'popIn 0.5s ease',
  },

  tray: {
    position: 'absolute', zIndex: 5, top: '1.5cqh', bottom: '1.5cqh', right: '1cqw', width: FRAME_W,
    display: 'flex', flexDirection: 'column', gap: '0.8cqh',
  },
  slot: {
    flex: 1, position: 'relative',
    background: `url(${UI.photoFrame}) center / 100% 100% no-repeat`,
    filter: 'drop-shadow(0 2px 3px rgba(40,25,10,0.3))',
  },
  slotDanger: { filter: 'drop-shadow(0 0 4px rgba(208,64,43,0.95))' },
  // 写真の面（明るい紙）。標本が見やすいように
  slotPaper: {
    position: 'absolute', left: '12%', right: '12%', top: '8%', bottom: '22%',
    background: 'linear-gradient(160deg, #fffdf6, #efe6d2)', borderRadius: 2,
  },
  slotPic: {
    position: 'absolute', left: '14%', right: '14%', top: '9%', bottom: '24%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'popIn 0.25s ease',
  },

  bottom: {
    position: 'absolute', zIndex: 5, left: '1.5cqw', right: `calc(${FRAME_W} + 2.5cqw)`, bottom: '1.5cqh',
    height: '12cqh', display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2cqw, 20px)',
  },
  sysBtns: { display: 'flex', gap: 'clamp(4px, 1cqw, 10px)', height: '100%' },
  roundBtn: {
    height: '100%', aspectRatio: '1 / 1', borderRadius: '50%',
    background: 'rgba(250,244,232,0.92)', border: '2px solid var(--beige-edge)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(60,40,20,0.2)',
  },
  glyph: { color: 'var(--brown-text)', fontSize: 'clamp(14px, 4.4cqh, 24px)', fontWeight: 800, lineHeight: 1 },
  boosters: { flex: 1, display: 'flex', justifyContent: 'center', gap: 'clamp(6px, 1.6cqw, 16px)', height: '100%' },
  booster: {
    position: 'relative', height: '100%',
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(250,244,232,0.94)', border: '2px solid var(--beige-edge)',
    borderRadius: 99, padding: '0 clamp(10px, 2cqw, 22px)', cursor: 'pointer',
    boxShadow: '0 3px 0 #cdb68e, 0 4px 8px rgba(60,40,20,0.2)',
  },
  boosterLabel: { color: 'var(--brown-text)', fontSize: 'clamp(11px, 3.4cqh, 18px)', fontWeight: 800, whiteSpace: 'nowrap' },
  boosterBadge: {
    position: 'absolute', top: -7, right: -4,
    minWidth: 20, height: 20, borderRadius: 99, padding: '0 5px',
    background: '#d0402b', color: '#fff', fontSize: 12, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 0 2px #fff',
  },

  overlay: {
    position: 'absolute', inset: 0, zIndex: 2000,
    background: 'rgba(40,28,14,0.45)', backdropFilter: 'blur(2px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  pauseCard: {
    background: 'var(--beige)', border: '3px solid var(--beige-edge)', borderRadius: 20,
    padding: '18px 28px', textAlign: 'center', minWidth: 280,
    boxShadow: '0 10px 30px rgba(40,25,10,0.4)', animation: 'popIn 0.25s ease',
  },
  pauseTitle: { color: 'var(--brown-text)', fontSize: 20, fontWeight: 800 },
  pauseText: { color: '#8b7a66', fontSize: 13.5, margin: '6px 0 0' },
  pauseRow: { display: 'flex', gap: 10, marginTop: 14 },
  pauseSub: {
    flex: 1, background: 'linear-gradient(135deg, #2ecc71, #1a8a47)', border: 'none', borderRadius: 99,
    padding: '9px 18px', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
  },
  pauseMain: {
    flex: 1, background: '#fff', border: '2px solid var(--beige-edge)', borderRadius: 99,
    padding: '9px 18px', color: 'var(--brown-text)', fontSize: 15, fontWeight: 800, cursor: 'pointer',
  },
}

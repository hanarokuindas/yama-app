import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import GameIcon from '../components/GameIcon'
import Specimen from '../components/Specimen'
import { BG } from '../assets/backgrounds'
import { sfx } from '../utils/sound'
import encyclopedia from '../data/encyclopedia.json'
import { buildStage } from './stageConfig'
import { specimenSprite } from '../utils/specimenAssets'
import { FX } from '../assets/fx'

/*
 * 山探索：トリプルマッチ（Match 3D 系）
 *
 * 上に出る「ターゲット」の標本を3つずつそろえるとクリア。そろえたターゲットは図鑑に登録される。
 * 盤面にはターゲット以外の標本も混ざる。
 *   おじゃま … 3個ずつあり、そろえれば消せる（図鑑には登録されない）
 *   ハズレ   … 1〜2個しかなく、取るとトレイの枠をふさいだままになる（Lv3から）
 * 上に別の標本が重なっている標本は取れない。トレイ(7枠)が埋まるか時間切れで失敗。
 */

const TRAY_SIZE = 7
const MATCH = 3
const FIELD_H = 400
const PIECE_R = 21      // 標本の見た目の半径(px)。scale を掛けて使う
const COVER = 0.85      // 中心同士がこの割合より近いと「上に重なっている」とみなす
const TARGET_POINT = 300
const DECOY_POINT = 50
const TIME_BONUS = 15   // クリア時の残り1秒あたり

const AREAS = {
  rock: { name: '岩場', bg: BG.stage.rocky, tint: 'rgba(40,30,70,0.35)' },
  trail: { name: '登山道', bg: BG.stage.trail, tint: 'rgba(20,50,25,0.30)' },
  meadow: { name: '草原', bg: BG.stage.meadow, tint: 'rgba(30,60,30,0.22)' },
  bounty: { name: '山の恵み', bg: BG.stage.trail, tint: 'rgba(60,40,15,0.30)' },
}

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

/* ターゲット・おじゃま・ハズレを、見た目が重ならないように選ぶ */
function pickSpecies(area, mountainId, stage, rng) {
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
  const inArea = encyclopedia.filter((e) => e.area === area)
  // ターゲット：山を選んでいるときは、その山の固有種を優先する
  const unique = mountainId ? shuffle(inArea.filter((e) => e.mountain === mountainId), rng) : []
  const common = shuffle(inArea.filter((e) => !e.mountain), rng)
  const targets = take([...unique, ...common], stage.targetKinds)
  // おじゃま・ハズレ：同じエリアの残り → ほかのエリアの順に選ぶ
  const rest = [...common, ...shuffle(encyclopedia.filter((e) => e.area !== area && !e.mountain), rng)]
  const decoys = take(rest, stage.decoyKinds)
  const hazure = take(rest, stage.hazure)
  return { targets, decoys, hazure }
}

function place(rng) {
  return {
    x: 8 + rng() * 84,          // %
    y: 9 + rng() * 80,          // %
    rot: (rng() - 0.5) * 44,    // deg
    depth: rng(),               // 奥行き（大きいほど上）
    scale: 0.86 + rng() * 0.3,
  }
}

/* 盤面の標本を生成。重なりと傾きで「山積み」を作る */
function buildPieces({ targets, decoys, hazure }, stage, rng) {
  const bag = []
  targets.forEach((sp) => { for (let i = 0; i < stage.targetSets * MATCH; i++) bag.push({ sp, role: 'target' }) })
  decoys.forEach((sp) => { for (let i = 0; i < MATCH; i++) bag.push({ sp, role: 'decoy' }) })
  hazure.forEach((sp) => { const n = rng() < 0.5 ? 1 : 2; for (let i = 0; i < n; i++) bag.push({ sp, role: 'hazure' }) })
  return shuffle(bag, rng).map((b, i) => ({ uid: i, ...b, ...place(rng) }))
}

/* 上に別の標本が重なっていて取れない標本の uid */
function coveredSet(pieces, fieldW) {
  const covered = new Set()
  for (const a of pieces) {
    for (const b of pieces) {
      if (b.depth <= a.depth) continue
      const dx = ((a.x - b.x) / 100) * fieldW
      const dy = ((a.y - b.y) / 100) * FIELD_H
      const lim = COVER * PIECE_R * (a.scale + b.scale)
      if (dx * dx + dy * dy < lim * lim) { covered.add(a.uid); break }
    }
  }
  return covered
}

export default function TripleMatchGame({ area, mountainId, level, onClear, onGameOver, onDiscover }) {
  const stage = useMemo(() => buildStage(level), [level])
  const [setup] = useState(() => {
    const rng = makeRng(Math.floor(Math.random() * 1e9))
    const picked = pickSpecies(area, mountainId, stage, rng)
    return { targets: picked.targets, pieces: buildPieces(picked, stage, rng) }
  })
  const targetIds = useMemo(() => new Set(setup.targets.map((sp) => sp.id)), [setup])

  const [pieces, setPieces] = useState(setup.pieces)
  const [tray, setTray] = useState([])
  const [timeLeft, setTimeLeft] = useState(stage.time)
  const [score, setScore] = useState(0)
  const [cleared, setCleared] = useState({})   // ターゲットごとにそろえたセット数
  const [found, setFound] = useState([])       // 図鑑登録されたターゲット
  const [popup, setPopup] = useState(null)     // 図鑑登録の演出
  const [flyers, setFlyers] = useState([])     // 取ったときの土ぼこり・加点表示
  const [shuffleLeft, setShuffleLeft] = useState(1)
  const [undoLeft, setUndoLeft] = useState(1)
  const [result, setResult] = useState(null)   // { ok, reason, score, found }
  const endedRef = useRef(false)
  const popupRef = useRef(null)
  const cbRef = useRef({ onClear, onGameOver })
  const fieldRef = useRef(null)
  const [fieldW, setFieldW] = useState(400)

  useEffect(() => { cbRef.current = { onClear, onGameOver } })
  useEffect(() => { popupRef.current = popup }, [popup])

  // 盤面の幅（重なり判定に使う）
  useEffect(() => {
    const el = fieldRef.current
    if (!el) return
    const update = () => setFieldW(el.clientWidth || 400)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const covered = useMemo(() => coveredSet(pieces, fieldW), [pieces, fieldW])
  // 重なり順（depth の小さい順に 1, 2, …）
  const layer = useMemo(() => {
    const order = [...pieces].sort((a, b) => a.depth - b.depth)
    return new Map(order.map((p, i) => [p.uid, i + 1]))
  }, [pieces])

  const targetsLeft = setup.targets.reduce((n, sp) => n + stage.targetSets - (cleared[sp.id] || 0), 0)

  /* ── 終了（1回だけ） ── */
  const end = useCallback((ok, reason, finalScore, finalFound) => {
    if (endedRef.current) return
    endedRef.current = true
    setResult({ ok, reason, score: finalScore, found: finalFound })
  }, [])

  useEffect(() => {
    if (!result) return
    if (result.ok) sfx.fanfare(); else sfx.miss()
    const t = setTimeout(() => {
      const cb = result.ok ? cbRef.current.onClear : cbRef.current.onGameOver
      cb({ score: result.score, found: result.found, reason: result.reason })
    }, result.ok ? 1200 : 900)
    return () => clearTimeout(t)
  }, [result])

  /* ── タイマー（図鑑登録の演出中は止める） ── */
  useEffect(() => {
    const id = setInterval(() => {
      if (endedRef.current || popupRef.current) return
      setTimeLeft((t) => {
        if (t <= 1) return 0
        if (t <= 11) sfx.tick()
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (timeLeft === 0) end(false, 'time', score, found)
  }, [timeLeft, score, found, end])

  /* ── トレイ判定（3つそろう / 埋まる） ── */
  useEffect(() => {
    if (tray.length === 0 || endedRef.current) return
    const counts = {}
    tray.forEach((t) => { counts[t.sp.id] = (counts[t.sp.id] || 0) + 1 })
    const hit = Object.keys(counts).find((k) => counts[k] >= MATCH)

    if (hit) {
      const sp = tray.find((t) => t.sp.id === hit).sp
      const isTarget = targetIds.has(hit)
      const timer = setTimeout(() => {
        setTray((prev) => {
          let removed = 0
          return prev.filter((t) => !(t.sp.id === hit && removed++ < MATCH))
        })
        if (isTarget) {
          setScore((s) => s + TARGET_POINT)
          setCleared((c) => ({ ...c, [hit]: (c[hit] || 0) + 1 }))
          setFound((f) => (f.some((x) => x.id === sp.id) ? f : [...f, sp]))
          onDiscover?.(sp)          // そろった時点で図鑑に保存（失敗しても記録は残る）
          setPopup(sp)
          sfx.item()
        } else {
          setScore((s) => s + DECOY_POINT)
          sfx.coin()
        }
      }, 220)
      return () => clearTimeout(timer)
    }

    if (tray.length >= TRAY_SIZE) {
      const timer = setTimeout(() => end(false, 'tray', score, found), 500)
      return () => clearTimeout(timer)
    }
  }, [tray, targetIds, onDiscover, end, score, found])

  /* ── ターゲットを全部そろえたらクリア（残り時間ボーナスは1回だけ） ── */
  useEffect(() => {
    if (targetsLeft > 0 || endedRef.current) return
    const bonus = timeLeft * TIME_BONUS
    setScore((s) => s + bonus)
    setPopup(null)
    end(true, 'clear', score + bonus, found)
  }, [targetsLeft, timeLeft, score, found, end])

  /* ── 標本をタップ ── */
  const pick = (piece) => {
    if (endedRef.current || tray.length >= TRAY_SIZE) return
    if (covered.has(piece.uid)) { sfx.miss(); return }
    sfx.tap()
    setPieces((prev) => prev.filter((p) => p.uid !== piece.uid))
    setTray((prev) => [...prev, piece])
    const id = piece.uid
    setFlyers((f) => [...f, { id, x: piece.x, y: piece.y }])
    setTimeout(() => setFlyers((f) => f.filter((x) => x.id !== id)), 700)
  }

  /* ── ブースター ── */
  const doShuffle = () => {
    if (shuffleLeft <= 0 || endedRef.current) return
    sfx.confirm()
    setShuffleLeft((n) => n - 1)
    const rng = makeRng(Date.now())
    setPieces((prev) => prev.map((p) => ({ ...p, ...place(rng), scale: p.scale })))
  }
  const doUndo = () => {
    if (undoLeft <= 0 || tray.length === 0 || endedRef.current) return
    sfx.cancel()
    setUndoLeft((n) => n - 1)
    const last = tray[tray.length - 1]
    setTray((prev) => prev.slice(0, -1))
    setPieces((prev) => [...prev, last])
  }

  const timePct = (timeLeft / stage.time) * 100
  const areaConf = AREAS[area]
  const endText = result && (result.ok ? 'ターゲット達成！' : result.reason === 'tray' ? 'トレイがいっぱい…' : '時間切れ…')

  return (
    <div style={st.root}>
      {/* 背景 */}
      <div style={{ ...st.bg, backgroundImage: `linear-gradient(${areaConf.tint}, ${areaConf.tint}), url(${areaConf.bg})` }} />

      {/* ヘッダー */}
      <div style={st.hud}>
        <div style={st.hudChip}>
          <span style={st.hudLabel}>{areaConf.name}</span>
          <span style={st.hudSub}>Lv.{level}</span>
        </div>
        <div style={st.hudChip}>
          <GameIcon name="star" size={15} />
          <span style={st.hudScore}>{score.toLocaleString()}</span>
        </div>
        <div style={st.hudChip}>
          <GameIcon name="timer" size={15} />
          <span style={{ ...st.hudScore, color: timeLeft <= 11 ? '#ff6b6b' : '#fff' }}>{timeLeft}</span>
        </div>
      </div>
      <div style={st.timeBarBg}>
        <div style={{ ...st.timeBarFill, width: `${timePct}%`, background: timeLeft <= 11 ? '#e74c3c' : 'linear-gradient(90deg,#2ecc71,#7ee8a5)' }} />
      </div>

      {/* ターゲット */}
      <div style={st.targetBar}>
        <span style={st.targetLabel}>ターゲット</span>
        {setup.targets.map((sp) => {
          const done = (cleared[sp.id] || 0) >= stage.targetSets
          const got = (cleared[sp.id] || 0) * MATCH + tray.filter((t) => t.sp.id === sp.id).length
          const left = stage.targetSets * MATCH - got
          return (
            <div key={sp.id} style={{ ...st.targetChip, opacity: done ? 0.55 : 1 }} title={sp.name}>
              <Specimen sp={sp} size={28} />
              <span style={{ ...st.targetCount, color: done ? '#1a8a47' : '#1a1a2e' }}>{done ? '✓' : left}</span>
            </div>
          )
        })}
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
                transform: `translate(-50%,-50%) rotate(${p.rot}deg) scale(${p.scale})`,
                filter: blocked ? 'brightness(0.5) saturate(0.6)' : `brightness(${0.95 + p.depth * 0.12})`,
                cursor: blocked ? 'default' : 'pointer',
              }}
              aria-label={blocked ? `${p.sp.name}（下にあって取れない）` : p.sp.name}
            >
              <span style={st.pieceInner}>
                <Specimen sp={p.sp} size={46} />
              </span>
            </button>
          )
        })}

        {flyers.map((f) => (
          FX.dust && <img key={f.id} src={FX.dust} alt="" style={{ ...st.dust, left: `${f.x}%`, top: `${f.y}%` }} />
        ))}

        {endText && <div style={st.clearMsg}>{endText}</div>}
      </div>

      {/* ブースター */}
      <div style={st.boosters}>
        <button style={{ ...st.booster, opacity: shuffleLeft ? 1 : 0.35 }} onClick={doShuffle} disabled={!shuffleLeft}>
          <GameIcon name="sparkle" size={20} />
          <span style={st.boosterLabel}>シャッフル {shuffleLeft}</span>
        </button>
        <button style={{ ...st.booster, opacity: undoLeft && tray.length ? 1 : 0.35 }} onClick={doUndo} disabled={!undoLeft || !tray.length}>
          <GameIcon name="box" size={20} />
          <span style={st.boosterLabel}>もどす {undoLeft}</span>
        </button>
        <div style={st.remainChip}>のこり {pieces.length}個</div>
      </div>

      {/* トレイ */}
      <div style={st.tray}>
        {Array.from({ length: TRAY_SIZE }).map((_, i) => {
          const t = tray[i]
          const danger = tray.length >= TRAY_SIZE - 1
          return (
            <div key={i} style={{
              ...st.slot,
              ...(FX.traySlot
                ? { backgroundImage: `url(${FX.traySlot})`, backgroundSize: '100% 100%', border: 'none',
                    boxShadow: danger && !t ? '0 0 0 2px rgba(231,76,60,0.9)' : 'none' }
                : { borderColor: danger && !t ? 'rgba(231,76,60,0.9)' : 'rgba(255,255,255,0.25)',
                    background: t ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.35)' }),
            }}>
              {t && <span style={{ animation: 'popIn 0.25s ease' }}><Specimen sp={t.sp} size={34} /></span>}
            </div>
          )
        })}
      </div>

      {/* 図鑑登録ポップ */}
      {popup && (
        <button style={st.discOverlay} onClick={() => setPopup(null)}>
          <div style={st.discCard}>
            {FX.sparkle && <img src={FX.sparkle} alt="" style={st.discSparkle} />}
            <div style={st.discBadge}>図鑑に登録！</div>
            <div style={{ margin: '10px 0 4px', animation: 'popIn 0.45s ease' }}>
              <Specimen sp={popup} size={64} />
            </div>
            <h3 style={st.discName}>{popup.name}</h3>
            {popup.reading && <p style={st.discReading}>{popup.reading}</p>}
            <p style={st.discDesc}>{popup.desc.split('\n').filter(Boolean).slice(0, 3).join('\n')}</p>
            <p style={st.discHint}>タップで続ける</p>
          </div>
        </button>
      )}
    </div>
  )
}

const st = {
  root: {
    position: 'relative', width: '100%', maxWidth: 420, margin: '0 auto',
    display: 'flex', flexDirection: 'column',
    borderRadius: 18, overflow: 'hidden',
    border: '1px solid rgba(245,200,66,0.25)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
    userSelect: 'none',
  },
  bg: {
    position: 'absolute', inset: 0,
    backgroundSize: 'cover', backgroundPosition: 'center',
  },

  hud: {
    position: 'relative', display: 'flex', justifyContent: 'space-between',
    gap: 6, padding: '8px 10px 6px',
  },
  hudChip: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(8,10,24,0.72)', backdropFilter: 'blur(6px)',
    border: '1px solid rgba(245,200,66,0.35)',
    borderRadius: 14, padding: '5px 11px',
  },
  hudLabel: { color: '#fff', fontSize: 12, fontWeight: 900 },
  hudSub: { color: '#f5c842', fontSize: 10, fontWeight: 700 },
  hudScore: { color: '#fff', fontSize: 13, fontWeight: 900, minWidth: 22, textAlign: 'right' },

  timeBarBg: {
    position: 'relative', height: 5, margin: '0 10px 4px',
    background: 'rgba(0,0,0,0.45)', borderRadius: 99, overflow: 'hidden',
  },
  timeBarFill: { height: '100%', borderRadius: 99, transition: 'width 0.9s linear' },

  field: { position: 'relative', zIndex: 0, height: FIELD_H, margin: '2px 6px 0' },  // zIndex で重なり順をこの中に閉じる
  piece: {
    position: 'absolute', background: 'none', border: 'none',
    padding: 0, cursor: 'pointer', lineHeight: 0,
    transition: 'transform 0.35s cubic-bezier(.22,1,.36,1), filter 0.3s',
    WebkitTapHighlightColor: 'transparent',
  },
  pieceInner: {
    display: 'block',
    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.55))',
  },
  dust: {
    position: 'absolute', transform: 'translate(-50%,-50%)',
    width: 74, height: 74, pointerEvents: 'none', zIndex: 1000,
    animation: 'dustPuff 0.65s ease-out forwards',
  },
  clearMsg: {
    position: 'absolute', inset: 0, zIndex: 1001, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 22, fontWeight: 900,
    textShadow: '0 0 18px rgba(245,200,66,0.9)',
    animation: 'popIn 0.5s ease',
  },

  targetBar: {
    position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
    margin: '2px 10px 0', padding: '5px 8px',
    background: 'rgba(8,10,24,0.72)', backdropFilter: 'blur(6px)',
    border: '1px solid rgba(245,200,66,0.45)', borderRadius: 14,
    flexWrap: 'wrap',
  },
  targetLabel: { color: '#f5c842', fontSize: 10.5, fontWeight: 900, letterSpacing: 1, marginRight: 2 },
  targetChip: {
    display: 'flex', alignItems: 'center', gap: 2,
    background: 'rgba(255,255,255,0.85)', borderRadius: 10, padding: '1px 6px 1px 2px',  // 黒っぽい標本も見えるように明るい下地
  },
  targetCount: { fontSize: 13, fontWeight: 900, minWidth: 10, textAlign: 'center' },

  boosters: {
    position: 'relative', display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 10px 4px',
  },
  booster: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(8,10,24,0.72)', backdropFilter: 'blur(6px)',
    border: '1px solid rgba(245,200,66,0.35)',
    borderRadius: 14, padding: '6px 11px', cursor: 'pointer',
  },
  boosterLabel: { color: '#fff', fontSize: 11, fontWeight: 700 },
  remainChip: { marginLeft: 'auto', color: '#dde', fontSize: 11, fontWeight: 700, textShadow: '0 1px 4px #000' },

  tray: {
    position: 'relative', display: 'flex', gap: 5,
    padding: '6px 8px 10px', justifyContent: 'center',
  },
  slot: {
    width: 44, height: 44, borderRadius: 11,
    border: '2px solid rgba(255,255,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'border-color 0.25s, background 0.25s',
  },

  discOverlay: {
    position: 'absolute', inset: 0, zIndex: 400,
    background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', cursor: 'pointer', padding: 16,
  },
  discCard: {
    position: 'relative',
    background: 'linear-gradient(180deg,#1e1e3c 0%,#12122a 100%)',
    border: '2px solid rgba(245,200,66,0.55)',
    borderRadius: 20, padding: '0 20px 20px',
    width: '100%', maxWidth: 300, textAlign: 'center',
    animation: 'popIn 0.4s cubic-bezier(.22,1,.36,1)',
    boxShadow: '0 10px 50px rgba(0,0,0,0.7)',
  },
  discSparkle: {
    position: 'absolute', top: -34, left: '50%',
    width: 150, height: 150, transform: 'translateX(-50%)',
    pointerEvents: 'none', opacity: 0.85,
    animation: 'glowPulse 1.8s ease-in-out infinite',
  },
  discBadge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg,#f5c842,#e0a800)',
    color: '#1a0e00', fontSize: 11, fontWeight: 900, letterSpacing: 1,
    borderRadius: '0 0 12px 12px', padding: '6px 16px',
  },
  discName: { color: '#fff', fontSize: 18, fontWeight: 900, margin: '2px 0 0' },
  discReading: { color: '#f5c842', fontSize: 12, margin: '2px 0 8px' },
  discDesc: {
    color: '#ccd', fontSize: 11.5, lineHeight: 1.7, whiteSpace: 'pre-wrap',
    textAlign: 'left', margin: 0,
    maxHeight: 120, overflow: 'hidden',
  },
  discHint: { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 12 },
}

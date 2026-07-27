import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import GameIcon from '../components/GameIcon'
import { BG } from '../assets/backgrounds'
import { sfx } from '../utils/sound'
import encyclopedia from '../data/encyclopedia.json'
import { buildStage } from './stageConfig'

/*
 * 山探索：トリプルマッチ（Match 3D 系）
 *
 * 散らばった標本をタップしてトレイに集め、同じものが3つそろうと
 * 消えて図鑑に登録される。トレイ(7枠)が埋まると失敗。
 * 3種の標本は「岩場（鉱物）／登山道（動物）／草原（植物）」の
 * 実在の図鑑データから出題される。
 */

const TRAY_SIZE = 7
const MATCH = 3

const AREAS = {
  rock: { name: '岩場', bg: BG.stage.rocky, tint: 'rgba(40,30,70,0.35)' },
  trail: { name: '登山道', bg: BG.stage.trail, tint: 'rgba(20,50,25,0.30)' },
  meadow: { name: '草原', bg: BG.stage.meadow, tint: 'rgba(30,60,30,0.22)' },
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

/* 山＋エリアに対応する図鑑エントリを抽出。
   マッチングゲームなので、1ステージ内で見た目（アイコン）が重複しないように選ぶ。 */
function pickSpecies(area, mountainId, kinds, rng) {
  const pool = encyclopedia.filter(
    (e) => e.area === area && (!e.mountain || e.mountain === mountainId)
  )
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const usedIcons = new Set()
  const picked = []
  for (const sp of shuffled) {
    if (usedIcons.has(sp.icon)) continue
    usedIcons.add(sp.icon)
    picked.push(sp)
    if (picked.length >= kinds) break
  }
  return picked
}

/* 盤面の標本を生成。重なりと傾きで立体的な「山積み」を作る */
function buildPieces(species, sets, rng) {
  const bag = []
  species.forEach((sp) => {
    for (let i = 0; i < sets * MATCH; i++) bag.push(sp)
  })
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[bag[i], bag[j]] = [bag[j], bag[i]]
  }
  return bag.map((sp, i) => ({
    uid: i,
    sp,
    x: 8 + rng() * 84,          // %
    y: 10 + rng() * 76,         // %
    rot: (rng() - 0.5) * 44,    // deg
    depth: rng(),               // 奥行き（重なり順・明るさ）
    scale: 0.86 + rng() * 0.3,
  }))
}

export default function TripleMatchGame({ area, mountainId, level, onClear, onGameOver, onDiscover }) {
  const stage = useMemo(() => buildStage(level), [level])
  const [seed] = useState(() => Math.floor(Math.random() * 1e9))

  const [pieces, setPieces] = useState(() => {
    const rng = makeRng(seed)
    const species = pickSpecies(area, mountainId, stage.kinds, rng)
    return buildPieces(species, stage.sets, rng)
  })
  const [tray, setTray] = useState([])
  const [timeLeft, setTimeLeft] = useState(stage.time)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [found, setFound] = useState([])       // 図鑑登録された種
  const [popup, setPopup] = useState(null)     // 新種発見の演出
  const [flyers, setFlyers] = useState([])     // 加点の飛び出し表示
  const [shuffleLeft, setShuffleLeft] = useState(1)
  const [undoLeft, setUndoLeft] = useState(1)
  const endedRef = useRef(false)

  const remaining = pieces.length

  /* ── 終了判定 ── */
  const finish = useCallback((ok) => {
    if (endedRef.current) return
    endedRef.current = true
    if (ok) { sfx.fanfare(); onClear({ score, found }) }
    else { sfx.miss(); onGameOver({ score, found }) }
  }, [score, found, onClear, onGameOver])

  /* ── タイマー ── */
  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); finish(false); return 0 }
        if (t <= 11) sfx.tick()
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [finish])

  /* ── トレイ判定（3つそろう / 埋まる） ── */
  useEffect(() => {
    if (tray.length === 0) return
    const counts = {}
    tray.forEach((t) => { counts[t.sp.id] = (counts[t.sp.id] || 0) + 1 })
    const hit = Object.keys(counts).find((k) => counts[k] >= MATCH)

    if (hit) {
      const sp = tray.find((t) => t.sp.id === hit).sp
      const timer = setTimeout(() => {
        setTray((prev) => {
          let removed = 0
          return prev.filter((t) => !(t.sp.id === hit && removed++ < MATCH))
        })
        setCombo((c) => c + 1)
        setScore((s) => s + 300 + combo * 100)
        setFound((f) => (f.some((x) => x.id === sp.id) ? f : [...f, sp]))
        onDiscover?.(sp)          // 揃った時点で図鑑に保存（失敗しても記録は残る）
        setPopup(sp)
        sfx.item()
      }, 220)
      return () => clearTimeout(timer)
    }

    if (tray.length >= TRAY_SIZE) {
      const timer = setTimeout(() => finish(false), 500)
      return () => clearTimeout(timer)
    }
  }, [tray, combo, finish, onDiscover])

  /* ── 全部片付いたらクリア ── */
  useEffect(() => {
    if (remaining === 0 && tray.length === 0 && !endedRef.current) {
      setScore((s) => s + timeLeft * 15)   // 残り時間ボーナス
      const t = setTimeout(() => finish(true), 400)
      return () => clearTimeout(t)
    }
  }, [remaining, tray.length, timeLeft, finish])

  /* ── 標本をタップ ── */
  const pick = (piece) => {
    if (endedRef.current || tray.length >= TRAY_SIZE) return
    sfx.tap()
    setPieces((prev) => prev.filter((p) => p.uid !== piece.uid))
    setTray((prev) => [...prev, piece])
    setScore((s) => s + 10)
    setCombo(0)
    const id = piece.uid
    setFlyers((f) => [...f, { id, x: piece.x, y: piece.y }])
    setTimeout(() => setFlyers((f) => f.filter((x) => x.id !== id)), 700)
  }

  /* ── ブースター ── */
  const doShuffle = () => {
    if (shuffleLeft <= 0) return
    sfx.confirm()
    setShuffleLeft((n) => n - 1)
    const rng = makeRng(Date.now())
    setPieces((prev) => prev.map((p) => ({
      ...p, x: 8 + rng() * 84, y: 10 + rng() * 76,
      rot: (rng() - 0.5) * 44, depth: rng(),
    })))
  }
  const doUndo = () => {
    if (undoLeft <= 0 || tray.length === 0) return
    sfx.cancel()
    setUndoLeft((n) => n - 1)
    const last = tray[tray.length - 1]
    setTray((prev) => prev.slice(0, -1))
    setPieces((prev) => [...prev, last])
  }

  const timePct = (timeLeft / stage.time) * 100
  const areaConf = AREAS[area]

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

      {/* 盤面（標本の山） */}
      <div style={st.field}>
        {pieces.map((p) => (
          <button
            key={p.uid}
            onClick={() => pick(p)}
            style={{
              ...st.piece,
              left: `${p.x}%`, top: `${p.y}%`,
              zIndex: Math.round(p.depth * 100),
              transform: `translate(-50%,-50%) rotate(${p.rot}deg) scale(${p.scale})`,
              filter: `brightness(${0.78 + p.depth * 0.32})`,
            }}
            aria-label={p.sp.name}
          >
            <span style={st.pieceInner}>
              <GameIcon name={p.sp.icon} size={46} />
            </span>
          </button>
        ))}

        {flyers.map((f) => (
          <span key={f.id} style={{ ...st.flyer, left: `${f.x}%`, top: `${f.y}%` }}>+10</span>
        ))}

        {remaining === 0 && tray.length === 0 && (
          <div style={st.clearMsg}>すべて発見！</div>
        )}
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
        <div style={st.remainChip}>のこり {remaining}</div>
      </div>

      {/* トレイ */}
      <div style={st.tray}>
        {Array.from({ length: TRAY_SIZE }).map((_, i) => {
          const t = tray[i]
          const danger = tray.length >= TRAY_SIZE - 1
          return (
            <div key={i} style={{
              ...st.slot,
              borderColor: danger && !t ? 'rgba(231,76,60,0.9)' : 'rgba(255,255,255,0.25)',
              background: t ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.35)',
            }}>
              {t && <span style={{ animation: 'popIn 0.25s ease' }}><GameIcon name={t.sp.icon} size={34} /></span>}
            </div>
          )
        })}
      </div>

      {/* 新種発見ポップ */}
      {popup && (
        <button style={st.discOverlay} onClick={() => setPopup(null)}>
          <div style={st.discCard}>
            <div style={st.discBadge}>図鑑に登録！</div>
            <div style={{ margin: '10px 0 4px', animation: 'popIn 0.45s ease' }}>
              <GameIcon name={popup.icon} size={64} />
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

  field: { position: 'relative', height: 400, margin: '2px 6px 0' },
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
  flyer: {
    position: 'absolute', transform: 'translate(-50%,-50%)',
    color: '#f5c842', fontWeight: 900, fontSize: 15,
    textShadow: '0 2px 6px #000', pointerEvents: 'none',
    animation: 'coinFly 0.7s ease-out forwards', zIndex: 200,
  },
  clearMsg: {
    position: 'absolute', inset: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 22, fontWeight: 900,
    textShadow: '0 0 18px rgba(245,200,66,0.9)',
    animation: 'popIn 0.5s ease',
  },

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
    background: 'linear-gradient(180deg,#1e1e3c 0%,#12122a 100%)',
    border: '2px solid rgba(245,200,66,0.55)',
    borderRadius: 20, padding: '0 20px 20px',
    width: '100%', maxWidth: 300, textAlign: 'center',
    animation: 'popIn 0.4s cubic-bezier(.22,1,.36,1)',
    boxShadow: '0 10px 50px rgba(0,0,0,0.7)',
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

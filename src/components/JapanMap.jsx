import { useRef, useState } from 'react'
import MAP from '../data/japanMap.json'
import GameIcon from './GameIcon'
import { ALBUM_MOUNTAINS, FUJI } from '../data/album'
import { sfx } from '../utils/sound'

/* アルバムの「マップ」：都道府県ごとに色分けした日本地図（tools/build_japan_map.py で作成）。
   富士山と、各山の最高地点にピン。ピンをタップすると山の名前。指でつまんで（ホイールでも）拡大縮小、ドラッグで移動 */

const { width: W, height: H, projection: P } = MAP
const MAX_ZOOM = 5

function project(lat, lon) {
  return { x: ((lon - P.lon0) * P.cos * P.scale) / W * 100, y: ((P.lat1 - lat) * P.scale) / H * 100 }
}

export default function JapanMap({ climbed = [] }) {
  const boxRef = useRef(null)
  const pointers = useRef(new Map())
  const pinchRef = useRef(null)
  const [view, setView] = useState({ s: 1, x: 0, y: 0 })
  const [selected, setSelected] = useState(null)

  // 地図が枠の外へ出すぎないようにする
  const clamp = (v) => {
    const el = boxRef.current
    const w = el?.clientWidth || 1
    const h = el?.clientHeight || 1
    const s = Math.min(MAX_ZOOM, Math.max(1, v.s))
    return { s, x: Math.min(0, Math.max(w * (1 - s), v.x)), y: Math.min(0, Math.max(h * (1 - s), v.y)) }
  }
  // 点 (px, py) を中心に倍率を変える
  const zoomAt = (v, factor, px, py) => {
    const s = Math.min(MAX_ZOOM, Math.max(1, v.s * factor))
    const k = s / v.s
    return clamp({ s, x: px - (px - v.x) * k, y: py - (py - v.y) * k })
  }
  const local = (e) => {
    const r = boxRef.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onPointerDown = (e) => {
    boxRef.current.setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, local(e))
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) }
    }
  }
  const onPointerMove = (e) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const cur = local(e)
    pointers.current.set(e.pointerId, cur)
    if (pointers.current.size === 2 && pinchRef.current) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const factor = dist / pinchRef.current.dist
      pinchRef.current.dist = dist
      setView((v) => zoomAt(v, factor, (a.x + b.x) / 2, (a.y + b.y) / 2))
    } else if (pointers.current.size === 1) {
      setView((v) => clamp({ ...v, x: v.x + cur.x - prev.x, y: v.y + cur.y - prev.y }))
    }
  }
  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchRef.current = null
  }
  const onWheel = (e) => {
    const p = local(e)
    setView((v) => zoomAt(v, e.deltaY < 0 ? 1.2 : 1 / 1.2, p.x, p.y))
  }
  const zoomButton = (factor) => {
    sfx.tap()
    const el = boxRef.current
    setView((v) => zoomAt(v, factor, el.clientWidth / 2, el.clientHeight / 2))
  }

  const fuji = project(FUJI.lat, FUJI.lon)

  return (
    <div style={st.wrap}>
      <div
        ref={boxRef}
        style={st.box}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <div style={{ ...st.inner, transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={st.svg} aria-label="日本地図">
            {MAP.insets.map((r) => (
              <rect key={r.name} x={r.x} y={r.y} width={r.w} height={r.h} rx="6"
                fill="rgba(255,255,255,0.25)" stroke="#a8977f" strokeWidth="1.2" strokeDasharray="5 4" />
            ))}
            {MAP.prefectures.map((p) => (
              <path key={p.code} d={p.d} fill={p.color} stroke="#fffaf0" strokeWidth={1 / view.s + 0.3}
                strokeLinejoin="round"><title>{p.name}</title></path>
            ))}
          </svg>
          {/* 富士山 */}
          <div style={{ ...st.marker, left: `${fuji.x}%`, top: `${fuji.y}%`, transform: `translate(-50%, -78%) scale(${1 / view.s})` }}>
            <GameIcon name="fuji" size={34} />
          </div>
          {/* 各山の最高地点のピン */}
          {ALBUM_MOUNTAINS.map((m) => {
            const p = project(m.lat, m.lon)
            const on = selected === m.id
            return (
              <button key={m.id}
                style={{ ...st.pin, left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%, -92%) scale(${1 / view.s})`, zIndex: on ? 3 : 2 }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => { sfx.tap(); setSelected(on ? null : m.id) }}
                aria-label={m.name}
              >
                <GameIcon name="mappin" size={34} style={{ filter: climbed.includes(m.id) ? 'none' : 'saturate(0.4)' }} />
                {on && (
                  <span style={st.label}>
                    {m.name}
                    <span style={st.labelSub}>{m.peak}{climbed.includes(m.id) ? ' ・ 登頂ずみ' : ''}</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      <div style={st.zoomBtns}>
        <button style={st.zoomBtn} onClick={() => zoomButton(1.5)} aria-label="拡大">＋</button>
        <button style={st.zoomBtn} onClick={() => zoomButton(1 / 1.5)} aria-label="縮小">－</button>
      </div>
      <p style={st.credit}>{MAP.source}</p>
    </div>
  )
}

const st = {
  wrap: { position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  box: {
    position: 'relative', flex: 1, minHeight: 0,
    aspectRatio: `${W} / ${H}`, maxWidth: '100%',
    overflow: 'hidden', touchAction: 'none', cursor: 'grab',
    borderRadius: 12,
  },
  inner: { position: 'absolute', inset: 0, transformOrigin: '0 0' },
  svg: { position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' },
  marker: { position: 'absolute', pointerEvents: 'none', transformOrigin: '50% 78%' },
  pin: {
    position: 'absolute', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', transformOrigin: '50% 92%',
  },
  label: {
    position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
    background: '#fffdf7', border: '2px solid var(--beige-edge)', borderRadius: 10,
    padding: '3px 10px', whiteSpace: 'nowrap',
    color: 'var(--brown-text)', fontSize: 15, fontWeight: 700,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    boxShadow: '0 3px 8px rgba(60,40,20,0.25)',
  },
  labelSub: { fontSize: 11, color: '#8b7a66' },
  zoomBtns: { position: 'absolute', right: 4, bottom: 22, display: 'flex', flexDirection: 'column', gap: 6 },
  zoomBtn: {
    width: 38, height: 38, borderRadius: '50%',
    background: '#fffdf7', border: '2px solid var(--beige-edge)',
    color: 'var(--brown-text)', fontSize: 20, fontWeight: 800, cursor: 'pointer', lineHeight: 1,
    boxShadow: '0 2px 0 var(--beige-edge)',
  },
  credit: { color: '#8b7a66', fontSize: 10, margin: '2px 0 0' },
}

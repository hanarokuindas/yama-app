import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'
import { TUTORIALS } from '../data/tutorial'
import { senpaiMini } from '../assets/characters/senpai'
import { Celebration } from './Celebration'
import GameIcon from './GameIcon'
import { sfx } from '../utils/sound'

const PAD = 6          // 照らす枠と要素のすき間
const BUBBLE_H = 176   // 吹き出しの高さの見込み（上下どちらに出すかの判定用）
const NAV_H = 64

// 照らす要素の位置を追いかける。画面遷移やアニメーションで動くので一定間隔で測り直す
function useTargetRect(name) {
  const [rect, setRect] = useState(null)
  useEffect(() => {
    if (!name) return
    let scrolled = false
    const measure = () => {
      const el = document.querySelector(`[data-tut="${name}"]`)
      if (!el) { setRect(null); return }
      const r = el.getBoundingClientRect()
      // 画面の外にあれば一度だけ見える位置までスクロールする
      if (!scrolled && (r.top < 0 || r.bottom > window.innerHeight - NAV_H)) {
        scrolled = true
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
      const next = {
        name,
        top: Math.round(r.top), left: Math.round(r.left),
        width: Math.round(r.width), height: Math.round(r.height),
      }
      setRect((prev) => (
        prev && prev.name === next.name && prev.top === next.top && prev.left === next.left
          && prev.width === next.width && prev.height === next.height ? prev : next
      ))
    }
    const first = requestAnimationFrame(measure)
    const id = setInterval(measure, 150)
    return () => { cancelAnimationFrame(first); clearInterval(id) }
  }, [name])
  return name && rect?.name === name ? rect : null
}

export default function TutorialOverlay() {
  const location = useLocation()
  const navigate = useNavigate()
  const tutorial = useGameStore((s) => s.tutorial)
  const flags = useGameStore((s) => s.flags)
  const advanceTutorial = useGameStore((s) => s.advanceTutorial)
  const endTutorial = useGameStore((s) => s.endTutorial)
  const [reward, setReward] = useState(0)
  const [confirmSkip, setConfirmSkip] = useState(false)
  const shownAt = useRef(0)

  const chapter = tutorial ? TUTORIALS[tutorial.id] : null
  const step = chapter ? chapter.steps[tutorial.step] : null
  const ready = flags.introCompleted && flags.profileCompleted
  const onRoute = !!step && (!step.route || step.route === location.pathname)
  const rect = useTargetRect(ready && onRoute ? step?.target : null)
  const stepKey = tutorial ? `${tutorial.id}:${tutorial.step}` : ''

  // ステップが変わったらスキップ確認を閉じる
  const [prevKey, setPrevKey] = useState(stepKey)
  if (prevKey !== stepKey) {
    setPrevKey(stepKey)
    setConfirmSkip(false)
  }
  // 連打で読まずに飛ばさないよう、吹き出しが実際に出た時刻を覚えておく
  const visible = ready && onRoute && (!step?.target || !!rect)
  useEffect(() => { if (visible) shownAt.current = Date.now() }, [stepKey, visible])

  // 照らした要素を実際にタップしたら次へ（タップ自体はそのまま要素に届く）
  useEffect(() => {
    if (!ready || !step?.action || step.waitFor || !step.target) return
    const onClick = (e) => {
      const el = document.querySelector(`[data-tut="${step.target}"]`)
      if (el && el.contains(e.target)) setTimeout(() => advanceTutorial(), 0)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [ready, step, advanceTutorial])

  const next = () => {
    if (Date.now() - shownAt.current < 400) return
    sfx.tap()
    const r = advanceTutorial()
    if (r > 0) { sfx.fanfare(); setReward(r) }
  }

  const skip = () => {
    sfx.cancel()
    endTutorial(false)
  }

  if (reward > 0) {
    return (
      <Celebration
        icon={<GameIcon name="trophy" size={80} />}
        title="チュートリアル達成！"
        subtitle={`ボーナス ★+${reward.toLocaleString()}pt`}
        onClose={() => setReward(0)}
      />
    )
  }
  if (!ready || !step) return null

  // 案内中の画面から離れているときは、戻り道だけ出す
  if (!onRoute) {
    return <Pill text="チュートリアルのつづきへ" onClick={() => { sfx.tap(); navigate(step.route) }} />
  }
  // 照らす要素が今は無い（トレーニング中・探索プレイ中など）ときは小さな案内だけ
  if (step.target && !rect) {
    return step.hint ? <Pill text={step.hint} top={step.hintAt === 'top'} /> : null
  }

  const vh = window.innerHeight
  const hole = rect && {
    top: rect.top - PAD, left: rect.left - PAD,
    width: rect.width + PAD * 2, height: rect.height + PAD * 2,
  }
  const gap = step.action ? 30 : 14
  const radius = hole ? (step.target.startsWith('spot-') ? Math.min(hole.width, hole.height) / 2 : 16) : 0

  // 吹き出しは要素の下、入らなければ上、どちらも無理なら画面下
  let place = 'bottom'
  if (hole && hole.top + hole.height + gap + BUBBLE_H < vh - NAV_H) place = 'below'
  else if (hole && hole.top - gap - BUBBLE_H > 0) place = 'above'
  const bubblePos =
    place === 'below' ? { top: hole.top + hole.height + gap }
    : place === 'above' ? { bottom: vh - hole.top + gap }
    : { bottom: NAV_H + 14 }

  return (
    <div style={st.root} key={stepKey}>
      {/* 暗幕：照らす要素があればそこだけ角丸に抜く（巨大な box-shadow は端末によって描画されないので SVG マスクで） */}
      {hole ? (
        <>
          <svg style={st.svg} width="100%" height="100%" aria-hidden>
            <defs>
              <mask id="tut-hole">
                <rect width="100%" height="100%" fill="#fff" />
                <rect x={hole.left} y={hole.top} width={hole.width} height={hole.height} rx={radius} fill="#000" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(4,6,16,0.66)" mask="url(#tut-hole)" />
          </svg>
          <div style={{ ...st.ring, ...hole, borderRadius: radius }} />
        </>
      ) : <div style={st.dimAll} />}

      {/* タップを受け止める層。action のときは照らした所だけ素通しにする */}
      {step.action && hole ? (
        <>
          <div style={{ ...st.block, top: 0, left: 0, right: 0, height: Math.max(0, hole.top) }} />
          <div style={{ ...st.block, top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
          <div style={{ ...st.block, top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height }} />
          <div style={{ ...st.block, top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
        </>
      ) : (
        <div style={{ ...st.block, inset: 0 }} onClick={next} />
      )}

      {/* 要素を指す矢印 */}
      {step.action && hole && place !== 'bottom' && (
        <div style={{
          ...st.arrow,
          left: hole.left + hole.width / 2 - 11,
          ...(place === 'below'
            ? { top: hole.top + hole.height + 6, borderBottom: '13px solid #f5c842' }
            : { top: hole.top - 19, borderTop: '13px solid #f5c842' }),
        }} />
      )}

      {/* 先輩の吹き出し */}
      <div style={{ ...st.bubbleWrap, ...bubblePos }}>
        <img src={senpaiMini[step.pose] || senpaiMini.smileCheer} alt="先輩" style={st.face} draggable={false} />
        <div style={st.bubble}>
          <div style={st.bubbleHead}>
            <span style={st.name}>先輩</span>
            <span style={st.chapter}>{chapter.title}</span>
          </div>
          {confirmSkip ? (
            <>
              <p style={st.text}>チュートリアルをスキップする？{'\n'}メニューからいつでも見直せるよ</p>
              <div style={st.row}>
                <button style={st.subBtn} onClick={() => { sfx.tap(); setConfirmSkip(false) }}>つづける</button>
                <button style={st.dangerBtn} onClick={skip}>スキップする</button>
              </div>
            </>
          ) : (
            <>
              <p style={st.text}>{step.text}</p>
              <div style={st.row}>
                <button style={st.skipLink} onClick={() => { sfx.tap(); setConfirmSkip(true) }}>スキップ</button>
                {step.action
                  ? <span style={st.tapHint}>光っているところをタップ</span>
                  : <button style={st.nextBtn} onClick={next}>{step.last ? chapter.doneLabel : '次へ ›'}</button>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Pill({ text, onClick, top = false }) {
  return (
    <button
      style={{ ...st.pill, ...(top ? st.pillTop : {}), pointerEvents: onClick ? 'auto' : 'none' }}
      onClick={onClick}
    >
      <img src={senpaiMini.smileCheer} alt="" style={{ height: 28, marginLeft: -4 }} draggable={false} />
      <span>{text}{onClick ? ' ›' : ''}</span>
    </button>
  )
}

const st = {
  root: {
    position: 'fixed', inset: 0, zIndex: 180,
    animation: 'overlayFade 0.3s ease',
    pointerEvents: 'none', // タップは下の block と吹き出しだけが受ける（抜いた穴は素通し）
  },
  dimAll: {
    position: 'absolute', inset: 0,
    background: 'rgba(4,6,16,0.55)',
  },
  svg: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  ring: {
    position: 'absolute',
    pointerEvents: 'none',
    animation: 'tutRing 1.6s ease-in-out infinite',
  },
  block: { position: 'absolute', pointerEvents: 'auto' },
  arrow: {
    position: 'absolute', width: 0, height: 0,
    borderLeft: '11px solid transparent', borderRight: '11px solid transparent',
    filter: 'drop-shadow(0 0 6px rgba(245,200,66,0.8))',
    animation: 'tutBounce 0.9s ease-in-out infinite',
    pointerEvents: 'none',
  },

  bubbleWrap: {
    position: 'absolute', left: 0, right: 0, margin: '0 auto',
    width: 'calc(100% - 24px)', maxWidth: 420,
    display: 'flex', alignItems: 'flex-end', gap: 4,
    animation: 'popIn 0.35s cubic-bezier(.22,1,.36,1)',
    pointerEvents: 'auto',
  },
  face: {
    height: 92, width: 'auto', flexShrink: 0, marginBottom: -4,
    filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))',
    pointerEvents: 'none',
  },
  bubble: {
    flex: 1, minWidth: 0,
    background: '#fff', borderRadius: 16, padding: '10px 14px 10px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
    border: '2px solid #f5c842',
  },
  bubbleHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { color: '#db2777', fontSize: 11.5, fontWeight: 900, letterSpacing: 0.5 },
  chapter: { color: '#a0a4b8', fontSize: 9.5, fontWeight: 700 },
  text: {
    color: '#222', fontSize: 13, lineHeight: 1.7, margin: 0,
    whiteSpace: 'pre-wrap',
  },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  skipLink: {
    background: 'none', border: 'none', color: '#a0a4b8',
    fontSize: 11, fontWeight: 700, padding: '6px 2px', cursor: 'pointer',
  },
  tapHint: {
    color: '#d97706', fontSize: 11.5, fontWeight: 900,
    animation: 'glowPulse 1.6s ease-in-out infinite',
  },
  nextBtn: {
    background: 'linear-gradient(135deg, #f5c842, #e0a800)', color: '#1a0e00',
    border: 'none', borderRadius: 20, padding: '8px 18px',
    fontSize: 13, fontWeight: 900, cursor: 'pointer',
    boxShadow: '0 3px 10px rgba(224,168,0,0.4)',
  },
  subBtn: {
    flex: 1, background: '#f1f2f6', color: '#445', border: 'none',
    borderRadius: 20, padding: '8px 0', fontSize: 12.5, fontWeight: 900, cursor: 'pointer',
  },
  dangerBtn: {
    flex: 1, background: '#fde8e8', color: '#c0392b', border: 'none',
    borderRadius: 20, padding: '8px 0', fontSize: 12.5, fontWeight: 900, cursor: 'pointer',
  },

  // 画面下のボタンと重なる場面では上に出す
  pillTop: { bottom: 'auto', top: 10 },
  pill: {
    position: 'fixed', left: 0, right: 0, margin: '0 auto', width: 'fit-content',
    bottom: 'calc(var(--nav-h) + 10px)', zIndex: 180,
    display: 'flex', alignItems: 'center', gap: 6,
    maxWidth: 'calc(100% - 32px)',
    background: 'rgba(14,14,34,0.92)', border: '1.5px solid rgba(245,200,66,0.6)',
    borderRadius: 999, padding: '4px 16px 4px 10px',
    color: '#ffe98a', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    cursor: 'pointer', overflow: 'hidden',
    animation: 'popIn 0.35s ease',
  },
}

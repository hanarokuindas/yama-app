import { useEffect, useState } from 'react'
import { BG } from '../assets/backgrounds'
import { senpaiFull } from '../assets/characters/senpai'
import characters from '../data/characters.json'
import { sfx } from '../utils/sound'

const SENPAI_INTRO = characters.senpai.intro.map((t) => t.replace(' ', '\n'))
const TYPE_MS = 34

// オープニングの台本。who が無い行はナレーション
function buildLines(returning) {
  return [
    { bg: 'map', text: 'ここは、山神さまたちが見守る山の世界。' },
    { bg: 'map', text: '山は、登りにくる人と\n手入れをしてくれる人がいてこそ、元気でいられる――' },
    { who: '先輩', img: senpaiFull.pointing, text: SENPAI_INTRO[0] },
    { who: '先輩', img: senpaiFull.pointing, text: '山にはそれぞれ山神さまがいて、\n会いに来てくれる人を楽しみに待ってるんだ' },
    { who: '先輩', img: senpaiFull.pointing, text: 'でも、いきなり登るのはキケン！\n体力が足りないと、途中でへばっちゃうからね' },
    { who: '先輩', img: senpaiFull.cheering, text: SENPAI_INTRO[1] },
    { who: '先輩', img: senpaiFull.cheering, text: '鍛えて、探索して、装備をそろえたら、いよいよ山へ。\n登った山の手入れも忘れずにね' },
    returning
      ? { who: '先輩', img: senpaiFull.pointing, text: 'それじゃあ、さっそく案内するね！' }
      : { who: '先輩', img: senpaiFull.pointing, text: 'そのまえに……\nキミのこと、教えてくれる？' },
  ]
}

export default function IntroStory({ returning = false, onComplete }) {
  const [lines] = useState(() => buildLines(returning))
  const [reduceMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  const [idx, setIdx] = useState(0)
  const [shown, setShown] = useState(() => (reduceMotion ? Infinity : 0))

  const line = lines[idx]
  const typed = shown >= line.text.length

  // 1文字ずつ表示する
  useEffect(() => {
    if (typed) return
    const id = setInterval(() => setShown((n) => n + 1), TYPE_MS)
    return () => clearInterval(id)
  }, [idx, typed])

  const advance = () => {
    if (!typed) { setShown(Infinity); return }
    if (idx < lines.length - 1) {
      sfx.tap()
      setIdx(idx + 1)
      setShown(reduceMotion ? Infinity : 0)
    } else {
      sfx.confirm()
      onComplete()
    }
  }

  const narration = !line.who

  return (
    <div style={st.root} onClick={advance}>
      {/* 背景：ナレーションはワールドマップ、先輩の場面は山の景色 */}
      <div style={{ ...st.bg, backgroundImage: `url(${BG.homeMap})`, opacity: line.bg === 'map' ? 1 : 0 }} />
      <div style={{ ...st.bg, backgroundImage: `url(${BG.intro})`, opacity: line.bg === 'map' ? 0 : 1 }} />
      <div style={st.shade} />

      {line.img && (
        <img key={line.img} src={line.img} alt={line.who} style={st.chara} draggable={false} />
      )}

      <button style={st.skip} onClick={(e) => { e.stopPropagation(); sfx.cancel(); onComplete() }}>
        スキップ ›
      </button>

      <div style={{ ...st.box, ...(narration ? st.boxNarration : {}) }}>
        {/* 名前は山神だけ出す（先輩は名前なし） */}
        {!narration && line.who !== '先輩' && <div style={st.nameTag}>{line.who}</div>}
        <p style={{ ...st.text, ...(narration ? st.textNarration : {}) }}>
          {line.text.slice(0, shown)}
        </p>
        {typed && <span style={st.more}>▼</span>}
        <div style={st.dots}>
          {lines.map((_, i) => (
            <span key={i} style={{ ...st.dot, background: i === idx ? '#e0a000' : (narration ? 'rgba(255,255,255,0.3)' : 'rgba(91,75,67,0.22)') }} />
          ))}
        </div>
      </div>
    </div>
  )
}

const st = {
  root: {
    position: 'fixed', inset: 0, zIndex: 1000,
    overflow: 'hidden', background: '#0a0c18',
    cursor: 'pointer', userSelect: 'none',
  },
  bg: {
    position: 'absolute', inset: 0,
    backgroundSize: 'cover', backgroundPosition: 'center',
    transition: 'opacity 0.8s ease',
  },
  shade: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(180deg, rgba(8,10,24,0.15) 0%, rgba(8,10,24,0.25) 45%, rgba(8,10,24,0.85) 100%)',
  },
  chara: {
    position: 'absolute', left: 0, right: 0, bottom: 0, margin: '0 auto',
    height: '96cqh', width: 'auto',
    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.45))',
    animation: 'pageIn 0.45s cubic-bezier(.22,1,.36,1)',
    pointerEvents: 'none',
  },
  skip: {
    position: 'absolute', top: 14, right: 14, zIndex: 2,
    background: 'rgba(10,12,30,0.6)', border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 20, padding: '6px 14px',
    color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
    backdropFilter: 'blur(6px)',
  },
  box: {
    position: 'absolute', left: '50%', bottom: 'max(24px, env(safe-area-inset-bottom))',
    transform: 'translateX(-50%)',
    width: 'min(860px, 90cqw)', minHeight: 'clamp(96px, 28cqh, 180px)',
    background: 'rgba(255,253,247,0.95)',
    border: '3px solid var(--beige-edge)',
    borderRadius: 18, padding: 'clamp(12px, 4cqh, 24px) clamp(18px, 3cqw, 32px) clamp(18px, 5cqh, 30px)',
    boxShadow: '0 10px 40px rgba(40,25,10,0.45)',
  },
  boxNarration: {
    background: 'rgba(30,22,12,0.6)',
    border: '1px solid rgba(255,255,255,0.2)',
    backdropFilter: 'blur(8px)',
  },
  nameTag: {
    position: 'absolute', top: -14, left: 18,
    background: 'linear-gradient(135deg, #f5c842, #e0a800)', color: '#1a0e00',
    fontSize: 12.5, fontWeight: 900, letterSpacing: 1,
    borderRadius: 999, padding: '4px 16px',
    boxShadow: '0 3px 10px rgba(0,0,0,0.35)',
  },
  text: {
    color: 'var(--brown-text)', fontSize: 'clamp(15px, 4.8cqh, 24px)', lineHeight: 1.75, fontWeight: 700,
    margin: 0, whiteSpace: 'pre-wrap', minHeight: 58,
  },
  textNarration: {
    textAlign: 'center', fontSize: 15, color: '#e8ebf7', fontWeight: 500,
    letterSpacing: 0.5,
  },
  more: {
    position: 'absolute', right: 18, bottom: 22,
    color: '#e0a000', fontSize: 14,
    animation: 'blink 1s ease-in-out infinite',
  },
  dots: {
    position: 'absolute', left: 0, right: 0, bottom: 9,
    display: 'flex', justifyContent: 'center', gap: 5,
  },
  dot: { width: 5, height: 5, borderRadius: '50%', transition: 'background 0.3s' },
}

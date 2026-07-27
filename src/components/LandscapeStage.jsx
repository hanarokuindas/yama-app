import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

/*
 * 常に横画面（landscape）で描画するステージ。
 * 端末が縦向きのときは中身を90°回転させて画面全体に敷き詰めるので、
 * 端末を横に倒すとそのまま正しい向きで見える。
 * PageTransition等のtransformを持つ祖先の影響を避けるため body へポータルする。
 */
export default function LandscapeStage({ children }) {
  const [vp, setVp] = useState(() => ({
    w: typeof window === 'undefined' ? 0 : window.innerWidth,
    h: typeof window === 'undefined' ? 0 : window.innerHeight,
  }))

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    onResize()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  // 縦持ちのときだけ「横向きに」のヒントを一定時間表示（回転させずに読める向きで出す）
  const [hintDone, setHintDone] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setHintDone(true), 3500)
    return () => clearTimeout(t)
  }, [])

  if (!vp.w) return null
  const portrait = vp.h > vp.w

  const style = portrait
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: vp.h,
        height: vp.w,
        transformOrigin: '0 0',
        transform: `translateX(${vp.w}px) rotate(90deg)`,
        overflow: 'hidden',
        zIndex: 50,
      }
    : {
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        zIndex: 50,
      }

  return createPortal(
    <>
      <div style={style}>{children}</div>
      {portrait && !hintDone && (
        <div style={hintStyles.wrap}>
          <div style={hintStyles.pill}>
            <span style={hintStyles.icon}>⟳</span>
            <span>画面を横向きにしてください</span>
          </div>
        </div>
      )}
    </>,
    document.body
  )
}

const hintStyles = {
  wrap: {
    position: 'fixed', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none', zIndex: 300,
    animation: 'overlayFade 0.4s ease',
  },
  pill: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(10,12,28,0.88)',
    border: '1.5px solid rgba(245,200,66,0.5)',
    borderRadius: 24, padding: '12px 22px',
    color: '#fff', fontSize: 14, fontWeight: 700,
    boxShadow: '0 6px 28px rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)',
  },
  icon: { fontSize: 22, color: '#f5c842', animation: 'rotateHint 1.8s ease-in-out infinite' },
}

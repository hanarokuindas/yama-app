/* 横画面の新しいデザインの共通スタイル（components/ui.jsx の部品と各画面で使う） */
import { UI } from '../assets/ui'

export const FS = (cqh, min, max) => `clamp(${min}px, ${cqh}cqh, ${max}px)`

export const ui = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(40,28,14,0.45)',
    backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'overlayFade 0.2s ease',
  },
  window: {
    maxHeight: '94cqh',
    display: 'flex', flexDirection: 'column',
    background: 'var(--beige)',
    border: '3px solid var(--beige-edge)',
    borderRadius: 22,
    boxShadow: '0 10px 40px rgba(40,25,10,0.45)',
    animation: 'popIn 0.3s cubic-bezier(.22,1,.36,1)',
    overflow: 'hidden',
  },
  windowHead: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: 'clamp(6px, 2cqh, 12px) clamp(10px, 2cqw, 18px) 0',
  },
  headSide: { flex: 1, display: 'flex', alignItems: 'center', minWidth: 0 },
  windowTitle: {
    color: 'var(--brown-text)', fontSize: FS(5, 16, 24), fontWeight: 800, letterSpacing: 2,
    whiteSpace: 'nowrap',
  },
  windowBody: {
    overflowY: 'auto',
    padding: 'clamp(8px, 2.5cqh, 16px) clamp(12px, 2.5cqw, 22px) clamp(10px, 3cqh, 20px)',
  },
  closeBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: '#fff', border: '2px solid var(--beige-edge)',
    borderRadius: 99, padding: '5px 14px 5px 10px',
    color: 'var(--brown-text)', fontSize: 14, fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 2px 0 var(--beige-edge)',
    whiteSpace: 'nowrap',
  },
  closeX: { fontSize: 18, lineHeight: 1, marginTop: -2 },
  tile: {
    position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
    aspectRatio: '1 / 1',
    background: 'linear-gradient(180deg, #fffaf0 0%, var(--beige-light) 60%, #f1e6d0 100%)',
    border: '2px solid var(--beige-edge)',
    borderRadius: 16,
    boxShadow: '0 5px 0 #cdb68e, 0 7px 12px rgba(60,40,20,0.18)',
    color: 'var(--brown-text)', fontWeight: 800,
    cursor: 'pointer',
    padding: 6,
    transition: 'transform 0.08s',
  },
  tileActive: {
    border: '3px solid #e0a000',
    boxShadow: '0 5px 0 #c58f00, 0 0 0 3px rgba(248,181,0,0.35)',
  },
  tileDisabled: { cursor: 'default', filter: 'grayscale(1)', opacity: 0.55 },
  plank: {
    position: 'relative',
    display: 'flex', alignItems: 'center', gap: 6,
    height: 'clamp(34px, 10.5cqh, 66px)',
    padding: '0 clamp(14px, 4cqh, 28px) 2px',
    background: `url(${UI.plankLong}) center / 100% 100% no-repeat`,
    border: 'none',
    filter: 'drop-shadow(0 2px 3px rgba(60,40,20,0.35))',
  },
  plankIcon: { width: 'clamp(22px, 7cqh, 42px)', height: 'clamp(22px, 7cqh, 42px)' },
  pointNum: {
    color: 'var(--yamabuki)', fontWeight: 800, fontSize: FS(5, 16, 28),
    textShadow: '0 0 2px #5a3a10, 0 0 2px #5a3a10, 0 1px 2px #5a3a10',
    letterSpacing: 0.5,
  },
  bubble: {
    background: '#fffdf7',
    border: '2px solid var(--beige-edge)',
    borderRadius: 16,
    color: 'var(--brown-text)', fontWeight: 700, lineHeight: 1.65,
    boxShadow: '0 3px 10px rgba(60,40,20,0.15)',
  },
}

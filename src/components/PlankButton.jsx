import { useNavigate } from 'react-router-dom'
import { UI } from '../assets/ui'
import GameIcon from './GameIcon'
import { sfx } from '../utils/sound'

/* 短い木の看板のボタン（「ホーム」「メニュー」など） */
export default function PlankButton({ label, icon, onClick, style, tut }) {
  return (
    <button style={{ ...st.btn, ...style }} onClick={onClick} data-tut={tut}>
      {icon && <GameIcon name={icon} size={22} style={{ marginLeft: -2 }} />}
      <span className="icon-label" style={st.label}>{label}</span>
    </button>
  )
}

/* どの画面からでもホームへ戻るボタン */
export function HomeButton({ style }) {
  const navigate = useNavigate()
  return (
    <PlankButton label="ホーム" icon="home" style={style}
      onClick={() => { sfx.cancel(); navigate('/') }} />
  )
}

const st = {
  btn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    minWidth: 104, height: 42, padding: '0 14px 2px',
    background: `url(${UI.plankShort}) center / 100% 100% no-repeat`,
    border: 'none', cursor: 'pointer',
    filter: 'drop-shadow(0 2px 3px rgba(60,40,20,0.35))',
  },
  label: { fontSize: 15 },
}

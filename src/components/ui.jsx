import GameIcon from './GameIcon'
import CountUp from './CountUp'
import { sfx } from '../utils/sound'
import { ui } from './uiStyles'

/* 横画面の新しいデザインで共通に使う部品（ベージュの窓・正方形のマス・木の看板） */

/* ×閉じる */
export function CloseButton({ onClick, label = '閉じる', style }) {
  return (
    <button style={{ ...ui.closeBtn, ...style }} onClick={() => { sfx.cancel(); onClick() }}>
      <span style={ui.closeX}>×</span>{label}
    </button>
  )
}

/* 画面の上に開くベージュの窓。外側をタップしても閉じる */
export function Window({ title, onClose, children, width = 720, style, headerLeft }) {
  return (
    <div style={ui.overlay} onClick={() => { sfx.cancel(); onClose() }}>
      <div style={{ ...ui.window, width: `min(${width}px, 94cqw)`, ...style }} onClick={(e) => e.stopPropagation()}>
        <div style={ui.windowHead}>
          <div style={ui.headSide}>{headerLeft}</div>
          <div style={ui.windowTitle}>{title}</div>
          <div style={{ ...ui.headSide, justifyContent: 'flex-end' }}><CloseButton onClick={onClose} /></div>
        </div>
        <div style={ui.windowBody}>{children}</div>
      </div>
    </div>
  )
}

/* 少し立体的なベージュの正方形のマス */
export function Tile({ children, onClick, style, disabled = false, active = false, tut }) {
  return (
    <button
      style={{ ...ui.tile, ...(active ? ui.tileActive : null), ...(disabled ? ui.tileDisabled : null), ...style }}
      onClick={onClick} data-tut={tut}
    >
      {children}
    </button>
  )
}

/* 名前やポイントをのせる長い木の看板 */
export function Plank({ children, style, onClick, tut }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag style={{ ...ui.plank, ...(onClick ? { cursor: 'pointer' } : null), ...style }} onClick={onClick} data-tut={tut}>
      {children}
    </Tag>
  )
}

/* 看板にのせた所持ポイント */
export function PointPlank({ points, style }) {
  return (
    <Plank style={style}>
      <GameIcon name="pcoin" size={32} style={ui.plankIcon} />
      <CountUp value={points} style={ui.pointNum} />
    </Plank>
  )
}

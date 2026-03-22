import { useState, useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import Toast from '../components/Toast'

const MAINTENANCE_MENUS = [
  {
    id: 'patrol',
    name: '巡回',
    icon: '👀',
    cost: 1000,
    staminaCost: 10,
    effect: 5,
    time: '1時間',
    description: '山の状態を確認するよ。手軽にできる基本の整備！',
  },
  {
    id: 'trash',
    name: 'ゴミ拾い',
    icon: '🗑️',
    cost: 500,
    staminaCost: 15,
    effect: 8,
    time: '2時間',
    description: 'ゴミを拾って山を綺麗に保とう！',
  },
  {
    id: 'trail',
    name: '登山道整備',
    icon: '🛤️',
    cost: 5000,
    staminaCost: 30,
    effect: 15,
    time: '5時間',
    description: '登山道を整えて安全に歩けるようにするよ！',
  },
  {
    id: 'pruning',
    name: '枝切り',
    icon: '✂️',
    cost: 3000,
    staminaCost: 25,
    effect: 12,
    time: '3時間',
    description: '伸びすぎた枝を切って日当たりをよくするよ！',
  },
  {
    id: 'mowing',
    name: '草刈り',
    icon: '🌿',
    cost: 2000,
    staminaCost: 20,
    effect: 10,
    time: '3時間',
    description: '草を刈って登山道を歩きやすくするよ！',
  },
  {
    id: 'thinning',
    name: '間伐',
    icon: '🌲',
    cost: 8000,
    staminaCost: 40,
    effect: 20,
    time: '8時間',
    description: '木を間引いて森を健全に保つよ。効果大！',
  },
  {
    id: 'planting',
    name: '植栽',
    icon: '🌱',
    cost: 10000,
    staminaCost: 35,
    effect: 25,
    time: '6時間',
    description: '新しい木や草を植えて山を豊かにするよ！',
  },
]

const MOUNTAINS = [
  { id: 'yatsugatake', name: '八ヶ岳連峰', icon: '🏔️' },
  { id: 'takao', name: '高尾山', icon: '⛰️' },
  { id: 'hakone', name: '箱根山', icon: '🌋' },
]

export default function Maintenance() {
  const points = useGameStore((state) => state.player.points)
  const stamina = useGameStore((state) => state.player.stamina)
  const mountains = useGameStore((state) => state.mountains)
  const addPoints = useGameStore((state) => state.addPoints)
  const addStamina = useGameStore((state) => state.addStamina)
  const maintainMountain = useGameStore((state) => state.maintainMountain)
  const degradeMountain = useGameStore((state) => state.degradeMountain)

  const [selectedMountain, setSelectedMountain] = useState('takao')
  const [selectedMenu, setSelectedMenu] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const checkDegradation = () => {
      MOUNTAINS.forEach(m => {
        const mountain = mountains[m.id]
        if (!mountain) return
        if (!mountain.lastMaintained) return
        const lastMaintained = new Date(mountain.lastMaintained)
        const now = new Date()
        const hoursPassed = (now - lastMaintained) / (1000 * 60 * 60)
        if (hoursPassed >= 24) {
          degradeMountain(m.id, 5)
        }
      })
    }
    checkDegradation()
  }, [])

  const handleMaintain = () => {
    if (!selectedMenu) return
    if (points < selectedMenu.cost) {
      setMessage('ポイントが足りないよ！')
      setShowConfirm(false)
      return
    }
    if (stamina < selectedMenu.staminaCost) {
      setMessage('体力が足りないよ！')
      setShowConfirm(false)
      return
    }
    addPoints(-selectedMenu.cost)
    addStamina(-selectedMenu.staminaCost)
    maintainMountain(selectedMountain, selectedMenu.effect)
    setMessage(`${selectedMenu.name}を実施したよ！山の状態が回復したね！`)
    setShowConfirm(false)
    setSelectedMenu(null)
  }

  const getMaintenanceColor = (level) => {
    if (level >= 70) return '#4dff91'
    if (level >= 40) return '#ffd700'
    return '#ff4444'
  }

  const getMaintenanceLabel = (level) => {
    if (level >= 70) return '良好'
    if (level >= 40) return '要注意'
    return '荒廃中'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1a2f1a 0%, #2d4a2d 100%)',
      paddingBottom: '70px',
    }}>

      <Toast message={message} onClose={() => setMessage('')} />

      {/* ヘッダー */}
      <div style={{
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <h2 style={{ color: '#fff', fontSize: '20px' }}>🌿 山整備</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ color: '#ffd700', fontSize: '13px' }}>⭐{points.toLocaleString()}</span>
          <span style={{ color: '#fff', fontSize: '13px' }}>💪{stamina}</span>
        </div>
      </div>

      {/* 山の状態一覧 */}
      <div style={{ padding: '16px' }}>
        <p style={{ color: '#aaa', fontSize: '12px', marginBottom: '12px' }}>
          山を選んで整備しよう！
        </p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {MOUNTAINS.map(m => {
            const mountain = mountains[m.id]
            const level = mountain?.maintenanceLevel ?? 100
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMountain(m.id)}
                style={{
                  flex: 1,
                  backgroundColor: selectedMountain === m.id
                    ? 'rgba(74,143,63,0.3)'
                    : 'rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '12px 8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: selectedMountain === m.id
                    ? '1px solid #4a8f3f'
                    : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <p style={{ fontSize: '24px' }}>{m.icon}</p>
                <p style={{ color: '#fff', fontSize: '11px', marginTop: '4px' }}>
                  {m.name.length > 4 ? m.name.slice(0, 4) : m.name}
                </p>
                <p style={{
                  color: getMaintenanceColor(level),
                  fontSize: '11px',
                  marginTop: '4px',
                  fontWeight: 'bold',
                }}>
                  {getMaintenanceLabel(level)}
                </p>
                <div style={{
                  width: '100%',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  height: '6px',
                  marginTop: '6px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${level}%`,
                    height: '100%',
                    backgroundColor: getMaintenanceColor(level),
                    borderRadius: '4px',
                  }} />
                </div>
                <p style={{ color: '#aaa', fontSize: '10px', marginTop: '4px' }}>
                  {level}%
                </p>
              </div>
            )
          })}
        </div>

        {/* 整備メニュー */}
        <p style={{ color: '#aaa', fontSize: '12px', marginBottom: '12px' }}>
          整備メニューを選んでね
        </p>
        {MAINTENANCE_MENUS.map(menu => (
          <div
            key={menu.id}
            onClick={() => {
              setSelectedMenu(menu)
              setShowConfirm(false)
              setMessage('')
            }}
            style={{
              backgroundColor: selectedMenu?.id === menu.id
                ? 'rgba(74,143,63,0.3)'
                : 'rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              border: selectedMenu?.id === menu.id
                ? '1px solid #4a8f3f'
                : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ fontSize: '28px' }}>{menu.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                {menu.name}
              </p>
              <p style={{ color: '#aaa', fontSize: '11px', marginTop: '2px' }}>
                ⭐{menu.cost.toLocaleString()} ／ 💪{menu.staminaCost} ／ ⏱{menu.time}
              </p>
            </div>
            <span style={{ color: '#4dff91', fontSize: '13px', fontWeight: 'bold' }}>
              +{menu.effect}%
            </span>
          </div>
        ))}
      </div>

      {/* 実施確認 */}
      {selectedMenu && (
        <div style={{
          position: 'fixed',
          bottom: '65px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#1a2f1a',
          borderTop: '1px solid rgba(255,255,255,0.2)',
          padding: '16px',
        }}>
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', marginBottom: '6px' }}>
            {selectedMenu.icon} {selectedMenu.name}
          </p>
          <p style={{ color: '#aaa', fontSize: '12px', marginBottom: '12px' }}>
            {selectedMenu.description}
          </p>

          {!showConfirm ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setSelectedMenu(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#aaa',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                閉じる
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                style={{
                  flex: 2,
                  padding: '10px',
                  backgroundColor: '#4a8f3f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                実施する
              </button>
            </div>
          ) : (
            <div>
              <p style={{ color: '#fff', fontSize: '14px', marginBottom: '12px', textAlign: 'center' }}>
                実施してよろしいですか？
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: '#aaa',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  いいえ
                </button>
                <button
                  onClick={handleMaintain}
                  style={{
                    flex: 2,
                    padding: '10px',
                    backgroundColor: '#4a8f3f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  はい
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

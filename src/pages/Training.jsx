import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'

const TRAINING_MENUS = [
  { id: 'stretch_neck', name: '首ストレッチ', duration: 60, stamina: 10, icon: '🧘' },
  { id: 'stretch_leg', name: '腿裏ストレッチ', duration: 120, stamina: 20, icon: '🦵' },
  { id: 'squat', name: 'スクワット', duration: 180, stamina: 30, icon: '🏋️' },
  { id: 'pushup', name: '腕立て', duration: 60, stamina: 20, icon: '💪' },
  { id: 'situp', name: '腹筋', duration: 180, stamina: 30, icon: '🔥' },
  { id: 'walk', name: 'ウォーキング', duration: 300, stamina: 50, icon: '🚶' },
]

export default function Training() {
  const stamina = useGameStore((state) => state.player.stamina)
  const addStamina = useGameStore((state) => state.addStamina)
  const [gameState, setGameState] = useState('idle') // idle / training / complete / failed
  const [selectedMenu, setSelectedMenu] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [timerId, setTimerId] = useState(null)

  const handleStart = (menu) => {
    setSelectedMenu(menu)
    setTimeLeft(menu.duration)
    setGameState('training')

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          setGameState('complete')
          addStamina(menu.stamina)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    setTimerId(id)
  }

  const handleGiveUp = () => {
    if (timerId) clearInterval(timerId)
    setGameState('failed')
  }

  const handleBack = () => {
    setGameState('idle')
    setSelectedMenu(null)
    setTimeLeft(0)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #2c3e50 0%, #3a7d44 100%)',
      paddingBottom: '70px',
    }}>

      {/* ヘッダー */}
      <div style={{
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h2 style={{ color: '#fff', fontSize: '20px' }}>トレーニング</h2>
        <span style={{ color: '#fff', fontSize: '14px' }}>💪 {stamina}</span>
      </div>

      {/* メニュー選択 */}
      {gameState === 'idle' && (
        <div style={{ padding: '0 16px' }}>
          <p style={{
            color: '#ccc',
            fontSize: '13px',
            marginBottom: '16px',
            textAlign: 'center',
          }}>
            トレーニングメニューを選んでね！
          </p>
          {TRAINING_MENUS.map((menu) => (
            <div
              key={menu.id}
              onClick={() => handleStart(menu)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <span style={{ fontSize: '32px' }}>{menu.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
                  {menu.name}
                </p>
                <p style={{ color: '#aaa', fontSize: '12px', marginTop: '4px' }}>
                  {menu.duration}秒 ／ 💪+{menu.stamina}
                </p>
              </div>
              <span style={{ color: '#4a8f3f', fontSize: '20px' }}>▶</span>
            </div>
          ))}
        </div>
      )}

      {/* トレーニング中 */}
      {gameState === 'training' && selectedMenu && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 16px',
          gap: '24px',
        }}>
          <span style={{ fontSize: '64px' }}>{selectedMenu.icon}</span>
          <h3 style={{ color: '#fff', fontSize: '24px' }}>{selectedMenu.name}</h3>

          {/* タイマー */}
          <div style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '4px solid #4a8f3f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: timeLeft <= 10 ? '#ff4444' : '#fff',
            }}>
              {timeLeft}
            </span>
          </div>

          <p style={{ color: '#aaa', fontSize: '14px' }}>
            完了で 💪+{selectedMenu.stamina}
          </p>

          <button
            onClick={handleGiveUp}
            style={{
              padding: '12px 32px',
              fontSize: '14px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: '#aaa',
              border: '1px solid #aaa',
              borderRadius: '24px',
              cursor: 'pointer',
            }}
          >
            やめる
          </button>
        </div>
      )}

      {/* 完了 */}
      {gameState === 'complete' && selectedMenu && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 16px',
          gap: '20px',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '64px' }}>🎉</span>
          <h3 style={{ color: '#fff', fontSize: '24px' }}>おつかれさま！</h3>
          <p style={{ color: '#4dff91', fontSize: '20px', fontWeight: 'bold' }}>
            💪 +{selectedMenu.stamina} 獲得！
          </p>
          <p style={{ color: '#aaa', fontSize: '14px' }}>
            現在の体力レベル：{stamina}
          </p>
          <button
            onClick={handleBack}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              backgroundColor: '#4a8f3f',
              color: '#fff',
              border: 'none',
              borderRadius: '24px',
              cursor: 'pointer',
            }}
          >
            メニューに戻る
          </button>
        </div>
      )}

      {/* やめた */}
      {gameState === 'failed' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 16px',
          gap: '20px',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '64px' }}>😅</span>
          <h3 style={{ color: '#fff', fontSize: '24px' }}>また次回がんばろう！</h3>
          <button
            onClick={handleBack}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              backgroundColor: '#888',
              color: '#fff',
              border: 'none',
              borderRadius: '24px',
              cursor: 'pointer',
            }}
          >
            メニューに戻る
          </button>
        </div>
      )}

    </div>
  )
}

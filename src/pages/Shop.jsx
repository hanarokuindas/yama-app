import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import items from '../data/items.json'
import Toast from '../components/Toast'


const CATEGORIES = ['すべて', 'ウェア', 'シューズ', 'バッグ', '小物', '食料', '救急', '道具', '必需品']

export default function Shop() {
  const points = useGameStore((state) => state.player.points)
  const inventory = useGameStore((state) => state.inventory)
  const addItem = useGameStore((state) => state.addItem)
  const addPoints = useGameStore((state) => state.addPoints)
  const [selectedCategory, setSelectedCategory] = useState('すべて')
  const [selectedItem, setSelectedItem] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState('')

  const filteredItems = selectedCategory === 'すべて'
    ? items
    : items.filter(item => item.category === selectedCategory)

  const isOwned = (itemId) => inventory.some(i => i.id === itemId)

  const handleBuy = () => {
    if (!selectedItem) return
    if (points < selectedItem.price) {
      setMessage('ポイントが足りないよ！')
      setShowConfirm(false)
      return
    }
    addPoints(-selectedItem.price)
    addItem(selectedItem)
    setMessage(`${selectedItem.name}を購入したよ！`)
    setShowConfirm(false)
    setSelectedItem(null)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #2c1810 0%, #4a3728 100%)',
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
        <h2 style={{ color: '#fff', fontSize: '20px' }}>🏪 登山ショップ</h2>
        <span style={{ color: '#ffd700', fontSize: '16px', fontWeight: 'bold' }}>
          ⭐ {points.toLocaleString()}
        </span>
      </div>

      {/* メッセージ */}
      {message && (
        <div style={{
          backgroundColor: '#4a8f3f',
          color: '#fff',
          padding: '10px 16px',
          textAlign: 'center',
          fontSize: '14px',
        }}>
          {message}
          <button
            onClick={() => setMessage('')}
            style={{
              marginLeft: '12px',
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >✕</button>
        </div>
      )}

      {/* カテゴリー */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        overflowX: 'auto',
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: selectedCategory === cat ? '#4a8f3f' : 'rgba(255,255,255,0.15)',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* アイテム一覧 */}
      <div style={{ padding: '0 16px' }}>
        {filteredItems.map(item => (
          <div
            key={item.id}
            onClick={() => {
              setSelectedItem(item)
              setShowConfirm(false)
              setMessage('')
            }}
            style={{
              backgroundColor: selectedItem?.id === item.id
                ? 'rgba(74,143,63,0.3)'
                : 'rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              border: selectedItem?.id === item.id
                ? '1px solid #4a8f3f'
                : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ fontSize: '28px' }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                {item.name}
              </p>
              <p style={{ color: '#aaa', fontSize: '12px' }}>{item.category}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              {isOwned(item.id) ? (
                <span style={{ color: '#4dff91', fontSize: '20px' }}>✓</span>
              ) : (
                <span style={{ color: '#ffd700', fontSize: '13px' }}>
                  ⭐{item.price === 0 ? '無料' : item.price.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* アイテム詳細・購入 */}
      {selectedItem && (
        <div style={{
          position: 'fixed',
          bottom: '65px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#2a1a0e',
          borderTop: '1px solid rgba(255,255,255,0.2)',
          padding: '16px',
        }}>
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', marginBottom: '8px' }}>
            {selectedItem.icon} {selectedItem.name}
          </p>
          <p style={{ color: '#aaa', fontSize: '12px', marginBottom: '12px', lineHeight: '1.6' }}>
            {selectedItem.advice}
          </p>

          {!showConfirm ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setSelectedItem(null)}
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
              {!isOwned(selectedItem.id) && (
                <button
                  onClick={() => setShowConfirm(true)}
                  style={{
                    flex: 2,
                    padding: '10px',
                    backgroundColor: points >= selectedItem.price ? '#4a8f3f' : '#666',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  購入 ⭐{selectedItem.price === 0 ? '無料' : selectedItem.price.toLocaleString()}
                </button>
              )}
              {isOwned(selectedItem.id) && (
                <div style={{
                  flex: 2,
                  padding: '10px',
                  backgroundColor: 'rgba(77,255,145,0.2)',
                  color: '#4dff91',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '14px',
                }}>
                  ✓ 購入済み
                </div>
              )}
            </div>
          ) : (
            <div>
              <p style={{ color: '#fff', fontSize: '14px', marginBottom: '12px', textAlign: 'center' }}>
                購入してよろしいですか？
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
                  onClick={handleBuy}
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

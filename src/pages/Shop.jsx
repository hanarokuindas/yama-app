import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import itemsData from '../data/items.json'

const CATEGORIES = ['すべて', 'ウェア', 'シューズ', '小物', 'バッグ', '食料', '道具', '救急', '必需品']

export default function Shop() {
  const player = useGameStore((s) => s.player)
  const inventory = useGameStore((s) => s.inventory)
  const spendPoints = useGameStore((s) => s.spendPoints)
  const addItem = useGameStore((s) => s.addItem)

  const [cat, setCat] = useState('すべて')
  const [preview, setPreview] = useState(null)
  const [bought, setBought] = useState(null)

  const ownedIds = new Set(inventory.map((i) => i.id))

  const filtered = cat === 'すべて' ? itemsData : itemsData.filter((i) => i.category === cat)

  const handleBuy = (item) => {
    if (item.price > 0 && !spendPoints(item.price)) {
      alert('ポイントが足りません')
      return
    }
    addItem(item)
    setBought(item.name)
    setPreview(null)
    setTimeout(() => setBought(null), 2000)
  }

  if (preview) {
    const owned = ownedIds.has(preview.id)
    return (
      <div style={styles.container}>
        <div style={styles.previewCard}>
          <span style={{ fontSize: 56 }}>{preview.icon}</span>
          <h3 style={styles.title}>{preview.name}</h3>
          <span style={styles.catTag}>{preview.category}</span>
          <div style={styles.adviceBox}>
            <p style={{ color: '#ffd700', fontSize: 12, marginBottom: 4 }}>先輩のアドバイス</p>
            <p style={{ color: '#ddd', fontSize: 14, lineHeight: 1.7 }}>{preview.advice}</p>
          </div>
          <p style={{ color: '#ffd700', fontSize: 22, fontWeight: 'bold' }}>
            {preview.price === 0 ? '無料' : `${preview.price.toLocaleString()}pt`}
          </p>
          {owned ? (
            <p style={{ color: '#27ae60', fontSize: 15 }}>✅ 購入済み</p>
          ) : (
            <button style={styles.primaryBtn} onClick={() => handleBuy(preview)}>購入する</button>
          )}
          <button style={styles.backBtn} onClick={() => setPreview(null)}>戻る</button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.pageTitle}>登山ショップ</h2>
      <div style={styles.pointsBar}>
        <span style={{ color: '#fff', fontSize: 14 }}>⭐ 所持: {player.points.toLocaleString()}pt</span>
      </div>

      {bought && (
        <div style={styles.toast}>✅ {bought} を購入しました！</div>
      )}

      {/* カテゴリフィルター */}
      <div style={styles.catRow}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            style={{ ...styles.catBtn, background: cat === c ? '#27ae60' : 'rgba(255,255,255,0.1)' }}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* アイテム一覧 */}
      <div style={styles.itemGrid}>
        {filtered.map((item) => {
          const owned = ownedIds.has(item.id)
          return (
            <button key={item.id} style={styles.itemCard} onClick={() => setPreview(item)}>
              <span style={{ fontSize: 32 }}>{item.icon}</span>
              <span style={styles.itemName}>{item.name}</span>
              <span style={styles.itemPrice}>
                {item.price === 0 ? '無料' : `${item.price.toLocaleString()}pt`}
              </span>
              {owned && <span style={styles.ownedBadge}>済</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #1a1a3e 0%, #2d3a5c 100%)',
    paddingBottom: 80,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  pageTitle: { color: '#fff', fontSize: 22, padding: '16px 0 4px' },
  pointsBar: {
    background: 'rgba(0,0,0,0.3)',
    padding: '6px 16px',
    borderRadius: 20,
    marginBottom: 12,
  },
  catRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    padding: '0 12px',
    marginBottom: 12,
    justifyContent: 'center',
  },
  catBtn: {
    padding: '4px 10px',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
  },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 10,
    width: 'calc(100% - 24px)',
    maxWidth: 380,
  },
  itemCard: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    position: 'relative',
  },
  itemName: { color: '#fff', fontSize: 11, textAlign: 'center', lineHeight: 1.3 },
  itemPrice: { color: '#ffd700', fontSize: 12, fontWeight: 'bold' },
  ownedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    background: '#27ae60',
    color: '#fff',
    fontSize: 10,
    padding: '1px 5px',
    borderRadius: 8,
  },
  previewCard: {
    margin: '32px 16px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: '28px 24px',
    width: 'calc(100% - 32px)',
    maxWidth: 340,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    backdropFilter: 'blur(8px)',
    textAlign: 'center',
  },
  title: { color: '#fff', fontSize: 20, margin: 0 },
  catTag: {
    background: 'rgba(39,174,96,0.3)',
    color: '#27ae60',
    fontSize: 12,
    padding: '2px 10px',
    borderRadius: 10,
    border: '1px solid #27ae60',
  },
  adviceBox: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: '12px 14px',
    width: '100%',
    textAlign: 'left',
    boxSizing: 'border-box',
  },
  primaryBtn: {
    width: '100%',
    padding: '12px 0',
    background: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: 24,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  backBtn: {
    width: '100%',
    padding: '10px 0',
    background: 'rgba(255,255,255,0.08)',
    color: '#aaa',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 24,
    fontSize: 14,
    cursor: 'pointer',
  },
  toast: {
    position: 'fixed',
    bottom: 90,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#27ae60',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 20,
    fontSize: 14,
    zIndex: 100,
    boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
  },
}

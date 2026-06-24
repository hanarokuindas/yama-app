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
      <div style={styles.pageTitle}>SHOP</div>
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
            style={{ ...styles.catBtn, background: cat === c ? 'linear-gradient(135deg, #f5c842, #e0a800)' : 'rgba(255,255,255,0.05)', color: cat === c ? '#3a2a00' : '#fff', borderColor: cat === c ? 'transparent' : 'rgba(255,255,255,0.12)' }}
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
    background: 'linear-gradient(180deg, #0a0a1a 0%, #0d1a2a 50%, #0a1a12 100%)',
    paddingBottom: 80,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  pageTitle: { color: '#f5c842', fontSize: 12, fontWeight: 700, letterSpacing: 3, padding: '18px 0 10px' },
  pointsBar: {
    background: 'rgba(245,200,66,0.12)',
    border: '1px solid rgba(245,200,66,0.3)',
    padding: '6px 18px',
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
    padding: '5px 12px',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
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
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    position: 'relative',
  },
  itemName: { color: '#fff', fontSize: 11, fontWeight: 700, textAlign: 'center', lineHeight: 1.3 },
  itemPrice: { color: '#f5c842', fontSize: 12, fontWeight: 900 },
  ownedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    background: '#2ecc71',
    color: '#fff',
    fontSize: 10,
    fontWeight: 900,
    padding: '1px 6px',
    borderRadius: 8,
  },
  previewCard: {
    margin: '32px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(245,200,66,0.2)',
    borderRadius: 24,
    padding: '28px 24px',
    width: 'calc(100% - 32px)',
    maxWidth: 340,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    backdropFilter: 'blur(12px)',
    textAlign: 'center',
    boxShadow: '0 0 40px rgba(123,92,240,0.15)',
  },
  title: { color: '#fff', fontSize: 20, fontWeight: 900, margin: 0 },
  catTag: {
    background: 'rgba(245,200,66,0.15)',
    color: '#f5c842',
    fontSize: 12,
    fontWeight: 700,
    padding: '3px 12px',
    borderRadius: 12,
    border: '1px solid rgba(245,200,66,0.4)',
  },
  adviceBox: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: '12px 14px',
    width: '100%',
    textAlign: 'left',
    boxSizing: 'border-box',
  },
  primaryBtn: {
    width: '100%',
    padding: '14px 0',
    background: 'linear-gradient(135deg, #2ecc71, #1a8a47)',
    color: '#fff',
    border: 'none',
    borderRadius: 30,
    fontSize: 16,
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(46,204,113,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
  },
  backBtn: {
    width: '100%',
    padding: '11px 0',
    background: 'rgba(255,255,255,0.08)',
    color: '#aab',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 30,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  toast: {
    position: 'fixed',
    bottom: 90,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #2ecc71, #1a8a47)',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 700,
    zIndex: 100,
    boxShadow: '0 4px 16px rgba(46,204,113,0.4)',
  },
}

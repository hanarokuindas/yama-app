import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'

export default function Menu() {
  const player = useGameStore((s) => s.player)
  const setPlayerName = useGameStore((s) => s.setPlayerName)
  const setPlayerWeight = useGameStore((s) => s.setPlayerWeight)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(player.name)
  const [weight, setWeight] = useState(player.weight)

  const total = Math.floor((player.core + player.legs + player.arms) / 3)

  const saveProfile = () => {
    if (name.trim()) setPlayerName(name.trim())
    const w = parseFloat(weight)
    if (!isNaN(w) && w > 0) setPlayerWeight(w)
    setEditing(false)
  }

  const menuLinks = [
    { to: '/shop', icon: '🛒', label: '登山ショップ' },
    { to: '/climbing', icon: '⛰️', label: '登山' },
    { to: '/explore', icon: '🔍', label: '山探索' },
    { to: '/training', icon: '💪', label: 'トレーニング' },
    { to: '/maintenance', icon: '🪚', label: '山整備' },
    { to: '/album', icon: '📷', label: 'アルバム' },
    { to: '/ar', icon: '📱', label: 'AR撮影' },
  ]

  return (
    <div style={styles.container}>
      <div style={styles.title}>MENU</div>

      {/* プロフィールカード */}
      <div style={styles.profileCard}>
        {!editing ? (
          <>
            <div style={styles.profileRow}>
              <span style={styles.avatar}>🧗</span>
              <div>
                <p style={styles.profileName}>{player.name || 'プレイヤー'}</p>
                <p style={styles.profileSub}>体重: {player.weight}kg</p>
              </div>
              <button style={styles.editBtn} onClick={() => { setName(player.name); setWeight(player.weight); setEditing(true) }}>
                編集
              </button>
            </div>
            <div style={styles.statRow}>
              <Stat label="体幹" value={player.core} color="#e67e22" />
              <Stat label="脚力" value={player.legs} color="#27ae60" />
              <Stat label="腕力" value={player.arms} color="#2980b9" />
              <Stat label="総合" value={total} color="#9b59b6" />
            </div>
            <p style={{ color: '#ffd700', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
              ⭐ {player.points.toLocaleString()}pt 所持
            </p>
          </>
        ) : (
          <div>
            <label style={styles.label}>ニックネーム</label>
            <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} maxLength={12} />
            <label style={styles.label}>体重 (kg)</label>
            <input style={styles.input} type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button style={styles.saveBtn} onClick={saveProfile}>保存</button>
              <button style={{ ...styles.saveBtn, background: 'rgba(255,255,255,0.1)' }} onClick={() => setEditing(false)}>キャンセル</button>
            </div>
          </div>
        )}
      </div>

      {/* リンクメニュー */}
      <div style={styles.linkList}>
        {menuLinks.map((item) => (
          <Link key={item.to} to={item.to} style={styles.linkItem}>
            <span style={{ fontSize: 24 }}>{item.icon}</span>
            <span style={styles.linkLabel}>{item.label}</span>
            <span style={{ color: '#aaa' }}>›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ color, fontWeight: 'bold', fontSize: 16 }}>{value}</div>
      <div style={{ color: '#aaa', fontSize: 11 }}>{label}</div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a1a 0%, #0d1a2a 100%)',
    paddingBottom: 80,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: { color: '#f5c842', fontSize: 12, fontWeight: 700, letterSpacing: 3, padding: '18px 0 10px' },
  profileCard: {
    width: 'calc(100% - 32px)',
    maxWidth: 380,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(245,200,66,0.2)',
    borderRadius: 16,
    padding: '16px 20px',
    marginBottom: 16,
    boxSizing: 'border-box',
  },
  profileRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { fontSize: 40, flexShrink: 0 },
  profileName: { color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 },
  profileSub: { color: '#aab', fontSize: 13, margin: 0 },
  editBtn: {
    marginLeft: 'auto',
    padding: '5px 14px',
    background: 'rgba(245,200,66,0.12)',
    color: '#f5c842',
    border: '1px solid rgba(245,200,66,0.3)',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  statRow: { display: 'flex', marginBottom: 8 },
  label: { display: 'block', color: '#aab', fontSize: 12, marginBottom: 4, marginTop: 8 },
  input: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 15,
    boxSizing: 'border-box',
    outline: 'none',
  },
  saveBtn: {
    flex: 1,
    padding: '12px 0',
    background: 'linear-gradient(135deg, #2ecc71, #1a8a47)',
    color: '#fff',
    border: 'none',
    borderRadius: 24,
    fontSize: 14,
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(46,204,113,0.3)',
  },
  linkList: {
    width: 'calc(100% - 32px)',
    maxWidth: 380,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  linkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: '14px 16px',
    textDecoration: 'none',
  },
  linkLabel: { color: '#fff', fontSize: 15, fontWeight: 700, flex: 1 },
}

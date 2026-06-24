import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import charactersData from '../data/characters.json'

const TABS = ['山神', '登頂記録', '所持装備']

const CHAR_EMOJIS = {
  yatsugatake: '⛰️',
  takao: '🌲',
  hakone: '🌋',
  senpai: '👤',
}

export default function Album() {
  const inventory = useGameStore((s) => s.inventory)
  const mountains = useGameStore((s) => s.mountains)
  const album = useGameStore((s) => s.album)
  const [tab, setTab] = useState('登頂記録')

  return (
    <div style={styles.container}>
      <div style={styles.title}>ALBUM</div>

      {/* タブ */}
      <div style={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t}
            style={{ ...styles.tabBtn, borderBottom: tab === t ? '2px solid #f5c842' : '2px solid transparent', color: tab === t ? '#f5c842' : '#667' }}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 山神タブ */}
      {tab === '山神' && (
        <div style={styles.list}>
          {Object.values(charactersData).map((char) => {
            const mt = mountains[char.id]
            const unlocked = char.id === 'senpai' || mt?.unlocked
            const accessed = char.id === 'senpai' || mt?.firstAccessed
            return (
              <div key={char.id} style={{ ...styles.charCard, opacity: unlocked ? 1 : 0.4 }}>
                <div style={{ ...styles.charIcon, background: accessed ? '#27ae60' : '#555' }}>
                  {accessed ? CHAR_EMOJIS[char.id] || '👤' : '🔒'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={styles.charName}>{accessed ? char.name : '？？？'}</p>
                  <p style={styles.charSub}>{accessed ? char.intro?.[0] : '未解禁'}</p>
                  {mt && accessed && (
                    <p style={{ color: '#27ae60', fontSize: 11, marginTop: 2 }}>
                      登頂済：{mt.summitedCourses.length}コース
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 登頂記録タブ */}
      {tab === '登頂記録' && (
        <div style={styles.list}>
          {album.length === 0 && (
            <div style={styles.empty}>
              <span style={{ fontSize: 48 }}>🏔️</span>
              <p>まだ登頂記録がないよ！</p>
              <p style={{ fontSize: 12, color: '#888' }}>登山に挑戦してみよう！</p>
            </div>
          )}
          {[...album].reverse().map((entry, i) => (
            <div key={i} style={styles.albumCard}>
              <div style={styles.albumTop}>
                <span style={{ color: '#aaa', fontSize: 12 }}>{entry.mountainName}</span>
                <span style={{ color: '#27ae60', fontSize: 12 }}>🏔️ 登頂済</span>
              </div>
              <p style={styles.courseName}>{entry.courseName}</p>
              <p style={{ color: '#888', fontSize: 11 }}>{new Date(entry.date).toLocaleDateString('ja-JP')}</p>
            </div>
          ))}
        </div>
      )}

      {/* 所持装備タブ */}
      {tab === '所持装備' && (
        <div style={styles.list}>
          {inventory.length === 0 ? (
            <div style={styles.empty}>
              <span style={{ fontSize: 48 }}>🎒</span>
              <p>まだ装備がないよ！</p>
              <p style={{ fontSize: 12, color: '#888' }}>ショップで揃えよう！</p>
            </div>
          ) : (
            inventory.map((item, i) => (
              <div key={i} style={styles.itemRow}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{item.name}</p>
                  <p style={{ color: '#aaa', fontSize: 11 }}>{item.category}</p>
                </div>
                <span style={{ color: '#27ae60' }}>✓</span>
              </div>
            ))
          )}
        </div>
      )}
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
  tabs: {
    display: 'flex',
    width: '100%',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    padding: '10px 4px',
    background: 'none',
    border: 'none',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  list: {
    width: 'calc(100% - 32px)',
    maxWidth: 380,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  charCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: '14px 16px',
  },
  charIcon: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    flexShrink: 0,
  },
  charName: { color: '#fff', fontSize: 16, fontWeight: 'bold', margin: 0 },
  charSub: { color: '#aaa', fontSize: 12, margin: '2px 0 0' },
  albumCard: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(39,174,96,0.3)',
    borderRadius: 12,
    padding: '12px 14px',
  },
  albumTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  courseName: { color: '#fff', fontSize: 15, fontWeight: 'bold', margin: 0 },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '10px 14px',
  },
  empty: {
    textAlign: 'center',
    padding: 40,
    color: '#aaa',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
}

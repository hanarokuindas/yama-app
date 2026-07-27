import { useState } from 'react'
import { BG } from '../assets/backgrounds'
import GameIcon from '../components/GameIcon'
import Specimen from '../components/Specimen'
import { useGameStore } from '../stores/gameStore'
import charactersData from '../data/characters.json'
import encyclopedia from '../data/encyclopedia.json'
import { sfx } from '../utils/sound'

const TABS = ['図鑑', '山神', '登頂記録', '所持装備']

const CHAR_EMOJIS = {
  yatsugatake: 'mountain',
  takao: 'forest',
  hakone: 'volcano',
  senpai: 'user',
}

export default function Album() {
  const inventory = useGameStore((s) => s.inventory)
  const mountains = useGameStore((s) => s.mountains)
  const album = useGameStore((s) => s.album)
  const discovered = useGameStore((s) => s.discovered)
  const [tab, setTab] = useState('図鑑')
  const [encArea, setEncArea] = useState('rock')
  const [detail, setDetail] = useState(null)

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

      {/* 図鑑タブ */}
      {tab === '図鑑' && (
        <Encyclopedia
          discovered={discovered}
          encArea={encArea} setEncArea={setEncArea}
          detail={detail} setDetail={setDetail}
        />
      )}

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
                  <GameIcon name={accessed ? CHAR_EMOJIS[char.id] || 'user' : 'lock'} size={34} />
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
              <GameIcon name="mountain" size={52} />
              <p>まだ登頂記録がないよ！</p>
              <p style={{ fontSize: 12, color: '#888' }}>登山に挑戦してみよう！</p>
            </div>
          )}
          {[...album].reverse().map((entry, i) => (
            <div key={i} style={styles.albumCard}>
              <div style={styles.albumTop}>
                <span style={{ color: '#aaa', fontSize: 12 }}>{entry.mountainName}</span>
                <span style={{ color: '#27ae60', fontSize: 12 }}>登頂済</span>
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
              <GameIcon name="backpack" size={52} />
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
                <GameIcon name="check" size={18} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}


/* ─────────────── 図鑑 ─────────────── */
const ENC_AREAS = [
  { id: 'rock', name: '岩場', sub: '鉱物', icon: 'gem', color: '#7c3aed' },
  { id: 'trail', name: '登山道', sub: '動物', icon: 'paw', color: '#059669' },
  { id: 'meadow', name: '草原', sub: '植物', icon: 'blossom', color: '#db2777' },
]

function Encyclopedia({ discovered, encArea, setEncArea, detail, setDetail }) {
  const list = encyclopedia.filter((e) => e.area === encArea)
  const got = list.filter((e) => discovered.includes(e.id)).length
  const totalAll = encyclopedia.length
  const gotAll = discovered.length

  return (
    <div style={styles.encWrap}>
      {/* 全体のコンプ率 */}
      <div style={styles.encHeader}>
        <div>
          <div style={styles.encHeaderLabel}>コンプリート率</div>
          <div style={styles.encHeaderValue}>
            {Math.round((gotAll / totalAll) * 100)}<span style={{ fontSize: 13 }}>%</span>
            <span style={styles.encHeaderSub}> {gotAll} / {totalAll} 種</span>
          </div>
        </div>
        <div style={styles.encHeaderBarBg}>
          <div style={{ ...styles.encHeaderBarFill, width: `${(gotAll / totalAll) * 100}%` }} />
        </div>
      </div>

      {/* エリア切替 */}
      <div style={styles.encTabs}>
        {ENC_AREAS.map((a) => {
          const on = encArea === a.id
          return (
            <button key={a.id}
              style={{
                ...styles.encTab,
                background: on ? `${a.color}33` : 'rgba(255,255,255,0.05)',
                borderColor: on ? `${a.color}aa` : 'rgba(255,255,255,0.1)',
              }}
              onClick={() => { sfx.tap(); setEncArea(a.id) }}>
              <GameIcon name={a.icon} size={22} />
              <span style={{ color: on ? '#fff' : '#aab', fontSize: 11, fontWeight: 700 }}>{a.name}</span>
              <span style={{ color: '#8a90a8', fontSize: 9 }}>{a.sub}</span>
            </button>
          )
        })}
      </div>

      <div style={styles.encCount}>このエリア {got} / {list.length} 種</div>

      {/* グリッド */}
      <div style={styles.encGrid}>
        {list.map((e) => {
          const found = discovered.includes(e.id)
          return (
            <button key={e.id}
              style={{ ...styles.encCell, opacity: found ? 1 : 0.5 }}
              onClick={() => { if (found) { sfx.tap(); setDetail(e) } else sfx.miss() }}>
              {found
                ? <Specimen sp={e} size={34} />
                : <GameIcon name="lock" size={22} style={{ filter: 'grayscale(1)' }} />}
              <span style={styles.encCellName}>{found ? e.name : '???'}</span>
              {e.mountain && found && <span style={styles.encCellTag}>固有</span>}
            </button>
          )
        })}
      </div>

      {/* 詳細 */}
      {detail && (
        <button style={styles.encDetailOverlay} onClick={() => setDetail(null)}>
          <div style={styles.encDetailCard} onClick={(ev) => ev.stopPropagation()}>
            <div style={{ margin: '4px 0 8px' }}><Specimen sp={detail} size={68} style={{ margin: '0 auto' }} /></div>
            <h3 style={styles.encDetailName}>{detail.name}</h3>
            {detail.reading && <p style={styles.encDetailReading}>{detail.reading}</p>}
            <div style={styles.encDetailMeta}>
              <span style={styles.encDetailChip}>{detail.areaName}</span>
              {detail.mountain && <span style={styles.encDetailChip}>固有種</span>}
              {detail.course && <span style={styles.encDetailChip}>{detail.course}</span>}
            </div>
            <p style={styles.encDetailDesc}>{detail.desc}</p>
            <button style={styles.encDetailClose} onClick={() => setDetail(null)}>閉じる</button>
          </div>
        </button>
      )}
    </div>
  )
}

const styles = {
  /* ── 図鑑 ── */
  encWrap: { width: 'calc(100% - 32px)', maxWidth: 380, paddingBottom: 20 },
  encHeader: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,200,66,0.25)',
    borderRadius: 14, padding: '12px 14px', marginBottom: 12,
  },
  encHeaderLabel: { color: '#8a90a8', fontSize: 10, fontWeight: 700 },
  encHeaderValue: { color: '#f5c842', fontSize: 24, fontWeight: 900, lineHeight: 1.2 },
  encHeaderSub: { color: '#aab', fontSize: 11, fontWeight: 700, marginLeft: 6 },
  encHeaderBarBg: { height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 99, overflow: 'hidden', marginTop: 8 },
  encHeaderBarFill: { height: '100%', background: 'linear-gradient(90deg,#f5c842,#ffe98a)', borderRadius: 99, transition: 'width 0.6s ease' },

  encTabs: { display: 'flex', gap: 8, marginBottom: 10 },
  encTab: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    border: '1.5px solid', borderRadius: 12, padding: '9px 4px', cursor: 'pointer',
  },
  encCount: { color: '#aab', fontSize: 11, marginBottom: 8, textAlign: 'right' },

  encGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 },
  encCell: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, padding: '10px 4px 8px', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    position: 'relative', minHeight: 76,
  },
  encCellName: {
    color: '#dde', fontSize: 8.5, fontWeight: 700, lineHeight: 1.25,
    textAlign: 'center', wordBreak: 'break-all',
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  encCellTag: {
    position: 'absolute', top: 3, right: 3,
    background: 'rgba(245,200,66,0.9)', color: '#1a0e00',
    fontSize: 7, fontWeight: 900, borderRadius: 4, padding: '1px 3px',
  },

  encDetailOverlay: {
    position: 'fixed', inset: 0, zIndex: 500,
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', cursor: 'pointer', padding: 20,
  },
  encDetailCard: {
    background: 'linear-gradient(180deg,#1e1e3c 0%,#12122a 100%)',
    border: '2px solid rgba(245,200,66,0.5)',
    borderRadius: 20, padding: '20px 20px 16px',
    width: '100%', maxWidth: 330, maxHeight: '78vh', overflowY: 'auto',
    textAlign: 'center', cursor: 'default',
    animation: 'popIn 0.35s cubic-bezier(.22,1,.36,1)',
  },
  encDetailName: { color: '#fff', fontSize: 19, fontWeight: 900, margin: 0 },
  encDetailReading: { color: '#f5c842', fontSize: 12, margin: '3px 0 0' },
  encDetailMeta: { display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap', margin: '10px 0' },
  encDetailChip: {
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.16)',
    borderRadius: 8, padding: '3px 9px', color: '#ccd', fontSize: 10, fontWeight: 700,
  },
  encDetailDesc: {
    color: '#ccd', fontSize: 12, lineHeight: 1.85, whiteSpace: 'pre-wrap',
    textAlign: 'left', margin: '0 0 14px',
  },
  encDetailClose: {
    width: '100%', background: 'none', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 12, padding: '10px', color: '#aab', fontSize: 13, cursor: 'pointer',
  },

  container: {
    minHeight: '100vh',
    backgroundImage: `linear-gradient(rgba(8,10,24,0.74), rgba(8,10,24,0.86)), url(${BG.intro})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
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

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { BG } from '../assets/backgrounds'
import GameIcon from '../components/GameIcon'
import { useGameStore } from '../stores/gameStore'
import TripleMatchGame from '../games/TripleMatchGame'
import { buildStage } from '../games/stageConfig'
import { Confetti } from '../components/Celebration'
import { sfx } from '../utils/sound'
import { senpaiPose } from '../assets/characters/senpai'
import encyclopedia from '../data/encyclopedia.json'

const MOUNT_NAMES = {
  yatsugatake: '八ヶ岳', takao: '高尾山', hakone: '箱根山', ashitaka: '愛鷹山',
  bukou: '武甲山', misaka: '御坂山地', okuchichibu: '奥秩父', kiso: '木曽',
  akaishi: '赤石山脈', izu: '伊豆',
}

const AREAS = [
  { id: 'rock', name: '岩場', sub: '鉱物をさがす', icon: 'gem', color: '#7c3aed' },
  { id: 'trail', name: '登山道', sub: '動物をさがす', icon: 'paw', color: '#059669' },
  { id: 'meadow', name: '草原', sub: '植物をさがす', icon: 'blossom', color: '#db2777' },
]

export default function Explore() {
  const navigate = useNavigate()
  const addPoints = useGameStore((s) => s.addPoints)
  const recordMission = useGameStore((s) => s.recordMission)
  const discover = useGameStore((s) => s.discover)
  const discovered = useGameStore((s) => s.discovered)
  const exploreLevel = useGameStore((s) => s.exploreLevel)
  const setExploreLevel = useGameStore((s) => s.setExploreLevel)

  const mountains = useGameStore((s) => s.mountains)
  const [phase, setPhase] = useState('idle')   // idle / playing / clear / gameover
  const [area, setArea] = useState(null)
  const [result, setResult] = useState(null)
  const [spot, setSpot] = useState(null)       // null=共通の山道 / 山ID=その山を探索

  // 登山で一度アクセスした山だけ探索先に出る（固有種はそこでしか見つからない）
  const spots = [
    { id: null, name: '一般の山道' },
    ...Object.keys(MOUNT_NAMES)
      .filter((m) => mountains[m]?.firstAccessed)
      .map((m) => ({ id: m, name: MOUNT_NAMES[m] })),
  ]

  const start = (a) => {
    sfx.go()
    setSnapshot(discovered)
    setArea(a)
    setPhase('playing')
  }

  // 揃った瞬間に図鑑へ登録。新種だったかは開始時のスナップショットで判定する
  const [snapshot, setSnapshot] = useState([])
  const handleDiscover = useCallback((sp) => discover(sp.id), [discover])

  const handleEnd = (ok) => ({ score, found }) => {
    const newOnes = found.filter((sp) => !snapshot.includes(sp.id))
    const bonus = newOnes.length * 200
    const gained = ok ? score + bonus : Math.floor(score / 2)
    addPoints(gained)
    if (ok) {
      recordMission('explore')
      setExploreLevel(exploreLevel + 1)
    }
    setResult({ score, gained, found, newCount: newOnes.length, nextLevel: exploreLevel + 1 })
    setPhase(ok ? 'clear' : 'gameover')
  }

  const total = encyclopedia.length
  const rate = Math.round((discovered.length / total) * 100)

  /* ───────── プレイ中 ───────── */
  if (phase === 'playing') {
    return (
      <div style={styles.container}>
        <div style={{ height: 12 }} />
        <TripleMatchGame
          area={area.id}
          mountainId={spot}
          level={exploreLevel}
          onClear={handleEnd(true)}
          onGameOver={handleEnd(false)}
          onDiscover={handleDiscover}
        />
        <button style={styles.quitBtn} onClick={() => { sfx.cancel(); setPhase('idle') }}>やめる</button>
      </div>
    )
  }

  /* ───────── 結果 ───────── */
  if ((phase === 'clear' || phase === 'gameover') && result) {
    const ok = phase === 'clear'
    return (
      <div style={styles.container}>
        {ok && <Confetti count={44} />}
        <div style={styles.card}>
          {ok
            ? <GameIcon name="trophy" size={62} style={{ animation: 'popIn 0.5s ease' }} />
            : <img src={senpaiPose.think[2]} alt="先輩" style={{ height: 96 }} draggable={false} />}
          <h3 style={styles.cardTitle}>{ok ? 'エリア踏破！' : 'トレイがいっぱい…'}</h3>

          <div style={styles.resultRows}>
            <Row label="スコア" value={result.score.toLocaleString()} />
            <Row label="発見した種" value={`${result.found.length} 種`} />
            {result.newCount > 0 && <Row label="新種ボーナス" value={`${result.newCount} 種`} gold />}
            <Row label="獲得ポイント" value={`+${result.gained.toLocaleString()}`} gold />
          </div>

          {result.found.length > 0 && (
            <div style={styles.foundStrip}>
              {result.found.slice(0, 8).map((sp) => (
                <div key={sp.id} style={styles.foundChip} title={sp.name}>
                  <GameIcon name={sp.icon} size={26} />
                </div>
              ))}
            </div>
          )}

          {ok && <p style={styles.levelUp}>探索レベル {result.nextLevel} に上昇！次はもっと種類が増えるよ</p>}

          <button className="btn-primary" onClick={() => { sfx.confirm(); setPhase('idle') }}>つづける</button>
          <button style={styles.ghostBtn} onClick={() => navigate('/album')}>図鑑を見る</button>
        </div>
      </div>
    )
  }

  /* ───────── エリア選択 ───────── */
  const stage = buildStage(exploreLevel)
  return (
    <div style={styles.container}>
      <div style={styles.title}>EXPLORE</div>

      <div style={styles.summary}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>探索レベル</span>
          <span style={styles.summaryValue}>{exploreLevel}</span>
        </div>
        <div style={styles.summaryDivider} />
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>図鑑コンプ率</span>
          <span style={styles.summaryValue}>{rate}<span style={{ fontSize: 12 }}>%</span></span>
          <span style={styles.summarySub}>{discovered.length} / {total}</span>
        </div>
        <div style={styles.summaryDivider} />
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>今回の種類</span>
          <span style={styles.summaryValue}>{stage.kinds}</span>
          <span style={styles.summarySub}>制限 {stage.time}秒</span>
        </div>
      </div>

      <p style={styles.rule}>
        同じ標本を<b style={{ color: '#f5c842' }}>3つ</b>そろえると図鑑に登録できるよ。<br />
        トレイ（7枠）が埋まる前にすべて片づけよう！
      </p>

      <div style={styles.spotRow}>
        {spots.map((sp) => (
          <button key={sp.id || 'common'}
            style={{
              ...styles.spotChip,
              background: spot === sp.id ? 'linear-gradient(135deg,#f5c842,#e0a800)' : 'rgba(255,255,255,0.07)',
              color: spot === sp.id ? '#1a0e00' : '#aab',
              borderColor: spot === sp.id ? 'transparent' : 'rgba(255,255,255,0.14)',
            }}
            onClick={() => { sfx.tap(); setSpot(sp.id) }}>
            {sp.name}
          </button>
        ))}
      </div>
      {spots.length === 1 && (
        <p style={styles.spotHint}>登山で山を訪れると、その山でしか見つからない固有種を探せるようになるよ</p>
      )}

      <div style={styles.areaList}>
        {AREAS.map((a) => {
          const pool = encyclopedia.filter((e) => e.area === a.id && (spot ? e.mountain === spot : !e.mountain))
          const got = pool.filter((e) => discovered.includes(e.id)).length
          return (
            <button key={a.id}
              style={{ ...styles.areaCard, borderColor: `${a.color}66`, opacity: pool.length ? 1 : 0.4 }}
              disabled={!pool.length}
              onClick={() => start(a)}>
              <div style={{ ...styles.areaIcon, background: `${a.color}28`, border: `1.5px solid ${a.color}88` }}>
                <GameIcon name={a.icon} size={30} />
              </div>
              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                <div style={styles.areaName}>{a.name}</div>
                <div style={styles.areaSub}>{a.sub}</div>
                <div style={styles.areaBarBg}>
                  <div style={{ ...styles.areaBarFill, width: `${pool.length ? (got / pool.length) * 100 : 0}%`, background: a.color }} />
                </div>
              </div>
              <div style={styles.areaCount}>{got}/{pool.length || 0}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Row({ label, value, gold }) {
  return (
    <div style={styles.row}>
      <span style={{ color: '#aab', fontSize: 12 }}>{label}</span>
      <span style={{ color: gold ? '#f5c842' : '#fff', fontSize: 15, fontWeight: 900 }}>{value}</span>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundImage: `linear-gradient(rgba(8,10,24,0.72), rgba(8,10,24,0.82)), url(${BG.stage.meadow})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    paddingBottom: 80,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: { color: '#f5c842', fontSize: 12, fontWeight: 700, letterSpacing: 3, padding: '18px 0 10px' },

  summary: {
    display: 'flex', alignItems: 'stretch',
    width: 'calc(100% - 32px)', maxWidth: 360,
    background: 'rgba(8,10,24,0.62)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(245,200,66,0.28)',
    borderRadius: 16, padding: '12px 8px', marginBottom: 12,
  },
  summaryItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  summaryLabel: { color: '#8a90a8', fontSize: 10, fontWeight: 700 },
  summaryValue: { color: '#fff', fontSize: 20, fontWeight: 900, lineHeight: 1.1 },
  summarySub: { color: '#8a90a8', fontSize: 9.5 },
  summaryDivider: { width: 1, background: 'rgba(255,255,255,0.12)', margin: '2px 0' },

  rule: {
    color: '#ccd', fontSize: 12, lineHeight: 1.8, textAlign: 'center',
    marginBottom: 14, textShadow: '0 1px 4px rgba(0,0,0,0.8)',
  },

  spotRow: {
    display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center',
    width: 'calc(100% - 32px)', maxWidth: 360, marginBottom: 10,
  },
  spotChip: {
    border: '1px solid', borderRadius: 16, padding: '6px 14px',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },
  spotHint: {
    color: '#8a90a8', fontSize: 10.5, textAlign: 'center', margin: '0 0 12px',
    width: 'calc(100% - 48px)', maxWidth: 340, lineHeight: 1.6,
  },
  areaList: { width: 'calc(100% - 32px)', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 },
  areaCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(8,10,24,0.6)', backdropFilter: 'blur(8px)',
    border: '1.5px solid', borderRadius: 16, padding: '14px 16px',
    cursor: 'pointer',
  },
  areaIcon: {
    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  areaName: { color: '#fff', fontSize: 16, fontWeight: 900 },
  areaSub: { color: '#aab', fontSize: 11, marginBottom: 6 },
  areaBarBg: { height: 5, background: 'rgba(255,255,255,0.12)', borderRadius: 99, overflow: 'hidden' },
  areaBarFill: { height: '100%', borderRadius: 99, transition: 'width 0.6s ease' },
  areaCount: { color: '#f5c842', fontSize: 12, fontWeight: 900, flexShrink: 0 },

  quitBtn: {
    marginTop: 12, background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20,
    color: '#aab', fontSize: 13, padding: '8px 24px', cursor: 'pointer',
  },

  card: {
    margin: '32px 16px',
    background: 'rgba(8,10,24,0.72)',
    border: '1px solid rgba(245,200,66,0.28)',
    borderRadius: 24, padding: '28px 22px',
    width: 'calc(100% - 32px)', maxWidth: 340,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    textAlign: 'center', backdropFilter: 'blur(12px)',
    boxShadow: '0 8px 44px rgba(0,0,0,0.5)',
  },
  cardTitle: { color: '#fff', fontSize: 21, fontWeight: 900, margin: 0 },
  resultRows: { width: '100%', display: 'flex', flexDirection: 'column', gap: 6 },
  row: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 12px',
  },
  foundStrip: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  foundChip: {
    width: 38, height: 38, borderRadius: 10,
    background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.16)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  levelUp: { color: '#7ee8a5', fontSize: 11.5, fontWeight: 700, margin: 0 },
  ghostBtn: {
    background: 'none', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 20, color: '#aab', fontSize: 13, padding: '9px 22px',
    cursor: 'pointer', width: '100%',
  },
}

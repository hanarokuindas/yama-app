import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'
import GameIcon from './GameIcon'
import { Window, Tile } from './ui'
import { ui, FS } from './uiStyles'
import { STAT } from '../data/stats'
import { MOUNTAINS } from '../data/mountains'
import { albumProgress } from '../data/album'
import { buildRecordText, shareText } from '../utils/share'
import { sfx } from '../utils/sound'

/* メニュー：ホームの上に開く窓（ガイド・マイプロフィール・サウンド・SNS・利用規約） */
const ITEMS = [
  { id: 'guide', label: 'ガイド', icon: 'book' },
  { id: 'profile', label: 'マイプロフィール', icon: 'profile' },
  { id: 'sound', label: 'サウンド', icon: 'speaker' },
  { id: 'sns', label: 'SNS', icon: 'phone' },
  { id: 'terms', label: '利用規約', icon: 'doc' },
]
const TITLES = { top: 'メニュー', profile: 'マイプロフィール', sound: 'サウンド', sns: 'SNS', terms: '利用規約' }

export default function MenuWindow({ onClose }) {
  const navigate = useNavigate()
  const [page, setPage] = useState('top')

  const open = (id) => {
    sfx.confirm()
    if (id === 'guide') navigate('/guide')
    else setPage(id)
  }

  const back = page !== 'top' && (
    <button style={st.backBtn} onClick={() => { sfx.cancel(); setPage('top') }}>‹ もどる</button>
  )

  return (
    <Window title={TITLES[page]} onClose={onClose} headerLeft={back} width={page === 'top' ? 780 : 680}>
      {page === 'top' && (
        <div style={st.grid}>
          {ITEMS.map((it) => (
            <Tile key={it.id} onClick={() => open(it.id)}>
              <GameIcon name={it.icon} size={64} style={st.tileIcon} />
              <span style={st.tileLabel}>{it.label}</span>
            </Tile>
          ))}
        </div>
      )}
      {page === 'profile' && <ProfilePage />}
      {page === 'sound' && <SoundPage />}
      {page === 'sns' && <SnsPage />}
      {page === 'terms' && (
        <div style={{ ...ui.bubble, ...st.note }}>
          利用規約は準備中です。決まりしだい、ここに載せます。
        </div>
      )}
    </Window>
  )
}

/* ───────── マイプロフィール ───────── */
function ProfilePage() {
  const player = useGameStore((s) => s.player)
  const setPlayerName = useGameStore((s) => s.setPlayerName)
  const setPlayerWeight = useGameStore((s) => s.setPlayerWeight)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(player.name)
  const [weight, setWeight] = useState(player.weight ?? '')
  const [error, setError] = useState('')

  const total = Math.floor((player.core + player.legs + player.arms) / 3)
  const level = Math.floor(total / 50) + 1
  const barMax = Math.max(100, player.core, player.legs, player.arms)

  const save = () => {
    const w = parseFloat(weight)
    if (!name.trim()) { sfx.miss(); return setError('ニックネームを入れてね') }
    if (String(weight).trim() && (isNaN(w) || w <= 0)) { sfx.miss(); return setError('体重は数字で入れてね（空欄でもOK）') }
    sfx.confirm()
    setPlayerName(name.trim())
    setPlayerWeight(String(weight).trim() ? w : null)
    setError('')
    setEditing(false)
  }

  return (
    <div style={st.profile}>
      <div style={st.profileLeft}>
        <GameIcon name="profile" size={96} style={st.profileFace} />
        {editing ? (
          <div style={{ width: '100%' }}>
            <label style={st.label}>ニックネーム</label>
            <input style={st.input} value={name} maxLength={12}
              onChange={(e) => { setName(e.target.value); setError('') }} />
            <label style={st.label}>体重 (kg)<span style={st.optional}>任意</span></label>
            <input style={st.input} type="number" inputMode="decimal" value={weight} placeholder="空欄なら60kgで計算"
              onChange={(e) => { setWeight(e.target.value); setError('') }} />
            {error && <p style={st.error}>{error}</p>}
            <div style={st.row}>
              <button style={st.subBtn} onClick={() => { sfx.cancel(); setEditing(false); setError('') }}>やめる</button>
              <button style={st.mainBtn} onClick={save}>保存</button>
            </div>
          </div>
        ) : (
          <>
            <div style={st.profileName}>{player.name || 'やまびこ'}さん</div>
            <div style={st.profileSub}>Lv.{level} ・ 体重 {player.weight ? `${player.weight}kg` : '未入力（60kgで計算）'}</div>
            <button style={st.subBtn} onClick={() => {
              sfx.tap(); setName(player.name); setWeight(player.weight ?? ''); setEditing(true)
            }}>名前・体重を変える</button>
          </>
        )}
      </div>
      <div style={st.profileRight}>
        <div style={st.totalRow}>
          <GameIcon name="flame" size={48} style={{ width: 44, height: 44, transform: 'scale(1.35)' }} />
          <span style={st.totalLabel}>総合体力</span>
          <span style={st.totalNum}>{total}</span>
        </div>
        {['core', 'legs', 'arms'].map((k) => (
          <div key={k} style={st.statRow}>
            <span style={{ ...st.statLabel, color: STAT[k].color }}>{STAT[k].label}</span>
            <div style={st.barBg}>
              <div style={{ ...st.barFill, width: `${(player[k] / barMax) * 100}%`, background: STAT[k].color }} />
            </div>
            <span style={st.statNum}>{player[k]}</span>
          </div>
        ))}
        <div style={st.pointRow}>
          <GameIcon name="pcoin" size={26} />
          <span style={st.pointNum}>{player.points.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

/* ───────── サウンド ───────── */
function SoundPage() {
  const settings = useGameStore((s) => s.settings)
  const setSettings = useGameStore((s) => s.setSettings)
  return (
    <div>
      <SoundRow label="効果音" icon="speaker" on={settings.sfxOn} vol={settings.sfxVol}
        onToggle={() => { setSettings({ sfxOn: !settings.sfxOn }); if (!settings.sfxOn) setTimeout(() => sfx.confirm(), 0) }}
        onVol={(v) => setSettings({ sfxVol: v })}
        onVolDone={() => sfx.tap()} />
      <SoundRow label="環境音" icon="sound" on={settings.ambientOn} vol={settings.ambientVol} disabled
        onToggle={() => setSettings({ ambientOn: !settings.ambientOn })}
        onVol={(v) => setSettings({ ambientVol: v })} />
      <p style={st.soundNote}>環境音（風や鳥の声など）は、音の素材が届いたら鳴るようになります。</p>
    </div>
  )
}

function SoundRow({ label, icon, on, vol, onToggle, onVol, onVolDone, disabled = false }) {
  return (
    <div style={{ ...st.soundRow, ...(disabled ? { opacity: 0.55 } : null) }}>
      <GameIcon name={icon} size={36} />
      <span style={st.soundLabel}>{label}</span>
      <button style={{ ...st.toggle, ...(on ? st.toggleOn : null) }} onClick={onToggle} disabled={disabled}>
        {on ? 'オン' : 'オフ'}
      </button>
      <input type="range" min={0} max={100} step={5} value={Math.round(vol * 100)} disabled={disabled || !on}
        style={st.slider}
        onChange={(e) => onVol(Number(e.target.value) / 100)}
        onPointerUp={onVolDone} />
      <span style={st.volNum}>{Math.round(vol * 100)}</span>
    </div>
  )
}

/* ───────── SNS：自分の記録を共有 ───────── */
function SnsPage() {
  const player = useGameStore((s) => s.player)
  const mountains = useGameStore((s) => s.mountains)
  const discovered = useGameStore((s) => s.discovered)
  const [msg, setMsg] = useState('')

  const total = Math.floor((player.core + player.legs + player.arms) / 3)
  const level = Math.floor(total / 50) + 1
  // 里山は実在しないので「登った山」には入れない（一問一答 #8）
  const climbedList = MOUNTAINS.filter((m) => m.id !== 'satoyama' && mountains[m.id]?.summitedCourses?.length)
  const climbed = climbedList.map((m) => m.name)
  const courseCount = climbedList.reduce((n, m) => n + mountains[m.id].summitedCourses.length, 0)
  const { got, total: totalSpecimens, rate } = albumProgress(discovered)

  const share = async () => {
    sfx.tap()
    const text = buildRecordText({
      playerName: player.name, level, total, climbed, courseCount,
      discovered: got, totalSpecimens,
    })
    const r = await shareText('山アプリ 山の記録', text)
    setMsg(
      r === 'shared' ? '共有しました！'
      : r === 'copied' ? '記録をコピーしました。SNSに貼り付けてね'
      : r === 'cancelled' ? ''
      : '共有できませんでした'
    )
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div>
      <div style={{ ...ui.bubble, ...st.recordCard }}>
        <div style={st.recordTitle}>{player.name || 'やまびこ'}さんの山の記録</div>
        <RecordRow icon="flame" label="総合体力" value={`${total}（Lv.${level}）`} />
        <RecordRow icon="hikinggear" label="登った山" value={climbed.length ? `${climbed.join('・')}（${courseCount}コース）` : 'まだこれから！'} />
        <RecordRow icon="albumbook" label="アルバム" value={`${got} / ${totalSpecimens} 種（コンプ率 ${rate}%）`} />
      </div>
      <button className="btn-primary" style={st.shareBtn} onClick={share}>記録を共有する</button>
      {msg && <p style={st.shareMsg}>{msg}</p>}
    </div>
  )
}

function RecordRow({ icon, label, value }) {
  return (
    <div style={st.recordRow}>
      <GameIcon name={icon} size={30} />
      <span style={st.recordLabel}>{label}</span>
      <span style={st.recordValue}>{value}</span>
    </div>
  )
}

const st = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'clamp(8px, 1.8cqw, 16px)', paddingBottom: 6 },
  tileIcon: { width: '58%', height: '58%' },
  tileLabel: { fontSize: FS(3.6, 12, 17), textAlign: 'center', lineHeight: 1.25 },
  backBtn: {
    background: 'none', border: 'none', color: 'var(--brown-text)',
    fontSize: 15, fontWeight: 800, cursor: 'pointer', padding: '4px 2px',
  },
  note: { padding: '16px 18px', fontSize: 15 },

  profile: { display: 'flex', gap: 'clamp(12px, 3cqw, 28px)', alignItems: 'stretch' },
  profileLeft: {
    flex: '0 0 40%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    ...ui.bubble, padding: '12px 14px',
  },
  profileFace: { width: 'clamp(56px, 20cqh, 104px)', height: 'clamp(56px, 20cqh, 104px)' },
  profileName: { color: 'var(--brown-text)', fontSize: FS(5, 17, 24), fontWeight: 800 },
  profileSub: { color: '#8b7a66', fontSize: 13, textAlign: 'center' },
  profileRight: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'clamp(6px, 2cqh, 12px)' },
  totalRow: { display: 'flex', alignItems: 'center', gap: 8 },
  totalLabel: { color: 'var(--brown-text)', fontSize: 16, fontWeight: 800 },
  totalNum: { color: 'var(--brown-text)', fontSize: FS(7, 24, 36), fontWeight: 800, marginLeft: 'auto' },
  statRow: { display: 'flex', alignItems: 'center', gap: 10 },
  statLabel: { width: 40, fontSize: 15, fontWeight: 800 },
  barBg: { flex: 1, height: 12, background: '#e6dccb', borderRadius: 99, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99, transition: 'width 0.5s ease' },
  statNum: { width: 40, textAlign: 'right', color: 'var(--brown-text)', fontSize: 16, fontWeight: 800 },
  pointRow: { display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
  pointNum: {
    color: 'var(--yamabuki)', fontSize: 20, fontWeight: 800,
    textShadow: '0 0 2px #5a3a10, 0 0 2px #5a3a10',
  },
  label: { display: 'block', color: 'var(--brown-text)', fontSize: 12.5, fontWeight: 800, margin: '6px 0 3px' },
  optional: { color: '#a8977f', marginLeft: 6, fontSize: 11.5 },
  input: {
    width: '100%', padding: '8px 10px', background: '#fff',
    border: '2px solid var(--beige-edge)', borderRadius: 10,
    color: 'var(--brown-text)', fontSize: 16, outline: 'none',
  },
  error: { color: '#d0402b', fontSize: 12.5, margin: '6px 0 0' },
  row: { display: 'flex', gap: 8, marginTop: 10 },
  subBtn: {
    flex: 1, background: '#fff', border: '2px solid var(--beige-edge)', borderRadius: 99,
    padding: '7px 14px', color: 'var(--brown-text)', fontSize: 13.5, fontWeight: 800, cursor: 'pointer',
  },
  mainBtn: {
    flex: 1, background: 'linear-gradient(135deg, #2ecc71, #1a8a47)', border: 'none', borderRadius: 99,
    padding: '7px 14px', color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: 'pointer',
  },

  soundRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    ...ui.bubble, padding: '10px 16px', marginBottom: 10,
  },
  soundLabel: { width: 70, color: 'var(--brown-text)', fontSize: 16, fontWeight: 800 },
  toggle: {
    width: 64, padding: '6px 0', borderRadius: 99, border: '2px solid var(--beige-edge)',
    background: '#e6dccb', color: '#8b7a66', fontSize: 14, fontWeight: 800, cursor: 'pointer',
  },
  toggleOn: { background: 'linear-gradient(135deg, #2ecc71, #1a8a47)', color: '#fff', border: '2px solid #1a8a47' },
  slider: { flex: 1, accentColor: '#e0a000', height: 24 },
  volNum: { width: 32, textAlign: 'right', color: 'var(--brown-text)', fontSize: 14, fontWeight: 800 },
  soundNote: { color: '#8b7a66', fontSize: 12.5, margin: '2px 4px 0' },

  recordCard: { padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 },
  recordTitle: { color: 'var(--brown-text)', fontSize: FS(4.8, 16, 22), fontWeight: 800, marginBottom: 2 },
  recordRow: { display: 'flex', alignItems: 'center', gap: 10 },
  recordLabel: { width: 76, color: '#8b7a66', fontSize: 14, fontWeight: 800, flexShrink: 0 },
  recordValue: { color: 'var(--brown-text)', fontSize: 15, fontWeight: 800 },
  shareBtn: { width: 'auto', margin: '14px auto 0', padding: '10px 40px' },
  shareMsg: { color: '#1a8a47', fontSize: 13, textAlign: 'center', margin: '8px 0 0' },
}

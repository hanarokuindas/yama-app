import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BG } from '../assets/backgrounds'
import { UI } from '../assets/ui'
import GameIcon from '../components/GameIcon'
import Specimen from '../components/Specimen'
import { HomeButton } from '../components/PlankButton'
import { Tile, CloseButton } from '../components/ui'
import { ui, FS } from '../components/uiStyles'
import { useGameStore } from '../stores/gameStore'
import TripleMatchGame from '../games/TripleMatchGame'
import { Confetti } from '../components/Celebration'
import { sfx } from '../utils/sound'
import { EXPLORE_AREAS, AREA_BY_ID, albumProgress } from '../data/album'

const NEW_BONUS = 200 // アルバムに新しく載った種ごとのボーナス
// 「探索成功！」の帯のまわりのキラキラ（位置と大きさ）
const SPARKLES = [
  { left: '-4%', top: '-18%', fontSize: '3.2em' }, { left: '8%', top: '62%', fontSize: '1.6em' },
  { right: '-2%', top: '-22%', fontSize: '3.8em' }, { right: '10%', top: '70%', fontSize: '1.8em' },
  { left: '46%', top: '-30%', fontSize: '2em' },
]

export default function Explore() {
  const navigate = useNavigate()
  const points = useGameStore((s) => s.player.points)
  const addPoints = useGameStore((s) => s.addPoints)
  const recordMission = useGameStore((s) => s.recordMission)
  const recordMatch = useGameStore((s) => s.recordMatch)
  const discovered = useGameStore((s) => s.discovered)
  const exploreLevel = useGameStore((s) => s.exploreLevel)
  const setExploreLevel = useGameStore((s) => s.setExploreLevel)
  const tutorialEvent = useGameStore((s) => s.tutorialEvent)

  const [phase, setPhase] = useState('idle')   // idle / playing / result
  const [area, setArea] = useState(null)
  const [result, setResult] = useState(null)
  const [popupOpen, setPopupOpen] = useState(false)
  const matchInfo = useRef({}) // 種ID → recordMatch の結果（そのゲームで最後にそろえたとき）

  const start = (a) => {
    sfx.go()
    matchInfo.current = {}
    setArea(a)
    setPhase('playing')
  }

  // そろえた瞬間にアルバムの回数を数える（失敗しても記録は残る）
  const handleMatch = (sp) => { matchInfo.current[sp.id] = recordMatch(sp.id) }

  const handleEnd = ({ ok, reason, score, matched }) => {
    const rows = matched.map((sp) => ({ sp, info: matchInfo.current[sp.id] }))
    const newCount = rows.filter((r) => r.info?.registered).length
    const gained = ok ? score + newCount * NEW_BONUS : Math.floor(score / 2)
    addPoints(gained)
    recordMission('explore') // ミッションは「山探索5回」なので、クリアできなくても1回と数える
    if (ok) setExploreLevel(exploreLevel + 1)
    setResult({ ok, reason, gained, rows, newCount, level: exploreLevel, nextLevel: ok ? exploreLevel + 1 : exploreLevel })
    setPopupOpen(newCount > 0)
    setPhase('result')
    tutorialEvent('explored')
  }

  /* ───────── プレイ中 ───────── */
  if (phase === 'playing') {
    return (
      <TripleMatchGame
        area={area.id}
        level={exploreLevel}
        onMatch={handleMatch}
        onEnd={handleEnd}
        onQuit={() => setPhase('idle')}
      />
    )
  }

  /* ───────── 終了 ───────── */
  if (phase === 'result' && result) {
    const a = AREA_BY_ID[area.id]
    const newOnes = result.rows.filter((r) => r.info?.registered)
    return (
      <div style={{ ...st.root, backgroundImage: `linear-gradient(rgba(239,228,207,0.3), rgba(239,228,207,0.3)), url(${BG.stage[{ rock: 'rocky', trail: 'trail', meadow: 'meadow' }[area.id]]})` }}>
        {result.ok && <Confetti count={44} />}
        <div style={st.topLeft}>
          <div style={st.chip}>探索Lv.{result.nextLevel}</div>
          <div style={st.chip}><GameIcon name="pcoin" size={22} /><span style={st.pointNum}>{points.toLocaleString()}</span></div>
        </div>

        <div style={st.resultMain}>
          <div style={{ ...st.ribbon, ...(result.ok ? null : { filter: 'grayscale(0.6) brightness(0.95)' }) }}>
            {result.ok && SPARKLES.map((p, i) => (
              <span key={i} style={{ ...st.sparkle, ...p, animationDelay: `${i * 0.25}s` }}>✦</span>
            ))}
            <span className="icon-label" style={st.ribbonText}>
              {result.ok ? '探索成功！' : result.reason === 'tray' ? 'フレームがいっぱい…' : '時間切れ…'}
            </span>
          </div>
          <div className="icon-label" style={st.subtitle}>
            {result.rows.length > 0 ? `今回の探索で${a.verb}山の仲間たち！` : '今回は山の仲間をそろえられなかった…'}
          </div>

          {result.rows.length > 0 && (
            <div style={st.found}>
              {result.rows.map(({ sp, info }) => (
                <div key={sp.id} style={st.foundItem}>
                  <Specimen sp={sp} size={96} style={st.foundPic} />
                  <div className="icon-label" style={st.foundName}>{sp.name}</div>
                  <div style={{ ...st.foundStatus, ...(info?.registered ? st.foundNew : null) }}>
                    {info?.registered ? 'アルバムに収まった！'
                      : info?.already ? 'アルバムにのってるよ'
                      : info ? `あと${Math.max(1, info.need - info.count)}回でアルバムに` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={st.bottomRow}>
            <div style={st.gainRow}>
              <span style={st.gainLabel}>獲得ポイント</span>
              <span style={st.gainNum}>{result.gained.toLocaleString()}pt</span>
              {result.ok && <span style={st.levelUp}>探索Lv.{result.nextLevel} にアップ！</span>}
            </div>
            <CloseButton onClick={() => setPhase('idle')} />
          </div>
        </div>

        {/* アルバムに収まったお知らせ（センター） */}
        {popupOpen && newOnes.length > 0 && (
          <div style={st.popupOverlay} onClick={() => { sfx.tap(); setPopupOpen(false) }}>
            <div style={{ ...ui.bubble, ...st.popup }} onClick={(e) => e.stopPropagation()}>
              <Specimen sp={newOnes[0].sp} size={120} style={st.popupPic} />
              <div style={st.popupText}>
                {newOnes[0].sp.name}{newOnes.length > 1 ? `ほか${newOnes.length - 1}種` : ''}が{'\n'}アルバムに収まったよ！
              </div>
              <button style={st.popupBtn} onClick={() => { sfx.confirm(); navigate('/album', { state: { area: area.id } }) }}>
                <GameIcon name="albumbook" size={26} /> アルバムを見てみる
              </button>
              <button style={st.popupClose} onClick={() => { sfx.cancel(); setPopupOpen(false) }}>とじる</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ───────── 山探索トップ ───────── */
  const { rate } = albumProgress(discovered)
  return (
    <div style={{ ...st.root, backgroundImage: `linear-gradient(rgba(239,228,207,0.25), rgba(239,228,207,0.25)), url(${BG.home})` }}>
      <div style={st.topBar}>
        <div style={st.chip}>探索Lv.{exploreLevel}</div>
        <div style={st.chip}>アルバムコンプ率 <span style={st.rateNum}>{rate}%</span></div>
        <div style={{ flex: 1 }} />
        <HomeButton />
      </div>

      <div style={st.panel}>
        <h2 style={st.title}>山の仲間たちを探索しよう！</h2>
        <p style={st.lead}>
          レベルクリアで“ポイント”が貯まるよ{'\n'}
          探索を続けてアルバムを山の仲間たちでいっぱいにしよう
        </p>
        <p style={st.lead2}>制限時間内に山の仲間を探してタップ！</p>
        <div style={st.areas} data-tut="explore-areas">
          {EXPLORE_AREAS.map((a) => (
            <div key={a.id} style={st.areaCol}>
              <Tile onClick={() => start(a)} style={st.areaTile}>
                <GameIcon name={a.icon} size={96} style={st.areaIcon} />
                <span style={st.areaName}>{a.name}</span>
              </Tile>
              <span style={st.areaSub}>{a.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const st = {
  root: {
    position: 'relative', height: '100cqh', overflow: 'hidden',
    backgroundSize: 'cover', backgroundPosition: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  topBar: {
    alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: 10,
    padding: '1.5cqh 1.5cqw 0',
  },
  chip: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(250,244,232,0.94)', border: '2px solid var(--beige-edge)', borderRadius: 99,
    padding: '4px 14px', color: 'var(--brown-text)', fontSize: FS(4, 13, 20), fontWeight: 800,
    boxShadow: '0 2px 6px rgba(60,40,20,0.15)',
  },
  rateNum: { color: '#c58f00', fontSize: FS(4.6, 15, 24) },
  pointNum: { color: 'var(--yamabuki)', textShadow: '0 0 2px #5a3a10, 0 0 2px #5a3a10', fontSize: FS(4.4, 15, 24) },

  panel: {
    marginTop: '2.5cqh',
    width: 'min(900px, 86cqw)', flex: '0 1 auto',
    background: 'rgba(250,244,232,0.9)', border: '3px solid var(--beige-edge)', borderRadius: 24,
    padding: 'clamp(10px, 3cqh, 26px) clamp(14px, 3cqw, 34px) clamp(12px, 3.6cqh, 28px)',
    textAlign: 'center', boxShadow: '0 8px 30px rgba(40,25,10,0.3)',
  },
  title: { color: 'var(--brown-text)', fontSize: FS(6, 18, 32), fontWeight: 800, margin: 0 },
  lead: { color: 'var(--brown-text)', fontSize: FS(3.8, 13, 19), lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: '1cqh 0 0' },
  lead2: { color: '#c58f00', fontSize: FS(4, 13, 20), fontWeight: 800, margin: '0.8cqh 0 0' },
  areas: { display: 'flex', justifyContent: 'center', gap: 'clamp(14px, 5cqw, 60px)', marginTop: '2.5cqh' },
  areaCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  areaTile: { width: 'clamp(84px, 30cqh, 200px)' },
  areaIcon: { width: '66%', height: '66%' },
  areaName: { fontSize: FS(4.6, 15, 24) },
  areaSub: { color: 'var(--brown-text)', fontSize: FS(3.4, 12, 17), fontWeight: 800 },

  topLeft: { position: 'absolute', top: '1.5cqh', left: '1.5cqw', display: 'flex', gap: 8, zIndex: 3 },
  resultMain: {
    position: 'relative', zIndex: 2, flex: 1, width: '100%',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '2cqh 2cqw',
  },
  ribbon: {
    position: 'relative', width: 'min(460px, 36cqw, 62cqh)', aspectRatio: '1400 / 632',
    background: `url(${UI.ribbon}) center / 100% 100% no-repeat`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'popIn 0.5s cubic-bezier(.22,1,.36,1)',
    marginBottom: '-2cqh',
  },
  ribbonText: { fontSize: FS(6.6, 20, 40), letterSpacing: 2, transform: 'rotate(-4deg)', marginTop: '-4%' },
  sparkle: {
    position: 'absolute', color: '#ffd84a', lineHeight: 1, pointerEvents: 'none',
    textShadow: '0 0 8px #fff3b0, 0 0 16px rgba(248,181,0,0.9)',
    animation: 'glowPulse 1.4s ease-in-out infinite',
  },
  subtitle: { fontSize: FS(4.4, 14, 26), marginBottom: '1.5cqh' },
  found: { display: 'flex', justifyContent: 'center', gap: 'clamp(6px, 2cqw, 36px)', flexWrap: 'wrap' },
  foundItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: 'clamp(96px, 14cqw, 170px)' },
  foundPic: {
    width: 'clamp(46px, 16cqh, 130px)', height: 'clamp(46px, 16cqh, 130px)',
    filter: 'drop-shadow(0 0 2px #fff) drop-shadow(0 6px 8px rgba(40,25,10,0.4))',
    animation: 'popIn 0.5s ease both',
  },
  foundName: { fontSize: FS(3.8, 13, 20), textAlign: 'center' },
  foundStatus: {
    background: 'rgba(250,244,232,0.92)', borderRadius: 10, padding: '1px 6px',
    color: 'var(--brown-text)', fontSize: FS(2.6, 9.5, 14), fontWeight: 800, whiteSpace: 'nowrap', letterSpacing: -0.2,
  },
  foundNew: { background: 'linear-gradient(135deg, #f8c537, #e0a000)', color: '#4a2e00' },
  bottomRow: { display: 'flex', alignItems: 'center', gap: 14, marginTop: '2cqh' },
  gainRow: {
    display: 'flex', alignItems: 'baseline', gap: 12,
    background: 'rgba(250,244,232,0.94)', border: '2px solid var(--beige-edge)', borderRadius: 99,
    padding: '4px 22px',
  },
  gainLabel: { color: 'var(--brown-text)', fontSize: FS(4, 13, 20), fontWeight: 800 },
  gainNum: { color: 'var(--yamabuki)', textShadow: '0 0 2px #5a3a10, 0 0 2px #5a3a10', fontSize: FS(5.4, 18, 30), fontWeight: 800 },
  levelUp: { color: '#1a8a47', fontSize: FS(3.4, 12, 17), fontWeight: 800 },

  popupOverlay: {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(40,28,14,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'overlayFade 0.3s ease',
  },
  popup: {
    width: 'min(360px, 60cqw)', padding: 'clamp(10px, 3cqh, 22px) 18px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2cqh',
    animation: 'popIn 0.45s cubic-bezier(.22,1,.36,1) 0.4s both',
    border: '3px solid var(--beige-edge)',
  },
  popupPic: { width: 'clamp(60px, 24cqh, 140px)', height: 'clamp(60px, 24cqh, 140px)' },
  popupText: { color: 'var(--brown-text)', fontSize: FS(4.6, 15, 22), fontWeight: 800, textAlign: 'center', whiteSpace: 'pre-wrap', lineHeight: 1.5 },
  popupBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'linear-gradient(135deg, #2ecc71, #1a8a47)', border: 'none', borderRadius: 99,
    padding: '8px 22px', color: '#fff', fontSize: FS(4, 14, 18), fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 3px 0 #136b37',
  },
  popupClose: {
    background: 'none', border: 'none', color: '#8b7a66', fontSize: 13, fontWeight: 800, cursor: 'pointer',
  },
}

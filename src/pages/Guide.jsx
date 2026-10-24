import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BG } from '../assets/backgrounds'
import { CloseButton } from '../components/ui'
import { ui, FS } from '../components/uiStyles'
import GameIcon from '../components/GameIcon'
import Specimen from '../components/Specimen'
import { useGameStore } from '../stores/gameStore'
import { senpaiPose } from '../assets/characters/senpai'
import { sfx } from '../utils/sound'
import encyclopedia from '../data/encyclopedia.json'

const TABS = ['遊び方', 'アルバムの手引き']

/* ───────── 遊び方 ───────── */
const FLOW = [
  {
    icon: 'muscle', color: '#d97706', title: 'まず体を鍛える',
    body: 'トレーニングで「体幹・脚力・腕力」を伸ばそう。この3つの平均が総合体力になって、挑める山が決まるよ。\n偏っていると、体力が足りていてもバランス不足で脱落することがあるから、まんべんなく鍛えるのがコツ。',
  },
  {
    icon: 'search', color: '#7c3aed', title: '山を探索してポイントを稼ぐ',
    body: '上に出る「ターゲット」の標本を3つずつそろえるとクリア。そろえたターゲットはアルバムに載って、ポイントがもらえる。\n上に重なっている標本は取れないし、トレイ（7枠）があふれたら失敗。ポイントは装備や整備に使うよ。',
  },
  {
    icon: 'cart', color: '#1d4ed8', title: '装備をそろえる',
    body: 'コースごとに必要な装備が決まっていて、全部そろわないと出発できない。\n装備は経年劣化するし、食べ物や飲み物は登るたびに買い直しが必要だよ。',
  },
  {
    icon: 'mountain', color: '#1d4ed8', title: '山に登る',
    body: '岩場・登山道・草原のステージを順に越えていく。体力が足りないとステージの合間で脱落するよ。\n登頂しても脱落しても体力は減る。脱落するとポイントも減るから、準備は念入りに。',
  },
  {
    icon: 'onsen', color: '#0891b2', title: '温泉で回復する',
    body: '下山後に温泉へ寄ると体力が戻る。ただし完全回復はしなくて、減った分の7割まで。\n体は鍛え続けないと保てない、という考え方だよ。',
  },
  {
    icon: 'saw', color: '#059669', title: '山を整備する',
    body: 'ポイントを使って山を手入れしよう。作業には30分〜6時間かかって、その間その山には登れない。\n整備度は1日に5%ずつ下がって、60%以下になると道が荒れて登山の必要体力が+20%、30%未満で+50%。30%未満は整備の費用も10倍になるよ。',
  },
]

/* ───────── アルバムの手引き ───────── */
const AREA_GUIDE = [
  { id: 'rock', name: '岩場', sub: '鉱物・化石', icon: 'gem', color: '#7c3aed' },
  { id: 'trail', name: '登山道', sub: '動物・鳥・昆虫', icon: 'paw', color: '#059669' },
  { id: 'meadow', name: '草原', sub: '植物・キノコ', icon: 'blossom', color: '#db2777' },
  { id: 'bounty', name: '山の恵み', sub: '山菜・ジビエ', icon: 'onigiri', color: '#d97706' },
]

export default function Guide() {
  const navigate = useNavigate()
  const discovered = useGameStore((s) => s.discovered)
  const replayTutorial = useGameStore((s) => s.replayTutorial)
  const [tab, setTab] = useState('遊び方')

  const total = encyclopedia.length
  const got = discovered.length
  const newest = encyclopedia.filter((e) => discovered.includes(e.id)).slice(-6)

  return (
    <div style={styles.root}>
      <div style={styles.window}>
        <div style={styles.head}>
          <div style={styles.tabs}>
            {TABS.map((t) => (
              <button key={t} style={{ ...styles.tabBtn, ...(tab === t ? styles.tabOn : null) }}
                onClick={() => { sfx.tap(); setTab(t) }}>
                {t}
              </button>
            ))}
          </div>
          <div style={styles.title}>ガイド</div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <CloseButton onClick={() => navigate('/')} />
          </div>
        </div>

        <div style={styles.scroll}>
          {tab === '遊び方' && (
            <>
              <div style={styles.senpaiRow}>
                <img src={senpaiPose.think[0]} alt="" style={styles.senpaiImg} draggable={false} />
                <div style={{ ...ui.bubble, ...styles.senpaiBubble }}>
                  山は逃げないけど、準備不足で登るとたいへんな目にあうよ。
                  この順番で進めるのがいちばんラクかな！
                </div>
              </div>
              <div style={styles.flowGrid}>
                {FLOW.map((f, i) => (
                  <div key={f.title} style={{ ...ui.bubble, ...styles.stepCard }}>
                    <div style={styles.stepHead}>
                      <div style={{ ...styles.stepIcon, background: `${f.color}22`, border: `2px solid ${f.color}88` }}>
                        <GameIcon name={f.icon} size={26} />
                      </div>
                      <div>
                        <div style={styles.stepNo}>STEP {i + 1}</div>
                        <div style={styles.stepTitle}>{f.title}</div>
                      </div>
                    </div>
                    <p style={styles.stepBody}>{f.body}</p>
                  </div>
                ))}
              </div>
              <button style={styles.replayBtn}
                onClick={() => { sfx.confirm(); replayTutorial(); navigate('/') }}>
                <GameIcon name="sparkle" size={22} /> チュートリアルをもう一度見る
              </button>
            </>
          )}

          {tab === 'アルバムの手引き' && (
            <div style={styles.albumCols}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...ui.bubble, ...styles.progressCard }}>
                  <div style={styles.progressLabel}>コンプリート率</div>
                  <div style={styles.progressValue}>
                    {Math.round((got / total) * 100)}<span style={{ fontSize: 16 }}>%</span>
                    <span style={styles.progressSub}> {got} / {total} 種</span>
                  </div>
                  <div style={styles.progressBarBg}>
                    <div style={{ ...styles.progressBarFill, width: `${(got / total) * 100}%` }} />
                  </div>
                </div>
                <p style={styles.lead}>
                  アルバムは<b>山探索</b>で埋まっていくよ。
                  ターゲットの標本を3つそろえるとアルバムに載って、その種の解説が読めるようになる。
                </p>
                <div style={styles.areaRow}>
                  {AREA_GUIDE.map((a) => {
                    const pool = encyclopedia.filter((e) => e.area === a.id)
                    const n = pool.filter((e) => discovered.includes(e.id)).length
                    return (
                      <div key={a.id} style={{ ...ui.bubble, ...styles.areaCard, border: `2px solid ${a.color}88` }}>
                        <GameIcon name={a.icon} size={28} />
                        <div style={styles.areaName}>{a.name}</div>
                        <div style={styles.areaSub}>{a.sub}</div>
                        <div style={{ ...styles.areaCount, color: a.color }}>{n}/{pool.length}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...ui.bubble, ...styles.tipCard }}>
                  <div style={styles.tipTitle}>固有種の集め方</div>
                  <p style={styles.tipBody}>
                    山ごとにしかいない種が全部で118種ある。
                    <b>登山でその山を一度訪れる</b>と、
                    山探索の行き先にその山が出てきて、固有種を探せるようになるよ。
                  </p>
                </div>
                {newest.length > 0 && (
                  <>
                    <div style={styles.sectionLabel}>さいきん見つけたもの</div>
                    <div style={styles.recentRow}>
                      {newest.map((e) => (
                        <div key={e.id} style={{ ...ui.bubble, ...styles.recentChip }} title={e.name}>
                          <Specimen sp={e} size={34} />
                          <span style={styles.recentName}>{e.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <button className="btn-primary" style={{ marginTop: 14 }}
                  onClick={() => { sfx.confirm(); navigate('/album') }}>
                  アルバムを開く
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  root: {
    height: '100cqh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundImage: `linear-gradient(rgba(40,28,14,0.4), rgba(40,28,14,0.4)), url(${BG.home})`,
    backgroundSize: 'cover', backgroundPosition: 'center',
  },
  window: {
    width: 'min(1000px, 96cqw)', height: '94cqh',
    display: 'flex', flexDirection: 'column',
    background: 'var(--beige)', border: '3px solid var(--beige-edge)', borderRadius: 22,
    boxShadow: '0 10px 40px rgba(40,25,10,0.45)', overflow: 'hidden',
  },
  head: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: 'clamp(6px, 2cqh, 12px) clamp(10px, 2cqw, 18px)',
    borderBottom: '2px solid var(--beige-edge)',
  },
  tabs: { flex: 1, display: 'flex', gap: 6 },
  tabBtn: {
    padding: '5px 14px', borderRadius: 99,
    border: '2px solid var(--beige-edge)', background: '#fff',
    color: 'var(--brown-text)', fontSize: FS(3.6, 12.5, 16), fontWeight: 800, cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tabOn: { background: 'linear-gradient(135deg, #f8c537, #e0a000)', color: '#4a2e00', border: '2px solid #c58f00' },
  title: { color: 'var(--brown-text)', fontSize: FS(5, 16, 24), fontWeight: 800, letterSpacing: 2 },
  scroll: { flex: 1, minHeight: 0, overflowY: 'auto', padding: 'clamp(8px, 2.5cqh, 16px) clamp(12px, 2.5cqw, 22px)' },

  senpaiRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  senpaiImg: { height: 'clamp(64px, 20cqh, 120px)' },
  senpaiBubble: { flex: 1, padding: '10px 14px', fontSize: FS(3.6, 13, 16) },
  flowGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 },
  stepCard: { padding: '12px 14px' },
  stepHead: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  stepIcon: {
    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  stepNo: { color: '#c58f00', fontSize: 10.5, fontWeight: 800, letterSpacing: 1.5 },
  stepTitle: { color: 'var(--brown-text)', fontSize: 16, fontWeight: 800 },
  stepBody: { color: 'var(--brown-text)', fontSize: 13.5, lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0, fontWeight: 700 },
  replayBtn: {
    display: 'flex', alignItems: 'center', gap: 8, margin: '14px auto 4px',
    background: '#fff', border: '2px solid var(--beige-edge)', borderRadius: 99,
    padding: '9px 22px', color: 'var(--brown-text)', fontSize: 14.5, fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 3px 0 var(--beige-edge)',
  },

  albumCols: { display: 'flex', gap: 'clamp(10px, 2.5cqw, 24px)', alignItems: 'flex-start' },
  progressCard: { padding: '12px 16px', marginBottom: 10 },
  progressLabel: { color: '#8b7a66', fontSize: 12, fontWeight: 800 },
  progressValue: { color: '#c58f00', fontSize: 30, fontWeight: 800, lineHeight: 1.2 },
  progressSub: { color: '#8b7a66', fontSize: 13, fontWeight: 800 },
  progressBarBg: { height: 8, background: '#e6dccb', borderRadius: 99, overflow: 'hidden', marginTop: 8 },
  progressBarFill: { height: '100%', background: 'linear-gradient(90deg,#f8b500,#ffd65c)', borderRadius: 99, transition: 'width 0.6s ease' },
  lead: { color: 'var(--brown-text)', fontSize: 13.5, lineHeight: 1.8, margin: '0 0 10px' },
  areaRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  areaCard: {
    flex: '1 1 76px', padding: '10px 6px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  },
  areaName: { color: 'var(--brown-text)', fontSize: 14, fontWeight: 800 },
  areaSub: { color: '#8b7a66', fontSize: 11 },
  areaCount: { fontSize: 13.5, fontWeight: 800, marginTop: 2 },
  tipCard: { padding: '12px 16px', marginBottom: 12 },
  tipTitle: { color: '#c58f00', fontSize: 14, fontWeight: 800, marginBottom: 4 },
  tipBody: { color: 'var(--brown-text)', fontSize: 13.5, lineHeight: 1.8, margin: 0 },
  sectionLabel: { color: '#8b7a66', fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 6 },
  recentRow: { display: 'flex', gap: 7, flexWrap: 'wrap' },
  recentChip: {
    flex: '1 1 76px', padding: '8px 4px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  },
  recentName: {
    color: 'var(--brown-text)', fontSize: 10, fontWeight: 800, textAlign: 'center',
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
}

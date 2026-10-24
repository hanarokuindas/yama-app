import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BG } from '../assets/backgrounds'
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

/* ───────── 図鑑の手引き ───────── */
const AREA_GUIDE = [
  { id: 'rock', name: '岩場', sub: '鉱物・化石', icon: 'gem', color: '#7c3aed' },
  { id: 'trail', name: '登山道', sub: '動物・鳥・昆虫', icon: 'paw', color: '#059669' },
  { id: 'meadow', name: '草原', sub: '植物・キノコ', icon: 'blossom', color: '#db2777' },
  { id: 'bounty', name: '山の恵み', sub: '山菜・ジビエ', icon: 'onigiri', color: '#d97706' },
]

export default function Guide() {
  const navigate = useNavigate()
  const discovered = useGameStore((s) => s.discovered)
  const [tab, setTab] = useState('遊び方')

  const total = encyclopedia.length
  const got = discovered.length
  const newest = encyclopedia.filter((e) => discovered.includes(e.id)).slice(-4)

  return (
    <div style={styles.container}>
      <div style={styles.title}>GUIDE BOOK</div>

      <div style={styles.tabs}>
        {TABS.map((t) => (
          <button key={t}
            style={{
              ...styles.tabBtn,
              borderBottom: tab === t ? '2px solid #f5c842' : '2px solid transparent',
              color: tab === t ? '#f5c842' : '#778',
            }}
            onClick={() => { sfx.tap(); setTab(t) }}>
            {t}
          </button>
        ))}
      </div>

      {tab === '遊び方' && (
        <div style={styles.body}>
          <div style={styles.senpaiRow}>
            <img src={senpaiPose.think[0]} alt="先輩" style={{ height: 86 }} draggable={false} />
            <div style={styles.senpaiBubble}>
              山は逃げないけど、準備不足で登るとたいへんな目にあうよ。
              この順番で進めるのがいちばんラクかな！
            </div>
          </div>

          {FLOW.map((f, i) => (
            <div key={f.title} style={styles.stepCard}>
              <div style={styles.stepHead}>
                <div style={{ ...styles.stepIcon, background: `${f.color}28`, border: `1.5px solid ${f.color}88` }}>
                  <GameIcon name={f.icon} size={24} />
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
      )}

      {tab === 'アルバムの手引き' && (
        <div style={styles.body}>
          <div style={styles.progressCard}>
            <div style={styles.progressLabel}>コンプリート率</div>
            <div style={styles.progressValue}>
              {Math.round((got / total) * 100)}<span style={{ fontSize: 14 }}>%</span>
              <span style={styles.progressSub}> {got} / {total} 種</span>
            </div>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: `${(got / total) * 100}%` }} />
            </div>
          </div>

          <p style={styles.lead}>
            アルバムは<b style={{ color: '#f5c842' }}>山探索</b>で埋まっていくよ。
            ターゲットの標本を3つそろえるとアルバムに載って、その種の解説が読めるようになる。
          </p>

          <div style={styles.areaRow}>
            {AREA_GUIDE.map((a) => {
              const pool = encyclopedia.filter((e) => e.area === a.id)
              const n = pool.filter((e) => discovered.includes(e.id)).length
              return (
                <div key={a.id} style={{ ...styles.areaCard, borderColor: `${a.color}66` }}>
                  <GameIcon name={a.icon} size={26} />
                  <div style={styles.areaName}>{a.name}</div>
                  <div style={styles.areaSub}>{a.sub}</div>
                  <div style={{ ...styles.areaCount, color: a.color }}>{n}/{pool.length}</div>
                </div>
              )
            })}
          </div>

          <div style={styles.tipCard}>
            <div style={styles.tipTitle}>固有種の集め方</div>
            <p style={styles.tipBody}>
              山ごとにしかいない種が全部で118種ある。
              <b style={{ color: '#f5c842' }}>登山でその山を一度訪れる</b>と、
              山探索の行き先にその山が出てきて、固有種を探せるようになるよ。
            </p>
          </div>

          {newest.length > 0 && (
            <>
              <div style={styles.sectionLabel}>さいきん見つけたもの</div>
              <div style={styles.recentRow}>
                {newest.map((e) => (
                  <div key={e.id} style={styles.recentChip} title={e.name}>
                    <Specimen sp={e} size={34} />
                    <span style={styles.recentName}>{e.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <button className="btn-primary" style={{ marginTop: 16 }}
            onClick={() => { sfx.confirm(); navigate('/album') }}>
            アルバムを開く
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundImage: `linear-gradient(rgba(8,10,24,0.78), rgba(8,10,24,0.88)), url(${BG.intro})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    paddingBottom: 90,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: { color: '#f5c842', fontSize: 12, fontWeight: 700, letterSpacing: 3, padding: '18px 0 10px' },

  tabs: {
    display: 'flex', width: 'calc(100% - 32px)', maxWidth: 380, marginBottom: 14,
  },
  tabBtn: {
    flex: 1, background: 'none', border: 'none', paddingBottom: 9,
    fontSize: 13.5, fontWeight: 900, cursor: 'pointer',
  },

  body: { width: 'calc(100% - 32px)', maxWidth: 380 },

  senpaiRow: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
  },
  senpaiBubble: {
    flex: 1, background: '#fff', color: '#222',
    borderRadius: 14, padding: '11px 14px',
    fontSize: 12.5, lineHeight: 1.7,
    boxShadow: '0 4px 18px rgba(0,0,0,0.3)',
  },

  stepCard: {
    background: 'rgba(255,255,255,0.055)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16, padding: '14px 16px', marginBottom: 10,
  },
  stepHead: { display: 'flex', alignItems: 'center', gap: 11, marginBottom: 9 },
  stepIcon: {
    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  stepNo: { color: '#f5c842', fontSize: 9.5, fontWeight: 900, letterSpacing: 1.5 },
  stepTitle: { color: '#fff', fontSize: 15.5, fontWeight: 900 },
  stepBody: { color: '#ccd', fontSize: 12.5, lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0 },

  progressCard: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,200,66,0.25)',
    borderRadius: 14, padding: '13px 15px', marginBottom: 12,
  },
  progressLabel: { color: '#8a90a8', fontSize: 10, fontWeight: 700 },
  progressValue: { color: '#f5c842', fontSize: 26, fontWeight: 900, lineHeight: 1.2 },
  progressSub: { color: '#aab', fontSize: 12, fontWeight: 700 },
  progressBarBg: { height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 99, overflow: 'hidden', marginTop: 8 },
  progressBarFill: { height: '100%', background: 'linear-gradient(90deg,#f5c842,#ffe98a)', borderRadius: 99, transition: 'width 0.6s ease' },

  lead: { color: '#ccd', fontSize: 12.5, lineHeight: 1.85, marginBottom: 12 },

  areaRow: { display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  areaCard: {
    flex: '1 1 76px', background: 'rgba(255,255,255,0.055)', border: '1.5px solid',
    borderRadius: 14, padding: '12px 6px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
  },
  areaName: { color: '#fff', fontSize: 12.5, fontWeight: 900 },
  areaSub: { color: '#8a90a8', fontSize: 9.5 },
  areaCount: { fontSize: 12, fontWeight: 900, marginTop: 2 },

  tipCard: {
    background: 'rgba(245,200,66,0.09)', border: '1px solid rgba(245,200,66,0.3)',
    borderRadius: 14, padding: '13px 15px', marginBottom: 14,
  },
  tipTitle: { color: '#f5c842', fontSize: 12.5, fontWeight: 900, marginBottom: 6 },
  tipBody: { color: '#ccd', fontSize: 12, lineHeight: 1.85, margin: 0 },

  sectionLabel: { color: '#f5c842', fontSize: 10.5, fontWeight: 700, letterSpacing: 2, marginBottom: 8 },
  recentRow: { display: 'flex', gap: 7, flexWrap: 'wrap' },
  recentChip: {
    flex: '1 1 76px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
    padding: '9px 4px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 4,
  },
  recentName: {
    color: '#dde', fontSize: 8.5, fontWeight: 700, textAlign: 'center',
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
}

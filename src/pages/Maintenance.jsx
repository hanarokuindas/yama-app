import { useState, useEffect } from 'react'
import { BG } from '../assets/backgrounds'
import GameIcon from '../components/GameIcon'
import { HomeButton } from '../components/PlankButton'
import PlankButton from '../components/PlankButton'
import { PointPlank, Window } from '../components/ui'
import { ui, FS } from '../components/uiStyles'
import { useGameStore } from '../stores/gameStore'
import { sfx } from '../utils/sound'
import { withFurigana } from '../utils/furigana'
import { MOUNTAINS } from '../data/mountains'
import {
  ACTIVITIES, getCost, getRestore, formatDuration, remainingMinutes, rushCost, maintenanceState, isClosed, CLOSED_BELOW,
} from '../data/maintenanceActivities'
import { senpaiFull, senpaiMini } from '../assets/characters/senpai'
import { yatsugatakeMini } from '../assets/characters/yatsugatake'
import { takaoMini } from '../assets/characters/takao'
import { hakoneMini } from '../assets/characters/hakone'

/* 山整備（横画面・最新ラフ 2026-11 p105〜110）
   初回は先輩の説明を3回に分けて出す。山を選ぶと、その山の山神のミニキャラとひとこと、7つの作業。
   作業をタップすると説明と費用の窓 →「する」で作業開始（作業中はその山に登れない）。
   背景は整備の状態で変える（荒廃は荒れた森）。 */

const INTRO = [
  'だいぶ慣れてきたかな？\n山にはたくさんの自然と\nいろいろな生き物がいたね！',
  '定期的に山の手入れをして、山を快適な状態に保ってね！\nこれからも山が残って、人も安全に過ごせるように、\n手入れが必要なんだ！ 君も手伝ってくれるかな？？',
  '山の整備には、資金と時間がかかるよ！\n“ポイント”をしっかり貯めていこう！',
]

// 山神のミニキャラ（ラフ：ふつうは八ヶ岳④・高尾①・箱根①、荒れているときは八ヶ岳③・高尾②・箱根③）とひとこと
// 高尾（ふつう）と箱根（荒廃）はラフの文。ほかは仮の文
const GODS = {
  yatsugatake: {
    name: 'ヤツガタケ', mini: yatsugatakeMini.eyesClosed, sad: yatsugatakeMini.smile,
    good: 'いつも手入れをありがとう\nおかげで森が気持ちよさそうだ（仮の文）',
    bad: '少し森が荒れてきたようだね\n手を貸してもらえるかい？（仮の文）',
  },
  takao: {
    name: 'タカオ', mini: takaoMini.smile, sad: takaoMini.calm,
    good: 'いつもすまない\n俺のような山でも足を滑らせないように気を付けておくれ',
    bad: '道がずいぶん荒れてしまった\n手入れを頼めるかい？（仮の文）',
  },
  hakone: {
    name: 'ハコネ', mini: hakoneMini.grin, sad: hakoneMini.laugh,
    good: 'きれいにしてくれてありがとう！\nおれ、うれしい！（仮の文）',
    bad: 'おれが火山だから⋯\n放っておかれちゃったのかなあ、、、ううぅ',
  },
  satoyama: {
    name: '', mini: senpaiMini.smileCheer, sad: senpaiMini.surprised,
    good: '里山もきれいになってきたね！（テスト用）',
    bad: '里山が荒れてきちゃった…（テスト用）',
  },
}

function Bar({ level }) {
  const { color } = maintenanceState(level)
  return (
    <div style={st.barBg}>
      <div style={{ ...st.barFill, width: `${level}%`, background: color }} />
    </div>
  )
}

export default function Maintenance() {
  const player = useGameStore((s) => s.player)
  const mountains = useGameStore((s) => s.mountains)
  const spendPoints = useGameStore((s) => s.spendPoints)
  const startMaintenance = useGameStore((s) => s.startMaintenance)
  const recordMission = useGameStore((s) => s.recordMission)
  const collectMaintenance = useGameStore((s) => s.collectMaintenance)
  const rushMaintenance = useGameStore((s) => s.rushMaintenance)
  const introSeen = useGameStore((s) => !!s.tutorialSeen.maintenanceIntro)
  const markSeen = useGameStore((s) => s.markSeen)

  const [selected, setSelected] = useState(null) // mountainId
  const [activity, setActivity] = useState(null) // 窓で開いている作業
  const [message, setMessage] = useState('')
  const [introIdx, setIntroIdx] = useState(0)
  const [, setTick] = useState(0)                // 残り時間の表示を30秒ごとに更新する

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const flash = (text) => { setMessage(text); setTimeout(() => setMessage(''), 2500) }

  /* ───────── 初回：先輩の説明（3回に分けて） ───────── */
  if (!introSeen) {
    const last = introIdx === INTRO.length - 1
    const next = () => {
      sfx.tap()
      if (!last) setIntroIdx(introIdx + 1)
      else markSeen('maintenanceIntro')
    }
    return (
      <div style={st.root} onClick={next}>
        <div style={{ ...st.bg, backgroundImage: `url(${BG.forestGood})` }} />
        <img src={senpaiFull.pointing} alt="先輩" style={st.introChara} draggable={false} />
        <div style={st.introBox}>
          <p style={st.introText}>{INTRO[introIdx]}</p>
          {last
            ? <div style={{ textAlign: 'right', marginTop: 10 }}><span style={st.mainBtn}>さっそく整備しよう！</span></div>
            : <span style={st.more}>▼</span>}
        </div>
      </div>
    )
  }

  const mt = selected ? mountains[selected] : null
  const level = mt?.maintenanceLevel ?? 100
  const state = maintenanceState(level)
  const leftMin = remainingMinutes(mt)
  const working = mt?.workingActivity ? ACTIVITIES.find((a) => a.id === mt.workingActivity) : null

  const startWork = (a) => {
    const cost = getCost(a, level)
    if (!spendPoints(cost)) {
      sfx.miss(); flash(`ポイントが足りないよ（必要：${cost.toLocaleString()}pt）`); return
    }
    sfx.confirm()
    setActivity(null)
    startMaintenance(selected, a.id, a.duration)
    recordMission('maintain')
  }

  const collect = () => { sfx.item(); collectMaintenance(selected, getRestore(working, level)) }
  const rush = () => {
    if (rushMaintenance(selected)) sfx.coin()
    else { sfx.miss(); flash('ポイントが足りないよ') }
  }

  /* ───────── 山選択 ───────── */
  if (!selected) {
    return (
      <div style={st.root}>
        <div style={{ ...st.bg, backgroundImage: `url(${BG.forestGood})` }} />
        <div style={st.topBar}>
          <PointPlank points={player.points} />
          <HomeButton />
        </div>
        <div style={st.notice}>
          定期的に手入れをして安全快適に保ってあげてね！ ポイントを使うよ！{'\n'}
          整備不足（整備{CLOSED_BELOW}%未満）になると登山できなくなっちゃうから気を付けてね。整備中の山は登山ができないよ
        </div>
        <div style={st.mountainRow}>
          {MOUNTAINS.map((m) => {
            const s = mountains[m.id] || {}
            const lv = s.maintenanceLevel ?? 100
            const ms = maintenanceState(lv)
            const busy = remainingMinutes(s)
            const god = GODS[m.id]
            return (
              <button key={m.id} style={st.mountainTile} onClick={() => { sfx.confirm(); setSelected(m.id) }}>
                <img src={ms.penalty >= 0.5 ? god.sad : god.mini} alt="" style={st.tileFace} draggable={false} />
                <div style={st.tileName}>{m.short}</div>
                {m.test && <div style={st.testTag}>テスト用</div>}
                <div style={{ ...st.tileLevel, color: ms.color }}>整備{lv}%</div>
                <Bar level={lv} />
                {busy > 0
                  ? <div style={{ ...st.tileNote, color: '#b07800' }}>整備中 あと{formatDuration(busy)}</div>
                  : isClosed(lv)
                    ? <div style={{ ...st.tileNote, color: '#c0392b' }}>登山できないよ</div>
                    : ms.penalty > 0 && <div style={{ ...st.tileNote, color: ms.color }}>{ms.label}・必要体力+{Math.round(ms.penalty * 100)}%</div>}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const god = GODS[selected]
  const info = MOUNTAINS.find((m) => m.id === selected)
  const ruined = state.penalty >= 0.5

  return (
    <div style={st.root}>
      <div style={{ ...st.bg, backgroundImage: `url(${ruined ? BG.forestBad : BG.forestGood})` }} />
      <div style={st.topBar}>
        <PointPlank points={player.points} />
        <div style={{ display: 'flex', gap: 6 }}>
          <PlankButton label="もどる" onClick={() => { sfx.cancel(); setSelected(null) }} />
          <HomeButton />
        </div>
      </div>

      {/* 左：山神とひとこと */}
      <div style={st.godArea}>
        <div style={st.godBubble}>
          {god.name && <div style={st.bubbleName}>{god.name}</div>}
          <p style={st.bubbleText}>{state.penalty > 0 ? god.bad : god.good}</p>
        </div>
        <img src={ruined ? god.sad : god.mini} alt={god.name} style={st.godMini} draggable={false} />
      </div>

      {/* 右：状態と作業 */}
      <div style={st.panel}>
        <div style={st.panelHead}>
          <span style={st.panelTitle}>{info.name}</span>
          <span style={{ ...st.levelText, color: state.color }}>整備{level}%（{state.label}）</span>
        </div>
        <Bar level={level} />
        {isClosed(level)
          ? <div style={{ ...st.warn, color: '#c0392b' }}>整備不足で登山できないよ。{CLOSED_BELOW}%以上にしよう</div>
          : state.penalty > 0 && <div style={{ ...st.warn, color: state.color }}>道が荒れていて、登山の必要体力が +{Math.round(state.penalty * 100)}% になっているよ</div>}
        {ruined && <div style={{ ...st.warn, color: '#c0392b' }}>荒れた山は、作業の費用が10倍・効果が半分になるよ</div>}
        {message && <div style={{ ...st.warn, color: '#c0392b' }}>{message}</div>}

        {working ? (
          <div style={st.workBox}>
            <GameIcon name={working.icon} size={64} />
            <div style={st.workName}>{working.name}</div>
            {leftMin > 0 ? (
              <>
                <div style={st.workLeft}>作業中… 残り {formatDuration(leftMin)}</div>
                <Bar level={Math.max(0, Math.min(100, (1 - leftMin / working.duration) * 100))} />
                <p style={st.small}>作業が終わるまで、この山には登れないよ。アプリを閉じても時間は進むよ</p>
                <button style={st.mainBtn} onClick={rush}>ポイントで早める（{rushCost(mt).toLocaleString()}pt）</button>
              </>
            ) : (
              <>
                <div style={{ ...st.workLeft, color: '#1a8a47' }}>整備完了！</div>
                <button style={st.mainBtn} onClick={collect}>受け取る（+{getRestore(working, level)}%）</button>
              </>
            )}
          </div>
        ) : (
          <div style={st.actGrid}>
            {ACTIVITIES.map((a) => {
              const cost = getCost(a, level)
              return (
                <button key={a.id} style={{ ...st.actTile, ...(player.points < cost ? st.dim : null) }}
                  onClick={() => { sfx.tap(); setActivity(a) }}>
                  <GameIcon name={a.icon} size={44} />
                  <span style={st.actName}>{a.name}</span>
                  <span style={st.actCost}>{cost.toLocaleString()}pt</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {activity && (
        <Window title={`${activity.name}1回`} width={520} onClose={() => setActivity(null)}>
          <div style={st.winBody}>
            <GameIcon name={activity.icon} size={72} />
            <p style={st.winText}>{withFurigana(activity.desc)}</p>
            <table style={st.winTable}>
              <tbody>
                <tr><th style={st.th}>資金</th><td style={st.td}>{getCost(activity, level).toLocaleString()}pt</td></tr>
                <tr><th style={st.th}>作業時間</th><td style={st.td}>{formatDuration(activity.duration)}</td></tr>
                <tr><th style={st.th}>整備</th><td style={st.td}>+{getRestore(activity, level)}%</td></tr>
              </tbody>
            </table>
            <button style={st.mainBtn} onClick={() => startWork(activity)}>する</button>
          </div>
        </Window>
      )}
    </div>
  )
}

const panel = {
  background: 'rgba(250,244,232,0.95)',
  border: '3px solid var(--beige-edge)',
  borderRadius: 20,
  boxShadow: '0 8px 28px rgba(40,25,10,0.3)',
  color: 'var(--brown-text)',
}

const st = {
  root: { position: 'relative', width: '100%', height: '100cqh', overflow: 'hidden', userSelect: 'none' },
  bg: { position: 'absolute', inset: 0, backgroundSize: 'cover', backgroundPosition: 'center' },
  dim: { filter: 'grayscale(0.6)', opacity: 0.6 },

  introChara: { position: 'absolute', left: '6cqw', bottom: 0, height: '90cqh', objectFit: 'contain', animation: 'popIn 0.5s ease' },
  introBox: { ...ui.bubble, position: 'absolute', left: '36cqw', right: '6cqw', bottom: '8cqh', padding: '4cqh 3cqw', cursor: 'pointer' },
  introText: { fontSize: FS(4.4, 15, 25), lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--brown-text)', fontWeight: 800 },
  more: { position: 'absolute', right: 18, bottom: 10, color: '#e0a000', animation: 'blink 1.2s infinite' },

  topBar: {
    position: 'absolute', top: '2cqh', left: '1.5cqw', right: '1.5cqw', zIndex: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  },
  notice: {
    ...panel, position: 'absolute', top: '16cqh', left: '6cqw', right: '6cqw', padding: '1.6cqh 2cqw',
    fontSize: FS(3.3, 12, 17), lineHeight: 1.7, whiteSpace: 'pre-wrap', fontWeight: 800, textAlign: 'center',
  },
  mountainRow: {
    position: 'absolute', left: '4cqw', right: '4cqw', top: '38cqh', bottom: '5cqh',
    display: 'flex', gap: '2cqw', justifyContent: 'center',
  },
  mountainTile: {
    ...panel, flex: '1 1 0', maxWidth: 260, cursor: 'pointer', position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1cqh',
    padding: '2cqh 1.4cqw',
  },
  tileFace: { height: '20cqh', objectFit: 'contain' },
  tileName: { fontSize: FS(5, 16, 28), fontWeight: 800 },
  tileLevel: { fontSize: FS(4, 14, 22), fontWeight: 800 },
  tileNote: { fontSize: FS(2.9, 10, 14), fontWeight: 800, textAlign: 'center' },
  testTag: { position: 'absolute', top: 8, right: 8, background: '#8a6a45', color: '#fff', fontSize: 11, borderRadius: 99, padding: '1px 8px' },
  barBg: { width: '100%', height: 10, background: '#e3d6bb', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5, transition: 'width 0.5s' },

  godArea: {
    position: 'absolute', left: '2cqw', top: '14cqh', bottom: '3cqh', width: '30cqw',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '2cqh',
  },
  godBubble: { ...ui.bubble, padding: '2cqh 1.6cqw', width: '100%' },
  bubbleName: { fontSize: FS(3.2, 12, 16), fontWeight: 800, color: '#e0a000', marginBottom: 2 },
  bubbleText: { fontSize: FS(3.4, 12, 18), lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--brown-text)', fontWeight: 800 },
  godMini: { height: '38cqh', objectFit: 'contain', animation: 'charFloat 3s ease-in-out infinite' },

  panel: {
    ...panel, position: 'absolute', left: '34cqw', right: '2cqw', top: '14cqh', bottom: '3cqh',
    display: 'flex', flexDirection: 'column', gap: '1.2cqh', padding: '2cqh 1.8cqw',
  },
  panelHead: { display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' },
  panelTitle: { fontSize: FS(5, 16, 28), fontWeight: 800 },
  levelText: { fontSize: FS(3.8, 13, 20), fontWeight: 800 },
  warn: { fontSize: FS(3, 11, 15), fontWeight: 800 },
  actGrid: {
    flex: 1, display: 'grid', gap: '1.6cqh 1cqw', alignContent: 'center',
    gridTemplateColumns: 'repeat(4, 1fr)',
  },
  actTile: {
    background: 'linear-gradient(180deg, #fffaf0, #f1e6d0)', border: '2px solid var(--beige-edge)',
    borderRadius: 14, boxShadow: '0 4px 0 #cdb68e', padding: '1.4cqh 0.4cqw', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: 'var(--brown-text)',
  },
  actName: { fontSize: FS(3.4, 12, 18), fontWeight: 800 },
  actCost: { fontSize: FS(2.9, 11, 15), fontWeight: 800, color: '#b07800' },
  workBox: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.6cqh', padding: '0 4cqw' },
  workName: { fontSize: FS(5, 16, 28), fontWeight: 800 },
  workLeft: { fontSize: FS(3.8, 13, 20), fontWeight: 800 },
  small: { fontSize: FS(2.9, 11, 15), color: '#8a6a45', textAlign: 'center', lineHeight: 1.6 },
  mainBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', borderRadius: 99, cursor: 'pointer', fontWeight: 800,
    padding: 'clamp(6px, 2cqh, 12px) clamp(18px, 3cqw, 34px)', fontSize: FS(3.8, 14, 20),
    background: 'linear-gradient(180deg, #f8c537, #e0a000)', color: '#4a2e00', boxShadow: '0 3px 0 #b07800',
  },

  winBody: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--brown-text)' },
  winText: { fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-wrap', textAlign: 'center', fontWeight: 800 },
  winTable: { borderCollapse: 'collapse', fontSize: 16 },
  th: { textAlign: 'left', color: '#8a6a45', padding: '2px 16px 2px 0' },
  td: { fontWeight: 800 },
}

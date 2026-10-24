import { useState } from 'react'
import { BG } from '../assets/backgrounds'
import GameIcon from '../components/GameIcon'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'
import coursesData from '../data/courses.json'
import itemsData from '../data/items.json'
import ClimbingGame from '../games/ClimbingGame'
import { Confetti } from '../components/Celebration'
import { sfx } from '../utils/sound'
import { takaoPose } from '../assets/characters/takao'
import { senpaiPose } from '../assets/characters/senpai'
import { isUnderMaintenance, remainingMinutes, formatDuration, maintenanceState, requiredStaminaFor } from '../data/maintenanceActivities'
import { buildSummitText, shareText } from '../utils/share'
import encyclopedia from '../data/encyclopedia.json'
import characters from '../data/characters.json'

const MOUNTAINS = [
  { id: 'satoyama', name: 'ふもとの里山', emoji: 'herb', color: '#7cb342', sub: 'はじめての登山におすすめ' },
  { id: 'takao', name: '高尾山', emoji: 'forest', color: '#27ae60' },
  { id: 'yatsugatake', name: '八ヶ岳連峰', emoji: 'mountain', color: '#7f8c8d' },
  { id: 'hakone', name: '箱根山', emoji: 'volcano', color: '#c0392b' },
]

// 温泉 300pt 回復
const ONSEN_COST = 300
// 完全回復はさせず、登山で失った分の7割までに留める（議事録 2026-10-11）
const ONSEN_RATE = 0.7

// お土産一覧
// blessing は次の登山で総合体力に乗る割合（ご利益）
// 山に初めて来たときのあいさつ。山神がいる山は characters.json の自己紹介を使う
const MOUNTAIN_INTRO = {
  satoyama: '先輩「ここは、ふもとの里山。\n高尾山に行く前に、登山の練習をするのにぴったりの小さな山だよ。まずはここで慣れていこう！」',
  ...Object.fromEntries(['takao', 'yatsugatake', 'hakone']
    .filter((id) => characters[id]?.intro)
    .map((id) => [id, characters[id].intro.join('\n')])),
}

// 登山の解禁条件（ホームの登山スポットと同じ。企画書p25）
const CLIMB_UNLOCK_REQ = 20

const SOUVENIRS = [
  { id: 'satoyama_onigiri', name: '里山のおにぎり', price: 100, mountainId: 'satoyama', emoji: 'onigiri', blessing: 0.03 },
  { id: 'takao_manju', name: '高尾まんじゅう', price: 200, mountainId: 'takao', emoji: 'dango', blessing: 0.05 },
  { id: 'yatsu_beer', name: '八ヶ岳地ビール', price: 500, mountainId: 'yatsugatake', emoji: 'beer', blessing: 0.10 },
  { id: 'hakone_yosegi', name: '箱根寄木細工', price: 800, mountainId: 'hakone', emoji: 'gift', blessing: 0.15 },
]

// ──────────────────────────────────────────
// 装備チェック画面
// ──────────────────────────────────────────
function EquipmentCheck({ course, onReady, onBack }) {
  const inventory = useGameStore((s) => s.inventory)
  const points = useGameStore((s) => s.player.points)
  const spendPoints = useGameStore((s) => s.spendPoints)
  const addItem = useGameStore((s) => s.addItem)
  const ownedIds = new Set(inventory.map((i) => i.id))
  const required = course.requiredItems || []
  const allOk = required.every((id) => ownedIds.has(id))
  const missing = required.filter((id) => !ownedIds.has(id)).map((id) => itemsData.find((i) => i.id === id)).filter(Boolean)
  const missingCost = missing.reduce((sum, i) => sum + i.price, 0)
  const [msg, setMsg] = useState('')

  const buyMissing = () => {
    if (!spendPoints(missingCost)) {
      sfx.miss()
      setMsg(`ポイントが足りないよ（あと ${(missingCost - points).toLocaleString()}pt）。山探索やトレーニングでためよう`)
      return
    }
    sfx.coin()
    missing.forEach((item) => addItem(item))
    setMsg('')
  }

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>装備チェック</h3>
      <p style={{ color: '#ccc', fontSize: 13, marginBottom: 12 }}>{course.mountainName} / {course.name}</p>
      <div style={styles.equipList}>
        {required.map((id) => {
          const item = itemsData.find((i) => i.id === id)
          const ok = ownedIds.has(id)
          return (
            <div key={id} style={{ ...styles.equipRow, opacity: ok ? 1 : 0.6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><GameIcon name={item?.icon || 'box'} size={20} /> {item?.name || id}</span>
              <GameIcon name={ok ? 'check' : 'cross'} size={20} />
            </div>
          )
        })}
      </div>
      {!allOk && (
        <>
          <p style={{ color: '#e74c3c', fontSize: 13, margin: '4px 0' }}>
            装備が {missing.length} 個足りないよ
          </p>
          <button style={styles.buyAllBtn} onClick={buyMissing}>
            足りない装備をまとめて買う（{missingCost.toLocaleString()}pt）
          </button>
          <p style={{ color: '#aab', fontSize: 11.5, margin: 0 }}>所持 {points.toLocaleString()}pt</p>
          {msg && <p style={{ color: '#ff8a80', fontSize: 12.5, margin: 0, lineHeight: 1.6 }}>{msg}</p>}
        </>
      )}
      <button
        style={{ ...styles.primaryBtn, opacity: allOk ? 1 : 0.5 }}
        disabled={!allOk}
        onClick={onReady}
      >
        出発！
      </button>
      <button style={styles.backBtn} onClick={onBack}>戻る</button>
    </div>
  )
}

// ──────────────────────────────────────────
// 温泉画面
// ──────────────────────────────────────────
function OnsenScreen({ onNext, onSkip }) {
  const spendPoints = useGameStore((s) => s.spendPoints)
  const recover = useGameStore((s) => s.recover)
  const lastFatigue = useGameStore((s) => s.lastFatigue)
  const [used, setUsed] = useState(false)
  const [msg, setMsg] = useState('')
  // 直前の登山で失った分の7割まで回復する
  // 小さいコースでも減った分より多くは戻らないよう、切り捨てにする（疲れていれば最低1）
  const recoverAmount = lastFatigue > 0 ? Math.max(1, Math.floor(lastFatigue * ONSEN_RATE)) : 0

  const handleOnsen = () => {
    if (spendPoints(ONSEN_COST)) {
      sfx.item()
      recover(recoverAmount)
      setUsed(true)
    } else {
      sfx.miss()
      setMsg('ポイントが足りないよ')
    }
  }

  return (
    <div style={styles.card}>
      <div style={{ marginBottom: 12 }}><GameIcon name="onsen" size={64} /></div>
      <h3 style={styles.cardTitle}>お疲れさま！温泉へどうぞ</h3>
      {!used ? (
        <>
          <p style={{ color: '#ccc', fontSize: 14, marginBottom: 16 }}>
            入湯料 {ONSEN_COST}pt で体力が回復するよ！<br />
            <span style={{ fontSize: 12, color: '#aab' }}>
              登山で失った {lastFatigue} のうち {recoverAmount} ぶん戻るよ
            </span>
          </p>
          {msg && <p style={{ color: '#ff8a80', fontSize: 13, margin: 0 }}>{msg}</p>}
          <button style={styles.primaryBtn} onClick={handleOnsen}>
            入湯する（{ONSEN_COST}pt）
          </button>
          <button style={styles.backBtn} onClick={onSkip}>スキップ</button>
        </>
      ) : (
        <>
          <p style={{ color: '#27ae60', fontSize: 16, marginBottom: 16 }}>
            体力が回復した！（各ステータス +{recoverAmount}）<br />
            <span style={{ fontSize: 12, color: '#aab' }}>疲れは完全には取れないから、鍛え続けよう</span>
          </p>
          <button style={styles.primaryBtn} onClick={onNext}>次へ</button>
        </>
      )}
    </div>
  )
}

// ──────────────────────────────────────────
// お土産画面
// ──────────────────────────────────────────
function SouvenirScreen({ mountainId, mountainName, onDone }) {
  const addPoints = useGameStore((s) => s.addPoints)
  const spendPoints = useGameStore((s) => s.spendPoints)
  const grantBlessing = useGameStore((s) => s.grantBlessing)
  const [bought, setBought] = useState([])
  const [granted, setGranted] = useState(null)
  const [msg, setMsg] = useState('')

  const souvenirs = SOUVENIRS.filter((s) => s.mountainId === mountainId)

  const handleBuy = (s) => {
    if (bought.includes(s.id)) return
    if (!spendPoints(s.price)) { sfx.miss(); setMsg('ポイントが足りないよ'); return }
    setMsg('')
    sfx.item()
    // お供えボーナス（ポイントの一部が戻る）
    addPoints(Math.floor(s.price * 0.3))
    // ご利益：次の登山1回だけ総合体力が上がる
    grantBlessing(mountainId, `${mountainName}の${s.name}`, s.blessing)
    setGranted(s)
    setBought([...bought, s.id])
  }

  return (
    <div style={styles.card}>
      <div style={{ marginBottom: 8 }}><GameIcon name="gift" size={52} /></div>
      <h3 style={styles.cardTitle}>お土産コーナー</h3>
      <p style={{ color: '#ccc', fontSize: 13, marginBottom: 12 }}>
        買うと山神へのお供えになり、次の登山にご利益がつくよ！
      </p>
      {granted && (
        <div style={styles.blessingBox}>
          <GameIcon name="sparkle" size={22} />
          <span>
            ご利益がついた！次の登山で総合体力 <b style={{ color: '#7ee8a5' }}>+{Math.round(granted.blessing * 100)}%</b>
          </span>
        </div>
      )}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {souvenirs.map((s) => (
          <div key={s.id} style={styles.souvenirRow}>
            <GameIcon name={s.emoji} size={26} />
            <span style={{ flex: 1, color: '#fff', fontSize: 14 }}>{s.name}</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: 8 }}>
              <span style={{ color: '#ffd700', fontSize: 13 }}>{s.price}pt</span>
              <span style={{ color: '#7ee8a5', fontSize: 10 }}>ご利益 +{Math.round(s.blessing * 100)}%</span>
            </div>
            <button
              style={{ ...styles.buyBtn, opacity: bought.includes(s.id) ? 0.5 : 1 }}
              onClick={() => handleBuy(s)}
              disabled={bought.includes(s.id)}
            >
              {bought.includes(s.id) ? '購入済' : '買う'}
            </button>
          </div>
        ))}
      </div>
      {msg && <p style={{ color: '#ff8a80', fontSize: 13, margin: '-8px 0 0' }}>{msg}</p>}
      <button style={styles.primaryBtn} onClick={onDone}>ホームへ戻る</button>
    </div>
  )
}

// ──────────────────────────────────────────
// 登山メイン
// ──────────────────────────────────────────
export default function Climbing() {
  const navigate = useNavigate()
  const player = useGameStore((s) => s.player)
  const mountains = useGameStore((s) => s.mountains)
  const flags = useGameStore((s) => s.flags)
  const completeCourse = useGameStore((s) => s.completeCourse)
  const setMountainAccessed = useGameStore((s) => s.setMountainAccessed)
  const addAlbumEntry = useGameStore((s) => s.addAlbumEntry)
  const unlockAR = useGameStore((s) => s.unlockAR)
  const addPoints = useGameStore((s) => s.addPoints)
  const recordMission = useGameStore((s) => s.recordMission)
  const spendClimbGear = useGameStore((s) => s.spendClimbGear)
  const [wornOut, setWornOut] = useState([])
  const applyFatigue = useGameStore((s) => s.applyFatigue)
  const album = useGameStore((s) => s.album)
  const spendPointsPenalty = useGameStore((s) => s.spendPoints)
  const blessing = useGameStore((s) => s.blessing)
  const discovered = useGameStore((s) => s.discovered)
  const [shareMsg, setShareMsg] = useState('')
  const consumeBlessing = useGameStore((s) => s.consumeBlessing)
  const lastFatigue = useGameStore((s) => s.lastFatigue)

  const [phase, setPhase] = useState('mountain') // mountain / course / intro / equip / game / result / onsen / souvenir
  const [selectedMountain, setSelectedMountain] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [gameResult, setGameResult] = useState(null) // success / early_fail / mid_fail / balance_fail
  const [blockedMsg, setBlockedMsg] = useState('')

  const total = Math.floor((player.core + player.legs + player.arms) / 3)

  const handleSelectMountain = (m) => {
    // 整備作業中の山には登れない（議事録 2026-10-11）
    if (isUnderMaintenance(mountains[m.id])) {
      sfx.miss()
      setBlockedMsg(`${m.name}は整備作業中だよ。あと${formatDuration(remainingMinutes(mountains[m.id]))}で終わるよ`)
      setTimeout(() => setBlockedMsg(''), 3000)
      return
    }
    setSelectedMountain(m)
    if (!mountains[m.id]?.firstAccessed) {
      setMountainAccessed(m.id)
      setPhase('intro')
    } else {
      setPhase('course')
    }
  }

  const handleGameComplete = (result, clearedStages = 0) => {
    setGameResult(result)
    recordMission('climb', selectedMountain.id)
    // 持って行った装備を1回ぶん使う（登頂しても脱落しても1回）。使い切ったものは消える
    setWornOut(spendClimbGear(selectedCourse.requiredItems || []))
    consumeBlessing()   // ご利益は1回の登山で消費される
    const reqTotal = selectedCourse.requiredStamina * 5 // 疲労は整備度に関係なく本来の必要体力で計算
    if (result === 'success') {
      sfx.fanfare()
      completeCourse(selectedMountain.id, selectedCourse.id)
      addPoints(selectedCourse.reward)
      addAlbumEntry({ mountainId: selectedMountain.id, courseId: selectedCourse.id, courseName: selectedCourse.name, mountainName: selectedMountain.name })
      if (!flags.arUnlocked) unlockAR()
      // 登頂による疲労: 必要総合体力 × 0.1（企画書p21）
      applyFatigue(Math.ceil(reqTotal * 0.1))
    } else {
      sfx.miss()
      // 脱落による疲労: 必要総合体力 × 0.02 × 進んだステージ数 + ポイントペナルティ（企画書p21,54）
      applyFatigue(Math.ceil(reqTotal * 0.02 * Math.max(1, clearedStages)))
      spendPointsPenalty(Math.min(Math.floor(selectedCourse.reward * 0.1), 500))
    }
    setPhase('result')
  }

  const handleShare = async () => {
    sfx.tap()
    const text = buildSummitText({
      playerName: player.name,
      mountainName: selectedMountain.name,
      courseName: selectedCourse.name,
      total,
      rate: Math.round((discovered.length / encyclopedia.length) * 100),
    })
    const r = await shareText('山アプリ 登頂記録', text)
    setShareMsg(
      r === 'shared' ? '共有しました！'
      : r === 'copied' ? '登頂記録をコピーしました。SNSに貼り付けてね'
      : r === 'cancelled' ? ''
      : '共有できませんでした'
    )
    setTimeout(() => setShareMsg(''), 3000)
  }

  const courses = coursesData.filter((c) => c.mountainId === selectedMountain?.id)
  const summited = mountains[selectedMountain?.id]?.summitedCourses || []
  const mtLevel = mountains[selectedMountain?.id]?.maintenanceLevel ?? 100
  const mtState = maintenanceState(mtLevel)

  // 下のナビやメニューからも来られるので、ここでも解禁を確かめる（ホームのスポットと同じ条件）
  if (!flags.climbingUnlocked) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <GameIcon name="lock" size={56} />
          <h3 style={styles.cardTitle}>登山はまだ解禁されていないよ</h3>
          <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7, textAlign: 'center', margin: 0 }}>
            総合体力が <b style={{ color: '#f5c842' }}>{CLIMB_UNLOCK_REQ}</b> になると解禁されるよ。<br />
            いまの総合体力は <b style={{ color: '#f5c842' }}>{total}</b>（あと {Math.max(0, CLIMB_UNLOCK_REQ - total)}）
          </p>
          <button style={styles.primaryBtn} onClick={() => navigate('/training')}>トレーニングへ</button>
        </div>
      </div>
    )
  }

  // ── 山選択 ──
  if (phase === 'mountain') {
    return (
      <div style={styles.container}>
        <div style={styles.pageTitle}>CLIMBING</div>
        {blockedMsg && <p style={styles.blockedMsg}>{blockedMsg}</p>}
        <div style={styles.list}>
          {MOUNTAINS.map((m) => {
            const unlocked = mountains[m.id]?.unlocked
            const busy = remainingMinutes(mountains[m.id])
            return (
              <button
                key={m.id}
                style={{ ...styles.mountainCard, borderColor: unlocked ? m.color : '#555', opacity: unlocked ? 1 : 0.5 }}
                onClick={() => unlocked && handleSelectMountain(m)}
                disabled={!unlocked}
              >
                <GameIcon name={m.emoji} size={40} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={styles.mountainName}>{m.name}</div>
                  {unlocked && m.sub && <div style={{ color: '#9ccc65', fontSize: 11.5, marginTop: 2 }}>{m.sub}</div>}
                  {unlocked && (() => {
                    const ms = maintenanceState(mountains[m.id]?.maintenanceLevel ?? 100)
                    return ms.penalty > 0 && (
                      <div style={{ color: ms.color, fontSize: 11.5, marginTop: 3 }}>
                        整備{ms.label}（{mountains[m.id].maintenanceLevel}%）— 必要体力 +{Math.round(ms.penalty * 100)}%
                      </div>
                    )
                  })()}
                  {!unlocked && <div style={{ color: '#888', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><GameIcon name="lock" size={14} /> 未解禁</div>}
                  {unlocked && busy > 0 && (
                    <div style={{ color: '#f5c842', fontSize: 11.5, marginTop: 3 }}>
                      整備作業中 — あと{formatDuration(busy)}
                    </div>
                  )}
                </div>
                {unlocked && <span style={{ color: m.color, fontSize: 20 }}>›</span>}
              </button>
            )
          })}
        </div>
        <button style={styles.shopLink} data-tut="climb-shop" onClick={() => navigate('/shop')}>山ショップへ ›</button>
      </div>
    )
  }

  // ── 山紹介（初回のみ） ──
  if (phase === 'intro') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          {selectedMountain.id === 'takao' ? <img src={takaoPose.intro[0]} alt="高尾" style={{ height: 220, animation: 'popIn 0.5s ease' }} draggable={false} />
            : selectedMountain.id === 'satoyama' ? <img src={senpaiPose.home[0]} alt="先輩" style={{ height: 160, animation: 'popIn 0.5s ease' }} draggable={false} />
            : <GameIcon name={selectedMountain.emoji} size={72} />}
          <h3 style={styles.cardTitle}>{selectedMountain.name}</h3>
          <p style={{ color: '#ddd', lineHeight: 1.8, marginBottom: 20, whiteSpace: 'pre-wrap', textAlign: 'center' }}>
            {MOUNTAIN_INTRO[selectedMountain.id] || `はじめまして！ ${selectedMountain.name}だよ。\nたくさん遊びに来てね！`}
          </p>
          <button style={styles.primaryBtn} onClick={() => setPhase('course')}>コース選択へ</button>
        </div>
      </div>
    )
  }

  // ── コース選択 ──
  if (phase === 'course') {
    return (
      <div style={styles.container}>
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 900, padding: '18px 0 4px' }}>{selectedMountain.name}</h2>
        <p style={{ color: '#aaa', fontSize: 13, marginBottom: 4 }}>あなたの総合体力: {total}</p>
        <p style={{ color: '#8a90a8', fontSize: 11.5, margin: '0 16px 8px', textAlign: 'center', lineHeight: 1.6 }}>
          推奨体力に届いていないと、途中で脱落してポイントと体力が減るよ
        </p>
        {blessing && (
          <p style={styles.blessingChip}>
            <GameIcon name="sparkle" size={14} /> {blessing.name}のご利益 +{Math.round(blessing.pct * 100)}%
          </p>
        )}
        {mtState.penalty > 0 && (
          <p style={{ ...styles.blockedMsg, color: mtState.color, borderColor: `${mtState.color}88`, background: `${mtState.color}1f` }}>
            整備度が {mtLevel}%（{mtState.label}）で道が荒れているよ。必要体力が +{Math.round(mtState.penalty * 100)}% になっているから、
            山整備をしてから登ると楽になるよ
          </p>
        )}
        <div style={styles.list}>
          {courses.map((c) => {
            const done = summited.includes(c.id)
            const reqTotal = requiredStaminaFor(c, mtLevel)
            const enough = total >= reqTotal
            return (
              <button
                key={c.id}
                style={{ ...styles.courseCard, opacity: enough ? 1 : 0.75 }}
                onClick={() => { setSelectedCourse(c); setPhase('equip') }}
              >
                <div style={styles.courseHeader}>
                  <span style={{ ...styles.courseName, display: 'flex', alignItems: 'center', gap: 5 }}>{c.name} {done && <GameIcon name="flagGoal" size={15} />}</span>
                  <span style={styles.diff}>{'★'.repeat(c.difficulty)}</span>
                </div>
                <div style={{ color: '#ccc', fontSize: 12 }}>{c.description}</div>
                <div style={styles.courseFooter}>
                  <span style={{ color: enough ? '#7ee8a5' : '#ff8a80', fontSize: 12, fontWeight: 700 }}>
                    推奨体力 {reqTotal}{enough ? '（OK）' : `（あと ${reqTotal - total}）`}
                  </span>
                  <span style={{ color: '#ffd700', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><GameIcon name="trophy" size={14} /> {c.reward}pt</span>
                </div>
              </button>
            )
          })}
        </div>
        <button style={styles.backBtn} onClick={() => setPhase('mountain')}>← 山選択へ</button>
      </div>
    )
  }

  // ── 装備チェック ──
  if (phase === 'equip') {
    return (
      <div style={styles.container}>
        <EquipmentCheck
          course={selectedCourse}
          onReady={() => setPhase('game')}
          onBack={() => setPhase('course')}
        />
      </div>
    )
  }

  // ── ミニゲーム ──
  if (phase === 'game') {
    return (
      <div style={styles.container}>
        <ClimbingGame
          course={selectedCourse}
          player={player}
          blessingPct={blessing?.pct ?? 0}
          maintenanceLevel={mtLevel}
          onComplete={handleGameComplete}
          onCancel={() => setPhase('course')}
        />
      </div>
    )
  }

  // ── 結果 ──
  if (phase === 'result') {
    const success = gameResult === 'success'
    const messages = {
      success: `+${selectedCourse.reward}pt 獲得！`,
      early_fail: '体力不足でここまでが限界だった…トレーニングを積もう！',
      mid_fail: '最後まで歩いたけど、山頂までの体力が足りなかった…もう一息！',
      balance_fail: 'バランスが崩れて転倒！体幹か脚力が足りないよ。苦手なトレーニングを補強しよう！',
      time: '時間切れで日が暮れてしまった…目印をもっと素早く見つけよう！',
    }
    const penalty = Math.min(Math.floor(selectedCourse.reward * 0.1), 500)
    return (
      <div style={styles.container}>
        {success && <Confetti count={50} />}
        <div style={styles.card}>
          {success ? <GameIcon name="trophy" size={64} style={{ animation: 'popIn 0.5s ease' }} /> : <img src={senpaiPose.think[2]} alt="先輩" style={{ height: 100 }} draggable={false} />}
          <h3 style={styles.cardTitle}>{success ? '登頂成功！' : '脱落…'}</h3>
          <p style={{ color: success ? '#2ecc71' : '#e74c3c', fontSize: 15, lineHeight: 1.6 }}>
            {messages[gameResult]}
          </p>
          <p style={{ color: '#aab', fontSize: 12 }}>
            {success
              ? `疲労で総合体力が ${Math.ceil(selectedCourse.requiredStamina * 5 * 0.1)} 減少。温泉で回復しよう！`
              : `疲労で体力が ${lastFatigue} 減って、${penalty}pt 失った…`}
          </p>
          {!success && mtState.penalty > 0 && (
            <p style={{ color: mtState.color, fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>
              道が荒れていて、必要体力が +{Math.round(mtState.penalty * 100)}% になっていたよ。山整備をすると登りやすくなるよ
            </p>
          )}
          {wornOut.length > 0 && (
            <p style={{ color: '#ffb36b', fontSize: 13, fontWeight: 700, lineHeight: 1.6, margin: 0 }}>
              {wornOut.map((w) => w.name).join('・')}が消耗しました！ 山ショップで買い直そう
            </p>
          )}
          {success && album.length === 1 && (
            <p style={{ color: '#f5c842', fontSize: 13, fontWeight: 700, animation: 'popIn 0.5s 0.3s both' }}>
              AR撮影が解禁されたよ！ホームから使ってみてね！
            </p>
          )}
          {success ? (
            <>
              <button style={styles.primaryBtn} onClick={() => setPhase('onsen')}>温泉へ ›</button>
              <button style={styles.shareBtn} onClick={handleShare}>
                <GameIcon name="phone" size={16} /> この登頂を共有する
              </button>
              {shareMsg && <p style={{ color: '#7ee8a5', fontSize: 12 }}>{shareMsg}</p>}
            </>
          ) : (
            <>
              {mtState.penalty > 0
                ? <button style={styles.primaryBtn} onClick={() => navigate('/maintenance')}>山整備へ</button>
                : <button style={styles.primaryBtn} onClick={() => navigate('/training')}>トレーニングへ</button>}
              <button style={styles.backBtn} onClick={() => setPhase('mountain')}>山選択へ</button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── 温泉 ──
  if (phase === 'onsen') {
    return (
      <div style={{ ...styles.container, backgroundImage: `linear-gradient(rgba(8,10,24,0.55), rgba(8,10,24,0.75)), url(${BG.onsen})` }}>
        <OnsenScreen
          onNext={() => setPhase('souvenir')}
          onSkip={() => setPhase('souvenir')}
        />
      </div>
    )
  }

  // ── お土産 ──
  if (phase === 'souvenir') {
    return (
      <div style={styles.container}>
        <SouvenirScreen
          mountainId={selectedMountain.id}
          mountainName={selectedMountain.name}
          onDone={() => navigate('/')}
        />
      </div>
    )
  }

  return null
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundImage: `linear-gradient(rgba(8,10,24,0.72), rgba(8,10,24,0.82)), url(${BG.home})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    paddingBottom: 80,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  pageTitle: { color: '#f5c842', fontSize: 12, fontWeight: 700, letterSpacing: 3, padding: '18px 0 10px' },
  list: { width: 'calc(100% - 32px)', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 },
  mountainCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid',
    borderRadius: 16,
    padding: '16px 20px',
    cursor: 'pointer',
    textAlign: 'left',
    justifyContent: 'space-between',
  },
  mountainName: { color: '#fff', fontSize: 18, fontWeight: 900 },
  courseCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: '14px 16px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  courseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  courseName: { color: '#fff', fontSize: 16, fontWeight: 900 },
  diff: { color: '#f5c842' },
  courseFooter: { display: 'flex', justifyContent: 'space-between', marginTop: 4 },
  card: {
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
    boxShadow: '0 0 40px rgba(123,92,240,0.15)',
  },
  cardTitle: { color: '#fff', fontSize: 22, fontWeight: 900, margin: 0 },
  equipList: { width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 },
  equipRow: {
    display: 'flex',
    justifyContent: 'space-between',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: '8px 12px',
    color: '#fff',
    fontSize: 14,
  },
  souvenirRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: '10px 12px',
  },
  buyBtn: {
    padding: '6px 14px',
    background: 'linear-gradient(135deg, #f5c842, #e0a800)',
    color: '#3a2a00',
    border: 'none',
    borderRadius: 16,
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
  },
  shareBtn: {
    width: '100%', padding: '11px 0', marginTop: 2,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    background: 'rgba(255,255,255,0.08)', color: '#dde',
    border: '1px solid rgba(255,255,255,0.22)', borderRadius: 24,
    fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
  },
  blessingChip: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: 'rgba(126,232,165,0.14)', border: '1px solid rgba(126,232,165,0.45)',
    borderRadius: 14, padding: '5px 12px', marginBottom: 10,
    color: '#7ee8a5', fontSize: 11.5, fontWeight: 700,
  },
  blessingBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(126,232,165,0.12)', border: '1px solid rgba(126,232,165,0.4)',
    borderRadius: 12, padding: '10px 13px', marginBottom: 14,
    color: '#ccd', fontSize: 12, lineHeight: 1.6, textAlign: 'left',
    animation: 'popIn 0.35s ease',
  },
  blockedMsg: {
    color: '#f5c842', fontSize: 13, fontWeight: 700, textAlign: 'center',
    background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.4)',
    borderRadius: 12, padding: '10px 14px', margin: '0 16px 10px',
    animation: 'popIn 0.3s ease',
  },
  buyAllBtn: {
    width: '100%', padding: '11px 0',
    background: 'linear-gradient(135deg, #f5c842, #e0a800)', color: '#1a0e00',
    border: 'none', borderRadius: 24, fontSize: 13.5, fontWeight: 900, cursor: 'pointer',
  },
  shopLink: {
    color: '#f5c842',
    background: 'rgba(245,200,66,0.1)',
    border: '1px solid rgba(245,200,66,0.3)',
    borderRadius: 20,
    padding: '9px 22px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
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
    marginTop: 4,
  },
}

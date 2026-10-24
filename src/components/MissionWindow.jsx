import { useGameStore } from '../stores/gameStore'
import GameIcon from './GameIcon'
import { Window, Tile } from './ui'
import { FS } from './uiStyles'
import { DAILY_MISSIONS, missionLabel, pickMissionMountain, todayString } from '../data/missions'
import { sfx } from '../utils/sound'

/* 今日のミッション：4つのマス。上に報酬、下に「うけとる」／「未達成」 */
export default function MissionWindow({ onClose }) {
  const daily = useGameStore((s) => s.daily)
  const mountains = useGameStore((s) => s.mountains)
  const claimMission = useGameStore((s) => s.claimMission)

  const today = todayString()
  const sameDay = daily.missionDate === today
  const progress = sameDay ? daily.missionProgress : {}
  const claimedIds = sameDay ? daily.missionClaimed : []
  const mountainId = (sameDay && daily.missionMountain) || pickMissionMountain(today, mountains)

  return (
    <Window title="今日のミッション" onClose={onClose} width={800}>
      <div style={st.grid}>
        {DAILY_MISSIONS.map((m) => {
          const cur = Math.min(progress[m.id] || 0, m.goal)
          const done = cur >= m.goal
          const claimed = claimedIds.includes(m.id)
          const left = m.goal - cur
          return (
            <div key={m.id} style={st.col}>
              <Tile style={st.tile} onClick={() => sfx.tap()}>
                <div style={st.reward}>
                  <GameIcon name="pcoin" size={22} />
                  <span style={st.rewardNum}>+{m.reward.toLocaleString()}</span>
                </div>
                <GameIcon name={m.icon} size={64} style={st.icon} />
                <div style={st.label}>{missionLabel(m, mountainId)}</div>
                <div style={st.barBg}>
                  <div style={{ ...st.barFill, width: `${(cur / m.goal) * 100}%` }} />
                </div>
                <div style={{ ...st.left, color: done ? '#1a8a47' : 'var(--brown-text)' }}>
                  {done ? '達成！' : `あと${left}回！`}
                </div>
              </Tile>
              <button
                style={{ ...st.btn, ...(done && !claimed ? st.btnReady : null) }}
                disabled={!done || claimed}
                onClick={() => { if (claimMission(m.id, m.reward)) sfx.coin() }}
              >
                {claimed ? '受け取りずみ' : done ? 'うけとる' : '未達成'}
              </button>
            </div>
          )
        })}
      </div>
    </Window>
  )
}

const st = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'clamp(8px, 2cqw, 18px)' },
  col: { display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 'clamp(8px, 2.6cqh, 14px)' },
  tile: { cursor: 'default', justifyContent: 'space-between', padding: 'clamp(6px, 2cqh, 12px) 6px' },
  reward: { display: 'flex', alignItems: 'center', gap: 3 },
  rewardNum: {
    color: 'var(--yamabuki)', fontSize: FS(4.4, 14, 20), fontWeight: 800,
    textShadow: '0 0 2px #5a3a10, 0 0 2px #5a3a10',
  },
  icon: { width: '40%', height: '40%' },
  label: { fontSize: FS(3.4, 11.5, 16), textAlign: 'center', lineHeight: 1.25 },
  barBg: { width: '82%', height: 8, background: '#e6dccb', borderRadius: 99, overflow: 'hidden' },
  barFill: { height: '100%', background: 'linear-gradient(90deg, #f8b500, #ffd65c)', borderRadius: 99, transition: 'width 0.5s ease' },
  left: { fontSize: FS(3.6, 12, 17), fontWeight: 800 },
  btn: {
    border: '2px solid var(--beige-edge)', borderRadius: 99,
    padding: 'clamp(5px, 1.8cqh, 10px) 0', fontSize: FS(3.8, 13, 18), fontWeight: 800,
    background: '#e6dccb', color: '#a8977f', cursor: 'default',
  },
  btnReady: {
    background: 'linear-gradient(135deg, #f8c537, #e0a000)', color: '#4a2e00', border: '2px solid #c58f00',
    cursor: 'pointer', boxShadow: '0 3px 0 #b07d00',
  },
}

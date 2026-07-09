import { useState } from 'react'
import GameIcon from '../components/GameIcon'
import { useGameStore } from '../stores/gameStore'
import ExploreGame from '../games/ExploreGame'
import { Confetti } from '../components/Celebration'
import { sfx } from '../utils/sound'
import { senpaiPose } from '../assets/characters/senpai'

export default function Explore() {
  const addPoints = useGameStore((state) => state.addPoints)
  const recordMission = useGameStore((state) => state.recordMission)
  const [gameState, setGameState] = useState('idle') // idle / playing / clear / gameover
  const [finalScore, setFinalScore] = useState(0)

  const handleClear = (score) => {
    addPoints(score)
    recordMission('explore')
    sfx.fanfare()
    setFinalScore(score)
    setGameState('clear')
  }

  const handleGameOver = (score) => {
    if (score > 0) addPoints(Math.floor(score / 2))
    sfx.miss()
    setFinalScore(score)
    setGameState('gameover')
  }

  return (
    <div style={styles.container}>
      <div style={styles.title}>EXPLORE</div>

      {gameState === 'idle' && (
        <div style={styles.card}>
          <GameIcon name="search" size={60} />
          <h3 style={styles.cardTitle}>山探索</h3>
          <p style={styles.desc}>アイテムを見つけてタップしよう！<br />ポイントを集めて登山に備えよう！</p>
          <button className="btn-primary" onClick={() => { sfx.go(); setGameState('playing') }}>はじめる</button>
        </div>
      )}

      {gameState === 'playing' && (
        <ExploreGame onClear={handleClear} onGameOver={handleGameOver} />
      )}

      {gameState === 'clear' && (
        <>
          <Confetti count={44} />
          <div style={styles.card}>
            <GameIcon name="trophy" size={64} style={{ animation: 'popIn 0.5s ease' }} />
            <h3 style={styles.cardTitle}>クリア！</h3>
            <p style={styles.desc}>スコア: {finalScore}</p>
            <p style={{ color: '#f5c842', fontWeight: 900, fontSize: 16, animation: 'popIn 0.5s 0.15s both', display: 'flex', alignItems: 'center', gap: 5 }}><GameIcon name="star" size={18} /> +{finalScore} ポイント獲得！</p>
            <button className="btn-primary" onClick={() => setGameState('idle')}>もう一度</button>
          </div>
        </>
      )}

      {gameState === 'gameover' && (
        <div style={styles.card}>
          <img src={senpaiPose.think[2]} alt="先輩" style={{ height: 110 }} draggable={false} />
          <h3 style={styles.cardTitle}>ゲームオーバー</h3>
          <p style={styles.desc}>スコア: {finalScore}</p>
          <button className="btn-primary" onClick={() => setGameState('idle')}>もう一度</button>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a1a 0%, #0d1a2a 50%, #0a1a12 100%)',
    paddingBottom: 80,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: { color: '#f5c842', fontSize: 12, fontWeight: 700, letterSpacing: 3, padding: '18px 0 10px' },
  card: {
    margin: '32px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(245,200,66,0.2)',
    borderRadius: 24,
    padding: '32px 24px',
    width: 'calc(100% - 32px)',
    maxWidth: 340,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    textAlign: 'center',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 0 40px rgba(123,92,240,0.15)',
  },
  cardTitle: { color: '#fff', fontSize: 22, fontWeight: 900, margin: 0 },
  desc: { color: '#ccd', fontSize: 14, lineHeight: 1.6, margin: 0 },
}

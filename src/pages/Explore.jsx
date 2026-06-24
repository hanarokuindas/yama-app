import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import ExploreGame from '../games/ExploreGame'

export default function Explore() {
  const addPoints = useGameStore((state) => state.addPoints)
  const addLegs = useGameStore((state) => state.addLegs)
  const [gameState, setGameState] = useState('idle') // idle / playing / clear / gameover
  const [finalScore, setFinalScore] = useState(0)

  const handleClear = (score) => {
    addPoints(score)
    // 山探索は脚力UP
    addLegs(Math.max(1, Math.floor(score / 200)))
    setFinalScore(score)
    setGameState('clear')
  }

  const handleGameOver = (score) => {
    if (score > 0) addPoints(Math.floor(score / 2))
    setFinalScore(score)
    setGameState('gameover')
  }

  return (
    <div style={styles.container}>
      <div style={styles.title}>EXPLORE</div>

      {gameState === 'idle' && (
        <div style={styles.card}>
          <span style={{ fontSize: 56 }}>🔍</span>
          <h3 style={styles.cardTitle}>山探索</h3>
          <p style={styles.desc}>アイテムを見つけてタップしよう！<br />脚力アップのチャンス！</p>
          <button className="btn-primary" onClick={() => setGameState('playing')}>はじめる</button>
        </div>
      )}

      {gameState === 'playing' && (
        <ExploreGame onClear={handleClear} onGameOver={handleGameOver} />
      )}

      {gameState === 'clear' && (
        <div style={styles.card}>
          <span style={{ fontSize: 56 }}>🎉</span>
          <h3 style={styles.cardTitle}>クリア！</h3>
          <p style={styles.desc}>スコア: {finalScore}</p>
          <p style={{ color: '#f5c842', fontWeight: 900, fontSize: 16 }}>⭐ +{finalScore} ポイント獲得！</p>
          <button className="btn-primary" onClick={() => setGameState('idle')}>もう一度</button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div style={styles.card}>
          <span style={{ fontSize: 56 }}>😢</span>
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

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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #2d4a2d 100%)',
      paddingBottom: '70px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <h2 style={{
        color: '#fff',
        padding: '16px',
        fontSize: '20px',
      }}>
        山探索
      </h2>

      {gameState === 'idle' && (
        <div style={{ textAlign: 'center', color: '#fff', padding: '20px' }}>
          <p style={{ marginBottom: '20px' }}>
            アイテムを見つけてタップしよう！
          </p>
          <button
            onClick={() => setGameState('playing')}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              backgroundColor: '#4a8f3f',
              color: '#fff',
              border: 'none',
              borderRadius: '24px',
              cursor: 'pointer',
            }}
          >
            はじめる
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <ExploreGame
          onClear={handleClear}
          onGameOver={handleGameOver}
        />
      )}

      {gameState === 'clear' && (
        <div style={{ textAlign: 'center', color: '#fff', padding: '20px' }}>
          <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>🎉 クリア！</h3>
          <p style={{ marginBottom: '8px' }}>スコア: {finalScore}</p>
          <p style={{ marginBottom: '20px' }}>⭐ +{finalScore} ポイント獲得！</p>
          <button
            onClick={() => setGameState('idle')}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              backgroundColor: '#4a8f3f',
              color: '#fff',
              border: 'none',
              borderRadius: '24px',
              cursor: 'pointer',
            }}
          >
            もう一度
          </button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div style={{ textAlign: 'center', color: '#fff', padding: '20px' }}>
          <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>😢 ゲームオーバー</h3>
          <p style={{ marginBottom: '8px' }}>スコア: {finalScore}</p>
          <button
            onClick={() => setGameState('idle')}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              backgroundColor: '#888',
              color: '#fff',
              border: 'none',
              borderRadius: '24px',
              cursor: 'pointer',
            }}
          >
            もう一度
          </button>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import { getGreeting, getUnlockedCharacters } from '../utils/characterUtils'

export default function Home() {
  const points = useGameStore((state) => state.player.points)
  const stamina = useGameStore((state) => state.player.stamina)
  const [currentChar, setCurrentChar] = useState(null)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const unlockedChars = getUnlockedCharacters()
    const randomChar = unlockedChars[Math.floor(Math.random() * unlockedChars.length)]
    setCurrentChar(randomChar)
    setGreeting(getGreeting(randomChar.id))
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #87CEEB 0%, #98D982 60%, #6B8F3E 100%)',
      paddingBottom: '70px',
    }}>

      {/* ステータスバー */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: 'rgba(255,255,255,0.3)',
      }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
          ⭐ {points.toLocaleString()}
        </span>
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
          💪 {stamina.toLocaleString()}
        </span>
      </div>

      {/* メインエリア */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 16px',
        gap: '20px',
      }}>

        {/* タイトル */}
        <h1 style={{
          fontSize: '28px',
          color: '#fff',
          textShadow: '1px 1px 4px rgba(0,0,0,0.4)',
          letterSpacing: '4px',
        }}>
          山アプリ
        </h1>

        {/* キャラクターメッセージエリア */}
        {currentChar && (
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderRadius: '16px',
            padding: '16px',
            width: '100%',
            maxWidth: '360px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <p style={{
              fontSize: '12px',
              color: '#888',
              marginBottom: '8px',
            }}>
              {currentChar.shortName}
            </p>
            <p style={{
              fontSize: '15px',
              color: '#333',
              lineHeight: '1.6',
            }}>
              {greeting}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

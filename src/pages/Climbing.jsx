import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import courses from '../data/courses.json'

import items from '../data/items.json'

// IDから日本語名を取得する関数
const getItemName = (itemId) => {
  const item = items.find(i => i.id === itemId)
  return item ? `${item.icon}${item.name}` : itemId
}

const DIFFICULTY_LABEL = { 1: '★☆☆', 2: '★★☆', 3: '★★★' }

export default function Climbing() {
  const points = useGameStore((state) => state.player.points)
  const stamina = useGameStore((state) => state.player.stamina)
  const inventory = useGameStore((state) => state.inventory)
  const exploreLevel = useGameStore((state) => state.player.exploreLevel)
  const addPoints = useGameStore((state) => state.addPoints)
  const addStamina = useGameStore((state) => state.addStamina)
  const completeCourse = useGameStore((state) => state.completeCourse)
  const summitedCourses = useGameStore((state) => state.mountains)

  const [gameState, setGameState] = useState('select') // select / check / climbing / success / failed
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [missingItems, setMissingItems] = useState([])
  const [climbProgress, setClimbProgress] = useState(0)
  const [timerId, setTimerId] = useState(null)

  const isSummited = (courseId) => {
    const allSummited = Object.values(summitedCourses).flatMap(m => m.summitedCourses)
    return allSummited.includes(courseId)
  }

  const handleSelectCourse = (course) => {
    setSelectedCourse(course)

    // 装備チェック
    const missing = course.requiredItems.filter(
      itemId => !inventory.some(i => i.id === itemId)
    )
    setMissingItems(missing)
    setGameState('check')
  }

  const handleStartClimbing = () => {
    if (stamina < selectedCourse.requiredStamina) return
    setClimbProgress(0)
    setGameState('climbing')

    let progress = 0
    const id = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5
      if (progress >= 100) {
        progress = 100
        setClimbProgress(100)
        clearInterval(id)

        // 成功
        addPoints(selectedCourse.reward)
        addStamina(-selectedCourse.requiredStamina)
        completeCourse(selectedCourse.mountainId, selectedCourse.id)
        setGameState('success')
      } else {
        setClimbProgress(progress)

        // ランダムで失敗
        if (Math.random() < 0.05 && stamina < selectedCourse.requiredStamina * 1.5) {
          clearInterval(id)
          addStamina(-Math.floor(selectedCourse.requiredStamina * 0.5))
          setGameState('failed')
        }
      }
    }, 800)
    setTimerId(id)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      paddingBottom: '70px',
    }}>

      {/* ヘッダー */}
      <div style={{
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <h2 style={{ color: '#fff', fontSize: '20px' }}>🏔️ 登山</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ color: '#ffd700', fontSize: '13px' }}>⭐{points.toLocaleString()}</span>
          <span style={{ color: '#fff', fontSize: '13px' }}>💪{stamina}</span>
        </div>
      </div>

      {/* コース選択 */}
      {gameState === 'select' && (
        <div style={{ padding: '16px' }}>
          <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
            登りたいコースを選んでね！
          </p>
          {courses.map(course => (
            <div
              key={course.id}
              onClick={() => handleSelectCourse(course)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '12px',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <p style={{ color: '#aaa', fontSize: '11px' }}>{course.mountainName}</p>
                <p style={{ color: '#ffd700', fontSize: '11px' }}>
                  {isSummited(course.id) ? '✅ 登頂済' : `⭐+${course.reward}`}
                </p>
              </div>
              <p style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '6px' }}>
                {course.name}
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ color: '#ffd700', fontSize: '12px' }}>{DIFFICULTY_LABEL[course.difficulty]}</span>
                <span style={{ color: '#aaa', fontSize: '12px' }}>📏{course.distance}km</span>
                <span style={{ color: '#aaa', fontSize: '12px' }}>⏱{course.duration}</span>
                <span style={{ color: '#aaa', fontSize: '12px' }}>🔥{course.calories}kcal</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 装備チェック */}
      {gameState === 'check' && selectedCourse && (
        <div style={{ padding: '16px' }}>
          <button
            onClick={() => setGameState('select')}
            style={{
              background: 'none',
              border: 'none',
              color: '#aaa',
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
          >
            ← 戻る
          </button>

          <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>
            {selectedCourse.name}
          </h3>
          <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '16px', lineHeight: '1.6' }}>
            {selectedCourse.description}
          </p>

          {/* 必要体力 */}
          <div style={{
            backgroundColor: stamina >= selectedCourse.requiredStamina
              ? 'rgba(74,143,63,0.2)'
              : 'rgba(255,68,68,0.2)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px',
          }}>
            <p style={{ color: '#fff', fontSize: '13px' }}>
              💪 必要体力：{selectedCourse.requiredStamina}
              現在：{stamina}
              {stamina >= selectedCourse.requiredStamina ? '✅' : '❌'}
            </p>
          </div>

          {/* 装備チェック */}
          <div style={{
            backgroundColor: missingItems.length === 0
              ? 'rgba(74,143,63,0.2)'
              : 'rgba(255,68,68,0.2)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
          }}>
            <p style={{ color: '#fff', fontSize: '13px', marginBottom: '8px' }}>
              🎒 装備チェック：{missingItems.length === 0 ? '✅ 完璧！' : `❌ ${missingItems.length}個不足`}
            </p>
            {missingItems.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                {missingItems.map(itemId => (
                  <p key={itemId} style={{ color: '#ff9999', fontSize: '12px', marginBottom: '4px' }}>
                    ✕ {getItemName(itemId)}
                  </p>
                ))}
              </div>
            )}

          </div>

          <button
            onClick={handleStartClimbing}
            disabled={missingItems.length > 0 || stamina < selectedCourse.requiredStamina}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: missingItems.length === 0 && stamina >= selectedCourse.requiredStamina
                ? '#4a8f3f'
                : '#555',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: missingItems.length === 0 && stamina >= selectedCourse.requiredStamina
                ? 'pointer'
                : 'not-allowed',
            }}
          >
            {missingItems.length > 0
              ? '装備が足りないよ！'
              : stamina < selectedCourse.requiredStamina
                ? '体力が足りないよ！'
                : '出発する！'}
          </button>
        </div>
      )}

      {/* 登山中 */}
      {gameState === 'climbing' && selectedCourse && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 16px',
          gap: '24px',
        }}>
          <h3 style={{ color: '#fff', fontSize: '20px' }}>{selectedCourse.name}</h3>
          <span style={{ fontSize: '64px' }}>🧗</span>
          <p style={{ color: '#aaa', fontSize: '14px' }}>登山中...</p>

          {/* プログレスバー */}
          <div style={{
            width: '100%',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            height: '20px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${climbProgress}%`,
              height: '100%',
              backgroundColor: '#4a8f3f',
              borderRadius: '8px',
              transition: 'width 0.8s ease',
            }} />
          </div>
          <p style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
            {climbProgress}%
          </p>
        </div>
      )}

      {/* 登頂成功 */}
      {gameState === 'success' && selectedCourse && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 16px',
          gap: '20px',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '64px' }}>🎉</span>
          <h3 style={{ color: '#fff', fontSize: '24px' }}>登頂成功！</h3>
          <p style={{ color: '#ffd700', fontSize: '20px', fontWeight: 'bold' }}>
            ⭐ +{selectedCourse.reward} ポイント獲得！
          </p>
          <p style={{ color: '#aaa', fontSize: '13px' }}>
            {selectedCourse.mountainName} {selectedCourse.name}
          </p>
          <button
            onClick={() => setGameState('select')}
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
            下山する
          </button>
        </div>
      )}

      {/* 登山失敗 */}
      {gameState === 'failed' && selectedCourse && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 16px',
          gap: '20px',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '64px' }}>😢</span>
          <h3 style={{ color: '#fff', fontSize: '24px' }}>下山...</h3>
          <p style={{ color: '#aaa', fontSize: '14px' }}>
            体力が足りなかったよ。トレーニングを続けよう！
          </p>
          <button
            onClick={() => setGameState('select')}
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
            戻る
          </button>
        </div>
      )}

    </div>
  )
}

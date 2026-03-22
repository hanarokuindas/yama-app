import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import courses from '../data/courses.json'
import characters from '../data/characters.json'

const TABS = ['山神', '登頂記録', '所持アイテム']

export default function Album() {
  const inventory = useGameStore((state) => state.inventory)
  const mountains = useGameStore((state) => state.mountains)
  const [activeTab, setActiveTab] = useState('山神')

  const getSummitedCourses = () => {
    const summited = Object.values(mountains).flatMap(m => m.summitedCourses)
    return courses.filter(c => summited.includes(c.id))
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1a1a3a 0%, #2a2a4a 100%)',
      paddingBottom: '70px',
    }}>

      {/* ヘッダー */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <h2 style={{ color: '#fff', fontSize: '20px' }}>📷 アルバム</h2>
      </div>

      {/* タブ */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #4a8f3f' : '2px solid transparent',
              color: activeTab === tab ? '#4dff91' : '#aaa',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 山神タブ */}
      {activeTab === '山神' && (
        <div style={{ padding: '16px' }}>
          {Object.values(characters).map(char => {
            const mountain = mountains[char.id]
            const isUnlocked = char.unlocked || mountain?.unlocked
            return (
              <div
                key={char.id}
                style={{
                  backgroundColor: isUnlocked
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  opacity: isUnlocked ? 1 : 0.4,
                }}
              >
                {/* アイコン */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: isUnlocked ? '#4a8f3f' : '#444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  flexShrink: 0,
                }}>
                  {isUnlocked ? '🏔️' : '🔒'}
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
                    {isUnlocked ? char.name : '？？？'}
                  </p>
                  <p style={{ color: '#aaa', fontSize: '12px', marginTop: '4px' }}>
                    {isUnlocked ? char.intro[0] : '未解禁'}
                  </p>
                  {isUnlocked && mountain && (
                    <p style={{ color: '#4dff91', fontSize: '11px', marginTop: '4px' }}>
                      登頂済：{mountain.summitedCourses.length}コース
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 登頂記録タブ */}
      {activeTab === '登頂記録' && (
        <div style={{ padding: '16px' }}>
          {getSummitedCourses().length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>🏔️</p>
              <p>まだ登頂記録がないよ！</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>登山に挑戦してみよう！</p>
            </div>
          ) : (
            getSummitedCourses().map(course => (
              <div
                key={course.id}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '12px',
                  border: '1px solid rgba(74,143,63,0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <p style={{ color: '#aaa', fontSize: '11px' }}>{course.mountainName}</p>
                  <p style={{ color: '#4dff91', fontSize: '11px' }}>✅ 登頂済</p>
                </div>
                <p style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', marginBottom: '6px' }}>
                  {course.name}
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ color: '#aaa', fontSize: '11px' }}>📏{course.distance}km</span>
                  <span style={{ color: '#aaa', fontSize: '11px' }}>⏱{course.duration}</span>
                  <span style={{ color: '#aaa', fontSize: '11px' }}>🔥{course.calories}kcal</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 所持アイテムタブ */}
      {activeTab === '所持アイテム' && (
        <div style={{ padding: '16px' }}>
          {inventory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>🎒</p>
              <p>アイテムがないよ！</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>登山ショップで装備を揃えよう！</p>
            </div>
          ) : (
            inventory.map((item, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <span style={{ fontSize: '28px' }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {item.name}
                  </p>
                  <p style={{ color: '#aaa', fontSize: '11px', marginTop: '2px' }}>
                    {item.category}
                  </p>
                </div>
                <span style={{ color: '#4dff91', fontSize: '16px' }}>✓</span>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  )
}

import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'ホーム', icon: '🏠' },
  { to: '/explore', label: '山探索', icon: '🔍' },
  { to: '/training', label: 'トレーニング', icon: '💪' },
  { to: '/climbing', label: '登山', icon: '⛰️' },
  { to: '/maintenance', label: '山整備', icon: '🪚' },
  { to: '/album', label: 'アルバム', icon: '📷' },
  { to: '/menu', label: 'Menu', icon: '☰' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '480px',
      height: '60px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: '#1a2a1a',
      borderTop: '1px solid rgba(255,255,255,0.15)',
      boxShadow: '0 -2px 12px rgba(0,0,0,0.4)',
      zIndex: 100,
    }}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.to
        return (
          <Link
            key={item.to}
            to={item.to}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              color: isActive ? '#27ae60' : '#888',
              fontSize: '9px',
              gap: '2px',
              minWidth: '40px',
              transition: 'color 0.2s',
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

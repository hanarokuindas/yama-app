import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'ホーム', icon: '🏠' },
  { to: '/explore', label: '山探索', icon: '🔍' },
  { to: '/training', label: 'トレーニング', icon: '💪' },
  { to: '/climbing', label: '登山', icon: '🏔️' },
  { to: '/maintenance', label: '山整備', icon: '🌿' },
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
      height: '65px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderTop: '1px solid #ddd',
      boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
      zIndex: 1,
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
              color: isActive ? '#4a8f3f' : '#999',
              fontSize: '10px',
              gap: '2px',
              minWidth: '40px',
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

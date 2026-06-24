import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'ホーム', icon: '🏠' },
  { to: '/training', label: '鍛錬', icon: '💪' },
  { to: '/climbing', label: '登山', icon: '⛰️' },
  { to: '/explore', label: '探索', icon: '🔍' },
  { to: '/menu', label: 'メニュー', icon: '☰' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav style={styles.nav}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.to
        return (
          <Link key={item.to} to={item.to} style={{ textDecoration: 'none', flex: 1 }}>
            <div style={{ ...styles.item, ...(isActive ? styles.itemActive : {}) }}>
              {isActive && <div style={styles.activeDot} />}
              <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
              <span style={{ ...styles.label, color: isActive ? '#f5c842' : '#667' }}>{item.label}</span>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}

const styles = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 480,
    height: 64,
    display: 'flex',
    alignItems: 'stretch',
    background: 'linear-gradient(180deg, rgba(13,13,26,0.85) 0%, rgba(13,13,26,0.98) 100%)',
    borderTop: '1px solid rgba(245,200,66,0.18)',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.6)',
    zIndex: 100,
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: '100%',
    position: 'relative',
    transition: 'opacity 0.15s',
  },
  itemActive: {
    opacity: 1,
  },
  activeDot: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 32,
    height: 2,
    background: 'linear-gradient(90deg, #f5c842, #ffe98a)',
    borderRadius: '0 0 4px 4px',
    boxShadow: '0 0 8px rgba(245,200,66,0.8)',
  },
  label: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
}

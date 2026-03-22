import { Link } from 'react-router-dom'

export default function BottomNav() {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '50px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderTop: '1px solid #ccc',
      padding: '8px 0',
      zIndex: 1,
    }}>
      <Link to="/">ホーム</Link>
      <Link to="/explore">山探索</Link>
      <Link to="/training">トレーニング</Link>
      <Link to="/climbing">登山</Link>
      <Link to="/maintenance">山整備</Link>
      <Link to="/album">アルバム</Link>
      <Link to="/menu">Menu</Link>
    </nav>
  )
}

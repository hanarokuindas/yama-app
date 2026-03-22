import { Link } from 'react-router-dom'

export default function Menu() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1a2a3a 0%, #2a3a4a 100%)',
      paddingBottom: '70px',
      padding: '16px',
    }}>
      <h2 style={{ color: '#fff', fontSize: '20px', marginBottom: '20px' }}>Menu</h2>
      <Link to="/shop" style={{
        display: 'block',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '16px',
        color: '#fff',
        textDecoration: 'none',
        marginBottom: '12px',
        fontSize: '16px',
      }}>
        🏪 登山ショップ
      </Link>
    </div>
  )
}

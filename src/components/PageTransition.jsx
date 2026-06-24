import { useLocation } from 'react-router-dom'

// ルートが変わるたびに key を更新して入場アニメをやり直させる
export default function PageTransition({ children }) {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-transition">
      {children}
    </div>
  )
}

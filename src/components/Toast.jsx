import { useEffect } from 'react'

export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => {
      onClose()
    }, 2500)
    return () => clearTimeout(timer)
  }, [message])

  if (!message) return null

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0,0,0,0.85)',
      color: '#fff',
      padding: '16px 24px',
      borderRadius: '16px',
      fontSize: '15px',
      textAlign: 'center',
      zIndex: 999,
      maxWidth: '280px',
      lineHeight: '1.6',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      {message}
    </div>
  )
}

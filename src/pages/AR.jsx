import { useState, useRef } from 'react'
import { useGameStore } from '../stores/gameStore'

export default function AR() {
  const flags = useGameStore((s) => s.flags)
  const album = useGameStore((s) => s.album)
  const [active, setActive] = useState(false)
  const [photo, setPhoto] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setActive(true)
    } catch {
      alert('カメラへのアクセスができませんでした。ブラウザの設定を確認してください。')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    setActive(false)
    setPhoto(null)
  }

  const takePhoto = () => {
    const canvas = document.createElement('canvas')
    const video = videoRef.current
    if (!video) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    // ARオーバーレイ（登頂した山の名前スタンプ）
    ctx.font = 'bold 28px sans-serif'
    ctx.fillStyle = 'rgba(255,255,0,0.9)'
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 3
    const lastEntry = album[album.length - 1]
    const label = lastEntry ? `🏔️ ${lastEntry.mountainName} ${lastEntry.courseName}` : '🏔️ 山アプリ'
    ctx.strokeText(label, 16, canvas.height - 30)
    ctx.fillText(label, 16, canvas.height - 30)
    setPhoto(canvas.toDataURL('image/jpeg', 0.9))
    stopCamera()
  }

  if (!flags.arUnlocked) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <span style={{ fontSize: 56 }}>🔒</span>
          <h3 style={styles.title}>AR撮影</h3>
          <p style={{ color: '#ccc', fontSize: 14, textAlign: 'center', lineHeight: 1.7 }}>
            最初の登頂成功後に解禁されます！{'\n'}山を登って解禁しよう！
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.title2}>AR CAMERA</div>

      {!active && !photo && (
        <div style={styles.card}>
          <span style={{ fontSize: 56 }}>📷</span>
          <h3 style={styles.title}>山で写真を撮ろう！</h3>
          <p style={{ color: '#ccc', fontSize: 13, textAlign: 'center', lineHeight: 1.7 }}>
            カメラを起動して登頂スタンプ付きの写真を撮ろう。
          </p>
          <button style={styles.primaryBtn} onClick={startCamera}>カメラを起動</button>
        </div>
      )}

      {active && (
        <div style={styles.cameraWrapper}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', borderRadius: 12, display: 'block' }}
          />
          {/* ARオーバーレイ */}
          <div style={styles.arOverlay}>
            {album.length > 0 && (
              <div style={styles.arStamp}>
                🏔️ {album[album.length - 1].mountainName} {album[album.length - 1].courseName}
              </div>
            )}
          </div>
          <div style={styles.camControls}>
            <button style={styles.captureBtn} onClick={takePhoto}>📸 撮影</button>
            <button style={styles.cancelBtn} onClick={stopCamera}>キャンセル</button>
          </div>
        </div>
      )}

      {photo && (
        <div style={styles.card}>
          <h3 style={styles.title}>撮影完了！</h3>
          <img src={photo} alt="撮影した写真" style={{ width: '100%', borderRadius: 12 }} />
          <p style={{ color: '#aaa', fontSize: 12, textAlign: 'center' }}>
            長押しで保存できます
          </p>
          <button style={styles.primaryBtn} onClick={() => setPhoto(null)}>もう一度撮る</button>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a1a 0%, #0d1a2a 50%, #0a1a12 100%)',
    paddingBottom: 80,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title2: { color: '#f5c842', fontSize: 12, fontWeight: 700, letterSpacing: 3, padding: '18px 0 10px' },
  card: {
    margin: '32px 16px',
    background: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    padding: '28px 24px',
    width: 'calc(100% - 32px)',
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    backdropFilter: 'blur(8px)',
    textAlign: 'center',
  },
  title: { color: '#fff', fontSize: 20, margin: 0 },
  primaryBtn: {
    width: '100%',
    padding: '12px 0',
    background: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: 24,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  cameraWrapper: {
    position: 'relative',
    width: 'calc(100% - 32px)',
    maxWidth: 400,
    marginTop: 16,
  },
  arOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    padding: '0 16px',
    pointerEvents: 'none',
  },
  arStamp: {
    display: 'inline-block',
    background: 'rgba(0,0,0,0.6)',
    color: '#ffd700',
    fontSize: 16,
    fontWeight: 'bold',
    padding: '6px 12px',
    borderRadius: 8,
    backdropFilter: 'blur(4px)',
  },
  camControls: {
    display: 'flex',
    gap: 12,
    marginTop: 12,
  },
  captureBtn: {
    flex: 2,
    padding: '14px 0',
    background: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: 24,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  cancelBtn: {
    flex: 1,
    padding: '14px 0',
    background: 'rgba(255,255,255,0.1)',
    color: '#aaa',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 24,
    fontSize: 14,
    cursor: 'pointer',
  },
}

import { useState, useRef, useEffect } from 'react'
import { BG } from '../assets/backgrounds'
import GameIcon from '../components/GameIcon'
import { useGameStore } from '../stores/gameStore'
import coursesData from '../data/courses.json'
import { yatsugatakeAR } from '../assets/characters/yatsugatake'
import { takaoAR } from '../assets/characters/takao'
import { hakoneAR } from '../assets/characters/hakone'

/* AR撮影（最新ラフ p3・p104）：はじめての登頂で解放（風景と登頂スタンプ）。
   その山の全コースを登頂すると、山神が会いに来てくれて一緒に写真を撮れる */
const GODS = [
  { id: 'yatsugatake', name: 'ヤツガタケ', img: yatsugatakeAR.plain },
  { id: 'takao', name: 'タカオ', img: takaoAR.sheer },
  { id: 'hakone', name: 'ハコネ', img: hakoneAR.plain },
]
const COURSE_COUNT = Object.fromEntries(GODS.map((g) => [g.id, coursesData.filter((c) => c.mountainId === g.id).length]))

function godUnlocked(mountains, id) {
  return (mountains[id]?.summitedCourses?.length || 0) >= COURSE_COUNT[id]
}

export default function AR() {
  const flags = useGameStore((s) => s.flags)
  const album = useGameStore((s) => s.album)
  const mountains = useGameStore((s) => s.mountains)
  const [god, setGod] = useState(null) // 一緒に撮る山神
  const [active, setActive] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const startCamera = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setActive(true)
    } catch {
      setError('カメラを使えませんでした。ブラウザの設定でカメラの使用を許可してから、もう一度ためしてね。')
    }
  }

  // video 要素は active になってから描かれるので、映像はそのあとでつなぐ
  useEffect(() => {
    if (active && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current
  }, [active])

  // 画面を離れたらカメラを止める
  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), [])

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
    const g = GODS.find((x) => x.id === god)
    const godImg = g && document.getElementById('ar-god')
    if (godImg?.naturalWidth) {
      const h = canvas.height * 0.85
      const w = h * (godImg.naturalWidth / godImg.naturalHeight)
      ctx.drawImage(godImg, canvas.width - w - canvas.width * 0.04, canvas.height - h, w, h)
    }
    // ARオーバーレイ（登頂した山の名前スタンプ）
    ctx.font = 'bold 28px sans-serif'
    ctx.fillStyle = 'rgba(255,255,0,0.9)'
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 3
    const lastEntry = album[album.length - 1]
    const label = lastEntry ? `▲ ${lastEntry.mountainName} ${lastEntry.courseName}` : '▲ 山アプリ'
    ctx.strokeText(label, 16, canvas.height - 30)
    ctx.fillText(label, 16, canvas.height - 30)
    setPhoto(canvas.toDataURL('image/jpeg', 0.9))
    stopCamera()
  }

  if (!flags.arUnlocked) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <GameIcon name="lock" size={60} />
          <h3 style={styles.title}>AR撮影</h3>
          <p style={{ color: '#ccc', fontSize: 14, textAlign: 'center', lineHeight: 1.7 }}>
            はじめて登頂すると解放されるよ！{'\n'}山を登ってみよう！
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
          <GameIcon name="camera" size={60} />
          <h3 style={styles.title}>山で写真を撮ろう！</h3>
          <p style={{ color: '#ccc', fontSize: 13, textAlign: 'center', lineHeight: 1.7 }}>
            カメラを起動して登頂スタンプ付きの写真を撮ろう。{'\n'}その山の全コースを登頂すると、山神が会いに来てくれるよ！
          </p>
          <div style={styles.godRow}>
            {GODS.map((g) => {
              const ok = godUnlocked(mountains, g.id)
              const left = COURSE_COUNT[g.id] - (mountains[g.id]?.summitedCourses?.length || 0)
              return (
                <button key={g.id} disabled={!ok} onClick={() => setGod(god === g.id ? null : g.id)}
                  style={{ ...styles.godChip, ...(god === g.id ? styles.godOn : null), ...(ok ? null : styles.godLocked) }}>
                  <img src={g.img} alt="" style={{ height: 64, filter: ok ? 'none' : 'brightness(0) opacity(0.35)' }} draggable={false} />
                  <span>{ok ? g.name : `あと${left}コース`}</span>
                </button>
              )
            })}
          </div>
          {error && <p style={{ color: '#ff8a80', fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>{error}</p>}
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
          {god && <img id="ar-god" src={GODS.find((g) => g.id === god).img} alt="" style={styles.godOverlay} draggable={false} />}
          {/* ARオーバーレイ */}
          <div style={styles.arOverlay}>
            {album.length > 0 && (
              <div style={styles.arStamp}>
                ▲ {album[album.length - 1].mountainName} {album[album.length - 1].courseName}
              </div>
            )}
          </div>
          <div style={styles.camControls}>
            <button style={styles.captureBtn} onClick={takePhoto}>● 撮影</button>
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
    backgroundImage: `linear-gradient(rgba(8,10,24,0.72), rgba(8,10,24,0.82)), url(${BG.stage.rocky})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
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
  godRow: { display: 'flex', gap: 8, justifyContent: 'center' },
  godChip: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: 92, padding: 6,
    background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: 12,
    color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
  },
  godOn: { border: '2px solid #f5c842', background: 'rgba(245,200,66,0.25)' },
  godLocked: { cursor: 'default', color: '#aab' },
  godOverlay: { position: 'absolute', right: '4%', bottom: 0, height: '85%', pointerEvents: 'none' },
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

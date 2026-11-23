import { useEffect, useRef } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import PageTransition from './components/PageTransition'
import { HomeButton } from './components/PlankButton'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Training from './pages/Training'
import Climbing from './pages/Climbing'
import Maintenance from './pages/Maintenance'
import Album from './pages/Album'
import Shop from './pages/Shop'
import Guide from './pages/Guide'
import AR from './pages/AR'
import TutorialOverlay from './components/TutorialOverlay'
import GameIcon from './components/GameIcon'
import { useGameStore } from './stores/gameStore'
import { applySoundSettings } from './utils/sound'

/* まだ横画面向けに作り直していない画面。中央の列に置き、左上にホームへ戻るボタンを出す */
function Legacy({ children }) {
  return (
    <div className="legacy-page">
      {children}
      <HomeButton style={{ position: 'fixed', top: 8, left: 10, zIndex: 90 }} />
    </div>
  )
}

/* 解放前の画面にメニューやURLから来たときは、条件だけ見せてホームへ戻す */
function Gate({ flag, text, children }) {
  const open = useGameStore((s) => s.flags[flag])
  if (open) return children
  return (
    <div style={{ height: '100cqh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'var(--brown-text)', fontSize: 18 }}>
      <GameIcon name="lock" size={56} />
      <p>{text}</p>
      <HomeButton />
    </div>
  )
}

function Inner() {
  const location = useLocation()
  const scrollRef = useRef(null)
  const settings = useGameStore((s) => s.settings)

  // メニューの「サウンド」の設定を効果音に反映する
  useEffect(() => { applySoundSettings(settings) }, [settings])

  // 画面が変わったら上から見せる（スクロールは .app-scroll の中で起きる）
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [location.pathname])

  return (
    <>
      <div className="app-stage">
        <div className="app-scroll" ref={scrollRef}>
          <PageTransition>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/training" element={<Gate flag="trainingUnlocked" text="トレーニングは、山探索を1回クリアすると解放されるよ"><Legacy><Training /></Legacy></Gate>} />
              <Route path="/climbing" element={<Climbing />} />
              <Route path="/maintenance" element={<Gate flag="maintenanceUnlocked" text="山整備は、はじめて登頂すると解放されるよ"><Legacy><Maintenance /></Legacy></Gate>} />
              <Route path="/album" element={<Album />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/guide" element={<Guide />} />
              <Route path="/ar" element={<Legacy><AR /></Legacy>} />
            </Routes>
          </PageTransition>
        </div>
      </div>
      <TutorialOverlay />
      <div className="rotate-notice">
        <GameIcon name="phone" size={72} style={{ animation: 'rotateHint 1.8s ease-in-out infinite' }} />
        <div>横にしてね</div>
      </div>
    </>
  )
}

function App() {
  return (
    <HashRouter>
      <Inner />
    </HashRouter>
  )
}

export default App

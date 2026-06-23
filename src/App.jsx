import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Training from './pages/Training'
import Climbing from './pages/Climbing'
import Maintenance from './pages/Maintenance'
import Album from './pages/Album'
import Shop from './pages/Shop'
import Menu from './pages/Menu'
import AR from './pages/AR'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/training" element={<Training />} />
        <Route path="/climbing" element={<Climbing />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/album" element={<Album />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/ar" element={<AR />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  )
}

export default App

import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Rate from './pages/Rating'
import Catalog from './pages/Catalog'
import TierMaker from './pages/TierMaker'
import TierListTemplates from './pages/TierListTemplates'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'
import TierListDetail from './pages/TierListDetail'
import BattlePage from './pages/BattlePage'
import AnimeOPED from './pages/AnimeOPED'
import DominionLobby from './pages/DominionLobby'
import DominionGame from './pages/DominionGame'
import MonopolyLobby from './pages/MonopolyLobby'
import MonopolyGame from './pages/MonopolyGame'

const FULLSCREEN_ROUTES = ['/monopoly/game']

export default function App() {
  const location = useLocation()
  const isFullscreen = FULLSCREEN_ROUTES.includes(location.pathname)

  if (isFullscreen) {
    return (
      <Routes>
        <Route path="/monopoly/game" element={
          <ProtectedRoute>
            <MonopolyGame />
          </ProtectedRoute>
        } />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen flex flex-col underwave-bg text-text vignette">

      <Navbar />
      <div className="flex-1">
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route
          path="/rate"
          element={
            <ProtectedRoute>
              <Rate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tiermaker"
          element={
            <ProtectedRoute>
              <TierMaker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tier-templates"
          element={
            <ProtectedRoute>
              <TierListTemplates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/user/:userId" element={<PublicProfile />} />
        <Route path="/tierlist/:listId" element={<TierListDetail />} />
        <Route path="/battle" element={
          <ProtectedRoute>
            <BattlePage />
          </ProtectedRoute>
        } />
        <Route path="/anime-oped" element={
          <ProtectedRoute>
            <AnimeOPED />
          </ProtectedRoute>
        } />
        <Route path="/dominion" element={
          <ProtectedRoute>
            <DominionLobby />
          </ProtectedRoute>
        } />
        <Route path="/dominion/game" element={
          <ProtectedRoute>
            <DominionGame />
          </ProtectedRoute>
        } />
        <Route path="/monopoly" element={
          <ProtectedRoute>
            <MonopolyLobby />
          </ProtectedRoute>
        } />
      </Routes>
      </div>
      <Footer />
    </div>
  )
}

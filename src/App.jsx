import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AsciiAuraBg from './components/AsciiAuraBg'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Rate from './pages/Rating'
import Catalog from './pages/Catalog'
import TierMaker from './pages/TierMaker'
import TierTemplatesSelect from './pages/TierTemplatesSelect'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'
import TierListDetail from './pages/TierListDetail'
import BattlePage from './pages/BattlePage'
import AnimeOPED from './pages/AnimeOPED'
import ScreenshotQuiz from './pages/ScreenshotQuiz'
import DominionLobby from './pages/DominionLobby'
import DominionGame from './pages/DominionGame'
import DraftLobby from './pages/DraftLobby'
import DraftGame from './pages/DraftGame'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col underwave-bg text-text vignette">
      <AsciiAuraBg />

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
              <TierTemplatesSelect />
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
        <Route path="/screenshot-quiz" element={
          <ProtectedRoute>
            <ScreenshotQuiz />
          </ProtectedRoute>
        } />
        <Route path="/draft" element={
          <ProtectedRoute>
            <DraftLobby />
          </ProtectedRoute>
        } />
        <Route path="/draft/game" element={
          <ProtectedRoute>
            <DraftGame />
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
      </Routes>
      </div>
      <Footer />
    </div>
  )
}

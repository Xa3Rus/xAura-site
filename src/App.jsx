import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Rate from './pages/Rating'
import Catalog from './pages/Catalog'
import TierMaker from './pages/TierMaker'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'
import TierListDetail from './pages/TierListDetail'
import BattlePage from './pages/BattlePage'

export default function App() {
  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
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
      </Routes>
    </div>
  )
}

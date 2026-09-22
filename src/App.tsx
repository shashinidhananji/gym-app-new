import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { ProtectedRoute } from './auth/ProtectedRoute'
import Layout from './pages/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MemberHome from './pages/member/MemberHome'
import MySchedule from './pages/member/MySchedule'
import MyMembership from './pages/member/MyMembership'
import MyQrCode from './pages/member/MyQrCode'
import Dashboard from './pages/admin/Dashboard'
import Members from './pages/admin/Members'
import MemberDetail from './pages/admin/MemberDetail'
import ScanCheckIn from './pages/admin/ScanCheckIn'
import Plans from './pages/admin/Plans'
import './App.css'

function RootRedirect() {
  const { session, loading, isStaff } = useAuth()
  if (loading) return <p className="centered-note">Loading…</p>
  if (!session) return <Navigate to="/login" replace />
  return <Navigate to={isStaff ? '/admin' : '/app'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<Layout />}>
              <Route index element={<MemberHome />} />
              <Route path="schedule" element={<MySchedule />} />
              <Route path="membership" element={<MyMembership />} />
              <Route path="qr" element={<MyQrCode />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute staffOnly />}>
            <Route path="/admin" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="members" element={<Members />} />
              <Route path="members/:id" element={<MemberDetail />} />
              <Route path="scan" element={<ScanCheckIn />} />
              <Route path="plans" element={<Plans />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function ProtectedRoute({ staffOnly = false }: { staffOnly?: boolean }) {
  const { session, profile, loading, isStaff } = useAuth()

  if (loading) return <p className="centered-note">Loading…</p>
  if (!session) return <Navigate to="/login" replace />
  if (staffOnly && !isStaff) return <Navigate to="/app" replace />
  if (!profile) return <p className="centered-note">Loading profile…</p>

  return <Outlet />
}

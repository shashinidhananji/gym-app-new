import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

const memberLinks = [
  { to: '/app', label: 'Today', end: true },
  { to: '/app/schedule', label: 'Schedule' },
  { to: '/app/membership', label: 'Membership' },
  { to: '/app/qr', label: 'My QR' },
]

const staffLinks = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/members', label: 'Members' },
  { to: '/admin/scan', label: 'Scan' },
  { to: '/admin/plans', label: 'Plans' },
]

export default function Layout() {
  const { profile, isStaff, signOut } = useAuth()
  const links = isStaff ? staffLinks : memberLinks

  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">Gym</span>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-right">
          <span className="muted">{profile?.full_name || 'Account'}</span>
          <button className="link-btn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

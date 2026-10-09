import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

const icons = {
  home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  card: 'M3 7h18v11H3zM3 11h18',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2z',
  gauge: 'M12 21a9 9 0 1 1 9-9M12 12l5-3',
  users: 'M3 20a6 6 0 0 1 12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 20a5 5 0 0 0-3-4.6',
  scan: 'M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M3 12h18',
  tag: 'M4 4h8l8 8-8 8-8-8z',
}

const memberLinks = [
  { to: '/app', label: 'Home', icon: icons.home, end: true },
  { to: '/app/schedule', label: 'Plan', icon: icons.calendar },
  { to: '/app/membership', label: 'Membership', icon: icons.card },
  { to: '/app/qr', label: 'My QR', icon: icons.qr },
]

const staffLinks = [
  { to: '/admin', label: 'Dashboard', icon: icons.gauge, end: true },
  { to: '/admin/members', label: 'Members', icon: icons.users },
  { to: '/admin/scan', label: 'Scan', icon: icons.scan },
  { to: '/admin/plans', label: 'Plans', icon: icons.tag },
]

function TabIcon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}

export default function Layout() {
  const { profile, isStaff, signOut } = useAuth()
  const links = isStaff ? staffLinks : memberLinks
  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="shell">
      <header className="app-header">
        <div>
          <p className="greeting">{isStaff ? 'Signed in as staff' : 'Welcome back'}</p>
          <p className="who">Hello, {firstName}</p>
        </div>
        <button className="icon-btn" onClick={signOut} title="Sign out">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 17l5-5-5-5M20 12H9M12 20H5V4h7" />
          </svg>
        </button>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <nav className="tabbar">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            <TabIcon d={l.icon} />
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

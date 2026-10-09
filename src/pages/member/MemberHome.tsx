import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import type { CheckIn, Membership } from '../../lib/types'
import { ScheduleView } from './MySchedule'

export default function MemberHome() {
  const { profile } = useAuth()
  const [membership, setMembership] = useState<Membership | null>(null)
  const [openCheckIn, setOpenCheckIn] = useState<CheckIn | null>(null)

  useEffect(() => {
    if (!profile) return

    async function load() {
      const [m, c] = await Promise.all([
        supabase.from('memberships').select('*').maybeSingle(),
        supabase
          .from('check_ins')
          .select('*')
          .is('checked_out_at', null)
          .maybeSingle(),
      ])
      setMembership(m.data as Membership | null)
      setOpenCheckIn(c.data as CheckIn | null)
    }

    load()
  }, [profile])

  if (!profile) return null

  const isActive =
    membership?.status === 'active' || membership?.status === 'trialing'

  return (
    <section>
      <div className="hero">
        <p className="hero-label">Today</p>
        <h2>{openCheckIn ? "You're training now" : 'Ready to train?'}</h2>
        <p className="muted">
          {isActive
            ? 'Your membership is active. Scan your QR at the desk to check in.'
            : 'Activate a membership to get started.'}
        </p>
      </div>

      <div className="stat-row">
        <div className="card">
          <span className="muted">Membership</span>
          <p className="stat">
            {membership ? membership.status : 'none'}
          </p>
          {!isActive && <Link to="/app/membership">Choose a plan</Link>}
        </div>
        <div className="card">
          <span className="muted">Right now</span>
          <p className="stat">{openCheckIn ? 'In the gym' : 'Not checked in'}</p>
          {openCheckIn && (
            <span className="muted">
              since{' '}
              {new Date(openCheckIn.checked_in_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>

      <ScheduleView memberId={profile.id} />
    </section>
  )
}

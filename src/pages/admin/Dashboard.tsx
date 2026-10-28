import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface InGymRow {
  id: string
  checked_in_at: string
  member: { full_name: string } | null
}

export default function Dashboard() {
  const [inGym, setInGym] = useState<InGymRow[]>([])
  const [activeMembers, setActiveMembers] = useState(0)

  useEffect(() => {
    async function loadOccupancy() {
      const { data } = await supabase
        .from('check_ins')
        .select('id, checked_in_at, member:profiles!check_ins_member_id_fkey(full_name)')
        .is('checked_out_at', null)
        .order('checked_in_at', { ascending: false })
      setInGym((data ?? []) as unknown as InGymRow[])
    }

    async function loadMembers() {
      const { count } = await supabase
        .from('memberships')
        .select('id', { count: 'exact', head: true })
        .in('status', ['active', 'trialing'])
      setActiveMembers(count ?? 0)
    }

    loadOccupancy()
    loadMembers()

    // Realtime: any insert/update to check_ins changes who is in the gym.
    const channel = supabase
      .channel('occupancy')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'check_ins' },
        loadOccupancy,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <section>
      <h2>Dashboard</h2>

      <div className="stat-row">
        <div className="card">
          <span className="muted">Currently in the gym</span>
          <p className="stat stat-big">{inGym.length}</p>
        </div>
        <div className="card">
          <span className="muted">Active memberships</span>
          <p className="stat stat-big">{activeMembers}</p>
        </div>
      </div>

      <h3>Who's in</h3>
      {inGym.length === 0 && <p className="muted">Nobody checked in.</p>}
      <table className="table">
        <tbody>
          {inGym.map((row) => (
            <tr key={row.id}>
              <td>{row.member?.full_name || 'Unknown'}</td>
              <td className="muted">
                since{' '}
                {new Date(row.checked_in_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

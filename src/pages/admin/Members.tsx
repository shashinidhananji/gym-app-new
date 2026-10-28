import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { MembershipStatus, Profile } from '../../lib/types'

interface MemberRow extends Profile {
  memberships: { status: MembershipStatus; current_period_end: string | null }[]
}

export default function Members() {
  const [rows, setRows] = useState<MemberRow[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('*, memberships(status, current_period_end)')
        .order('full_name')
      setRows((data ?? []) as unknown as MemberRow[])
    }
    load()
  }, [])

  const filtered = rows.filter((r) =>
    r.full_name.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <section>
      <div className="row-between">
        <h2>Members</h2>
        <input
          type="search"
          placeholder="Search name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Membership</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => {
            const status = r.memberships?.[0]?.status
            return (
              <tr key={r.id}>
                <td>{r.full_name || <span className="muted">unnamed</span>}</td>
                <td className="muted">{r.role}</td>
                <td>
                  {status ? (
                    <span className={`status status-${status}`}>{status}</span>
                  ) : (
                    <span className="muted">none</span>
                  )}
                </td>
                <td>
                  <Link to={`/admin/members/${r.id}`}>Open</Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="muted">No members found.</p>}
    </section>
  )
}

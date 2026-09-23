import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import type {
  Membership,
  Profile,
  Schedule,
  ScheduleItem,
  ScheduleItemKind,
} from '../../lib/types'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const { profile: me, isAdmin } = useAuth()
  const [member, setMember] = useState<Profile | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [date, setDate] = useState(today)
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    async function load() {
      const [p, m] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('memberships').select('*').eq('member_id', id).maybeSingle(),
      ])
      setMember(p.data as Profile | null)
      setMembership(m.data as Membership | null)
    }
    load()
  }, [id])

  const loadSchedule = useCallback(async () => {
    if (!id) return
    const { data: sched } = await supabase
      .from('schedules')
      .select('*')
      .eq('member_id', id)
      .eq('date', date)
      .maybeSingle()

    setSchedule(sched as Schedule | null)
    if (!sched) {
      setItems([])
      return
    }

    const { data: rows } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('schedule_id', sched.id)
      .order('position')
    setItems((rows ?? []) as ScheduleItem[])
  }, [id, date])

  useEffect(() => {
    loadSchedule()
  }, [loadSchedule])

  async function ensureSchedule(): Promise<string | null> {
    if (schedule) return schedule.id
    const { data, error } = await supabase
      .from('schedules')
      .insert({ member_id: id, trainer_id: me?.id, date })
      .select()
      .single()
    if (error) {
      setError(error.message)
      return null
    }
    setSchedule(data as Schedule)
    return (data as Schedule).id
  }

  async function addItem(kind: ScheduleItemKind, title: string, detail: string) {
    setError(null)
    const scheduleId = await ensureSchedule()
    if (!scheduleId) return

    const position = items.filter((i) => i.kind === kind).length
    const { error } = await supabase
      .from('schedule_items')
      .insert({ schedule_id: scheduleId, kind, title, detail: detail || null, position })
    if (error) setError(error.message)
    else loadSchedule()
  }

  async function removeItem(itemId: string) {
    const { error } = await supabase.from('schedule_items').delete().eq('id', itemId)
    if (error) setError(error.message)
    else loadSchedule()
  }

  async function changeRole(role: string) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) setError(error.message)
    else setMember((m) => (m ? { ...m, role: role as Profile['role'] } : m))
  }

  if (!member) return <p className="muted">Loading…</p>

  return (
    <section>
      <h2>{member.full_name || 'Unnamed member'}</h2>

      <div className="stat-row">
        <div className="card">
          <span className="muted">Membership</span>
          <p className="stat">{membership?.status ?? 'none'}</p>
          {membership?.current_period_end && (
            <span className="muted">
              until {new Date(membership.current_period_end).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="card">
          <span className="muted">Role</span>
          {isAdmin ? (
            <select
              value={member.role}
              onChange={(e) => changeRole(e.target.value)}
            >
              <option value="member">member</option>
              <option value="trainer">trainer</option>
              <option value="admin">admin</option>
            </select>
          ) : (
            <p className="stat">{member.role}</p>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="row-between">
        <h3>Daily plan</h3>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="plan-grid">
        <EditableList
          title="Food"
          kind="food"
          items={items.filter((i) => i.kind === 'food')}
          onAdd={addItem}
          onRemove={removeItem}
        />
        <EditableList
          title="Exercise"
          kind="exercise"
          items={items.filter((i) => i.kind === 'exercise')}
          onAdd={addItem}
          onRemove={removeItem}
        />
      </div>
    </section>
  )
}

function EditableList({
  title,
  kind,
  items,
  onAdd,
  onRemove,
}: {
  title: string
  kind: ScheduleItemKind
  items: ScheduleItem[]
  onAdd: (kind: ScheduleItemKind, title: string, detail: string) => void
  onRemove: (id: string) => void
}) {
  const [name, setName] = useState('')
  const [detail, setDetail] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(kind, name.trim(), detail.trim())
    setName('')
    setDetail('')
  }

  return (
    <div className="plan-col">
      <h4>{title}</h4>
      <ul className="plan-list">
        {items.map((i) => (
          <li key={i.id}>
            <div className="plan-item-head">
              <span className="plan-item-title">{i.title}</span>
              <button className="remove-btn" onClick={() => onRemove(i.id)}>
                ×
              </button>
            </div>
            {i.detail && <p className="muted">{i.detail}</p>}
          </li>
        ))}
      </ul>
      <form className="inline-form" onSubmit={submit}>
        <input
          placeholder={kind === 'food' ? 'Meal' : 'Exercise'}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder={kind === 'food' ? '300 kcal' : '4x8 @ 60kg'}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import type { Schedule, ScheduleItem } from '../../lib/types'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function ScheduleView({ memberId }: { memberId: string }) {
  const [date, setDate] = useState(today)
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function load() {
      const { data: sched } = await supabase
        .from('schedules')
        .select('*')
        .eq('member_id', memberId)
        .eq('date', date)
        .maybeSingle()

      if (cancelled) return
      setSchedule(sched as Schedule | null)

      if (!sched) {
        setItems([])
        setLoading(false)
        return
      }

      const { data: rows } = await supabase
        .from('schedule_items')
        .select('*')
        .eq('schedule_id', sched.id)
        .order('position')

      if (cancelled) return
      setItems((rows ?? []) as ScheduleItem[])
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [memberId, date])

  const food = items.filter((i) => i.kind === 'food')
  const exercise = items.filter((i) => i.kind === 'exercise')

  return (
    <section>
      <div className="row-between">
        <h2>Daily plan</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {loading && <p className="muted">Loading…</p>}
      {!loading && !schedule && (
        <p className="muted">No plan assigned for this day.</p>
      )}

      {schedule && (
        <>
          {schedule.notes && <p className="note">{schedule.notes}</p>}
          <div className="plan-grid">
            <ItemList title="Food" items={food} />
            <ItemList title="Exercise" items={exercise} />
          </div>
        </>
      )}
    </section>
  )
}

function ItemList({ title, items }: { title: string; items: ScheduleItem[] }) {
  return (
    <div className="plan-col">
      <h3>{title}</h3>
      {items.length === 0 && <p className="muted">Nothing listed.</p>}
      <ul className="plan-list">
        {items.map((i) => (
          <li key={i.id}>
            <div className="plan-item-head">
              <span className="plan-item-title">{i.title}</span>
              {i.time_of_day && (
                <span className="muted">{i.time_of_day.slice(0, 5)}</span>
              )}
            </div>
            {i.detail && <p className="muted">{i.detail}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function MySchedule() {
  const { profile } = useAuth()
  if (!profile) return null
  return <ScheduleView memberId={profile.id} />
}

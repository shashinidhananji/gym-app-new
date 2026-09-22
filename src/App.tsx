import { useEffect, useState } from 'react'
import './App.css'

interface SetEntry {
  id: string
  exercise: string
  weight: number
  reps: number
}

const STORAGE_KEY = 'gym-app-sets'

function loadSets(): SetEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function App() {
  const [sets, setSets] = useState<SetEntry[]>(loadSets)
  const [exercise, setExercise] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets))
  }, [sets])

  function addSet(e: React.FormEvent) {
    e.preventDefault()
    if (!exercise.trim() || !weight || !reps) return

    setSets((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        exercise: exercise.trim(),
        weight: Number(weight),
        reps: Number(reps),
      },
    ])
    setExercise('')
    setWeight('')
    setReps('')
  }

  function removeSet(id: string) {
    setSets((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="app">
      <h1>Gym Log</h1>

      <form className="set-form" onSubmit={addSet}>
        <input
          type="text"
          placeholder="Exercise"
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
        />
        <input
          type="number"
          placeholder="Weight (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          min="0"
        />
        <input
          type="number"
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          min="0"
        />
        <button type="submit">Add Set</button>
      </form>

      <ul className="set-list">
        {sets.length === 0 && <li className="empty">No sets logged yet.</li>}
        {sets.map((s) => (
          <li key={s.id} className="set-item">
            <span className="set-exercise">{s.exercise}</span>
            <span className="set-detail">
              {s.weight}kg × {s.reps} reps
            </span>
            <button className="remove-btn" onClick={() => removeSet(s.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App

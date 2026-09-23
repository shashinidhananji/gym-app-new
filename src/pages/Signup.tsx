import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

export default function Signup() {
  const { session } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/app" replace />

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) setError(error.message)
    else setSent(true)
    setBusy(false)
  }

  if (sent) {
    return (
      <div className="auth-card">
        <h1>Check your email</h1>
        <p className="muted">
          We sent a confirmation link to {email}. Confirm it, then sign in.
        </p>
        <Link to="/login">Back to sign in</Link>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <h1>Create account</h1>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="muted">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}

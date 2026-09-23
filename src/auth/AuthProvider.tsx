import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  isStaff: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (!next) {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  useEffect(() => {
    if (!userId) return

    let cancelled = false
    setLoading(true)

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        setProfile(data as Profile | null)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      loading,
      isStaff: profile?.role === 'admin' || profile?.role === 'trainer',
      isAdmin: profile?.role === 'admin',
      signOut: async () => {
        await supabase.auth.signOut()
      },
      refreshProfile: async () => {
        if (!userId) return
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        setProfile(data as Profile | null)
      },
    }),
    [session, profile, loading, userId],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

import { createContext, useContext, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AUTH_KEY = 'souardjj_auth_v1'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return null
  })

  const login = useCallback(async (username, password) => {
    // Check admin_credentials table first
    const { data: adminData, error: adminErr } = await supabase
      .from('admin_credentials')
      .select('id')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle()

    if (adminErr) return { success: false, error: 'Something went wrong. Try again.' }

    if (adminData) {
      const session = { role: 'admin', username }
      localStorage.setItem(AUTH_KEY, JSON.stringify(session))
      setAuth(session)
      return { success: true }
    }

    // Check freelancer_credentials table
    const { data: freelancerData, error: freelancerErr } = await supabase
      .from('freelancer_credentials')
      .select('id')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle()

    if (freelancerErr) return { success: false, error: 'Something went wrong. Try again.' }

    if (freelancerData) {
      const session = { role: 'freelancer', username }
      localStorage.setItem(AUTH_KEY, JSON.stringify(session))
      setAuth(session)
      return { success: true }
    }

    return { success: false, error: 'Invalid username or password.' }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    setAuth(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      auth,
      login,
      logout,
      isAdmin:      auth?.role === 'admin',
      isFreelancer: auth?.role === 'freelancer',
      username:     auth?.username ?? null,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

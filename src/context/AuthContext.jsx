import { createContext, useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId, email) => {
    const { data } = await supabase.from('profiles').select('username').eq('id', userId).single()
    if (data) {
      setUser({ id: userId, username: data.username, email })
    }
    setLoading(false)
  }

  const register = async (username, email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw { response: { data: { message: error.message === 'User already registered' ? 'Email уже используется' : error.message } } }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({ id: data.user.id, username })
      if (profileError) {
        if (profileError.code === '23505') throw { response: { data: { message: 'Имя пользователя уже занято' } } }
        throw { response: { data: { message: profileError.message } } }
      }
      setUser({ id: data.user.id, username, email })
    }
    return { user: data.user }
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw { response: { data: { message: 'Неверный email или пароль' } } }

    if (data.user) {
      await loadProfile(data.user.id, data.user.email)
    }
    return { user: data.user }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

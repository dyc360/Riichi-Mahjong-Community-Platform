import { createContext, useContext, useState, type ReactNode } from 'react'

type AuthState = {
  token: string | null
  user: { id: string; name: string } | null
}

type AuthContextValue = AuthState & {
  login: (next: AuthState) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: localStorage.getItem('authToken'),
    user: null,
  })

  const login = (next: AuthState) => {
    localStorage.setItem('authToken', next.token ?? '')
    setAuth(next)
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    setAuth({ token: null, user: null })
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return ctx
}
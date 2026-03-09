"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, role: string) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem("auth") : null
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed.user)
        setToken(parsed.access)
      } catch {
        sessionStorage.removeItem("auth")
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || "Login failed")
    }
    const data = await res.json()
    setUser(data.user)
    setToken(data.access)
    sessionStorage.setItem("auth", JSON.stringify(data))
  }, [])

  const register = useCallback(async (username: string, email: string, password: string, role: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || "Registration failed")
    }
    const data = await res.json()
    setUser(data.user)
    setToken(data.access)
    sessionStorage.setItem("auth", JSON.stringify(data))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    sessionStorage.removeItem("auth")
  }, [])

  const refreshAuth = useCallback(async () => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem("auth") : null
    if (!stored) return
    try {
      const parsed = JSON.parse(stored)
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: parsed.refresh }),
      })
      if (res.ok) {
        const data = await res.json()
        parsed.access = data.access
        setToken(data.access)
        sessionStorage.setItem("auth", JSON.stringify(parsed))
      } else {
        logout()
      }
    } catch {
      logout()
    }
  }, [logout])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

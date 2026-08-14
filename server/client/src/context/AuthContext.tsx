import React, { createContext, useContext, useEffect, useState } from "react"
import { authApi, removeToken, setToken } from "@/lib/api"
import type { UserProfile } from "@/types"

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  error: string | null
  checkAuth: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const checkAuth = async () => {
    try {
      setLoading(true)
      setError(null)

      const hash = window.location.hash
      if (hash.includes("token=")) {
        const params = new URLSearchParams(hash.replace(/^#/, ""))
        const urlToken = params.get("token")
        if (urlToken) {
          setToken(urlToken)
          window.history.replaceState(null, "", window.location.pathname)
        }
      }

      const profile = await authApi.getMe()
      setUser(profile)
    } catch {
      removeToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (err) {
      console.error("Logout failed", err)
    } finally {
      removeToken()
      setUser(null)
      window.location.href = "/login"
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        checkAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

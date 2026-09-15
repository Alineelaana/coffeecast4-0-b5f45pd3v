import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { UserRecord } from '@/types/database'

interface AuthContextType {
  user: UserRecord | null
  isLoading: boolean
  isAdmin: boolean
  isMaster: boolean
  role: 'master' | 'ouro' | 'prata' | null
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const mapAuthRecord = (): UserRecord | null => {
    if (!pb.authStore.isValid || !pb.authStore.record) return null
    const rec = pb.authStore.record
    return {
      id: rec.id,
      email: rec.email || '',
      name: (rec as unknown as { name?: string }).name || 'Administrador',
      avatar: (rec as unknown as { avatar?: string }).avatar,
      role: ((rec as unknown as { role?: string }).role as 'master' | 'ouro' | 'prata') || 'prata',
      ativo: Boolean((rec as unknown as { ativo?: boolean }).ativo ?? true),
      created: rec.created,
      updated: rec.updated,
    }
  }

  const refreshUser = async () => {
    try {
      if (pb.authStore.isValid) {
        await pb.collection('users').authRefresh()
        setUser(mapAuthRecord())
      } else {
        setUser(null)
      }
    } catch {
      pb.authStore.clear()
      setUser(null)
    }
  }

  useEffect(() => {
    setUser(mapAuthRecord())
    setIsLoading(false)

    const unsubscribe = pb.authStore.onChange(() => {
      setUser(mapAuthRecord())
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    try {
      await pb.collection('users').authWithPassword(email.trim(), pass)
      const currentUser = mapAuthRecord()
      setUser(currentUser)
      return { success: true }
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Credenciais inválidas. Verifique seu e-mail e senha.'
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
  }

  const role = user?.role || null
  const isAdmin = Boolean(
    user && user.ativo && (role === 'master' || role === 'ouro' || role === 'prata'),
  )
  const isMaster = Boolean(user && user.ativo && role === 'master')

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        isMaster,
        role,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { UserRecord, UserRole } from '@/types/database'

interface AuthContextType {
  user: UserRecord | null
  isLoading: boolean
  isAdmin: boolean
  isMaster: boolean
  isGerencial: boolean
  isMembro: boolean
  role: UserRole | null
  login: (
    email: string,
    pass: string,
  ) => Promise<{ success: boolean; role?: UserRole; error?: string }>
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
      role: ((rec as unknown as { role?: string }).role as UserRole) || 'prata',
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
      return { success: true, role: currentUser?.role }
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

  // Regras de acesso por categoria:
  // - Master: Superadministrador com acesso total (admin + membros)
  // - Gerencial: Acesso a membros e painel admin (com restrições a Conteúdo, Episódios, Integrantes, etc.)
  // - Ouro e Prata: Apenas Área de Membros (não podem acessar o painel admin)
  const isMaster = Boolean(user && user.ativo && role === 'master')
  const isGerencial = Boolean(user && user.ativo && role === 'gerencial')
  const isMembro = Boolean(
    user &&
    user.ativo &&
    (role === 'ouro' || role === 'prata' || role === 'gerencial' || role === 'master'),
  )
  const isAdmin = Boolean(user && user.ativo && (role === 'master' || role === 'gerencial'))

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        isMaster,
        isGerencial,
        isMembro,
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

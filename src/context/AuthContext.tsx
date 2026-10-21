import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { UserRecord, UserRole } from '@/types/database'

interface AuthContextType {
  user: UserRecord | null
  isLoading: boolean
  isAdmin: boolean
  isMaster: boolean
  isAdm: boolean
  isGerencial: boolean
  isMembro: boolean
  role: UserRole | null
  login: (
    email: string,
    pass: string,
  ) => Promise<{ success: boolean; role?: UserRole; error?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
  hasScreenPermission: (screenKey: string) => boolean
  canManageStore: (storeId: string) => boolean
  hasAuditoriaPermission: (
    subKey: keyof import('@/types/database').AuditoriaSubPermissions,
  ) => boolean
  inatividadeMinutos: number
  forcarTrocaSenha: boolean
  marcarSenhaRedefinida: () => void
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
      name: (rec as unknown as { name?: string }).name || 'Membro CoffeeCast',
      avatar: (rec as unknown as { avatar?: string }).avatar,
      bio: (rec as unknown as { bio?: string }).bio || '',
      telefone: (rec as unknown as { telefone?: string }).telefone || '',
      origem: (rec as unknown as { origem?: string }).origem || '',
      role: ((rec as unknown as { role?: string }).role as UserRole) || 'prata',
      ativo: Boolean((rec as unknown as { ativo?: boolean }).ativo ?? true),
      adm_permissions: (rec as unknown as { adm_permissions?: any }).adm_permissions || null,
      inatividade_minutos:
        typeof (rec as unknown as { inatividade_minutos?: number }).inatividade_minutos ===
          'number' && (rec as unknown as { inatividade_minutos: number }).inatividade_minutos > 0
          ? (rec as unknown as { inatividade_minutos: number }).inatividade_minutos
          : 10,
      forcar_troca_senha: Boolean(
        (rec as unknown as { forcar_troca_senha?: boolean }).forcar_troca_senha,
      ),
      ultimo_acesso: (rec as unknown as { ultimo_acesso?: string }).ultimo_acesso || '',
      last_seen: (rec as unknown as { last_seen?: string }).last_seen || '',
      created: rec.created,
      updated: rec.updated,
    }
  }

  const refreshUser = async () => {
    try {
      if (pb.authStore.isValid && pb.authStore.record?.id) {
        // 1. Tenta atualizar os dados do próprio registro via getOne para garantir avatar atualizado imediatamente
        try {
          const freshRecord = await pb.collection('users').getOne(pb.authStore.record.id)
          if (freshRecord) {
            pb.authStore.save(pb.authStore.token, freshRecord as any)
          }
        } catch (_) {
          // Fallback para authRefresh padrão
          await pb.collection('users').authRefresh()
        }
        setUser(mapAuthRecord())
      } else if (pb.authStore.isValid) {
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

  // =========================================================================
  // DETECTOR DE INATIVIDADE POR USUÁRIO (LOGOUT AUTOMÁTICO)
  // Cada usuário possui seu próprio tempo em minutos (mínimo 1, padrão 10).
  // Monitora cliques, digitação, movimento do mouse, scroll e toque.
  // =========================================================================
  const inatividadeMinutos =
    user && typeof user.inatividade_minutos === 'number' && user.inatividade_minutos > 0
      ? user.inatividade_minutos
      : 10

  const forcarTrocaSenha = Boolean(user && user.forcar_troca_senha)

  const marcarSenhaRedefinida = () => {
    setUser((prev) => (prev ? { ...prev, forcar_troca_senha: false } : null))
    if (pb.authStore.record) {
      ;(pb.authStore.record as any).forcar_troca_senha = false
    }
  }

  useEffect(() => {
    if (!user) return

    const timeoutMs = inatividadeMinutos * 60 * 1000
    let timerId: ReturnType<typeof setTimeout> | null = null

    const handleInatividadeLogout = () => {
      if (!pb.authStore.isValid) return

      // Registrar auditoria de logout por inatividade
      try {
        import('@/services/auditoria').then(({ AuditoriaService }) => {
          AuditoriaService.registrarEvento({
            tipo_acao: 'logout',
            area_sistema: 'Autenticação / Sessão',
            descricao: `Logout automático por inatividade (${inatividadeMinutos} min sem interação) para o usuário ${user.name || user.email}`,
            usuario_id: user.id,
            usuario_email: user.email,
            usuario_nome: user.name || user.email,
            usuario_role: user.role,
            resultado: 'sucesso',
          })
        })
      } catch {
        /* ignore */
      }

      pb.authStore.clear()
      setUser(null)

      try {
        sessionStorage.setItem(
          'coffeecast_flash_message',
          'Você foi desconectado por inatividade. Faça login novamente.',
        )
      } catch {
        /* ignore */
      }

      // Redireciona para login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?motivo=inatividade'
      }
    }

    const resetTimer = () => {
      if (timerId) clearTimeout(timerId)
      timerId = setTimeout(handleInatividadeLogout, timeoutMs)
    }

    // Iniciar contagem
    resetTimer()

    // Eventos de interação para reiniciar o contador
    const eventos = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'wheel', 'click']

    // Throttle no listener para não onerar CPU em mousemove contínuo
    let lastActivity = Date.now()
    const onUserActivity = () => {
      const now = Date.now()
      // Só reseta se tiver passado pelo menos 1 segundo da última interação registrada
      if (now - lastActivity > 1000) {
        lastActivity = now
        resetTimer()
      }
    }

    eventos.forEach((evt) => {
      window.addEventListener(evt, onUserActivity, { passive: true })
    })

    return () => {
      if (timerId) clearTimeout(timerId)
      eventos.forEach((evt) => {
        window.removeEventListener(evt, onUserActivity)
      })
    }
  }, [user?.id, inatividadeMinutos])

  const login = async (email: string, pass: string) => {
    try {
      await pb.collection('users').authWithPassword(email.trim(), pass)
      const nowIso = new Date().toISOString()

      // Atualiza ultimo_acesso do usuário diretamente no cliente para garantir persistência imediata
      if (pb.authStore.record?.id) {
        try {
          await pb.collection('users').update(pb.authStore.record.id, {
            ultimo_acesso: nowIso,
          })
          if (pb.authStore.record) {
            ;(pb.authStore.record as any).ultimo_acesso = nowIso
          }
        } catch {
          /* fallback caso hook no backend já tenha tratado */
        }
      }

      const currentUser = mapAuthRecord()
      setUser(currentUser)

      // Registrar auditoria de login
      if (currentUser) {
        try {
          import('@/services/auditoria').then(({ AuditoriaService }) => {
            AuditoriaService.registrarEvento({
              tipo_acao: 'login',
              area_sistema: 'Autenticação',
              descricao: `Login realizado com sucesso por ${currentUser.name || currentUser.email} (${currentUser.role})`,
              usuario_id: currentUser.id,
              usuario_email: currentUser.email,
              usuario_nome: currentUser.name || currentUser.email,
              usuario_role: currentUser.role,
              resultado: 'sucesso',
            })
          })
        } catch {
          /* intentionally ignored */
        }
      }

      return { success: true, role: currentUser?.role }
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Credenciais inválidas. Verifique seu e-mail e senha.'

      // Registrar falha de login na auditoria
      try {
        import('@/services/auditoria').then(({ AuditoriaService }) => {
          AuditoriaService.registrarEvento({
            tipo_acao: 'falha_login',
            area_sistema: 'Autenticação',
            descricao: `Tentativa de login falha com o e-mail: ${email.trim()}`,
            usuario_email: email.trim(),
            resultado: 'erro',
            suspeito: true,
            motivo_suspeito: 'Senha incorreta ou usuário inexistente',
          })
        })
      } catch {
        /* intentionally ignored */
      }

      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    if (user) {
      try {
        import('@/services/auditoria').then(({ AuditoriaService }) => {
          AuditoriaService.registrarEvento({
            tipo_acao: 'logout',
            area_sistema: 'Autenticação',
            descricao: `Sessão encerrada (logout) por ${user.name || user.email}`,
            usuario_id: user.id,
            usuario_email: user.email,
            usuario_nome: user.name || user.email,
            usuario_role: user.role,
            resultado: 'sucesso',
          })
        })
      } catch {
        /* intentionally ignored */
      }
    }
    pb.authStore.clear()
    setUser(null)
  }

  const role = user?.role || null

  // Regras de acesso por categoria:
  // - Master: Superadministrador com acesso total (admin + membros)
  // - ADM: Administrador com permissões granulares por tela/bloco e por loja definidas pelo Master
  // - Gerencial: Acesso a membros e painel admin operacional
  // - Ouro e Prata: Apenas Área de Membros (não podem acessar o painel admin)
  const isMaster = Boolean(user && user.ativo && role === 'master')
  const isAdm = Boolean(user && user.ativo && role === 'adm')
  const isGerencial = Boolean(user && user.ativo && role === 'gerencial')
  const isMembro = Boolean(
    user &&
    user.ativo &&
    (role === 'ouro' ||
      role === 'prata' ||
      role === 'gerencial' ||
      role === 'adm' ||
      role === 'master'),
  )
  const isAdmin = Boolean(
    user && user.ativo && (role === 'master' || role === 'adm' || role === 'gerencial'),
  )

  const hasScreenPermission = (screenKey: string): boolean => {
    if (!user || !user.ativo) return false
    if (role === 'master') return true // Master tem acesso soberano total

    if (role === 'adm') {
      const perms = user.adm_permissions
      if (!perms) return false
      const screens = Array.isArray(perms.allowedScreens) ? perms.allowedScreens : []
      return screens.includes(screenKey)
    }

    if (role === 'gerencial') {
      // Gerencial tem acesso ao operacional padrão, mas não ao submenu exclusivo master
      const gerencialAllowed = [
        'dashboard',
        'notificacoes',
        'chat',
        'nine',
        'episodios',
        'momentos',
        'roteiros',
        'depoimentos',
        'contatos',
        'financeiro',
        'horas',
        'agenda',
        'convites',
      ]
      return gerencialAllowed.includes(screenKey)
    }

    return false
  }

  const canManageStore = (storeId: string): boolean => {
    if (!user || !user.ativo) return false
    if (role === 'master') return true
    if (role === 'adm') {
      const perms = user.adm_permissions
      if (!perms) return false
      if (perms.allStores) return true
      const allowed = Array.isArray(perms.storeIds) ? perms.storeIds : []
      return allowed.includes(storeId)
    }
    return false
  }

  const hasAuditoriaPermission = (
    subKey: keyof import('@/types/database').AuditoriaSubPermissions,
  ): boolean => {
    if (!user || !user.ativo) return false
    if (role === 'master') return true // Master soberano tem acesso total
    if (role === 'adm') {
      const perms = user.adm_permissions
      if (!perms) return false
      const screens = Array.isArray(perms.allowedScreens) ? perms.allowedScreens : []
      if (!screens.includes('auditoria')) return false
      if (!perms.auditoria) return true // Se o Master liberou auditoria e não especificou subpermissões, dá acesso padrão
      return Boolean(perms.auditoria[subKey])
    }
    return false
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        isMaster,
        isAdm,
        isGerencial,
        isMembro,
        role,
        login,
        logout,
        refreshUser,
        hasScreenPermission,
        canManageStore,
        hasAuditoriaPermission,
        inatividadeMinutos,
        forcarTrocaSenha,
        marcarSenhaRedefinida,
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

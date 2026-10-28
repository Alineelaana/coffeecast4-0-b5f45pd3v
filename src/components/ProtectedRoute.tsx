import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireMaster?: boolean
  requireMembersOnly?: boolean
  screenKey?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireMaster = false,
  requireMembersOnly = false,
  screenKey,
}) => {
  const { user, isLoading, isAdmin, isMaster, isAdm, role, hasScreenPermission } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-vinho flex flex-col items-center justify-center space-y-4 text-marfim">
        <div className="w-12 h-12 border-4 border-dourado border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium tracking-wide">Validando acesso ao CoffeeCast 4.0...</p>
      </div>
    )
  }

  // Usuário não autenticado
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se o usuário precisa redefinir a senha obrigatoriamente, a tela é renderizada pelo AppAuthenticatedGate,
  // mas para prevenir qualquer escape visual de conteúdo restrito em ProtectedRoute, barramos também aqui:
  const forcarTroca = Boolean(user?.forcar_troca_senha)
  if (forcarTroca) {
    return null
  }

  // Se a rota for a Área de Membros (/membros), qualquer usuário autenticado pode acessar
  if (requireMembersOnly) {
    return <>{children}</>
  }

  // Se o usuário tentar acessar o painel admin (/admin), apenas Master, ADM e Gerencial podem.
  // Usuários Ouro e Prata só têm permissão para a Área de Membros.
  if (role === 'ouro' || role === 'prata') {
    return (
      <Navigate
        to="/membros"
        state={{
          blockedAdmin: true,
          message:
            'Atenção: Os usuários das categorias Ouro e Prata possuem acesso exclusivo à Área de Membros.',
        }}
        replace
      />
    )
  }

  if (!isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Exclusivo Master estrito (ex.: tela de Usuários & Permissões onde se criam e editam permissões de ADMs)
  if (requireMaster && !isMaster) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-2xl border border-vinho/15 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-vinho/10 text-vinho mx-auto flex items-center justify-center font-bold text-lg">
          🔒
        </div>
        <h2 className="text-xl font-serif font-bold text-vinho">Acesso Restrito ao Master</h2>
        <p className="text-sm text-vinho/70">
          Esta tela é reservada exclusivamente ao Superadministrador Master. As permissões de acesso
          são configuradas diretamente pela gestão central.
        </p>
      </div>
    )
  }

  // Checagem de permissão granular por tela (quando screenKey for especificado)
  if (screenKey && !hasScreenPermission(screenKey)) {
    // Registrar tentativa de acesso não autorizada na auditoria automaticamente
    try {
      import('@/services/auditoria').then(({ AuditoriaService }) => {
        AuditoriaService.registrarEvento({
          tipo_acao: 'bloqueio_acesso',
          area_sistema: screenKey.toUpperCase(),
          descricao: `Tentativa de acesso não autorizada à área ${screenKey} por ${user.name || user.email} (${role})`,
          resultado: 'bloqueio',
          suspeito: true,
          motivo_suspeito: 'Usuário sem permissão tentou abrir rota restrita',
        })
      })
    } catch {
      /* intentionally ignored */
    }

    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-2xl border border-vinho/15 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center font-bold text-lg">
          ⚠️
        </div>
        <h2 className="text-xl font-serif font-bold text-vinho">Área Não Autorizada</h2>
        <p className="text-sm text-vinho/70">
          Seu perfil de usuário ({role === 'adm' ? 'ADM' : role}) não possui autorização concedida
          pelo Master para visualizar ou gerenciar esta seção.
        </p>
        <p className="text-xs text-vinho/50">
          Caso necessite de acesso a esta área, entre em contato com o administrador Master da sua
          loja ou plataforma.
        </p>
      </div>
    )
  }

  return <>{children}</>
}

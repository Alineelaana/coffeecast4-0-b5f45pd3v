import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireMaster?: boolean
  requireMembersOnly?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireMaster = false,
  requireMembersOnly = false,
}) => {
  const { user, isLoading, isAdmin, isMaster, role } = useAuth()
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

  // Se a rota for a Área de Membros (/membros), qualquer usuário autenticado (master, gerencial, ouro, prata) pode acessar
  if (requireMembersOnly) {
    return <>{children}</>
  }

  // Se o usuário tentar acessar o painel admin (/admin), apenas Master e Gerencial podem.
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

  // Se a rota exige Master (ex.: Editar Site / Conteúdo, Episódios, Integrantes, Depoimentos, Nossos Momentos, Políticas e Usuários):
  // O usuário Gerencial é redirecionado para a Visão Geral (/admin) ou outra área permitida com aviso
  if (requireMaster && !isMaster) {
    return (
      <Navigate
        to="/admin"
        state={{
          blockedMaster: true,
          message: 'Acesso restrito: esta tela é permitida exclusivamente para a categoria Master.',
        }}
        replace
      />
    )
  }

  return <>{children}</>
}

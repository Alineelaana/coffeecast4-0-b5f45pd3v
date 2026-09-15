import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireMaster?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireMaster = false,
}) => {
  const { user, isLoading, isAdmin, isMaster } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-vinho flex flex-col items-center justify-center space-y-4 text-marfim">
        <div className="w-12 h-12 border-4 border-dourado border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium tracking-wide">Validando acesso ao CoffeeCast 4.0...</p>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireMaster && !isMaster) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}

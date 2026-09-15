import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Toaster } from 'sonner'

// Public Pages
import Index from '@/pages/Index'
import PoliticaScreen from '@/pages/PoliticaScreen'
import LoginScreen from '@/pages/LoginScreen'
import NotFound from '@/pages/NotFound'

// Admin Layout & Screens
import AdminLayout from '@/components/AdminLayout'
import DashboardScreen from '@/pages/admin/DashboardScreen'
import AdminEpisodesScreen from '@/pages/admin/AdminEpisodesScreen'
import AdminIntegrantesScreen from '@/pages/admin/AdminIntegrantesScreen'
import AdminDepoimentosScreen from '@/pages/admin/AdminDepoimentosScreen'
import AdminMomentosScreen from '@/pages/admin/AdminMomentosScreen'
import AdminContatosScreen from '@/pages/admin/AdminContatosScreen'
import AdminFinanceiroScreen from '@/pages/admin/AdminFinanceiroScreen'
import AdminAgendaScreen from '@/pages/admin/AdminAgendaScreen'
import AdminConvitesScreen from '@/pages/admin/AdminConvitesScreen'
import AdminConteudoScreen from '@/pages/admin/AdminConteudoScreen'
import AdminPoliticasScreen from '@/pages/admin/AdminPoliticasScreen'
import AdminUsuariosScreen from '@/pages/admin/AdminUsuariosScreen'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/politica/:slug" element={<PoliticaScreen />} />
          <Route path="/login" element={<LoginScreen />} />

          {/* Rotas Administrativas Protegidas */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardScreen />} />
            <Route path="episodios" element={<AdminEpisodesScreen />} />
            <Route path="integrantes" element={<AdminIntegrantesScreen />} />
            <Route path="depoimentos" element={<AdminDepoimentosScreen />} />
            <Route path="momentos" element={<AdminMomentosScreen />} />
            <Route path="contatos" element={<AdminContatosScreen />} />
            <Route path="financeiro" element={<AdminFinanceiroScreen />} />
            <Route path="agenda" element={<AdminAgendaScreen />} />
            <Route path="convites" element={<AdminConvitesScreen />} />
            <Route path="conteudo" element={<AdminConteudoScreen />} />
            <Route path="politicas" element={<AdminPoliticasScreen />} />
            <Route
              path="usuarios"
              element={
                <ProtectedRoute requireMaster>
                  <AdminUsuariosScreen />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Rota 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>

      {/* Notificações Toaster elegantes */}
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  )
}

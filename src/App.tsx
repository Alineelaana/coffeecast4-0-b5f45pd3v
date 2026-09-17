import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Toaster } from 'sonner'

// Public Pages
import Index from '@/pages/Index'
import ConvidadoScreen from '@/pages/ConvidadoScreen'
import DepoimentoScreen from '@/pages/DepoimentoScreen'
import PoliticaScreen from '@/pages/PoliticaScreen'
import LoginScreen from '@/pages/LoginScreen'
import ResetPasswordScreen from '@/pages/ResetPasswordScreen'
import MembersScreen from '@/pages/MembersScreen'
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
import AdminControleHorasScreen from '@/pages/admin/AdminControleHorasScreen'
import AdminConvitesScreen from '@/pages/admin/AdminConvitesScreen'
import AdminConteudoScreen from '@/pages/admin/AdminConteudoScreen'
import AdminDominioScreen from '@/pages/admin/AdminDominioScreen'
import AdminPoliticasScreen from '@/pages/admin/AdminPoliticasScreen'
import AdminUsuariosScreen from '@/pages/admin/AdminUsuariosScreen'
import AdminNotificacoesScreen from '@/pages/admin/AdminNotificacoesScreen'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/convidado" element={<ConvidadoScreen />} />
          <Route path="/depoimento" element={<DepoimentoScreen />} />
          <Route path="/politica/:slug" element={<PoliticaScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />

          {/* Área de Membros (Disponível para Master, Gerencial, Ouro e Prata) */}
          <Route
            path="/membros"
            element={
              <ProtectedRoute requireMembersOnly>
                <MembersScreen />
              </ProtectedRoute>
            }
          />

          {/* Rotas Administrativas Protegidas (Master e Gerencial) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Visão Geral (Disponível para Master e Gerencial) */}
            <Route index element={<DashboardScreen />} />

            {/* Gestão Operacional permitida para Master e Gerencial */}
            <Route path="notificacoes" element={<AdminNotificacoesScreen />} />
            <Route path="contatos" element={<AdminContatosScreen />} />
            <Route path="financeiro" element={<AdminFinanceiroScreen />} />
            <Route path="horas" element={<AdminControleHorasScreen />} />
            <Route path="agenda" element={<AdminAgendaScreen />} />
            <Route path="convites" element={<AdminConvitesScreen />} />

            {/* Rotas Restritas Exclusivamente ao Superadministrador Master:
                - Editar Site (conteudo)
                - Domínio do Site (dominio)
                - Episódios (episodios)
                - Integrantes
                - Depoimentos
                - Nossos Momentos
                - Políticas do Site
                - Usuários & Permissões
            */}
            <Route
              path="conteudo"
              element={
                <ProtectedRoute requireMaster>
                  <AdminConteudoScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="dominio"
              element={
                <ProtectedRoute requireMaster>
                  <AdminDominioScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="episodios"
              element={
                <ProtectedRoute requireMaster>
                  <AdminEpisodesScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="integrantes"
              element={
                <ProtectedRoute requireMaster>
                  <AdminIntegrantesScreen />
                </ProtectedRoute>
              }
            />
            <Route path="depoimentos" element={<AdminDepoimentosScreen />} />
            <Route
              path="momentos"
              element={
                <ProtectedRoute requireMaster>
                  <AdminMomentosScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="politicas"
              element={
                <ProtectedRoute requireMaster>
                  <AdminPoliticasScreen />
                </ProtectedRoute>
              }
            />
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

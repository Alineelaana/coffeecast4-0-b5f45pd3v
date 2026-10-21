import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { StorefrontProvider } from '@/context/StorefrontContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { CookieBanner } from '@/components/CookieBanner'
import { NineChatWidget } from '@/components/NineChatWidget'
import { RedefinirSenhaObrigatoriaScreen } from '@/components/RedefinirSenhaObrigatoriaScreen'
import { useAuth } from '@/context/AuthContext'
import { Toaster } from 'sonner'

// Public Pages
import Index from '@/pages/Index'
import ConvidadoScreen from '@/pages/ConvidadoScreen'
import DepoimentoScreen from '@/pages/DepoimentoScreen'
import RoteiroScreen from '@/pages/RoteiroScreen'
import PoliticaScreen from '@/pages/PoliticaScreen'
import StorefrontPage from '@/pages/StorefrontPage'
import LoginScreen from '@/pages/LoginScreen'
import ResetPasswordScreen from '@/pages/ResetPasswordScreen'
import MembersScreen from '@/pages/MembersScreen'
import PerfilScreen from '@/pages/PerfilScreen'
import ChatScreen from '@/pages/ChatScreen'
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
import AdminStorefrontScreen from '@/pages/admin/AdminStorefrontScreen'
import AdminPoliticasScreen from '@/pages/admin/AdminPoliticasScreen'
import AdminUsuariosScreen from '@/pages/admin/AdminUsuariosScreen'
import AdminBackupsScreen from '@/pages/admin/AdminBackupsScreen'
import AdminAuditoriaScreen from '@/pages/admin/AdminAuditoriaScreen'
import AdminNotificacoesScreen from '@/pages/admin/AdminNotificacoesScreen'
import AdminRoteirosScreen from '@/pages/admin/AdminRoteirosScreen'
import AdminNineScreen from '@/pages/admin/AdminNineScreen'
import AdminChatManagementScreen from '@/pages/admin/AdminChatManagementScreen'
import DocumentacaoScreen from '@/pages/DocumentacaoScreen'
import GuiaAjudaScreen from '@/pages/GuiaAjudaScreen'

function AppAuthenticatedGate() {
  const { forcarTrocaSenha } = useAuth()
  return forcarTrocaSenha ? <RedefinirSenhaObrigatoriaScreen /> : null
}

export default function App() {
  return (
    <AuthProvider>
      <StorefrontProvider>
        <BrowserRouter>
          <AppAuthenticatedGate />
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/loja/:slug/*" element={<StorefrontPage />} />
            <Route path="/loja/:slug" element={<StorefrontPage />} />
            <Route path="/convidado" element={<ConvidadoScreen />} />
            <Route path="/roteiro" element={<RoteiroScreen />} />
            <Route path="/depoimento" element={<DepoimentoScreen />} />
            <Route path="/privacidade" element={<Navigate to="/politica/privacidade" replace />} />
            <Route path="/politica/:slug" element={<PoliticaScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/reset-password" element={<ResetPasswordScreen />} />
            <Route path="/reset-password/:token" element={<ResetPasswordScreen />} />
            <Route path="/redefinir-senha" element={<ResetPasswordScreen />} />
            <Route path="/redefinir-senha/:token" element={<ResetPasswordScreen />} />

            {/* Fallback de compatibilidade caso e-mails antigos ou links do PocketBase cheguem sem hash ou em sub-rotas */}
            <Route
              path="/_/#/auth/confirm-password-reset/:token"
              element={<ResetPasswordScreen />}
            />
            <Route path="/auth/confirm-password-reset/:token" element={<ResetPasswordScreen />} />
            <Route path="/auth/confirm-password-reset" element={<ResetPasswordScreen />} />
            <Route path="/confirm-password-reset/:token" element={<ResetPasswordScreen />} />
            <Route path="/confirm-password-reset" element={<ResetPasswordScreen />} />
            <Route path="/_/*" element={<ResetPasswordScreen />} />

            {/* Perfil do Usuário (Disponível para qualquer usuário autenticado: Master, ADM, Gerencial, Ouro e Prata) */}
            <Route
              path="/perfil"
              element={
                <ProtectedRoute requireMembersOnly>
                  <PerfilScreen />
                </ProtectedRoute>
              }
            />

            {/* Área de Membros (Disponível para Master, Gerencial, Ouro e Prata) */}
            <Route
              path="/membros"
              element={
                <ProtectedRoute requireMembersOnly>
                  <MembersScreen />
                </ProtectedRoute>
              }
            />

            {/* Chat (Acessível a TODOS os níveis: Master, ADM, Gerencial, Ouro e Prata) */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute requireMembersOnly>
                  <div className="min-h-screen bg-[#FAF8F5] p-3 sm:p-6 lg:p-8 flex flex-col">
                    <ChatScreen />
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Documentação do Sistema (Acessível para qualquer usuário autenticado) */}
            <Route
              path="/documentacao"
              element={
                <ProtectedRoute requireMembersOnly>
                  <DocumentacaoScreen />
                </ProtectedRoute>
              }
            />

            {/* Guia de Ajuda & Primeiro Acesso (Acessível a TODOS os usuários autenticados: Master, ADM, Gerencial, Ouro e Prata) */}
            <Route
              path="/guia-ajuda"
              element={
                <ProtectedRoute requireMembersOnly>
                  <GuiaAjudaScreen />
                </ProtectedRoute>
              }
            />
            {/* Rota amigável de compatibilidade /ajuda */}
            <Route path="/ajuda" element={<Navigate to="/guia-ajuda" replace />} />

            {/* Rotas Administrativas Protegidas (Master e Gerencial) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              {/* Visão Geral (Disponível para Master, Gerencial e ADM com permissão) */}
              <Route
                index
                element={
                  <ProtectedRoute screenKey="dashboard">
                    <DashboardScreen />
                  </ProtectedRoute>
                }
              />

              {/* Gestão Operacional */}
              <Route
                path="notificacoes"
                element={
                  <ProtectedRoute screenKey="notificacoes">
                    <AdminNotificacoesScreen />
                  </ProtectedRoute>
                }
              />
              {/* Chat no painel administrativo */}
              <Route
                path="chat"
                element={
                  <ProtectedRoute screenKey="chat">
                    <ChatScreen />
                  </ProtectedRoute>
                }
              />
              {/* Gestão de Conversas (Exclusivo Master) */}
              <Route
                path="chat/gestao"
                element={
                  <ProtectedRoute requireMaster>
                    <AdminChatManagementScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="nine"
                element={
                  <ProtectedRoute screenKey="nine">
                    <AdminNineScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="roteiros"
                element={
                  <ProtectedRoute screenKey="roteiros">
                    <AdminRoteirosScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="contatos"
                element={
                  <ProtectedRoute screenKey="contatos">
                    <AdminContatosScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="financeiro"
                element={
                  <ProtectedRoute screenKey="financeiro">
                    <AdminFinanceiroScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="horas"
                element={
                  <ProtectedRoute screenKey="horas">
                    <AdminControleHorasScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="agenda"
                element={
                  <ProtectedRoute screenKey="agenda">
                    <AdminAgendaScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="convites"
                element={
                  <ProtectedRoute screenKey="convites">
                    <AdminConvitesScreen />
                  </ProtectedRoute>
                }
              />

              {/* Gestão de Conteúdo e Mídia */}
              <Route
                path="episodios"
                element={
                  <ProtectedRoute screenKey="episodios">
                    <AdminEpisodesScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="momentos"
                element={
                  <ProtectedRoute screenKey="momentos">
                    <AdminMomentosScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="depoimentos"
                element={
                  <ProtectedRoute screenKey="depoimentos">
                    <AdminDepoimentosScreen />
                  </ProtectedRoute>
                }
              />

              {/* Rotas Avançadas / Master:
                - Storefront Multi-Loja (storefront) -> Acessível por Master e ADM autorizado
                - Editar Site (conteudo) -> Acessível por Master e ADM autorizado
                - Domínio do Site (dominio) -> Acessível por Master e ADM autorizado
                - Integrantes (integrantes) -> Acessível por Master e ADM autorizado
                - Políticas do Site (politicas) -> Acessível por Master e ADM autorizado
                - Usuários & Permissões (usuarios) -> Exclusivo soberano do Master
              */}
              <Route
                path="storefront"
                element={
                  <ProtectedRoute screenKey="storefront">
                    <AdminStorefrontScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="conteudo"
                element={
                  <ProtectedRoute screenKey="conteudo">
                    <AdminConteudoScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dominio"
                element={
                  <ProtectedRoute screenKey="dominio">
                    <AdminDominioScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="integrantes"
                element={
                  <ProtectedRoute screenKey="integrantes">
                    <AdminIntegrantesScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="politicas"
                element={
                  <ProtectedRoute screenKey="politicas">
                    <AdminPoliticasScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="auditoria"
                element={
                  <ProtectedRoute screenKey="auditoria">
                    <AdminAuditoriaScreen />
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
              <Route
                path="backups"
                element={
                  <ProtectedRoute requireMaster>
                    <AdminBackupsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="documentacao"
                element={
                  <ProtectedRoute>
                    <DocumentacaoScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="guia-ajuda"
                element={
                  <ProtectedRoute>
                    <GuiaAjudaScreen />
                  </ProtectedRoute>
                }
              />
              <Route path="ajuda" element={<Navigate to="/admin/guia-ajuda" replace />} />
            </Route>

            {/* Rota 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Chat com a Nine (Assistente Virtual Pública do CoffeeCast 4.0) */}
          <NineChatWidget />

          {/* Banner de Cookies & Privacidade LGPD (público) */}
          <CookieBanner />
        </BrowserRouter>
      </StorefrontProvider>

      {/* Notificações Toaster elegantes */}
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  )
}

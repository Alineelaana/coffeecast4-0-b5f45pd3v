import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { CoffeeCastLogo } from '@/components/CoffeeCastLogo'
import {
  LayoutDashboard,
  Tv,
  Users2,
  MessageSquareQuote,
  Camera,
  Inbox,
  DollarSign,
  CalendarDays,
  FileCheck2,
  FileText,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Shield,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AdminLayout() {
  const { user, logout, role, isMaster } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    {
      label: 'Visão Geral',
      path: '/admin',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Editar Site',
      path: '/admin/conteudo',
      icon: FileText,
      badge: 'Geral',
    },
    {
      label: 'Episódios',
      path: '/admin/episodios',
      icon: Tv,
    },
    {
      label: 'Integrantes',
      path: '/admin/integrantes',
      icon: Users2,
    },
    {
      label: 'Depoimentos',
      path: '/admin/depoimentos',
      icon: MessageSquareQuote,
    },
    {
      label: 'Nossos Momentos',
      path: '/admin/momentos',
      icon: Camera,
    },
    {
      label: 'Contatos & Leads',
      path: '/admin/contatos',
      icon: Inbox,
    },
    {
      label: 'Financeiro',
      path: '/admin/financeiro',
      icon: DollarSign,
      highlight: true,
    },
    {
      label: 'Agenda de Gravação',
      path: '/admin/agenda',
      icon: CalendarDays,
    },
    {
      label: 'Gerador de Convites',
      path: '/admin/convites',
      icon: FileCheck2,
      badge: 'PDF',
    },
    {
      label: 'Políticas do Site',
      path: '/admin/politicas',
      icon: ShieldAlert,
    },
    ...(isMaster
      ? [
          {
            label: 'Usuários & Permissões',
            path: '/admin/usuarios',
            icon: UserCheck,
            badge: 'Master',
          },
        ]
      : []),
  ]

  const getPageTitle = () => {
    const current = menuItems.find((m) =>
      m.exact ? location.pathname === m.path : location.pathname.startsWith(m.path),
    )
    return current ? current.label : 'Painel de Controle'
  }

  const roleLabel =
    role === 'master'
      ? 'Master / Superadministrador'
      : role === 'ouro'
        ? 'Nível Ouro'
        : 'Nível Prata'

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col md:flex-row font-sans">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-72 bg-vinho border-r border-vinho-dark text-marfim shadow-2xl shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Topo da Sidebar com Logo */}
        <div className="p-6 border-b border-vinho-light/40 flex items-center gap-3">
          <CoffeeCastLogo className="w-10 h-10" variant="gold" />
          <div>
            <h2 className="font-serif font-black text-lg text-white leading-tight">
              CoffeeCast <span className="text-dourado">4.0</span>
            </h2>
            <p className="text-[10px] uppercase tracking-wider text-dourado-light font-medium">
              Painel Administrativo
            </p>
          </div>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-marfim/60 mb-2">
            Gestão do Podcast
          </p>

          {menuItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)

            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-vinho-light text-white shadow-md border-l-4 border-dourado pl-3'
                    : 'text-marfim/80 hover:text-white hover:bg-vinho-light/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-dourado' : 'text-marfim/70'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <Badge
                    className={`text-[9px] px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-dourado text-vinho font-bold'
                        : 'bg-vinho-dark/80 text-dourado-light border border-dourado/30'
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Rodapé da Sidebar com Usuário Logado e Logout */}
        <div className="p-4 border-t border-vinho-light/40 bg-vinho-dark/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-dourado/20 border border-dourado/60 flex items-center justify-center text-dourado font-bold text-xs uppercase">
              {user?.name ? user.name.slice(0, 2) : 'AL'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Aline Lana'}</p>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-dourado shrink-0" />
                <span className="text-[10px] text-dourado-light truncate">{roleLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-marfim/70 hover:text-dourado flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Ver Site Público
            </a>

            <button
              onClick={handleLogout}
              className="text-[11px] text-red-300 hover:text-red-200 flex items-center gap-1 transition-colors font-medium p-1 rounded"
              title="Encerrar sessão"
            >
              <LogOut className="w-3 h-3" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* CABEÇALHO MOBILE */}
      <header className="md:hidden bg-vinho text-white border-b-2 border-dourado px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <CoffeeCastLogo className="w-8 h-8" variant="gold" />
          <span className="font-serif font-black text-base text-white">
            CoffeeCast <span className="text-dourado">4.0</span>
          </span>
        </div>

        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-lg bg-vinho-light text-marfim hover:bg-vinho-light/80"
          aria-label="Menu administrativo"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* DRAWER MOBILE DA SIDEBAR */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex">
          <div className="w-72 bg-vinho text-marfim h-full flex flex-col p-4 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-vinho-light/40">
              <div className="flex items-center gap-2">
                <CoffeeCastLogo className="w-8 h-8" variant="gold" />
                <span className="font-serif font-bold text-sm text-white">Menu Admin</span>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded text-marfim/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1">
              {menuItems.map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive
                        ? 'bg-vinho-light text-white border-l-4 border-dourado'
                        : 'text-marfim/80 hover:bg-vinho-light/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-dourado" />
                      <span>{item.label}</span>
                    </div>
                  </NavLink>
                )
              })}
            </nav>

            <div className="pt-4 border-t border-vinho-light/40 flex items-center justify-between">
              <span className="text-xs text-dourado-light">{user?.name}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="text-xs h-7"
              >
                Sair
              </Button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* ÁREA PRINCIPAL DO PAINEL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Desktop */}
        <header className="hidden md:flex bg-white border-b border-vinho/10 px-8 py-4 items-center justify-between sticky top-0 z-30 shadow-xs">
          <div>
            <h1 className="font-serif font-bold text-xl text-vinho">{getPageTitle()}</h1>
            <p className="text-xs text-vinho/60">
              Gerencie todas as facetas e conteúdos do CoffeeCast 4.0
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-vinho/70 hover:text-dourado-dark flex items-center gap-1.5 transition-colors font-medium border border-vinho/15 px-3 py-1.5 rounded-full"
            >
              <ExternalLink className="w-3.5 h-3.5 text-dourado" />
              Ver Site
            </a>

            <div className="h-5 w-px bg-vinho/10" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-vinho text-dourado font-bold flex items-center justify-center text-xs">
                {user?.name ? user.name[0] : 'A'}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-vinho leading-none">{user?.name}</p>
                <span className="text-[10px] text-dourado-dark font-semibold uppercase">
                  {role}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo Dinâmico Renderizado pelas Rotas Admin */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

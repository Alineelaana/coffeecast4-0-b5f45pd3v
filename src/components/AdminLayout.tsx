import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import pb from '@/lib/pocketbase/client'
import officialLogo from '@/assets/sem-nome-1350-x-1080-px-1-c4c50.png'
import {
  LayoutDashboard,
  Bell,
  Tv,
  Users2,
  MessageSquareQuote,
  Camera,
  Inbox,
  DollarSign,
  Clock,
  CalendarDays,
  FileCheck2,
  FileText,
  Globe,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Shield,
  ShieldCheck,
  UserCheck,
  Bot,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AdminLayout() {
  const { user, logout, role, isMaster } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [ninePendingCount, setNinePendingCount] = useState(0)

  // Carrega e atualiza badge de pendências (novos roteiros + novos contatos + novos depoimentos)
  const fetchUnreadCount = async () => {
    try {
      const [rotList, depList, contList] = await Promise.all([
        pb
          .collection('roteiros_convidados')
          .getFullList({
            filter: 'status = "pendente" || visualizado = false',
            fields: 'id',
          })
          .catch(() => []),
        pb
          .collection('depoimentos_convidados')
          .getFullList({
            filter: 'status = "pendente" || visualizado = false',
            fields: 'id',
          })
          .catch(() => []),
        pb
          .collection('contatos')
          .getFullList({
            filter: 'status = "novo"',
            fields: 'id',
          })
          .catch(() => []),
      ])

      setUnreadNotificationsCount(rotList.length + depList.length + contList.length)
    } catch (e) {
      console.error('Erro ao buscar notificações não lidas:', e)
    }
  }

  // Carrega badge de conversas da Nine aguardando resposta humana
  const fetchNinePendingCount = async () => {
    try {
      const nineList = await pb
        .collection('nine_conversas')
        .getFullList({
          filter: 'modo_atendimento = "aguardando_humano"',
          fields: 'id',
        })
        .catch(() => [])

      setNinePendingCount(nineList.length)
    } catch (e) {
      console.error('Erro ao buscar pendências da Nine:', e)
    }
  }

  React.useEffect(() => {
    fetchUnreadCount()
    fetchNinePendingCount()

    let unsubNine: (() => void) | undefined
    pb.collection('nine_conversas')
      .subscribe('*', () => {
        fetchNinePendingCount()
      })
      .then((unsub) => {
        unsubNine = unsub
      })
      .catch(() => {})

    let unsubRot: (() => void) | undefined
    let unsubDep: (() => void) | undefined
    let unsubCont: (() => void) | undefined

    pb.collection('roteiros_convidados')
      .subscribe('*', () => {
        fetchUnreadCount()
      })
      .then((unsub) => {
        unsubRot = unsub
      })
      .catch(() => {})

    pb.collection('depoimentos_convidados')
      .subscribe('*', () => {
        fetchUnreadCount()
      })
      .then((unsub) => {
        unsubDep = unsub
      })
      .catch(() => {})

    pb.collection('contatos')
      .subscribe('*', () => {
        fetchUnreadCount()
      })
      .then((unsub) => {
        unsubCont = unsub
      })
      .catch(() => {})

    return () => {
      if (unsubRot) unsubRot()
      if (unsubDep) unsubDep()
      if (unsubCont) unsubCont()
      if (unsubNine) unsubNine()
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Itens do menu com controle estrito de permissão:
  // - Master: Acesso total (vê e acessa todos os itens)
  // - Gerencial: Acesso a tudo EXCETO: Editar Site (/admin/conteudo), Episódios (/admin/episodios),
  //   Integrantes (/admin/integrantes), Depoimentos (/admin/depoimentos), Nossos Momentos (/admin/momentos),
  //   Políticas do Site (/admin/politicas) e Usuários & Permissões (/admin/usuarios).
  const menuItems = [
    {
      label: 'Visão Geral',
      path: '/admin',
      icon: LayoutDashboard,
      exact: true,
      masterOnly: false,
    },
    {
      label: 'Notificações',
      path: '/admin/notificacoes',
      icon: Bell,
      badgeCount: unreadNotificationsCount,
      masterOnly: false,
    },
    {
      label: 'Nine Assistente Virtual',
      path: '/admin/nine',
      icon: Bot,
      badgeCount: ninePendingCount,
      highlight: true,
      masterOnly: false,
    },
    ...(isMaster
      ? [
          {
            label: 'Editar Site',
            path: '/admin/conteudo',
            icon: FileText,
            badge: 'Master',
            masterOnly: true,
          },
          {
            label: 'Domínio do Site',
            path: '/admin/dominio',
            icon: Globe,
            badge: 'Master',
            masterOnly: true,
          },
          {
            label: 'Episódios',
            path: '/admin/episodios',
            icon: Tv,
            badge: 'Master',
            masterOnly: true,
          },
          {
            label: 'Integrantes',
            path: '/admin/integrantes',
            icon: Users2,
            badge: 'Master',
            masterOnly: true,
          },
          {
            label: 'Nossos Momentos',
            path: '/admin/momentos',
            icon: Camera,
            badge: 'Master',
            masterOnly: true,
          },
        ]
      : []),
    {
      label: 'Roteiros e Apresentações',
      path: '/admin/roteiros',
      icon: FileText,
      masterOnly: false,
    },
    {
      label: 'Depoimentos',
      path: '/admin/depoimentos',
      icon: MessageSquareQuote,
      masterOnly: false,
    },
    {
      label: 'Contatos & Leads',
      path: '/admin/contatos',
      icon: Inbox,
      masterOnly: false,
    },
    {
      label: 'Financeiro',
      path: '/admin/financeiro',
      icon: DollarSign,
      highlight: true,
      masterOnly: false,
    },
    {
      label: 'Controle de Horas',
      path: '/admin/horas',
      icon: Clock,
      masterOnly: false,
    },
    {
      label: 'Agenda de Gravação',
      path: '/admin/agenda',
      icon: CalendarDays,
      masterOnly: false,
    },
    {
      label: 'Gerador de Convites',
      path: '/admin/convites',
      icon: FileCheck2,
      badge: 'PDF',
      masterOnly: false,
    },
    ...(isMaster
      ? [
          {
            label: 'Políticas do Site',
            path: '/admin/politicas',
            icon: ShieldAlert,
            badge: 'Master',
            masterOnly: true,
          },
          {
            label: 'Usuários & Permissões',
            path: '/admin/usuarios',
            icon: UserCheck,
            badge: 'Master',
            masterOnly: true,
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
      ? 'Master (Superadministrador)'
      : role === 'gerencial'
        ? 'Categoria Gerencial'
        : role === 'ouro'
          ? 'Categoria Ouro'
          : 'Categoria Prata'

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col md:flex-row font-sans">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-72 bg-vinho border-r border-vinho-dark text-marfim shadow-2xl shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Topo da Sidebar com Logo Oficial Clicável */}
        <div className="p-5 border-b border-vinho-light/40">
          <NavLink
            to="/admin"
            end
            className="group flex flex-col items-center text-center p-2 rounded-2xl hover:bg-vinho-light/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-dourado/60"
            title="Ir para a Visão Geral do Painel Administrativo"
            aria-label="Ir para a Visão Geral do Painel Administrativo"
          >
            <img
              src={officialLogo}
              alt="CoffeeCast 4.0 — Painel Administrativo"
              className="h-16 w-auto max-w-[210px] object-contain drop-shadow-[0_3px_10px_rgba(212,175,55,0.35)] transition-transform duration-200 group-hover:scale-105 cursor-pointer"
            />
            <span className="text-[10px] uppercase tracking-widest text-dourado-light font-medium mt-2 group-hover:text-white transition-colors">
              Painel Administrativo
            </span>
          </NavLink>
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
                  <div className="relative">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-dourado' : 'text-marfim/70'}`} />
                    {item.badgeCount && item.badgeCount > 0 ? (
                      <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    ) : null}
                  </div>
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <Badge className="bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0 rounded-full shadow-xs">
                      {item.badgeCount}
                    </Badge>
                  )}

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
                </div>
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

          {/* Link para Área de Membros + Site Público */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <NavLink
              to="/membros"
              className="text-[11px] text-dourado-light hover:text-white flex items-center gap-1.5 transition-colors font-medium py-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-dourado" />
              Acessar Área de Membros
            </NavLink>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-marfim/70 hover:text-dourado flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Site Público
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
        </div>
      </aside>

      {/* CABEÇALHO MOBILE ESTILO APP */}
      <header className="md:hidden bg-vinho text-white border-b-2 border-dourado px-4 py-2 flex items-center justify-between sticky top-0 z-40 shadow-md min-h-[56px]">
        <NavLink
          to="/admin"
          end
          className="flex items-center gap-2 group p-1 -ml-1 rounded-xl active:scale-95 transition-transform"
          title="Ir para a Visão Geral do Painel Administrativo"
          aria-label="Ir para a Visão Geral do Painel Administrativo"
        >
          <img
            src={officialLogo}
            alt="CoffeeCast 4.0 — Painel Administrativo"
            className="h-10 w-auto max-w-[150px] object-contain drop-shadow-[0_2px_8px_rgba(212,175,55,0.35)] cursor-pointer"
          />
        </NavLink>

        <div className="flex items-center gap-2">
          <NavLink
            to="/admin/notificacoes"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-vinho-light text-marfim relative active:scale-95 transition-all"
            aria-label="Central de Notificações"
          >
            <Bell className="w-5 h-5 text-dourado" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-vinho" />
            )}
          </NavLink>

          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-vinho-light text-marfim hover:bg-vinho-light/80 active:scale-95 transition-all"
            aria-label="Menu administrativo"
          >
            {mobileSidebarOpen ? (
              <X className="w-5 h-5 text-dourado" />
            ) : (
              <Menu className="w-5 h-5 text-dourado" />
            )}
          </button>
        </div>
      </header>
      {/* DRAWER MOBILE DA SIDEBAR ESTILO APP */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex">
          <div className="w-72 max-w-[85vw] bg-vinho text-marfim h-full flex flex-col p-4 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-vinho-light/40">
              <NavLink
                to="/admin"
                end
                onClick={() => setMobileSidebarOpen(false)}
                className="group flex flex-col items-start p-1 rounded-xl active:scale-95 transition-transform"
                title="Ir para a Visão Geral do Painel Administrativo"
                aria-label="Ir para a Visão Geral do Painel Administrativo"
              >
                <img
                  src={officialLogo}
                  alt="CoffeeCast 4.0 — Painel Administrativo"
                  className="h-11 w-auto max-w-[160px] object-contain drop-shadow-[0_2px_8px_rgba(212,175,55,0.35)] cursor-pointer"
                />
                <span className="text-[9px] uppercase tracking-wider text-dourado-light font-medium mt-1">
                  Painel Administrativo
                </span>
              </NavLink>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-marfim/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5 text-dourado" />
              </button>
            </div>

            <nav className="flex-1 py-3 space-y-1">
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
                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold min-h-[44px] transition-all active:scale-[0.98] ${
                      isActive
                        ? 'bg-vinho-light text-white border-l-4 border-dourado shadow-sm font-bold'
                        : 'text-marfim/85 hover:bg-vinho-light/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-dourado shrink-0" />
                      <span>{item.label}</span>
                    </div>

                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <Badge className="bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                        {item.badgeCount}
                      </Badge>
                    )}
                  </NavLink>
                )
              })}
            </nav>

            <div className="pt-4 border-t border-vinho-light/40 flex items-center justify-between">
              <div className="flex flex-col truncate max-w-[140px]">
                <span className="text-xs font-bold text-white truncate">
                  {user?.name || 'Aline Lana'}
                </span>
                <span className="text-[10px] text-dourado-light truncate">{roleLabel}</span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="text-xs h-10 min-h-[44px] px-4 rounded-xl active:scale-95 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
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

          <div className="flex items-center gap-3">
            <NavLink
              to="/admin/notificacoes"
              className="text-xs text-vinho hover:text-dourado-dark flex items-center gap-1.5 transition-colors font-semibold bg-marfim border border-vinho/15 hover:border-dourado px-3 py-1.5 rounded-full relative"
              title="Central de Notificações"
            >
              <Bell className="w-3.5 h-3.5 text-dourado-dark" />
              <span>Notificações</span>
              {unreadNotificationsCount > 0 && (
                <Badge className="bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0 rounded-full h-4 min-w-[16px] flex items-center justify-center">
                  {unreadNotificationsCount}
                </Badge>
              )}
            </NavLink>

            <NavLink
              to="/membros"
              className="text-xs text-vinho hover:text-dourado-dark flex items-center gap-1.5 transition-colors font-semibold bg-dourado/15 border border-dourado/30 px-3 py-1.5 rounded-full"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-dourado-dark" />
              Área de Membros
            </NavLink>

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
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden w-full max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

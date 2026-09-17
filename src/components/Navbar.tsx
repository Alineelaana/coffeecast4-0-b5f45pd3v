import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  Lock,
  ShieldCheck,
  Sparkles,
  Home,
  Users,
  Video,
  MessageSquare,
  UserCheck,
  FileText,
  Send,
  Mail,
  Camera,
  Compass,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { HeaderNavbarLogo } from '@/components/HeaderNavbarLogo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

interface NavbarProps {
  onOpenMembersModal?: () => void
}

interface NavItem {
  label: string
  href: string
  isRoute: boolean
  description?: string
  icon: React.ComponentType<{ className?: string }>
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMembersModal }) => {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  // Detecta rolagem para ajustar o estilo do cabeçalho
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fecha o menu suspenso ao apertar a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  // Fecha o menu suspenso ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuOpen &&
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  // Fecha o menu quando a rota muda
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, location.hash])

  // Todas as páginas e seções solicitadas pelo usuário:
  // Início, Integrantes, Episódios, Depoimentos, Área do Convidado, Deixe seu depoimento,
  // Roteiro do Episódio, Participar, Contato, Nossos Momentos, Missão & Valores.
  const navLinks: NavItem[] = [
    {
      label: 'Início',
      href: '/#inicio',
      isRoute: false,
      description: 'Página inicial e destaques',
      icon: Home,
    },
    {
      label: 'Integrantes',
      href: '/#integrantes',
      isRoute: false,
      description: 'Apresentadores e time',
      icon: Users,
    },
    {
      label: 'Episódios',
      href: '/#episodios',
      isRoute: false,
      description: 'Navegue por todos os episódios',
      icon: Video,
    },
    {
      label: 'Depoimentos',
      href: '/#depoimentos',
      isRoute: false,
      description: 'O que dizem os convidados',
      icon: MessageSquare,
    },
    {
      label: 'Área do Convidado',
      href: '/convidado',
      isRoute: true,
      description: 'Portal do convidado e preparação',
      icon: UserCheck,
    },
    {
      label: 'Deixe seu depoimento',
      href: '/depoimento',
      isRoute: true,
      description: 'Envie sua mensagem sobre o podcast',
      icon: Send,
    },
    {
      label: 'Roteiro do Episódio',
      href: '/roteiro',
      isRoute: true,
      description: 'Consulte cronogramas e pautas',
      icon: FileText,
    },
    {
      label: 'Participar',
      href: '/#participar',
      isRoute: false,
      description: 'Candidate-se como convidado',
      icon: Sparkles,
    },
    {
      label: 'Contato',
      href: '/#contato',
      isRoute: false,
      description: 'Fale com a produção',
      icon: Mail,
    },
    {
      label: 'Nossos Momentos',
      href: '/#momentos',
      isRoute: false,
      description: 'Galeria de fotos e bastidores',
      icon: Camera,
    },
    {
      label: 'Missão & Valores',
      href: '/#missao',
      isRoute: false,
      description: 'Propósito do CoffeeCast',
      icon: Compass,
    },
  ]

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    isRoute: boolean,
  ) => {
    setMenuOpen(false)

    if (isRoute) {
      // Deixa o React Router navegar normalmente para a rota interna
      return
    }

    const hash = href.includes('#') ? href.split('#')[1] : ''

    if (location.pathname === '/') {
      e.preventDefault()
      if (hash) {
        const target = document.getElementById(hash)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' })
          window.history.pushState(null, '', `/#${hash}`)
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } else {
      // Se não estiver na home, navega para '/' mantendo o hash
      e.preventDefault()
      navigate(`/#${hash}`)
    }
  }

  const handleMembersClick = () => {
    setMenuOpen(false)
    if (user) {
      navigate('/membros')
    } else if (onOpenMembersModal) {
      onOpenMembersModal()
    } else {
      navigate('/login')
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-vinho-dark/95 text-marfim shadow-xl backdrop-blur-md border-b border-dourado/40 py-1 sm:py-1.5'
          : 'bg-gradient-to-b from-[#36142d]/95 via-[#36142d]/75 to-transparent text-white py-1.5 sm:py-2'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo oficial clicável que leva ao início */}
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="group flex items-center shrink-0 transition-transform hover:opacity-95 focus:outline-none py-0.5"
            aria-label="CoffeeCast 4.0 - Página Inicial"
          >
            <HeaderNavbarLogo className="h-11 sm:h-14 md:h-16 lg:h-[4.25rem] xl:h-[4.5rem] w-auto transition-all duration-200 group-hover:scale-[1.02]" />
          </Link>

          {/* Acessos diretos no cabeçalho + Botão de Menu Dropdown */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-2.5 shrink-0">
            {/* 1. Área do Convidado (visível a partir de md; no dropdown está sempre disponível) */}
            <Link
              to="/convidado"
              onClick={() => setMenuOpen(false)}
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border border-dourado/30 hover:border-dourado whitespace-nowrap ${
                location.pathname === '/convidado'
                  ? 'bg-dourado/20 text-dourado font-bold border-dourado'
                  : 'text-marfim/90 hover:text-dourado hover:bg-vinho/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-dourado" />
              <span>Área do Convidado</span>
            </Link>

            {/* 2. Botão Área de Membros (o acesso a Meu Perfil fica exclusivamente dentro da Área de Membros) */}
            {user ? (
              <Link
                to="/membros"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border border-dourado/60 text-dourado-light bg-vinho/80 hover:bg-vinho hover:border-dourado whitespace-nowrap shadow-xs active:scale-95"
                title="Acessar Área de Membros"
              >
                <Sparkles className="w-3.5 h-3.5 text-dourado shrink-0" />
                <span className="hidden xs:inline">Área de Membros</span>
                <span className="xs:hidden">Membros</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleMembersClick}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border border-dourado/40 text-marfim hover:bg-vinho/60 hover:border-dourado whitespace-nowrap cursor-pointer active:scale-95"
                title="Acessar Área de Membros"
              >
                <Lock className="w-3.5 h-3.5 text-dourado shrink-0" />
                <span className="hidden xs:inline">Área de Membros</span>
                <span className="xs:hidden">Membros</span>
              </button>
            )}

            {/* 3. Área Administrativa (visível em telas médias/grandes) */}
            {isAdmin ? (
              <Link to="/admin" className="hidden lg:inline-flex shrink-0">
                <Button
                  size="sm"
                  className="bg-dourado hover:bg-dourado-dark text-vinho font-bold shadow-sm transition-all text-xs rounded-full px-3.5 whitespace-nowrap"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Área Administrativa
                </Button>
              </Link>
            ) : (
              <Link to="/login" className="hidden lg:inline-flex shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs rounded-full px-3.5 font-medium transition-all border-dourado/60 text-dourado hover:bg-dourado/15 bg-transparent whitespace-nowrap"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-dourado" />
                  Área Administrativa
                </Button>
              </Link>
            )}

            {/* 4. Botão de MENU Dropdown Interativo (Desktop e Mobile) */}
            <div className="relative" ref={menuContainerRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-md active:scale-95 cursor-pointer min-h-[36px] sm:min-h-[38px] shrink-0 border ${
                  menuOpen
                    ? 'bg-dourado-dark text-vinho border-dourado shadow-dourado/30 ring-2 ring-dourado/40'
                    : 'bg-dourado hover:bg-dourado-dark text-vinho border-dourado/80 hover:shadow-dourado/20'
                }`}
                aria-label={menuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                {menuOpen ? (
                  <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-vinho stroke-[2.5]" />
                ) : (
                  <Menu className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-vinho stroke-[2.5]" />
                )}
                <span className="font-bold">Menu</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-vinho transition-transform duration-200 hidden sm:inline-block ${
                    menuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* DROPDOWN SUSPENSO INTERATIVO ANCORADO NO CABEÇALHO */}
              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-[540px] md:w-[620px] max-w-[95vw] bg-marfim text-vinho rounded-2xl shadow-2xl border-2 border-dourado/60 p-3 sm:p-4 z-[60] origin-top-right animate-in fade-in slide-in-from-top-3 duration-200 focus:outline-none"
                  role="menu"
                  aria-label="Menu de páginas do CoffeeCast"
                >
                  {/* Cabeçalho sutil do dropdown */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-vinho/10 px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-dourado animate-pulse" />
                      <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-vinho/70">
                        Navegue pelo CoffeeCast
                      </span>
                    </div>
                    <span className="text-[11px] text-vinho/50 hidden sm:inline">
                      Selecione uma página para ir direto
                    </span>
                  </div>

                  {/* Grid de páginas e seções (2 colunas em telas maiores, 1 no mobile) */}
                  <div className="max-h-[62vh] sm:max-h-[460px] overflow-y-auto pr-1 space-y-1 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-2">
                    {navLinks.map((item) => {
                      const isActive = item.isRoute && location.pathname === item.href
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.label}
                          to={item.href}
                          onClick={(e) => handleNavClick(e, item.href, item.isRoute)}
                          className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all duration-150 text-left ${
                            isActive
                              ? 'bg-dourado/20 border-dourado text-vinho font-bold shadow-xs'
                              : 'bg-white hover:bg-vinho/5 border-vinho/10 hover:border-dourado text-vinho hover:shadow-xs'
                          }`}
                          role="menuitem"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isActive
                                  ? 'bg-dourado text-vinho'
                                  : 'bg-vinho/5 group-hover:bg-dourado/20 text-vinho group-hover:text-dourado-dark'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="font-serif text-sm sm:text-base font-semibold leading-tight text-vinho truncate">
                                {item.label}
                              </p>
                              {item.description && (
                                <p className="text-[11px] text-vinho/60 truncate leading-tight mt-0.5 hidden xs:block">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-vinho/40 group-hover:text-dourado group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                        </Link>
                      )
                    })}
                  </div>

                  {/* Barra inferior de acessos rápidos (Área de Membros + Área Administrativa) */}
                  <div className="mt-3 pt-3 border-t border-vinho/10 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {user ? (
                      <Link
                        to="/membros"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-vinho text-marfim border border-dourado/50 text-xs font-semibold hover:bg-vinho-dark transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-dourado" />
                        <span>Área de Membros</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={handleMembersClick}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-vinho text-marfim border border-dourado/40 text-xs font-semibold hover:bg-vinho-dark transition-all cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-dourado" />
                        <span>Área de Membros</span>
                      </button>
                    )}

                    <Link
                      to={isAdmin ? '/admin' : '/login'}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-dourado text-vinho border border-dourado-dark/30 text-xs font-bold hover:bg-dourado-dark transition-all shadow-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isAdmin ? 'Painel Admin' : 'Área Administrativa'}</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

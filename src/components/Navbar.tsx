import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import { HeaderNavbarLogo } from '@/components/HeaderNavbarLogo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

interface NavbarProps {
  onOpenMembersModal?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMembersModal }) => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { user, isAdmin } = useAuth()

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

  const navLinks = [
    { label: 'Início', href: '/#inicio', isRoute: false },
    { label: 'Integrantes', href: '/#integrantes', isRoute: false },
    { label: 'Episódios', href: '/#episodios', isRoute: false },
    { label: 'Depoimentos', href: '/#depoimentos', isRoute: false },
    { label: 'Área do Convidado', href: '/convidado', isRoute: true },
    { label: 'Deixe seu depoimento', href: '/depoimento', isRoute: true },
    { label: 'Participar', href: '/#participar', isRoute: false },
    { label: 'Contato', href: '/#contato', isRoute: false },
    { label: 'Nossos Momentos', href: '/#momentos', isRoute: false },
    { label: 'Missão & Valores', href: '/#missao', isRoute: false },
  ]

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    isRoute: boolean,
  ) => {
    setMobileMenuOpen(false)
    if (isRoute) {
      return // Navegação de rota padrão via React Router Link
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
    }
    // Se não estiver em '/', deixa o <Link to={href}> navegar para /#hash; o scroll de carregamento na Index cuidará do hash
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
          {/* Logo oficial do cabeçalho público com fundo transparente - cabeçalho compacto */}
          <Link
            to="/"
            className="group flex items-center shrink-0 transition-transform hover:opacity-95 focus:outline-none py-0.5"
            aria-label="CoffeeCast 4.0 - Página Inicial"
          >
            <HeaderNavbarLogo className="h-12 sm:h-14 md:h-16 lg:h-[4.25rem] xl:h-[4.5rem] w-auto transition-all duration-200 group-hover:scale-[1.02]" />
          </Link>

          {/* Desktop Navigation Links (exibidos a partir de telas médias/grandes lg) */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 2xl:gap-6 shrink">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={(e) => handleNavClick(e, link.href, link.isRoute)}
                className={`text-xs xl:text-sm font-medium transition-colors relative py-1 whitespace-nowrap ${
                  link.isRoute && location.pathname === link.href
                    ? 'text-dourado font-bold'
                    : 'text-marfim/90 hover:text-dourado'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {user ? (
              <Link
                to="/membros"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border border-dourado/50 text-dourado-light bg-vinho/80 hover:bg-vinho hover:border-dourado whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-dourado" />
                Área de Membros
              </Link>
            ) : (
              <button
                onClick={onOpenMembersModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border border-dourado/40 text-marfim hover:bg-vinho/60 hover:border-dourado whitespace-nowrap cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-dourado" />
                Área de Membros
              </button>
            )}

            {isAdmin ? (
              <Link to="/admin" className="shrink-0">
                <Button
                  size="sm"
                  className="bg-dourado hover:bg-dourado-dark text-vinho font-bold shadow-sm transition-all text-xs rounded-full px-3.5 whitespace-nowrap"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Painel Admin
                </Button>
              </Link>
            ) : (
              <Link to="/login" className="shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs rounded-full px-3.5 font-medium transition-all border-dourado/60 text-dourado hover:bg-dourado/15 bg-transparent whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-dourado" />
                  Administração
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile / Tablet menu button */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            {/* Em telas sm e md, mostramos o botão da Área de Membros se não houver espaço completo para todos os botões */}
            <div className="flex md:hidden items-center gap-1.5 shrink-0">
              {user ? (
                <Link
                  to="/membros"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border border-dourado/50 text-dourado-light bg-vinho/80 whitespace-nowrap"
                >
                  <Sparkles className="w-3 h-3 text-dourado" />
                  Membros
                </Link>
              ) : (
                <button
                  onClick={onOpenMembersModal}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border border-dourado/40 text-marfim bg-vinho/60 whitespace-nowrap"
                >
                  <Lock className="w-3 h-3 text-dourado" />
                  Membros
                </button>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors text-marfim hover:bg-vinho/60 active:scale-95 shrink-0"
              aria-label="Abrir menu de navegação"
            >
              {mobileMenuOpen ? (
                <X className="w-7 h-7 text-dourado" />
              ) : (
                <Menu className="w-7 h-7" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-vinho-dark border-b-2 border-dourado/60 text-marfim px-5 py-5 shadow-2xl animate-fade-in-down max-h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={(e) => handleNavClick(e, link.href, link.isRoute)}
                className={`text-base font-medium py-3 px-3 rounded-xl border-b border-vinho-light/30 hover:text-dourado hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-between min-h-[44px] ${
                  link.isRoute && location.pathname === link.href
                    ? 'text-dourado bg-white/5 font-bold'
                    : ''
                }`}
              >
                <span>{link.label}</span>
                <span className="text-dourado/60 text-xs">›</span>
              </Link>
            ))}

            <div className="pt-4 flex flex-col gap-2.5">
              {user ? (
                <Link
                  to="/membros"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 px-4 rounded-xl bg-vinho-light/60 border border-dourado/40 text-dourado-light text-sm font-semibold flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.99] transition-transform"
                >
                  <Sparkles className="w-4 h-4 text-dourado" />
                  Área de Membros
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onOpenMembersModal?.()
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-vinho-light/60 border border-white/20 text-marfim text-sm font-semibold flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.99] transition-transform"
                >
                  <Lock className="w-4 h-4 text-dourado" />
                  Área de Membros
                </button>
              )}

              <Link
                to={isAdmin ? '/admin' : user ? '/membros' : '/login'}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button className="w-full bg-dourado hover:bg-dourado-dark text-vinho font-bold text-sm rounded-xl py-3 min-h-[44px] active:scale-[0.99] transition-transform">
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  {isAdmin
                    ? 'Acessar Painel Admin'
                    : user
                      ? 'Área de Membros'
                      : 'Acesso Administrativo'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

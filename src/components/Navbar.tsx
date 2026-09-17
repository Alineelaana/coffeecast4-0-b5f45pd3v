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
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Logo oficial clicável que leva ao início */}
          <Link
            to="/"
            className="group flex items-center shrink-0 transition-transform hover:opacity-95 focus:outline-none py-0.5"
            aria-label="CoffeeCast 4.0 - Página Inicial"
          >
            <HeaderNavbarLogo className="h-12 sm:h-14 md:h-16 lg:h-[4.25rem] xl:h-[4.5rem] w-auto transition-all duration-200 group-hover:scale-[1.02]" />
          </Link>

          {/* Acessos diretos no cabeçalho + Botão de Menu para Desktop e Mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3 shrink-0">
            {/* 1. Área do Convidado (visível a partir de sm; no mobile menor está no Menu) */}
            <Link
              to="/convidado"
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border border-dourado/30 hover:border-dourado whitespace-nowrap ${
                location.pathname === '/convidado'
                  ? 'bg-dourado/20 text-dourado font-bold border-dourado'
                  : 'text-marfim/90 hover:text-dourado hover:bg-vinho/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-dourado" />
              <span>Área do Convidado</span>
            </Link>

            {/* 2. Área de Membros */}
            {user ? (
              <Link
                to="/membros"
                className="hidden xs:inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border border-dourado/50 text-dourado-light bg-vinho/80 hover:bg-vinho hover:border-dourado whitespace-nowrap shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-dourado" />
                <span>Área de Membros</span>
              </Link>
            ) : (
              <button
                onClick={onOpenMembersModal}
                className="hidden xs:inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border border-dourado/40 text-marfim hover:bg-vinho/60 hover:border-dourado whitespace-nowrap cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-dourado" />
                <span>Área de Membros</span>
              </button>
            )}

            {/* 3. Área Administrativa / Administração */}
            {isAdmin ? (
              <Link to="/admin" className="hidden md:inline-flex shrink-0">
                <Button
                  size="sm"
                  className="bg-dourado hover:bg-dourado-dark text-vinho font-bold shadow-sm transition-all text-xs rounded-full px-3.5 whitespace-nowrap"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Área Administrativa
                </Button>
              </Link>
            ) : (
              <Link to="/login" className="hidden md:inline-flex shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs rounded-full px-3.5 font-medium transition-all border-dourado/60 text-dourado hover:bg-dourado/15 bg-transparent whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-dourado" />
                  Área Administrativa
                </Button>
              </Link>
            )}

            {/* 4. Botão de MENU (Desktop e Mobile) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all bg-dourado hover:bg-dourado-dark text-vinho shadow-md hover:shadow-dourado/20 active:scale-95 cursor-pointer min-h-[38px] shrink-0"
              aria-label="Abrir menu de páginas do site"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-vinho stroke-[2.5]" />
              <span className="font-bold">Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay Marfim em tela cheia (Desktop e Mobile) com links do site */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[100] bg-marfim text-vinho overflow-y-auto animate-in fade-in duration-300 flex flex-col justify-between"
          role="dialog"
          aria-modal="true"
          aria-label="Menu principal de navegação"
        >
          {/* Top bar do overlay: Logo oficial + Botão Fechar dourado elegante */}
          <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between border-b border-dourado/30">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center transition-transform hover:opacity-90"
              aria-label="CoffeeCast 4.0 - Voltar ao início"
            >
              <HeaderNavbarLogo className="h-12 sm:h-14 md:h-16 w-auto" />
            </Link>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full border border-vinho/20 hover:border-dourado text-vinho hover:text-dourado-dark bg-white/70 hover:bg-white shadow-xs transition-all active:scale-95 cursor-pointer text-xs sm:text-sm font-bold min-h-[44px]"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5 text-vinho" />
              <span>Fechar</span>
            </button>
          </div>

          {/* Conteúdo central do menu com fade-in escalonado */}
          <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 flex flex-col justify-center">
            <div className="text-center mb-6 sm:mb-8">
              <span className="text-[11px] sm:text-xs uppercase tracking-widest text-vinho/70 font-semibold bg-vinho/5 px-3.5 py-1 rounded-full border border-vinho/10 inline-block mb-2">
                Navegação Completa
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-vinho">
                Páginas & Seções do Site
              </h2>
            </div>

            {/* Grid elegante de links de navegação com transições */}
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 max-w-2xl mx-auto w-full">
              {navLinks.map((link, idx) => {
                const isActive = link.isRoute && location.pathname === link.href
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={(e) => handleNavClick(e, link.href, link.isRoute)}
                    style={{ animationDelay: `${idx * 40}ms` }}
                    className={`group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 active:scale-[0.99] animate-in fade-in slide-in-from-bottom-2 ${
                      isActive
                        ? 'bg-dourado/20 border-dourado text-vinho font-bold shadow-xs'
                        : 'bg-white/80 hover:bg-white border-vinho/10 hover:border-dourado text-vinho/90 hover:text-vinho hover:shadow-md'
                    }`}
                  >
                    <span className="font-serif text-base sm:text-lg font-medium group-hover:translate-x-1 transition-transform">
                      {link.label}
                    </span>
                    <span className="w-7 h-7 rounded-full bg-vinho/5 group-hover:bg-dourado/20 text-vinho/60 group-hover:text-vinho flex items-center justify-center text-sm transition-colors">
                      ›
                    </span>
                  </Link>
                )
              })}
            </nav>

            {/* Botões de Acesso Rápido dentro do Overlay (Área de Membros + Área Administrativa) */}
            <div className="mt-8 pt-6 border-t border-dourado/30 max-w-2xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
              {user ? (
                <Link
                  to="/membros"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3.5 px-4 rounded-xl bg-vinho text-marfim border border-dourado/50 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-vinho-dark transition-all active:scale-[0.99] shadow-sm min-h-[46px]"
                >
                  <Sparkles className="w-4 h-4 text-dourado" />
                  <span>Acessar Área de Membros</span>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onOpenMembersModal?.()
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-vinho text-marfim border border-dourado/50 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-vinho-dark transition-all active:scale-[0.99] shadow-sm cursor-pointer min-h-[46px]"
                >
                  <Lock className="w-4 h-4 text-dourado" />
                  <span>Área de Membros</span>
                </button>
              )}

              <Link
                to={isAdmin ? '/admin' : user ? '/membros' : '/login'}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button className="w-full bg-dourado hover:bg-dourado-dark text-vinho font-bold text-sm rounded-xl py-3.5 min-h-[46px] active:scale-[0.99] transition-all shadow-sm">
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  {isAdmin ? 'Acessar Painel Admin' : 'Área Administrativa'}
                </Button>
              </Link>
            </div>
          </div>

          {/* Rodapé informativo sutil dentro do overlay */}
          <div className="py-4 text-center border-t border-vinho/10 bg-white/40">
            <p className="text-xs text-vinho/60 font-light">
              CoffeeCast 4.0 — Mais que conversas, histórias que transformam.
            </p>
          </div>
        </div>
      )}
    </header>
  )
}

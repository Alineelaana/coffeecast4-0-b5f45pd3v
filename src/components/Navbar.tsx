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
    { label: 'Início', href: '#inicio' },
    { label: 'Integrantes', href: '#integrantes' },
    { label: 'Episódios', href: '#episodios' },
    { label: 'Depoimentos', href: '#depoimentos' },
    { label: 'Participar', href: '#participar' },
    { label: 'Contato', href: '#contato' },
    { label: 'Nossos Momentos', href: '#momentos' },
    { label: 'Missão & Valores', href: '#missao' },
  ]

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileMenuOpen(false)
    if (location.pathname !== '/') {
      return // deixe navegar normalmente para /#secao
    }
    e.preventDefault()
    const target = document.querySelector(href)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-vinho-dark/95 text-marfim shadow-lg backdrop-blur-md border-b border-dourado/40 py-2.5'
          : 'bg-gradient-to-b from-[#36142d]/85 via-[#36142d]/45 to-transparent text-white py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Logo Brand recolorida do cabeçalho público (SVG inline: xícara dourada + 'CoffeeCast' em branco + '4.0' em dourado) */}
          <Link
            to="/"
            className="group flex items-center transition-transform hover:opacity-95 focus:outline-none"
            aria-label="CoffeeCast 4.0 - Página Inicial"
          >
            <HeaderNavbarLogo className="h-9 sm:h-10 md:h-11 w-auto transition-transform duration-200 group-hover:scale-[1.02]" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={location.pathname === '/' ? link.href : `/${link.href}`}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm font-medium transition-colors text-marfim/90 hover:text-dourado relative py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            {user ? (
              <Link
                to="/membros"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border border-dourado/50 text-dourado-light bg-vinho/80 hover:bg-vinho hover:border-dourado"
              >
                <Sparkles className="w-3.5 h-3.5 text-dourado" />
                Área de Membros
              </Link>
            ) : (
              <button
                onClick={onOpenMembersModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border border-dourado/40 text-marfim hover:bg-vinho/60 hover:border-dourado"
              >
                <Lock className="w-3.5 h-3.5 text-dourado" />
                Área de Membros
              </button>
            )}

            {isAdmin ? (
              <Link to="/admin">
                <Button
                  size="sm"
                  className="bg-dourado hover:bg-dourado-dark text-vinho font-bold shadow-sm transition-all text-xs rounded-full px-3.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Painel Admin
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs rounded-full px-3.5 font-medium transition-all border-dourado/60 text-dourado hover:bg-dourado/15 bg-transparent"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-dourado" />
                  Administração
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg transition-colors text-marfim hover:bg-vinho/60"
              aria-label="Abrir menu de navegação"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-vinho-dark border-b-2 border-dourado/60 text-marfim px-6 py-6 shadow-2xl animate-fade-in-down">
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={location.pathname === '/' ? link.href : `/${link.href}`}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-base font-medium py-1.5 border-b border-vinho-light/40 hover:text-dourado transition-colors"
              >
                {link.label}
              </a>
            ))}

            <div className="pt-4 flex flex-col gap-2.5">
              {user ? (
                <Link
                  to="/membros"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-lg bg-vinho-light/60 border border-dourado/30 text-dourado-light text-sm font-semibold flex items-center justify-center gap-2"
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
                  className="w-full py-2.5 px-4 rounded-lg bg-vinho-light/60 border border-white/20 text-marfim text-sm font-semibold flex items-center justify-center gap-2"
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
                <Button className="w-full bg-dourado hover:bg-dourado-dark text-vinho font-bold text-sm rounded-lg">
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

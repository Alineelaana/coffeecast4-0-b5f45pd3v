import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Cookie, ShieldCheck, ChevronRight, X } from 'lucide-react'

const COOKIE_STORAGE_KEY = 'coffeecast_cookies_accepted'

export const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const location = useLocation()

  useEffect(() => {
    // Não exibir na área administrativa
    if (location.pathname.startsWith('/admin')) {
      setIsVisible(false)
      return
    }

    try {
      const consent = localStorage.getItem(COOKIE_STORAGE_KEY)
      if (!consent) {
        // Pequeno atraso para entrada suave com slide-up após carregar a página
        const timer = setTimeout(() => {
          setIsVisible(true)
        }, 600)
        return () => clearTimeout(timer)
      }
    } catch {
      // Se o localStorage estiver bloqueado, não quebra a aplicação
    }
  }, [location.pathname])

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, 'all')
    } catch {
      // fallback
    }
    setIsVisible(false)
  }

  const handleDeclineOrEssentialOnly = () => {
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, 'essential')
    } catch {
      // fallback
    }
    setIsVisible(false)
  }

  // Se rota administrativa ou usuário já consentiu, não renderiza nada
  if (!isVisible || location.pathname.startsWith('/admin')) {
    return null
  }

  return (
    <aside
      aria-label="Aviso de Privacidade e Cookies"
      role="region"
      className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-5 pointer-events-none transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-6"
    >
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <div className="bg-[#FAF8F5]/98 backdrop-blur-md border-2 border-[#D4AF37] rounded-2xl sm:rounded-3xl shadow-[0_12px_40px_rgba(75,30,63,0.22)] p-4 sm:p-6 text-[#4B1E3F] transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            {/* Ícone e Texto Explicativo */}
            <div className="flex items-start gap-3 sm:gap-4 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#4B1E3F] text-[#D4AF37] flex items-center justify-center shrink-0 shadow-md border border-[#D4AF37]/40">
                <span className="text-xl sm:text-2xl" role="img" aria-label="Cookies">
                  🍪
                </span>
              </div>

              <div className="space-y-1.5 flex-1 pr-6 sm:pr-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-[#4B1E3F] tracking-wide flex items-center gap-1.5">
                    <span>Cookies & Privacidade</span>
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#4B1E3F]/10 text-[#4B1E3F] text-[10px] font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
                    LGPD
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#4B1E3F]/85 leading-relaxed font-light">
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência de
                  navegação, analisar o tráfego do podcast e personalizar conteúdos de acordo com a
                  Lei Geral de Proteção de Dados (LGPD).
                </p>

                <div className="pt-0.5">
                  <Link
                    to="/politica/privacidade"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#4B1E3F] hover:text-[#D4AF37] underline decoration-[#D4AF37] decoration-2 underline-offset-4 transition-colors"
                  >
                    <span>Saiba mais na nossa Política de Privacidade</span>
                    <ChevronRight className="w-3 h-3 text-[#D4AF37]" />
                  </Link>
                </div>
              </div>

              {/* Botão sutil de fechar/dispensar no canto mobile */}
              <button
                type="button"
                onClick={handleDeclineOrEssentialOnly}
                aria-label="Dispensar aviso de cookies"
                className="sm:hidden absolute top-4 right-4 text-[#4B1E3F]/50 hover:text-[#4B1E3F] p-1.5 rounded-lg active:scale-95 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ações / Botões */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0 pt-1 sm:pt-0 border-t border-[#4B1E3F]/10 sm:border-t-0">
              <button
                type="button"
                onClick={handleDeclineOrEssentialOnly}
                className="order-2 sm:order-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#4B1E3F]/80 hover:text-[#4B1E3F] hover:bg-[#4B1E3F]/5 border border-[#4B1E3F]/20 active:scale-95 transition-all min-h-[42px] flex items-center justify-center text-center"
              >
                Continuar navegando
              </button>

              <button
                type="button"
                onClick={handleAccept}
                className="order-1 sm:order-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#4B1E3F] hover:bg-[#36142D] text-[#FAF8F5] border border-[#D4AF37] shadow-md hover:shadow-lg active:scale-95 transition-all min-h-[42px] flex items-center justify-center gap-2 group"
              >
                <Cookie className="w-3.5 h-3.5 text-[#D4AF37] transition-transform group-hover:rotate-12" />
                <span>Aceitar cookies</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default CookieBanner

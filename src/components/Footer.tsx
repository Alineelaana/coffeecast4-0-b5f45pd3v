import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Heart, Shield, Lock, ExternalLink, Instagram, Linkedin } from 'lucide-react'
import officialLogo from '@/assets/sem-nome-1350-x-1080-px-1-c4c50.png'
import pb from '@/lib/pocketbase/client'
import { normalizeSocialUrl } from '@/lib/formatters'
import type { ConteudoSiteRecord, SocialLinks } from '@/types/database'

interface FooterProps {
  contatoComercial?: string
  rodapeCreditos?: string
  socialLinks?: SocialLinks
}

// Ícones SVG elegantes inline para TikTok e Facebook (sem instalar dependências pesadas)
const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-2.04-.52 4.93 4.93 0 0 1-1.04-.79 4.83 4.83 0 0 1-.96-3.21z" />
  </svg>
)

const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

export const Footer: React.FC<FooterProps> = ({
  contatoComercial = 'Aline Lana / WhatsApp: (31) 99129-7619',
  rodapeCreditos = 'Site criado e gerenciado por SAF TECNOLOGIA E GESTAO LTDA — CNPJ 65.768.215/0001-00',
  socialLinks: initialSocialLinks,
}) => {
  const currentYear = new Date().getFullYear()
  const [fetchedLinks, setFetchedLinks] = useState<SocialLinks | null>(null)

  // Se não foi passado via props (ex: página de Políticas), busca do PocketBase
  useEffect(() => {
    if (initialSocialLinks) return

    let isMounted = true
    async function loadSocials() {
      try {
        const records = await pb.collection('conteudo_site').getFullList<ConteudoSiteRecord>({
          filter: "chave ~ 'social_'",
        })
        if (!isMounted) return
        const links: SocialLinks = {}
        records.forEach((r) => {
          if (r.chave === 'social_tiktok') links.tiktok = r.valor
          if (r.chave === 'social_facebook') links.facebook = r.valor
          if (r.chave === 'social_instagram') links.instagram = r.valor
          if (r.chave === 'social_linkedin') links.linkedin = r.valor
        })
        setFetchedLinks(links)
      } catch (err) {
        console.error('Erro ao buscar redes sociais para o rodapé:', err)
      }
    }

    loadSocials()
    return () => {
      isMounted = false
    }
  }, [initialSocialLinks])

  const links = initialSocialLinks || fetchedLinks || {}

  const socialItems = [
    {
      key: 'tiktok',
      name: 'TikTok',
      url: normalizeSocialUrl('tiktok', links.tiktok),
      icon: TikTokIcon,
    },
    {
      key: 'facebook',
      name: 'Facebook',
      url: normalizeSocialUrl('facebook', links.facebook),
      icon: FacebookIcon,
    },
    {
      key: 'instagram',
      name: 'Instagram',
      url: normalizeSocialUrl('instagram', links.instagram),
      icon: Instagram,
    },
    {
      key: 'linkedin',
      name: 'LinkedIn',
      url: normalizeSocialUrl('linkedin', links.linkedin),
      icon: Linkedin,
    },
  ].filter((item) => Boolean(item.url))

  return (
    <footer className="bg-vinho-dark border-t-2 border-dourado/40 text-marfim relative overflow-hidden">
      {/* Detalhes de luz de fundo decorativa */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-dourado/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-brand/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Coluna 1: Marca e Propósito */}
          <div className="space-y-4">
            <a
              href="#inicio"
              className="inline-block group focus:outline-none focus:ring-2 focus:ring-dourado/50 rounded-xl"
              aria-label="CoffeeCast 4.0 — Voltar ao início"
            >
              <img
                src={officialLogo}
                alt="CoffeeCast 4.0"
                className="h-16 sm:h-20 w-auto max-w-[240px] object-contain drop-shadow-[0_4px_14px_rgba(212,175,55,0.35)] transition-transform duration-200 group-hover:scale-105"
              />
            </a>
            <p className="text-sm text-marfim/80 leading-relaxed font-light">
              "Mais que conversas, histórias que transformam." O podcast brasileiro feito por e
              sobre mulheres, trazendo acolhimento, inspiração e autenticidade para cada encontro.
            </p>
            <div className="flex items-center gap-2 text-xs text-dourado-light pt-1">
              <Heart className="w-3.5 h-3.5 text-dourado fill-dourado" />
              <span>Conexão, acolhimento e verdade.</span>
            </div>
          </div>

          {/* Coluna 2: Navegação Rápida */}
          <div>
            <h4 className="font-serif font-bold text-base text-dourado mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-dourado" />
              Navegação
            </h4>
            <ul className="space-y-2.5 text-sm text-marfim/80">
              <li>
                <a href="#inicio" className="hover:text-dourado transition-colors">
                  Início
                </a>
              </li>
              <li>
                <a href="#integrantes" className="hover:text-dourado transition-colors">
                  Nossas Integrantes
                </a>
              </li>
              <li>
                <a href="#episodios" className="hover:text-dourado transition-colors">
                  Episódios & YouTube
                </a>
              </li>
              <li>
                <a href="#depoimentos" className="hover:text-dourado transition-colors">
                  Depoimentos de Convidados
                </a>
              </li>
              <li>
                <a href="#participar" className="hover:text-dourado transition-colors">
                  Quero Participar do Podcast
                </a>
              </li>
              <li>
                <a href="#momentos" className="hover:text-dourado transition-colors">
                  Nossos Momentos
                </a>
              </li>
              <li>
                <a href="#missao" className="hover:text-dourado transition-colors">
                  Missão, Visão & Valores
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Contato Comercial */}
          <div id="contato">
            <h4 className="font-serif font-bold text-base text-dourado mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-dourado" />
              Contato Comercial
            </h4>
            <div className="bg-vinho/60 border border-dourado/30 rounded-xl p-4 space-y-3">
              <p className="text-xs uppercase font-semibold text-dourado-light tracking-wider">
                Parcerias, Patrocínios & Imprensa
              </p>
              <div className="flex items-start gap-2.5 text-sm text-marfim">
                <MessageCircle className="w-4 h-4 text-dourado shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">{contatoComercial}</span>
                  <a
                    href="https://wa.me/5531991297619"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-dourado hover:underline mt-1"
                  >
                    Abrir conversa direta no WhatsApp
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
            <p className="text-xs text-marfim/60 mt-3">
              Horário de atendimento: Segunda a Sexta, das 09h às 18h.
            </p>
          </div>

          {/* Coluna 4: Políticas & Institucional */}
          <div>
            <h4 className="font-serif font-bold text-base text-dourado mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-dourado" />
              Políticas & Acesso
            </h4>
            <ul className="space-y-2.5 text-sm text-marfim/80">
              <li>
                <Link
                  to="/politica/privacidade"
                  className="hover:text-dourado transition-colors flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-dourado" />
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  to="/politica/cookies"
                  className="hover:text-dourado transition-colors flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-dourado" />
                  Política de Cookies
                </Link>
              </li>
              <li>
                <Link
                  to="/politica/termos"
                  className="hover:text-dourado transition-colors flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-dourado" />
                  Termos de Uso
                </Link>
              </li>
              <li className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-xs text-marfim/70 hover:text-dourado transition-colors"
                >
                  <Lock className="w-3 h-3 text-dourado" />
                  Acesso Restrito / Administração
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Seção Redes Sociais com frase em destaque e linha de ícones sutis */}
        {socialItems.length > 0 && (
          <div className="mt-12 pt-10 border-t border-vinho-light/40 flex flex-col items-center justify-center text-center space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-widest text-dourado-light/80 font-medium block">
                Comunidade & Conexão
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-dourado tracking-wide">
                Siga a gente nas redes sociais
              </h3>
            </div>

            <div className="flex items-center justify-center gap-3.5 sm:gap-4 flex-wrap pt-1">
              {socialItems.map((social) => {
                const IconComponent = social.icon
                return (
                  <a
                    key={social.key}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visitar nosso perfil no ${social.name}`}
                    title={social.name}
                    className="w-12 h-12 sm:w-11 sm:h-11 rounded-full bg-vinho/70 border border-dourado/40 text-marfim/90 hover:text-dourado hover:border-dourado hover:bg-vinho hover:scale-110 active:scale-95 shadow-md hover:shadow-dourado/20 transition-all duration-200 flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-dourado/60 min-w-[48px] min-h-[48px]"
                  >
                    <IconComponent className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Linha Divisória */}
        <div className="border-t border-vinho-light/50 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-marfim/70 text-center md:text-left">
          <p>© {currentYear} CoffeeCast 4.0 — Todos os direitos reservados.</p>

          <a
            href="https://api.whatsapp.com/send/?phone=5531991297619&text=Ol%C3%A1%20quero%20falar%20na%20SAF%20Tecnologia%20e%20Gest%C3%A3o%20LTDA.&type=phone_number&app_absent=0"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar com a SAF Tecnologia e Gestão LTDA. pelo WhatsApp"
            className="font-medium text-marfim/85 hover:text-dourado bg-vinho/40 hover:bg-vinho/70 px-3 py-2 sm:py-1.5 rounded-md border border-white/10 hover:border-dourado/40 transition-all duration-200 inline-flex items-center justify-center gap-1.5 underline-offset-4 hover:underline cursor-pointer group/creditos min-h-[44px] sm:min-h-0"
          >
            <span>{rodapeCreditos}</span>
          </a>
        </div>
      </div>
    </footer>
  )
}

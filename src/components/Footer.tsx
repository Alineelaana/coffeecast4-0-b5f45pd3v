import React from 'react'
import { Link } from 'react-router-dom'
import { CoffeeCastBrand } from './CoffeeCastLogo'
import { MessageCircle, Heart, Shield, Lock, ExternalLink } from 'lucide-react'

interface FooterProps {
  contatoComercial?: string
  rodapeCreditos?: string
}

export const Footer: React.FC<FooterProps> = ({
  contatoComercial = 'Aline Lana / WhatsApp: (31) 99129-7619',
  rodapeCreditos = 'Site criado e gerenciado por SAF TECNOLOGIA E GESTAO LTDA — CNPJ 65.768.215/0001-00',
}) => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-vinho-dark border-t-2 border-dourado/40 text-marfim relative overflow-hidden">
      {/* Detalhes de luz de fundo decorativa */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-dourado/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-brand/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Coluna 1: Marca e Propósito */}
          <div className="space-y-4">
            <CoffeeCastBrand variant="light" iconSize="w-12 h-12" />
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
                <a href="#momentos" className="hover:text-dourado transition-colors">
                  Nossos Momentos
                </a>
              </li>
              <li>
                <a href="#participar" className="hover:text-dourado transition-colors">
                  Quero Participar do Podcast
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

        {/* Linha Divisória */}
        <div className="border-t border-vinho-light/50 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-marfim/70 text-center md:text-left">
          <p>© {currentYear} CoffeeCast 4.0 — Todos os direitos reservados.</p>

          <p className="font-medium text-marfim/85 bg-vinho/40 px-3 py-1.5 rounded-md border border-white/10">
            {rodapeCreditos}
          </p>
        </div>
      </div>
    </footer>
  )
}

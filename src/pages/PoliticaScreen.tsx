import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { MembersAreaModal } from '@/components/MembersAreaModal'
import { ShieldCheck, ArrowLeft, Clock, FileText } from 'lucide-react'
import type { PoliticaRecord } from '@/types/database'

export default function PoliticaScreen() {
  const { slug } = useParams<{ slug: string }>()
  const [politica, setPolitica] = useState<PoliticaRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [membersModalOpen, setMembersModalOpen] = useState(false)

  useEffect(() => {
    async function loadPolitica() {
      setLoading(true)
      try {
        const cleanSlug =
          slug === 'privacidade' || slug === 'cookies' || slug === 'termos' ? slug : 'privacidade'
        const record = await pb
          .collection('politicas')
          .getFirstListItem<PoliticaRecord>(`slug = "${cleanSlug}"`)
        setPolitica(record)
      } catch (err) {
        console.error('Erro ao buscar política:', err)
        // Fallback razoável caso a coleção não retorne
        const defaultTitle =
          slug === 'cookies'
            ? 'Política de Cookies'
            : slug === 'termos'
              ? 'Termos de Uso'
              : 'Política de Privacidade'

        setPolitica({
          id: 'default',
          slug: (slug as 'privacidade' | 'cookies' | 'termos') || 'privacidade',
          titulo: defaultTitle,
          conteudo: `O CoffeeCast 4.0 preza pelo respeito, transparência e segurança de todos os seus visitantes, ouvintes e parceiros.

1. TRATAMENTO DE INFORMAÇÕES
Todas as informações coletadas através do formulário de contato são utilizadas estritamente para a produção e agendamento dos episódios do podcast. Não comercializamos nem compartilhamos seus dados com terceiros sem consentimento prévio.

2. DIREITOS E PRIVACIDADE
Em conformidade com a legislação brasileira de proteção de dados (LGPD), você pode a qualquer momento solicitar a alteração ou exclusão de seus dados de nossa base de contatos pelo e-mail da nossa produção ou WhatsApp comercial.

3. DÚVIDAS E SUPORTE
Para mais esclarecimentos sobre nossas políticas, entre em contato com nossa equipe responsável: Aline Lana / WhatsApp: (31) 99129-7619.`,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        })
      } finally {
        setLoading(false)
      }
    }

    loadPolitica()
  }, [slug])

  return (
    <div className="min-h-screen bg-marfim text-vinho flex flex-col font-sans">
      <Navbar onOpenMembersModal={() => setMembersModalOpen(true)} />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-vinho/70 hover:text-vinho transition-colors bg-white px-3.5 py-1.5 rounded-full border border-vinho/10 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para a Página Inicial
          </Link>

          <div className="bg-white rounded-3xl border-2 border-vinho/10 p-6 sm:p-12 shadow-xl space-y-8">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-dourado border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-vinho/70">Carregando política...</p>
              </div>
            ) : politica ? (
              <>
                <div className="border-b border-vinho/10 pb-6 space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vinho/10 text-vinho text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-dourado-dark" />
                    <span>Documento Institucional Oficial</span>
                  </div>

                  <h1 className="font-serif text-3xl sm:text-4xl font-bold text-vinho">
                    {politica.titulo}
                  </h1>

                  <div className="flex items-center gap-4 text-xs text-vinho/60 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-dourado" />
                      CoffeeCast 4.0
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-dourado" />
                      Versão Atualizada
                    </span>
                  </div>
                </div>

                <div className="prose prose-wine max-w-none text-vinho/85 text-sm sm:text-base leading-relaxed whitespace-pre-line font-light">
                  {politica.conteudo}
                </div>

                <div className="pt-8 border-t border-vinho/10 text-xs text-vinho/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span>Site criado e gerenciado por SAF TECNOLOGIA E GESTAO LTDA</span>
                  <div className="flex items-center gap-4">
                    <Link to="/politica/privacidade" className="hover:underline">
                      Privacidade
                    </Link>
                    <Link to="/politica/cookies" className="hover:underline">
                      Cookies
                    </Link>
                    <Link to="/politica/termos" className="hover:underline">
                      Termos
                    </Link>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </main>

      <Footer />
      <MembersAreaModal open={membersModalOpen} onOpenChange={setMembersModalOpen} />
    </div>
  )
}

import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { MembersAreaModal } from '@/components/MembersAreaModal'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  FileText,
  Sparkles,
  Heart,
  Coffee,
  Mic,
  ArrowLeft,
  Upload,
  Check,
  Send,
  AlertCircle,
  Building,
  User,
  Users,
  ShieldCheck,
  LockOpen,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'

export default function RoteiroScreen() {
  const [membersModalOpen, setMembersModalOpen] = useState(false)

  // Estados do formulário
  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [estadoCivil, setEstadoCivil] = useState('')

  // Cônjuge
  const [temConjuge, setTemConjuge] = useState<'sim' | 'nao' | null>(null)
  const [nomeConjuge, setNomeConjuge] = useState('')

  // Filhos
  const [temFilhos, setTemFilhos] = useState<'sim' | 'nao' | null>(null)
  const [quantidadeFilhos, setQuantidadeFilhos] = useState('')
  const [nomesFilhos, setNomesFilhos] = useState('')

  // Empresa
  const [temEmpresa, setTemEmpresa] = useState<'sim' | 'nao' | null>(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [sobreEmpresa, setSobreEmpresa] = useState('')

  // Temas
  const [temaEnfatizar, setTemaEnfatizar] = useState('')
  const [temTemaSensivel, setTemTemaSensivel] = useState<'sim' | 'nao' | null>(null)
  const [temaSensivelDetalhes, setTemaSensivelDetalhes] = useState('')

  // Biografia
  const [biografia, setBiografia] = useState('')

  // Uploads
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const fotoInputRef = useRef<HTMLInputElement>(null)

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Autorização de imagem
  const [autorizacaoImagem, setAutorizacaoImagem] = useState(false)

  // Estados de envio
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido para sua foto.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('O tamanho da foto não pode exceder 10MB.')
      return
    }

    setFotoFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setFotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido para a logomarca.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('O tamanho da logomarca não pode exceder 10MB.')
      return
    }

    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Validações obrigatórias
    if (!nome.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.')
      toast.error('Informe seu nome completo.')
      return
    }

    if (!dataNascimento.trim()) {
      setErrorMessage('Por favor, informe sua data de nascimento.')
      toast.error('Informe sua data de nascimento.')
      return
    }

    if (!estadoCivil.trim()) {
      setErrorMessage('Por favor, selecione seu estado civil.')
      toast.error('Selecione seu estado civil.')
      return
    }

    if (temConjuge === 'sim' && !nomeConjuge.trim()) {
      setErrorMessage('Por favor, informe o nome do cônjuge.')
      toast.error('Informe o nome do cônjuge.')
      return
    }

    if (temFilhos === 'sim' && (!quantidadeFilhos.trim() || !nomesFilhos.trim())) {
      setErrorMessage('Por favor, informe a quantidade e os nomes dos seus filhos.')
      toast.error('Preencha os dados dos filhos.')
      return
    }

    if (temEmpresa === 'sim' && !nomeEmpresa.trim()) {
      setErrorMessage('Por favor, informe o nome da sua empresa.')
      toast.error('Informe o nome da empresa.')
      return
    }

    if (temTemaSensivel === 'sim' && !temaSensivelDetalhes.trim()) {
      setErrorMessage('Por favor, detalhe quais temas prefere que evitemos durante a entrevista.')
      toast.error('Informe os temas a serem evitados.')
      return
    }

    if (!fotoFile) {
      setErrorMessage('Por favor, envie uma foto sua para a divulgação do episódio.')
      toast.error('O upload de uma foto sua é obrigatório.')
      return
    }

    if (!autorizacaoImagem) {
      setErrorMessage(
        'Por favor, confirme a autorização de uso de imagem para podermos divulgar seu episódio.',
      )
      toast.error('Autorização de imagem obrigatória.')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('nome', nome.trim())
      formData.append('data_nascimento', dataNascimento.trim())
      formData.append('estado_civil', estadoCivil.trim())
      formData.append('tem_conjuge', String(temConjuge === 'sim'))
      if (temConjuge === 'sim' && nomeConjuge.trim()) {
        formData.append('nome_conjuge', nomeConjuge.trim())
      }
      formData.append('tem_filhos', String(temFilhos === 'sim'))
      if (temFilhos === 'sim') {
        formData.append('quantidade_filhos', quantidadeFilhos.trim())
        formData.append('nomes_filhos', nomesFilhos.trim())
      }
      formData.append('tem_empresa', String(temEmpresa === 'sim'))
      if (temEmpresa === 'sim') {
        formData.append('nome_empresa', nomeEmpresa.trim())
        if (sobreEmpresa.trim()) {
          formData.append('sobre_empresa', sobreEmpresa.trim())
        }
      }
      if (temaEnfatizar.trim()) {
        formData.append('tema_enfatizar', temaEnfatizar.trim())
      }
      formData.append('tem_tema_sensivel', String(temTemaSensivel === 'sim'))
      if (temTemaSensivel === 'sim' && temaSensivelDetalhes.trim()) {
        formData.append('tema_sensivel_detalhes', temaSensivelDetalhes.trim())
      }
      if (biografia.trim()) {
        formData.append('biografia', biografia.trim())
      }
      formData.append('foto', fotoFile)
      if (logoFile) {
        formData.append('logomarca', logoFile)
      }
      formData.append('autorizacao_imagem', 'true')
      formData.append('status', 'pendente')
      formData.append('visualizado', 'false')

      await pb.collection('roteiros_convidados').create(formData)

      toast.success(
        'Roteiro enviado com sucesso! Nossa produção já está preparando tudo com muito amor para seu grande dia.',
      )
      setSubmitted(true)
    } catch (err: unknown) {
      console.error('Erro ao enviar roteiro:', err)
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Ocorreu um erro ao enviar suas respostas. Verifique os campos e tente novamente.'
      setErrorMessage(msg)
      toast.error('Não foi possível enviar o formulário. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setNome('')
    setDataNascimento('')
    setEstadoCivil('')
    setTemConjuge(null)
    setNomeConjuge('')
    setTemFilhos(null)
    setQuantidadeFilhos('')
    setNomesFilhos('')
    setTemEmpresa(null)
    setNomeEmpresa('')
    setSobreEmpresa('')
    setTemaEnfatizar('')
    setTemTemaSensivel(null)
    setTemaSensivelDetalhes('')
    setBiografia('')
    setFotoFile(null)
    setFotoPreview(null)
    setLogoFile(null)
    setLogoPreview(null)
    setAutorizacaoImagem(false)
    setSubmitted(false)
    setErrorMessage(null)
  }

  return (
    <div className="min-h-screen bg-marfim text-vinho flex flex-col font-sans selection:bg-dourado/30">
      {/* Navbar global */}
      <Navbar onOpenMembersModal={() => setMembersModalOpen(true)} />

      <main className="flex-1 pt-20 sm:pt-24 md:pt-28 pb-16 sm:pb-24">
        {/* Cabeçalho Acolhedor na Identidade Visual Oficial (vinho #4B1E3F, dourado, rosé, marfim) */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-10 sm:py-16 bg-gradient-to-b from-[#36142d] via-vinho to-[#36142d] text-marfim overflow-hidden">
          {/* Efeitos sutis de iluminação dourada e rosé */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-dourado/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-brand/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto relative z-10 space-y-6">
            {/* Botões de retorno */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/convidado"
                className="inline-flex items-center gap-2 text-xs font-semibold text-dourado hover:text-white transition-colors bg-vinho/80 hover:bg-vinho px-3.5 py-1.5 rounded-full border border-dourado/50 backdrop-blur-xs shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-dourado" />
                Voltar à Área do Convidado
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-marfim/80 hover:text-dourado transition-colors bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full border border-dourado/30 backdrop-blur-xs shadow-xs"
              >
                Início do Site
              </Link>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-dourado/20 border border-dourado/40 text-dourado text-xs sm:text-sm font-semibold tracking-wide shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-dourado shrink-0" />
                <span>Espaço de Preparação do Convidado</span>
                <Heart className="w-3 h-3 text-dourado shrink-0 fill-dourado/40" />
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                Estamos muito felizes em entrevistar você!
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-marfim/90 max-w-2xl mx-auto leading-relaxed font-light">
                A equipe do{' '}
                <strong className="text-dourado-light font-semibold">CoffeeCast 4.0</strong> está
                preparando com todo o carinho a sua participação. Precisamos que você responda a
                essas perguntinhas para deixar tudo perfeito para o grande dia da sua gravação.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <LockOpen className="w-3.5 h-3.5 text-emerald-300" />
                  Sem necessidade de login ou senha
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-dourado-light border border-dourado/30">
                  <Coffee className="w-3.5 h-3.5 text-dourado" />
                  Ambiente acolhedor e seguro
                </span>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2 text-xs sm:text-sm text-dourado font-medium italic">
                <Mic className="w-4 h-4 text-dourado shrink-0" />
                <span>"Mais que conversas, histórias que transformam."</span>
              </div>
            </div>
          </div>
        </section>

        {/* Seção do Formulário / Agradecimento */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20">
          <div className="max-w-4xl mx-auto">
            {submitted ? (
              /* Tela carinhosa de agradecimento */
              <div className="bg-white border-2 border-dourado/70 rounded-3xl p-6 sm:p-12 shadow-xl text-center space-y-6 max-w-2xl mx-auto animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-dourado/15 rounded-full blur-2xl pointer-events-none" />

                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-tr from-dourado/20 via-dourado/30 to-dourado/10 text-vinho rounded-full flex items-center justify-center mx-auto border-2 border-dourado shadow-md">
                  <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-dourado fill-dourado/30" />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] uppercase font-bold tracking-widest text-dourado-dark bg-dourado/15 px-3 py-1 rounded-full border border-dourado/30 inline-block">
                    Respostas Recebidas com Sucesso
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-vinho">
                    Muito obrigada, {nome.split(' ')[0]}!
                  </h3>
                </div>

                <div className="bg-marfim/80 border border-vinho/15 p-5 sm:p-6 rounded-2xl text-left space-y-3 shadow-xs">
                  <p className="text-sm sm:text-base text-vinho/90 leading-relaxed font-light italic">
                    "Toda a equipe do CoffeeCast 4.0 agradece imensamente por sua dedicação em
                    compartilhar seus detalhes, histórias e momentos conosco. Nosso time já está
                    reunindo as informações e estruturando um episódio memorável, feito sob medida
                    para homenagear e dar voz à sua trajetória."
                  </p>
                  <div className="pt-2 border-t border-vinho/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-serif font-bold text-xs sm:text-sm text-vinho">
                        Nos vemos em breve à mesa de café!
                      </p>
                      <p className="text-xs text-dourado-dark font-medium">
                        Equipe CoffeeCast 4.0 & Aline Lana
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-vinho/70 italic">
                      <Coffee className="w-4 h-4 text-dourado shrink-0" />
                      <span>"Mais que conversas, histórias que transformam."</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-vinho/70">
                  Caso deseje revisar algo ou preencher para outra pessoa, sinta-se à vontade.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full sm:w-auto border-2 border-vinho text-vinho hover:bg-vinho hover:text-white rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold transition-all min-h-[44px]"
                  >
                    Preencher Outro Roteiro
                  </Button>
                  <Link to="/convidado" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-vinho hover:bg-vinho-dark text-white rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold shadow-md min-h-[44px]">
                      Voltar ao Portal do Convidado
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              /* Formulário com todos os 13 pontos solicitados */
              <div className="bg-white border-2 border-dourado/60 rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl relative overflow-hidden">
                <div className="text-center max-w-2xl mx-auto space-y-3 mb-8 sm:mb-10">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-dourado/15 border border-dourado/40 text-vinho text-xs font-semibold">
                    <FileText className="w-4 h-4 text-dourado shrink-0" />
                    <span>Perguntas para o Roteiro do Episódio</span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-vinho">
                    Informações para seu Grande Dia
                  </h2>
                  <p className="text-xs sm:text-sm text-vinho/75 leading-relaxed">
                    Responda às questões abaixo no seu próprio ritmo. Elas ajudarão nossa
                    apresentadora a conduzir a conversa com leveza, intimidade e muito respeito à
                    sua essência.
                  </p>
                </div>

                {errorMessage && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                  {/* SEÇÃO 1: DADOS PESSOAIS */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-vinho/10">
                      <User className="w-4 h-4 text-dourado" />
                      <h3 className="font-serif text-base sm:text-lg font-bold text-vinho">
                        1. Dados Pessoais & Família
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Campo 1: Nome completo */}
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label htmlFor="rot-nome" className="text-xs font-bold text-vinho">
                          1. Nome completo *
                        </Label>
                        <Input
                          id="rot-nome"
                          required
                          placeholder="Ex.: Mariana Fernandes de Souza"
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          className="bg-marfim/40 border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5 min-h-[44px]"
                        />
                      </div>

                      {/* Campo 2: Data de nascimento */}
                      <div className="space-y-1.5">
                        <Label htmlFor="rot-data-nasc" className="text-xs font-bold text-vinho">
                          2. Data de nascimento *
                        </Label>
                        <Input
                          id="rot-data-nasc"
                          type="date"
                          required
                          value={dataNascimento}
                          onChange={(e) => setDataNascimento(e.target.value)}
                          className="bg-marfim/40 border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5 min-h-[44px]"
                        />
                      </div>

                      {/* Campo 3: Estado civil */}
                      <div className="sm:col-span-1 space-y-1.5">
                        <Label htmlFor="rot-estado-civil" className="text-xs font-bold text-vinho">
                          3. Estado civil *
                        </Label>
                        <select
                          id="rot-estado-civil"
                          required
                          value={estadoCivil}
                          onChange={(e) => setEstadoCivil(e.target.value)}
                          className="w-full bg-marfim/40 border border-vinho/20 focus:ring-2 focus:ring-dourado text-sm rounded-xl px-3 py-2.5 min-h-[44px] text-vinho"
                        >
                          <option value="">Selecione...</option>
                          <option value="Solteiro(a)">Solteiro(a)</option>
                          <option value="Casado(a)">Casado(a)</option>
                          <option value="União Estável">União Estável</option>
                          <option value="Divorciado(a)">Divorciado(a)</option>
                          <option value="Viúvo(a)">Viúvo(a)</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>

                      {/* Campo 4: Se tem cônjuge */}
                      <div className="sm:col-span-2 space-y-2">
                        <Label className="text-xs font-bold text-vinho block">
                          4. Tem cônjuge ou parceiro(a)?
                        </Label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setTemConjuge('sim')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
                              temConjuge === 'sim'
                                ? 'bg-vinho text-white border-vinho shadow-xs'
                                : 'bg-marfim/40 border-vinho/20 text-vinho hover:bg-marfim'
                            }`}
                          >
                            {temConjuge === 'sim' && <Check className="w-3.5 h-3.5 text-dourado" />}
                            <span>SIM</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTemConjuge('nao')
                              setNomeConjuge('')
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
                              temConjuge === 'nao'
                                ? 'bg-vinho text-white border-vinho shadow-xs'
                                : 'bg-marfim/40 border-vinho/20 text-vinho hover:bg-marfim'
                            }`}
                          >
                            {temConjuge === 'nao' && <Check className="w-3.5 h-3.5 text-dourado" />}
                            <span>NÃO</span>
                          </button>
                        </div>

                        {temConjuge === 'sim' && (
                          <div className="pt-2 animate-fade-in space-y-1.5">
                            <Label
                              htmlFor="rot-nome-conjuge"
                              className="text-xs font-bold text-vinho"
                            >
                              Nome do cônjuge / parceiro(a) *
                            </Label>
                            <Input
                              id="rot-nome-conjuge"
                              placeholder="Ex.: Carlos Eduardo"
                              value={nomeConjuge}
                              onChange={(e) => setNomeConjuge(e.target.value)}
                              className="bg-marfim/40 border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5 min-h-[44px]"
                            />
                          </div>
                        )}
                      </div>

                      {/* Campo 5: Se tem filhos */}
                      <div className="sm:col-span-3 space-y-2 pt-2 border-t border-vinho/5">
                        <Label className="text-xs font-bold text-vinho block">
                          5. Você tem filhos?
                        </Label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setTemFilhos('sim')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
                              temFilhos === 'sim'
                                ? 'bg-vinho text-white border-vinho shadow-xs'
                                : 'bg-marfim/40 border-vinho/20 text-vinho hover:bg-marfim'
                            }`}
                          >
                            {temFilhos === 'sim' && <Check className="w-3.5 h-3.5 text-dourado" />}
                            <span>SIM</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTemFilhos('nao')
                              setQuantidadeFilhos('')
                              setNomesFilhos('')
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
                              temFilhos === 'nao'
                                ? 'bg-vinho text-white border-vinho shadow-xs'
                                : 'bg-marfim/40 border-vinho/20 text-vinho hover:bg-marfim'
                            }`}
                          >
                            {temFilhos === 'nao' && <Check className="w-3.5 h-3.5 text-dourado" />}
                            <span>NÃO</span>
                          </button>
                        </div>

                        {temFilhos === 'sim' && (
                          <div className="pt-3 animate-fade-in grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <Label
                                htmlFor="rot-qtd-filhos"
                                className="text-xs font-bold text-vinho"
                              >
                                Quantos filhos? *
                              </Label>
                              <Input
                                id="rot-qtd-filhos"
                                placeholder="Ex.: 2"
                                value={quantidadeFilhos}
                                onChange={(e) => setQuantidadeFilhos(e.target.value)}
                                className="bg-marfim/40 border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5 min-h-[44px]"
                              />
                            </div>
                            <div className="sm:col-span-2 space-y-1.5">
                              <Label
                                htmlFor="rot-nomes-filhos"
                                className="text-xs font-bold text-vinho"
                              >
                                Escreva os nomes dos filhos *
                              </Label>
                              <Input
                                id="rot-nomes-filhos"
                                placeholder="Ex.: Lucas (7 anos) e Beatriz (3 anos)"
                                value={nomesFilhos}
                                onChange={(e) => setNomesFilhos(e.target.value)}
                                className="bg-marfim/40 border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5 min-h-[44px]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 2: EMPRESA E NEGÓCIO */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-vinho/10">
                      <Building className="w-4 h-4 text-dourado" />
                      <h3 className="font-serif text-base sm:text-lg font-bold text-vinho">
                        2. Empresa & Empreendimento
                      </h3>
                    </div>

                    {/* Campo 6: Se tem empresa */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-vinho block">
                        6. Você tem empresa, negócio próprio ou marca?
                      </Label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setTemEmpresa('sim')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
                            temEmpresa === 'sim'
                              ? 'bg-vinho text-white border-vinho shadow-xs'
                              : 'bg-marfim/40 border-vinho/20 text-vinho hover:bg-marfim'
                          }`}
                        >
                          {temEmpresa === 'sim' && <Check className="w-3.5 h-3.5 text-dourado" />}
                          <span>SIM</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTemEmpresa('nao')
                            setNomeEmpresa('')
                            setSobreEmpresa('')
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
                            temEmpresa === 'nao'
                              ? 'bg-vinho text-white border-vinho shadow-xs'
                              : 'bg-marfim/40 border-vinho/20 text-vinho hover:bg-marfim'
                          }`}
                        >
                          {temEmpresa === 'nao' && <Check className="w-3.5 h-3.5 text-dourado" />}
                          <span>NÃO</span>
                        </button>
                      </div>

                      {temEmpresa === 'sim' && (
                        <div className="pt-3 animate-fade-in space-y-3">
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="rot-nome-empresa"
                              className="text-xs font-bold text-vinho"
                            >
                              Nome da empresa ou marca *
                            </Label>
                            <Input
                              id="rot-nome-empresa"
                              placeholder="Ex.: Studio Beleza & Bem-Estar"
                              value={nomeEmpresa}
                              onChange={(e) => setNomeEmpresa(e.target.value)}
                              className="bg-marfim/40 border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5 min-h-[44px]"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label
                              htmlFor="rot-sobre-empresa"
                              className="text-xs font-bold text-vinho"
                            >
                              Conte um pouco sobre a sua empresa e o que ela faz
                            </Label>
                            <Textarea
                              id="rot-sobre-empresa"
                              rows={3}
                              placeholder="Fale sobre o propósito da sua empresa, mercado de atuação, diferenciais e serviços oferecidos..."
                              value={sobreEmpresa}
                              onChange={(e) => setSobreEmpresa(e.target.value)}
                              className="bg-marfim/40 border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl p-3 resize-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SEÇÃO 3: TEMAS E BIOGRAFIA */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-vinho/10">
                      <Mic className="w-4 h-4 text-dourado" />
                      <h3 className="font-serif text-base sm:text-lg font-bold text-vinho">
                        3. Temas da Entrevista & Biografia
                      </h3>
                    </div>

                    {/* Campo 7: Qual tema mais quer enfatizar */}
                    <div className="space-y-1.5">
                      <Label htmlFor="rot-tema-enfatizar" className="text-xs font-bold text-vinho">
                        7. Qual tema você mais quer enfatizar no episódio?
                      </Label>
                      <Textarea
                        id="rot-tema-enfatizar"
                        rows={3}
                        placeholder="Ex.: Minha virada de carreira após os 30 anos, como equilibro maternidade e negócios, o lançamento do meu novo método..."
                        value={temaEnfatizar}
                        onChange={(e) => setTemaEnfatizar(e.target.value)}
                        className="bg-marfim/40 border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl p-3 resize-none"
                      />
                    </div>

                    {/* Campo 8: Tema sensível que prefere evitar */}
                    <div className="space-y-2 pt-2">
                      <Label className="text-xs font-bold text-vinho block">
                        8. Existe algum tema sensível que prefere evitar?
                      </Label>
                      <p className="text-xs text-vinho/70">
                        O CoffeeCast 4.0 preza pelo seu total conforto e acolhimento. Se houver
                        algum assunto delicado (ex-sócios, relacionamentos passados, perdas
                        familiares, etc.), avise-nos para que nossa apresentadora não toque nele.
                      </p>

                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setTemTemaSensivel('sim')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
                            temTemaSensivel === 'sim'
                              ? 'bg-vinho text-white border-vinho shadow-xs'
                              : 'bg-marfim/40 border-vinho/20 text-vinho hover:bg-marfim'
                          }`}
                        >
                          {temTemaSensivel === 'sim' && (
                            <Check className="w-3.5 h-3.5 text-dourado" />
                          )}
                          <span>SIM, tenho tema a evitar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTemTemaSensivel('nao')
                            setTemaSensivelDetalhes('')
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
                            temTemaSensivel === 'nao'
                              ? 'bg-vinho text-white border-vinho shadow-xs'
                              : 'bg-marfim/40 border-vinho/20 text-vinho hover:bg-marfim'
                          }`}
                        >
                          {temTemaSensivel === 'nao' && (
                            <Check className="w-3.5 h-3.5 text-dourado" />
                          )}
                          <span>NÃO, assunto 100% livre</span>
                        </button>
                      </div>

                      {temTemaSensivel === 'sim' && (
                        <div className="pt-2 animate-fade-in space-y-1.5">
                          <Label
                            htmlFor="rot-tema-sensivel-detalhes"
                            className="text-xs font-bold text-vinho"
                          >
                            Detalhe qual(is) tema(s) devemos evitar *
                          </Label>
                          <Textarea
                            id="rot-tema-sensivel-detalhes"
                            rows={3}
                            placeholder="Escreva com toda franqueza. Este campo é sigiloso e de uso exclusivo da produção para proteger sua privacidade."
                            value={temaSensivelDetalhes}
                            onChange={(e) => setTemaSensivelDetalhes(e.target.value)}
                            className="bg-marfim/40 border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl p-3 resize-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Campo 9: Espaço para escrever uma biografia */}
                    <div className="space-y-1.5 pt-2">
                      <Label htmlFor="rot-biografia" className="text-xs font-bold text-vinho">
                        9. Espaço para escrever sua biografia (resumo da sua trajetória)
                      </Label>
                      <Textarea
                        id="rot-biografia"
                        rows={5}
                        placeholder="Conte um pouco sobre sua formação, sua história de vida, principais conquistas, o que lhe move no dia a dia e como chegou até aqui..."
                        value={biografia}
                        onChange={(e) => setBiografia(e.target.value)}
                        className="bg-marfim/40 border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl p-3 resize-none"
                      />
                    </div>
                  </div>

                  {/* SEÇÃO 4: FOTOS E ARQUIVOS */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-vinho/10">
                      <Upload className="w-4 h-4 text-dourado" />
                      <h3 className="font-serif text-base sm:text-lg font-bold text-vinho">
                        4. Fotos & Identidade Visual
                      </h3>
                    </div>

                    {/* Campo 10: Upload de UMA FOTO DELA (mesma pessoa) */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-vinho block">
                        10. Upload de uma foto sua (obrigatório) *
                        <span className="font-normal text-vinho/70 block mt-0.5">
                          Essa foto será usada na arte oficial de divulgação do episódio nas redes
                          sociais do CoffeeCast 4.0 e YouTube.
                        </span>
                      </Label>

                      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-dourado/60 bg-marfim/50 hover:bg-marfim transition-colors">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-dourado bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                          {fotoPreview ? (
                            <img
                              src={fotoPreview}
                              alt="Prévia da foto do convidado"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Upload className="w-8 h-8 text-dourado-dark/60" />
                          )}
                        </div>

                        <div className="flex-1 text-center sm:text-left space-y-2">
                          <p className="text-xs font-medium text-vinho">
                            {fotoFile ? (
                              <span className="font-bold text-emerald-700 flex items-center justify-center sm:justify-start gap-1">
                                <Check className="w-4 h-4" /> Foto selecionada: {fotoFile.name}
                              </span>
                            ) : (
                              'Envie uma foto nítida em alta resolução, de rosto ou meio corpo, preferencialmente bem iluminada.'
                            )}
                          </p>
                          <p className="text-[11px] text-vinho/60">
                            Formatos: JPG, PNG, WEBP. Máximo de 10MB.
                          </p>

                          <div>
                            <input
                              ref={fotoInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleFotoChange}
                              className="hidden"
                              id="foto-roteiro-upload"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fotoInputRef.current?.click()}
                              className="border-vinho/30 text-vinho hover:bg-vinho/10 text-xs rounded-full px-4 py-1.5 h-auto min-h-[36px]"
                            >
                              <Upload className="w-3.5 h-3.5 mr-1.5 text-dourado" />
                              {fotoFile ? 'Trocar foto' : 'Selecionar arquivo de foto'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Campo 11: Upload da LOGOMARCA da empresa (opcional) */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-vinho block">
                          11. Upload da logomarca da sua empresa (opcional)
                        </Label>
                        <span className="text-[11px] text-vinho/60 italic">caso tenha</span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-dashed border-vinho/20 bg-marfim/30 hover:bg-marfim transition-colors">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-vinho/20 bg-white flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-2xs">
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Prévia da logomarca"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Building className="w-6 h-6 text-vinho/40" />
                          )}
                        </div>

                        <div className="flex-1 text-center sm:text-left space-y-2">
                          <p className="text-xs font-medium text-vinho">
                            {logoFile ? (
                              <span className="font-bold text-emerald-700 flex items-center justify-center sm:justify-start gap-1">
                                <Check className="w-4 h-4" /> Logo selecionada: {logoFile.name}
                              </span>
                            ) : (
                              'Envie o logotipo com fundo transparente (PNG ou SVG) ou em alta definição.'
                            )}
                          </p>

                          <div>
                            <input
                              ref={logoInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleLogoChange}
                              className="hidden"
                              id="logo-roteiro-upload"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => logoInputRef.current?.click()}
                              className="border-vinho/30 text-vinho hover:bg-vinho/10 text-xs rounded-full px-4 py-1.5 h-auto min-h-[36px]"
                            >
                              <Upload className="w-3.5 h-3.5 mr-1.5 text-dourado" />
                              {logoFile ? 'Trocar logomarca' : 'Selecionar arquivo da logo'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 5: AUTORIZAÇÃO E ENVIO */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 pb-2 border-b border-vinho/10">
                      <ShieldCheck className="w-4 h-4 text-dourado" />
                      <h3 className="font-serif text-base sm:text-lg font-bold text-vinho">
                        5. Autorização de Direito de Imagem & Envio
                      </h3>
                    </div>

                    {/* Campo 12: Autorização de direito de imagem */}
                    <div
                      onClick={() => setAutorizacaoImagem(!autorizacaoImagem)}
                      className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                        autorizacaoImagem
                          ? 'border-dourado bg-dourado/15 shadow-sm ring-1 ring-dourado'
                          : 'border-vinho/20 bg-marfim/30 hover:border-vinho/40'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          autorizacaoImagem
                            ? 'border-dourado-dark bg-dourado text-vinho font-bold'
                            : 'border-vinho/30 bg-white'
                        }`}
                      >
                        {autorizacaoImagem && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                      <div className="space-y-1 leading-snug">
                        <Label className="text-xs sm:text-sm font-bold text-vinho cursor-pointer block">
                          12. Autorização de Direito de Imagem e Voz *
                        </Label>
                        <p className="text-xs text-vinho/80 leading-relaxed">
                          Estou ciente e autorizo expressamente o uso da minha imagem, voz, fotos e
                          nome nos canais oficiais do{' '}
                          <strong className="font-semibold text-vinho">CoffeeCast 4.0</strong>{' '}
                          (YouTube, Instagram, TikTok, LinkedIn, site oficial e plataformas de
                          streaming de podcast) para divulgação do episódio, cortes e materiais
                          promocionais do podcast.
                        </p>
                      </div>
                    </div>

                    {/* Campo 13: Botão ENVIAR */}
                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-vinho hover:bg-vinho-light text-white font-bold py-4 min-h-[54px] text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 border border-dourado/40 active:scale-[0.99] cursor-pointer"
                      >
                        {loading ? (
                          <span>Enviando respostas para a equipe...</span>
                        ) : (
                          <>
                            <Send className="w-5 h-5 text-dourado shrink-0" />
                            <span>13. Enviar Meu Roteiro do Episódio</span>
                            <Sparkles className="w-5 h-5 text-dourado shrink-0" />
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-xs text-vinho/70 text-center pt-1">
                      <Heart className="w-3.5 h-3.5 text-dourado-dark shrink-0 fill-dourado/30" />
                      <span>
                        Sua história é única e transformadora. "Mais que conversas, histórias que
                        transformam."
                      </span>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Rodapé oficial do site */}
      <Footer />

      {/* Modal de Membros */}
      <MembersAreaModal open={membersModalOpen} onOpenChange={setMembersModalOpen} />
    </div>
  )
}

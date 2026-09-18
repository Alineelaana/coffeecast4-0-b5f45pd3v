import React, { useState, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import { parseInstagramHandle } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  MessageSquareQuote,
  Sparkles,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  Heart,
  Coffee,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

export const GuestTestimonialForm: React.FC = () => {
  const [nome, setNome] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [instagram, setInstagram] = useState('')
  const [texto, setTexto] = useState('')
  const [tipoConvidado, setTipoConvidado] = useState<'convidado' | 'convidada'>('convidado')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [autorizaPublicacao, setAutorizaPublicacao] = useState<'sim' | 'nao' | null>(null)

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido (JPEG, PNG, etc).')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Validações explícitas
    if (!tipoConvidado) {
      setErrorMessage('Por favor, selecione se você é Convidado ou Convidada.')
      toast.error('Selecione Convidado ou Convidada.')
      return
    }

    if (!nome.trim()) {
      setErrorMessage(
        tipoConvidado === 'convidado'
          ? 'Por favor, informe seu nome de convidado.'
          : 'Por favor, informe seu nome de convidada.',
      )
      toast.error(
        tipoConvidado === 'convidado'
          ? 'Informe seu nome de convidado.'
          : 'Informe seu nome de convidada.',
      )
      return
    }

    if (!instagram.trim()) {
      setErrorMessage('Por favor, informe seu @ do Instagram.')
      toast.error('Informe seu @ do Instagram.')
      return
    }

    if (!texto.trim()) {
      setErrorMessage('Por favor, escreva seu depoimento contando como foi a experiência.')
      toast.error('Preencha seu depoimento.')
      return
    }

    if (!fotoFile) {
      setErrorMessage('Por favor, adicione uma foto sua para acompanhar o depoimento no site.')
      toast.error('Faça o upload de uma foto.')
      return
    }

    if (!autorizaPublicacao) {
      setErrorMessage(
        'Por favor, informe se autoriza a publicação do depoimento no site (SIM ou NÃO).',
      )
      toast.error('Selecione se autoriza a publicação no site.')
      return
    }

    setLoading(true)

    try {
      const parsedInsta = parseInstagramHandle(instagram)
      const cleanInsta = parsedInsta ? parsedInsta.username : instagram.trim()

      const formData = new FormData()
      formData.append('nome', nome.trim())
      if (empresa.trim()) {
        formData.append('empresa', empresa.trim())
      }
      formData.append('tipo_convidado', tipoConvidado)
      formData.append('instagram', cleanInsta)
      formData.append('texto', texto.trim())
      formData.append('foto', fotoFile)
      formData.append('autoriza_publicacao', String(autorizaPublicacao === 'sim'))
      formData.append('status', 'pendente')
      formData.append('visualizado', 'false')

      await pb.collection('depoimentos_convidados').create(formData)

      toast.success(
        tipoConvidado === 'convidado'
          ? 'Depoimento enviado com sucesso! Muito obrigado por compartilhar sua história no CoffeeCast 4.0.'
          : 'Depoimento enviado com carinho! Muito obrigada por compartilhar sua história no CoffeeCast 4.0.',
      )
      setSubmitted(true)
    } catch (err: unknown) {
      console.error('Erro ao enviar depoimento:', err)
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Ocorreu um erro ao enviar seu depoimento. Por favor, verifique os dados e tente novamente.'
      setErrorMessage(msg)
      toast.error('Não foi possível enviar seu depoimento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setNome('')
    setEmpresa('')
    setInstagram('')
    setTexto('')
    setTipoConvidado('convidado')
    setFotoFile(null)
    setFotoPreview(null)
    setAutorizaPublicacao(null)
    setSubmitted(false)
    setErrorMessage(null)
  }

  return (
    <section
      id="deixe-seu-depoimento"
      className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-marfim border-t-2 border-b-2 border-dourado/30 relative overflow-hidden"
    >
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-dourado/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-brand/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {submitted ? (
          /* Mensagem calorosa de agradecimento substituindo o formulário */
          <div className="bg-white border-2 border-dourado/70 rounded-3xl p-6 sm:p-12 shadow-xl text-center space-y-6 max-w-2xl mx-auto animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-dourado/15 rounded-full blur-2xl pointer-events-none" />

            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-tr from-dourado/20 via-dourado/30 to-dourado/10 text-vinho rounded-full flex items-center justify-center mx-auto border-2 border-dourado shadow-md">
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-dourado fill-dourado/30" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] uppercase font-bold tracking-widest text-dourado-dark bg-dourado/15 px-3 py-1 rounded-full border border-dourado/30 inline-block">
                Gratidão Imensa
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-vinho">
                Obrigada por Fazer Parte Dessa História!
              </h3>
            </div>

            <div className="bg-marfim/80 border border-vinho/15 p-5 sm:p-6 rounded-2xl text-left space-y-3 shadow-xs">
              <p className="text-sm sm:text-base text-vinho/90 leading-relaxed font-light italic">
                "Receber suas palavras aquece o nosso coração. Cada episódio gravado no CoffeeCast
                4.0 nasce do desejo genuíno de criar encontros acolhedores e dar voz a trajetórias
                que inspiram. Saber como foi a sua experiência é o maior presente para toda a nossa
                equipe!"
              </p>
              <div className="pt-2 border-t border-vinho/10 flex items-center justify-between">
                <div>
                  <p className="font-serif font-bold text-xs sm:text-sm text-vinho">
                    Com todo carinho e gratidão,
                  </p>
                  <p className="text-xs text-dourado-dark font-medium">Equipe CoffeeCast 4.0</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-vinho/60 italic">
                  <Coffee className="w-4 h-4 text-dourado" />
                  <span>"Mais que conversas, histórias que transformam."</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-vinho/70">
              Seu relato passará pelo nosso time e, com a sua autorização, brilhará com orgulho na
              nossa galeria de depoimentos do site!
            </p>

            <div className="pt-2">
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-2 border-vinho text-vinho hover:bg-vinho hover:text-white rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold transition-all min-h-[44px]"
              >
                Enviar Outro Depoimento
              </Button>
            </div>
          </div>
        ) : (
          /* Formulário elegante de envio de depoimento do convidado */
          <div className="bg-white border-2 border-dourado/60 rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl relative overflow-hidden">
            {/* Cabeçalho do formulário */}
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-dourado/15 border border-dourado/40 text-vinho text-xs font-semibold">
                <MessageSquareQuote className="w-4 h-4 text-dourado shrink-0" />
                <span>Espaço do Convidado</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-vinho">
                Deixe seu depoimento sobre a gravação
              </h2>
              <p className="text-xs sm:text-sm text-vinho/75 leading-relaxed">
                Você que já gravou um episódio no CoffeeCast 4.0: conte-nos como foi a sua
                experiência à mesa com a gente! Suas palavras inspiram novos convidados e aquecem
                nossa jornada.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {/* Escolha obrigatória e elegante do gênero: Convidado ou Convidada */}
              <div className="space-y-2 p-3.5 sm:p-4 rounded-2xl bg-marfim/60 border-2 border-dourado/40">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-vinho flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-dourado" />
                    Como devemos apresentar você? *
                  </Label>
                  <span className="text-[11px] font-semibold text-dourado-dark uppercase tracking-wider">
                    {tipoConvidado === 'convidado' ? 'Convidado' : 'Convidada'}
                  </span>
                </div>
                <p className="text-[11px] text-vinho/70 leading-snug">
                  Selecione abaixo para garantir o tratamento correto (Convidado ou Convidada) no
                  seu card público e no painel do podcast.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setTipoConvidado('convidado')}
                    className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border-2 transition-all cursor-pointer min-h-[46px] ${
                      tipoConvidado === 'convidado'
                        ? 'border-dourado bg-white shadow-md ring-2 ring-dourado/40 text-vinho font-bold'
                        : 'border-vinho/20 bg-white/70 hover:bg-white text-vinho/75 hover:border-vinho/40'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        tipoConvidado === 'convidado'
                          ? 'border-dourado-dark bg-dourado text-vinho'
                          : 'border-vinho/40 bg-white'
                      }`}
                    >
                      {tipoConvidado === 'convidado' && (
                        <div className="w-2 h-2 rounded-full bg-vinho" />
                      )}
                    </div>
                    <span className="text-xs sm:text-sm">Sou Convidado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoConvidado('convidada')}
                    className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border-2 transition-all cursor-pointer min-h-[46px] ${
                      tipoConvidado === 'convidada'
                        ? 'border-dourado bg-white shadow-md ring-2 ring-dourado/40 text-vinho font-bold'
                        : 'border-vinho/20 bg-white/70 hover:bg-white text-vinho/75 hover:border-vinho/40'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        tipoConvidado === 'convidada'
                          ? 'border-dourado-dark bg-dourado text-vinho'
                          : 'border-vinho/40 bg-white'
                      }`}
                    >
                      {tipoConvidado === 'convidada' && (
                        <div className="w-2 h-2 rounded-full bg-vinho" />
                      )}
                    </div>
                    <span className="text-xs sm:text-sm">Sou Convidada</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Nome do Convidado / Convidada (Obrigatório) */}
                <div className="space-y-1.5">
                  <Label htmlFor="dep-guest-nome" className="text-xs font-bold text-vinho">
                    {tipoConvidado === 'convidado' ? 'Nome do Convidado *' : 'Nome da Convidada *'}
                  </Label>
                  <Input
                    id="dep-guest-nome"
                    required
                    placeholder={
                      tipoConvidado === 'convidado'
                        ? 'Ex.: Mateus Capelli'
                        : 'Ex.: Mariana Fernandes'
                    }
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="bg-marfim/40 border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5 min-h-[44px]"
                  />
                </div>

                {/* Nome da Empresa ou Marca (Opcional) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dep-guest-empresa" className="text-xs font-bold text-vinho">
                      Empresa ou Marca
                    </Label>
                    <span className="text-[11px] text-vinho/60 italic">se tiver</span>
                  </div>
                  <Input
                    id="dep-guest-empresa"
                    placeholder="Ex.: Café & Aroma Studio (opcional)"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    className="bg-marfim/40 border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5 min-h-[44px]"
                  />
                </div>

                {/* @ do Instagram (Obrigatório) */}
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="dep-guest-instagram" className="text-xs font-bold text-vinho">
                    @ do Instagram *
                  </Label>
                  <Input
                    id="dep-guest-instagram"
                    required
                    placeholder="Ex.: @mariana.fernandes"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="bg-marfim/40 border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5 min-h-[44px]"
                  />
                  <p className="text-[11px] text-vinho/60">
                    Aparecerá com link direto para o seu perfil junto ao seu relato.
                  </p>
                </div>

                {/* Texto do Depoimento (Obrigatório) */}
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="dep-guest-texto" className="text-xs font-bold text-vinho">
                    Seu Depoimento sobre a Experiência *
                  </Label>
                  <Textarea
                    id="dep-guest-texto"
                    required
                    rows={4}
                    placeholder="Conte como você se sentiu durante a gravação, o acolhimento da equipe, o clima do bate-papo e o impacto de compartilhar sua história no CoffeeCast 4.0..."
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    className="bg-marfim/40 border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl p-3 resize-none"
                  />
                </div>

                {/* Upload de Foto (Obrigatório) */}
                <div className="sm:col-span-2 space-y-2">
                  <Label className="text-xs font-bold text-vinho block">
                    Sua Foto *{' '}
                    <span className="font-normal text-vinho/60">
                      (aparecerá junto ao seu depoimento no site)
                    </span>
                  </Label>

                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-dourado/60 bg-marfim/50 hover:bg-marfim transition-colors">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dourado bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                      {fotoPreview ? (
                        <img
                          src={fotoPreview}
                          alt="Prévia da foto"
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
                          'Escolha uma foto sua bonita e com boa iluminação (rosto ou retrato).'
                        )}
                      </p>
                      <p className="text-[11px] text-vinho/60">
                        Formatos aceitos: JPG, PNG, WEBP. Máximo: 10MB.
                      </p>

                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFotoChange}
                          className="hidden"
                          id="foto-convidado-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="border-vinho/30 text-vinho hover:bg-vinho/10 text-xs rounded-full px-4 py-1.5 h-auto min-h-[36px]"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1.5 text-dourado" />
                          {fotoFile ? 'Trocar foto' : 'Selecionar arquivo de foto'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Caixinha de Autorização: SIM ou NÃO (Obrigatória marcar uma) */}
                <div className="sm:col-span-2 space-y-2 pt-2">
                  <Label className="text-xs font-bold text-vinho block">
                    Autorização de Publicação no Site *
                  </Label>
                  <p className="text-xs text-vinho/70">
                    Você autoriza a equipe do CoffeeCast 4.0 a publicar o seu depoimento, nome, @ e
                    foto na seção pública de depoimentos do nosso site?
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setAutorizaPublicacao('sim')}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left cursor-pointer min-h-[50px] ${
                        autorizaPublicacao === 'sim'
                          ? 'border-dourado bg-dourado/15 shadow-sm ring-1 ring-dourado'
                          : 'border-vinho/15 bg-white hover:border-vinho/30'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          autorizaPublicacao === 'sim'
                            ? 'border-dourado-dark bg-dourado text-vinho'
                            : 'border-vinho/30 bg-white'
                        }`}
                      >
                        {autorizaPublicacao === 'sim' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="leading-tight">
                        <span className="text-xs font-bold text-vinho block">
                          SIM, autorizo a publicação
                        </span>
                        <span className="text-[10px] text-vinho/65">
                          Pode exibir meu depoimento e foto no site oficial
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAutorizaPublicacao('nao')}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left cursor-pointer min-h-[50px] ${
                        autorizaPublicacao === 'nao'
                          ? 'border-vinho bg-vinho/10 shadow-sm ring-1 ring-vinho'
                          : 'border-vinho/15 bg-white hover:border-vinho/30'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          autorizaPublicacao === 'nao'
                            ? 'border-vinho bg-vinho text-white'
                            : 'border-vinho/30 bg-white'
                        }`}
                      >
                        {autorizaPublicacao === 'nao' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="leading-tight">
                        <span className="text-xs font-bold text-vinho block">
                          NÃO autorizo a publicação
                        </span>
                        <span className="text-[10px] text-vinho/65">
                          Apenas para feedback interno da equipe do podcast
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Botão de Envio */}
              <div className="pt-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-vinho hover:bg-vinho-light text-white font-bold py-3.5 min-h-[50px] text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 border border-dourado/40 active:scale-[0.99]"
                >
                  {loading ? (
                    <span>Enviando seu depoimento...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-dourado shrink-0" />
                      <span>Enviar Meu Depoimento</span>
                      <Sparkles className="w-4 h-4 text-dourado shrink-0" />
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-vinho/60 text-center">
                <Heart className="w-3 h-3 text-dourado-dark shrink-0" />
                <span>
                  Obrigada por somar à nossa mesa de café. "Mais que conversas, histórias que
                  transformam."
                </span>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}

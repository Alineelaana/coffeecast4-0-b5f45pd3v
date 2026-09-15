import React, { useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, Coffee, Sparkles, Send, AlertCircle } from 'lucide-react'

interface ParticipationFormProps {
  titulo?: string
  sucessoMsg?: string
}

export const ParticipationForm: React.FC<ParticipationFormProps> = ({
  titulo = 'Preencha o formulário se você tem interesse em participar do nosso podcast.',
  sucessoMsg = 'Obrigada pelo seu contato! Nossa equipe retornará o mais breve possível, porque aqui o café pode até esfriar, mas o papo nunca! ☕️',
}) => {
  const [formData, setFormData] = useState({
    nome_completo: '',
    idade: '',
    profissao: '',
    instagram: '',
    email: '',
    telefone: '',
    whatsapp: '',
    motivo: '',
    como_nos_conheceu: '',
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, como_nos_conheceu: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    try {
      const parsedAge = parseInt(formData.idade, 10)
      if (isNaN(parsedAge) || parsedAge < 10) {
        throw new Error('Por favor, informe uma idade válida.')
      }

      await pb.collection('contatos').create({
        nome_completo: formData.nome_completo.trim(),
        idade: parsedAge,
        profissao: formData.profissao.trim(),
        instagram: formData.instagram.trim(),
        email: formData.email.trim(),
        telefone: formData.telefone.trim(),
        whatsapp: formData.whatsapp.trim(),
        motivo: formData.motivo.trim(),
        como_nos_conheceu: formData.como_nos_conheceu || 'Instagram',
        status: 'novo',
      })

      setSubmitted(true)
    } catch (err: unknown) {
      console.error('Erro ao enviar contato:', err)
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Ocorreu um erro ao enviar suas informações. Verifique todos os campos e tente novamente.'
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      nome_completo: '',
      idade: '',
      profissao: '',
      instagram: '',
      email: '',
      telefone: '',
      whatsapp: '',
      motivo: '',
      como_nos_conheceu: '',
    })
    setSubmitted(false)
    setErrorMessage(null)
  }

  if (submitted) {
    return (
      <div className="bg-marfim border-2 border-dourado/60 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto shadow-2xl space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-dourado/20 text-dourado-dark rounded-full flex items-center justify-center mx-auto border-2 border-dourado">
          <CheckCircle2 className="w-10 h-10 text-dourado" />
        </div>

        <h3 className="font-serif text-2xl md:text-3xl font-bold text-vinho">
          Proposta Enviada com Sucesso!
        </h3>

        <div className="bg-rose-brand/50 border border-rose-brand p-5 rounded-2xl">
          <p className="text-base text-vinho font-medium leading-relaxed italic">"{sucessoMsg}"</p>
        </div>

        <p className="text-xs text-vinho/70">
          Recebemos seus dados para contato: <strong>{formData.email}</strong>. Aline Lana e a
          equipe do CoffeeCast 4.0 entrarão em contato em breve!
        </p>

        <Button
          onClick={handleReset}
          className="bg-vinho hover:bg-vinho-light text-white font-semibold px-8 py-2.5 rounded-full"
        >
          Enviar Outra Mensagem
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-marfim border-2 border-dourado/40 rounded-3xl p-6 sm:p-10 md:p-12 shadow-2xl max-w-3xl mx-auto relative overflow-hidden">
      {/* Detalhes de iluminação sutil */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-dourado/10 rounded-full blur-2xl pointer-events-none" />

      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-vinho/10 border border-vinho/20 text-vinho text-xs font-semibold mb-3">
          <Coffee className="w-3.5 h-3.5 text-dourado-dark" />
          <span>Participe da Nossa Mesa de Café</span>
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-vinho leading-tight">
          {titulo}
        </h3>
        <p className="text-xs sm:text-sm text-vinho/75 mt-2 max-w-lg mx-auto">
          Queremos conhecer você, suas lutas, conquistas e visão de mundo. Preencha os campos abaixo
          com carinho.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Nome Completo */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="nome_completo" className="text-xs font-semibold text-vinho">
              Nome Completo *
            </Label>
            <Input
              id="nome_completo"
              name="nome_completo"
              required
              placeholder="Ex.: Carolina Mendes"
              value={formData.nome_completo}
              onChange={handleChange}
              className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5"
            />
          </div>

          {/* Idade */}
          <div className="space-y-1.5">
            <Label htmlFor="idade" className="text-xs font-semibold text-vinho">
              Idade *
            </Label>
            <Input
              id="idade"
              name="idade"
              type="number"
              min="10"
              max="110"
              required
              placeholder="Ex.: 32"
              value={formData.idade}
              onChange={handleChange}
              className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5"
            />
          </div>

          {/* Profissão */}
          <div className="space-y-1.5">
            <Label htmlFor="profissao" className="text-xs font-semibold text-vinho">
              Profissão / Atuação *
            </Label>
            <Input
              id="profissao"
              name="profissao"
              required
              placeholder="Ex.: Empreendedora & Psicóloga"
              value={formData.profissao}
              onChange={handleChange}
              className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5"
            />
          </div>

          {/* Instagram */}
          <div className="space-y-1.5">
            <Label htmlFor="instagram" className="text-xs font-semibold text-vinho">
              @ do Instagram *
            </Label>
            <Input
              id="instagram"
              name="instagram"
              required
              placeholder="@seuperfil"
              value={formData.instagram}
              onChange={handleChange}
              className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5"
            />
          </div>

          {/* E-mail */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-vinho">
              E-mail *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="seuemail@exemplo.com"
              value={formData.email}
              onChange={handleChange}
              className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5"
            />
          </div>

          {/* Telefone */}
          <div className="space-y-1.5">
            <Label htmlFor="telefone" className="text-xs font-semibold text-vinho">
              Telefone *
            </Label>
            <Input
              id="telefone"
              name="telefone"
              required
              placeholder="(00) 0000-0000"
              value={formData.telefone}
              onChange={handleChange}
              className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5"
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp" className="text-xs font-semibold text-vinho">
              WhatsApp *
            </Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              required
              placeholder="(00) 90000-0000"
              value={formData.whatsapp}
              onChange={handleChange}
              className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5"
            />
          </div>

          {/* Como nos conheceu */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-semibold text-vinho">Como nos conheceu? *</Label>
            <Select value={formData.como_nos_conheceu} onValueChange={handleSelectChange}>
              <SelectTrigger className="bg-white border-vinho/20 focus:ring-dourado text-sm rounded-xl py-2.5">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent className="bg-white border-vinho/20">
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="YouTube">YouTube</SelectItem>
                <SelectItem value="Indicação de Amigo">Indicação de Amiga / Conhecido</SelectItem>
                <SelectItem value="Spotify / Podcasts">Spotify ou Plataformas de Áudio</SelectItem>
                <SelectItem value="Google / Pesquisa">Google ou Internet</SelectItem>
                <SelectItem value="Outro">Outro meio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pergunta Longa: O que te levou a ter interesse... */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="motivo" className="text-xs font-semibold text-vinho">
              O que te levou a ter interesse em participar do nosso podcast? *
            </Label>
            <Textarea
              id="motivo"
              name="motivo"
              required
              rows={4}
              placeholder="Conte-nos um pouco sobre a sua história, sua mensagem e por que você gostaria de sentar para tomar um café conosco..."
              value={formData.motivo}
              onChange={handleChange}
              className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl p-3 resize-none"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-vinho hover:bg-vinho-light text-white font-bold py-3.5 text-base rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
        >
          {loading ? (
            <span>Enviando sua história...</span>
          ) : (
            <>
              <Send className="w-4 h-4 text-dourado" />
              Enviar Proposta de Participação
              <Sparkles className="w-4 h-4 text-dourado" />
            </>
          )}
        </Button>

        <p className="text-[11px] text-center text-vinho/60 pt-1">
          Ao enviar, você concorda em receber o contato da nossa produção. Seus dados estão
          protegidos.
        </p>
      </form>
    </div>
  )
}

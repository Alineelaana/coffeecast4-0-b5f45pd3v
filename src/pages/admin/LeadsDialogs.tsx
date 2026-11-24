// Subcomponentes do Painel Comercial de Leads — diálogos de detalhe e ações rápidas.
// Contato com lead é SEMPRE manual (wa.me / tel: / mailto:) — nunca envio automático.
import { useState } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, MessageCircle, Phone, Mail, Bot, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  NineComercialService,
  ROTULO_INTERESSE,
  ROTULO_CANAL,
  ROTULO_STATUS_COMERCIAL,
  STATUS_COMERCIAIS,
  montarLinkWhatsappLead,
  montarLinkTel,
} from '@/services/nineComercial'
import type { NineLeadDetalhe, NineLeadResumo } from '@/types/database'

const fmtDataHora = (iso: string) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const remetenteRotulo = (r: string) =>
  r === 'nine' ? 'Nine IA' : r === 'visitante' ? 'Visitante' : 'Equipe'

interface BaseProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onDone: () => void
}

// ---------------------------------------------------------------------------
// Diálogo: Ver Conversa (histórico da Nine) + ações rápidas do lead
// ---------------------------------------------------------------------------
export function DialogVerConversa({
  lead,
  open,
  onOpenChange,
  onDone,
}: BaseProps & { lead: NineLeadResumo | null }) {
  const [carregando, setCarregando] = useState(false)
  const [detalhe, setDetalhe] = useState<NineLeadDetalhe | null>(null)

  const carregar = async () => {
    if (!lead) return
    setCarregando(true)
    try {
      const d = await NineComercialService.detalheLead(lead.id)
      setDetalhe(d)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar conversa'
      toast.error(msg)
    } finally {
      setCarregando(false)
    }
  }

  // Carrega ao abrir
  const handleOpen = (v: boolean) => {
    if (v) {
      setDetalhe(null)
      carregar()
    }
    onOpenChange(v)
  }

  const waLead = montarLinkWhatsappLead(lead?.whatsapp || lead?.telefone || '')
  const telLead = montarLinkTel(lead?.telefone || lead?.whatsapp || '')

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg bg-marfim border-dourado/30">
        <DialogHeader>
          <DialogTitle className="font-serif text-vinho">
            Conversa com {lead?.nome_completo || 'lead'}
          </DialogTitle>
          <DialogDescription className="text-vinho/60">
            Histórico do atendimento da Nine IA no chat do site
          </DialogDescription>
        </DialogHeader>

        {carregando && (
          <div className="flex items-center justify-center gap-2 py-8 text-vinho/70">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando conversa…
          </div>
        )}

        {!carregando && detalhe && (
          <ScrollArea className="max-h-80 pr-3">
            <div className="space-y-3">
              {detalhe.mensagens.length === 0 && (
                <p className="text-sm text-vinho/60">Nenhuma mensagem registrada nesta conversa.</p>
              )}
              {detalhe.mensagens.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'rounded-xl px-3 py-2 text-sm',
                    m.remetente === 'visitante'
                      ? 'bg-vinho/5 text-vinho'
                      : 'bg-[#D4AF37]/10 text-[#7a5b0d]',
                  )}
                >
                  <div className="mb-1 flex items-center justify-between text-[11px] opacity-70">
                    <span className="font-semibold">{remetenteRotulo(m.remetente)}</span>
                    <span>{fmtDataHora(m.created)}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{m.conteudo}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {detalhe && detalhe.tarefas.length > 0 && (
          <div className="rounded-xl border border-dourado/30 bg-white/60 p-3">
            <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-vinho">
              <CheckCircle2 className="h-3.5 w-3.5 text-dourado" /> Tarefas de retorno
            </p>
            <ul className="space-y-1 text-xs text-vinho/80">
              {detalhe.tarefas.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{t.titulo}</span>
                  <span className="shrink-0 font-medium">
                    {t.status === 'concluida'
                      ? 'Concluída'
                      : `Pendente · ${t.prazo || 'sem prazo'}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2">
          {waLead && (
            <Button asChild size="sm" className="bg-vinho hover:bg-vinho-dark">
              <a href={waLead} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-1 h-4 w-4" /> WhatsApp
              </a>
            </Button>
          )}
          {telLead && (
            <Button asChild size="sm" variant="outline" className="border-vinho/30 text-vinho">
              <a href={telLead}>
                <Phone className="mr-1 h-4 w-4" /> Ligar
              </a>
            </Button>
          )}
          {lead?.email && (
            <Button asChild size="sm" variant="outline" className="border-vinho/30 text-vinho">
              <a href={`mailto:${lead.email}`}>
                <Mail className="mr-1 h-4 w-4" /> E-mail
              </a>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-vinho/70"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Diálogo: Resumo IA (Quem é / O que deseja / Informações / Expectativa / Canal / Próxima ação)
// ---------------------------------------------------------------------------
export function DialogResumoIa({
  lead,
  open,
  onOpenChange,
}: BaseProps & { lead: NineLeadResumo | null }) {
  const [carregando, setCarregando] = useState(false)
  const [resumo, setResumo] = useState('')

  const handleOpen = async (v: boolean) => {
    if (v && lead) {
      setCarregando(true)
      setResumo('')
      try {
        const r = await NineComercialService.resumoIaLead(lead.id)
        setResumo(r.resumo_ia)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Falha ao gerar resumo IA'
        toast.error(msg)
      } finally {
        setCarregando(false)
      }
    }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg bg-marfim border-dourado/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-vinho">
            <Bot className="h-5 w-5 text-dourado" /> Resumo IA — {lead?.nome_completo}
          </DialogTitle>
          <DialogDescription className="text-vinho/60">
            Resumo do atendimento gerado pela Nine IA
          </DialogDescription>
        </DialogHeader>
        {carregando ? (
          <div className="flex items-center justify-center gap-2 py-8 text-vinho/70">
            <Loader2 className="h-5 w-5 animate-spin" /> Gerando resumo…
          </div>
        ) : (
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-dourado/30 bg-white/70 p-4 font-sans text-sm text-vinho">
            {resumo || 'Sem resumo disponível para este lead.'}
          </pre>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Diálogo: Registrar Contato
// ---------------------------------------------------------------------------
export function DialogRegistrarContato({
  lead,
  open,
  onOpenChange,
  onDone,
}: BaseProps & { lead: NineLeadResumo | null }) {
  const [salvando, setSalvando] = useState(false)
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [canal, setCanal] = useState('whatsapp')
  const [resultado, setResultado] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const handleOpen = (v: boolean) => {
    if (v) {
      const agora = new Date()
      setData(agora.toISOString().slice(0, 10))
      setHora(agora.toTimeString().slice(0, 5))
      setCanal(
        lead?.canal_preferido && lead.canal_preferido !== 'nao_informado'
          ? lead.canal_preferido
          : 'whatsapp',
      )
      setResultado('')
      setObservacoes('')
    }
    onOpenChange(v)
  }

  const salvar = async () => {
    if (!lead) return
    if (!data || !resultado.trim()) {
      toast.error('Informe a data e o resultado do contato.')
      return
    }
    setSalvando(true)
    try {
      await NineComercialService.acaoLead(lead.id, {
        acao: 'registrar_contato',
        data_hora: `${data} ${hora || '00:00'}:00`,
        canal,
        resultado: resultado.trim(),
        observacoes: observacoes.trim(),
        responsavel: 'Aline Lana',
      })
      toast.success('Contato registrado com sucesso.')
      onOpenChange(false)
      onDone()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar contato'
      toast.error(msg)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-md bg-marfim border-dourado/30">
        <DialogHeader>
          <DialogTitle className="font-serif text-vinho">Registrar Contato</DialogTitle>
          <DialogDescription className="text-vinho/60">
            {lead?.nome_completo} — registre um contato real feito com o lead
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-vinho">Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-vinho">Hora</Label>
              <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-vinho">Canal</Label>
            <select
              className="w-full rounded-md border border-vinho/20 bg-white px-3 py-2 text-sm text-vinho"
              value={canal}
              onChange={(e) => setCanal(e.target.value)}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="ligacao">Ligação</option>
              <option value="email">E-mail</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-vinho">Resultado</Label>
            <Input
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              placeholder="Ex.: Conversou e agendou visita ao estúdio"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-vinho">Observações</Label>
            <Textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Detalhes do atendimento (opcional)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            className="text-vinho/70"
            onClick={() => onOpenChange(false)}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button className="bg-vinho hover:bg-vinho-dark" onClick={salvar} disabled={salvando}>
            {salvando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Salvar registro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Diálogo: Agendar Retorno (cria/atualiza tarefa sem duplicar)
// ---------------------------------------------------------------------------
export function DialogAgendarRetorno({
  lead,
  open,
  onOpenChange,
  onDone,
}: BaseProps & { lead: NineLeadResumo | null }) {
  const [salvando, setSalvando] = useState(false)
  const [prazo, setPrazo] = useState('')
  const [prioridade, setPrioridade] = useState('media')
  const [responsavel, setResponsavel] = useState('Aline Lana')
  const [observacao, setObservacao] = useState('')

  const handleOpen = (v: boolean) => {
    if (v) {
      setPrazo(lead?.data_proximo_retorno ? lead.data_proximo_retorno.slice(0, 10) : '')
      setPrioridade(lead?.prioridade || 'media')
      setResponsavel(lead?.responsavel || 'Aline Lana')
      setObservacao(lead?.proxima_acao || '')
    }
    onOpenChange(v)
  }

  const salvar = async () => {
    if (!lead) return
    if (!prazo) {
      toast.error('Informe a data prevista de retorno.')
      return
    }
    setSalvando(true)
    try {
      await NineComercialService.acaoLead(lead.id, {
        acao: 'agendar_retorno',
        data_proximo_retorno: prazo,
        prioridade,
        responsavel,
        observacao: observacao.trim(),
      })
      toast.success('Retorno agendado — tarefa criada/atualizada sem duplicar.')
      onOpenChange(false)
      onDone()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao agendar retorno'
      toast.error(msg)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-md bg-marfim border-dourado/30">
        <DialogHeader>
          <DialogTitle className="font-serif text-vinho">Agendar Retorno</DialogTitle>
          <DialogDescription className="text-vinho/60">
            {lead?.nome_completo} — cria/atualiza a tarefa "Retornar contato — Lead CoffeeCast 4.0"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-vinho">Data prevista de retorno</Label>
            <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-vinho">Prioridade</Label>
              <select
                className="w-full rounded-md border border-vinho/20 bg-white px-3 py-2 text-sm text-vinho"
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-vinho">Responsável</Label>
              <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-vinho">Próxima ação / observação</Label>
            <Textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex.: Retornar para confirmar horário de gravação"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            className="text-vinho/70"
            onClick={() => onOpenChange(false)}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button className="bg-vinho hover:bg-vinho-dark" onClick={salvar} disabled={salvando}>
            {salvando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Agendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Diálogo: Alterar Status (só por ação real da equipe)
// ---------------------------------------------------------------------------
export function DialogAlterarStatus({
  lead,
  open,
  onOpenChange,
  onDone,
}: BaseProps & { lead: NineLeadResumo | null }) {
  const [salvando, setSalvando] = useState(false)
  const [novoStatus, setNovoStatus] = useState('')
  const [justificativa, setJustificativa] = useState('')

  const handleOpen = (v: boolean) => {
    if (v) {
      setNovoStatus(lead?.status_comercial || 'novo_lead')
      setJustificativa('')
    }
    onOpenChange(v)
  }

  const salvar = async () => {
    if (!lead) return
    if (!novoStatus) {
      toast.error('Escolha o novo status.')
      return
    }
    setSalvando(true)
    try {
      await NineComercialService.acaoLead(lead.id, {
        acao: 'alterar_status',
        status_comercial: novoStatus,
        justificativa: justificativa.trim(),
      })
      toast.success(`Status alterado para "${ROTULO_STATUS_COMERCIAL[novoStatus] || novoStatus}".`)
      onOpenChange(false)
      onDone()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao alterar status'
      toast.error(msg)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-md bg-marfim border-dourado/30">
        <DialogHeader>
          <DialogTitle className="font-serif text-vinho">Alterar Status</DialogTitle>
          <DialogDescription className="text-vinho/60">
            {lead?.nome_completo} — o status só muda por ação real da equipe, nunca por abrir o
            cadastro
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-vinho">Novo status</Label>
            <select
              className="w-full rounded-md border border-vinho/20 bg-white px-3 py-2 text-sm text-vinho"
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value)}
            >
              {STATUS_COMERCIAIS.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.rotulo}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-vinho">Justificativa (registra no histórico)</Label>
            <Textarea
              rows={2}
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Ex.: Cliente Confirmou Participação no episódio 42"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            className="text-vinho/70"
            onClick={() => onOpenChange(false)}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button className="bg-vinho hover:bg-vinho-dark" onClick={salvar} disabled={salvando}>
            {salvando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Alterar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Diálogo: Adicionar Observação
// ---------------------------------------------------------------------------
export function DialogObservacao({
  lead,
  open,
  onOpenChange,
  onDone,
}: BaseProps & { lead: NineLeadResumo | null }) {
  const [salvando, setSalvando] = useState(false)
  const [texto, setTexto] = useState('')

  const handleOpen = (v: boolean) => {
    if (v) setTexto('')
    onOpenChange(v)
  }

  const salvar = async () => {
    if (!lead) return
    if (!texto.trim()) {
      toast.error('Escreva a observação antes de salvar.')
      return
    }
    setSalvando(true)
    try {
      await NineComercialService.acaoLead(lead.id, {
        acao: 'adicionar_observacao',
        texto: texto.trim(),
      })
      toast.success('Observação adicionada ao cadastro do lead.')
      onOpenChange(false)
      onDone()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao adicionar observação'
      toast.error(msg)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-md bg-marfim border-dourado/30">
        <DialogHeader>
          <DialogTitle className="font-serif text-vinho">Adicionar Observação</DialogTitle>
          <DialogDescription className="text-vinho/60">
            {lead?.nome_completo} — anotação interna da equipe comercial
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={4}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Ex.: Lead pediu para retornar após as 18h"
        />
        <DialogFooter>
          <Button
            variant="ghost"
            className="text-vinho/70"
            onClick={() => onOpenChange(false)}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button className="bg-vinho hover:bg-vinho-dark" onClick={salvar} disabled={salvando}>
            {salvando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Diálogo: Tarefas de retorno (pendentes / hoje / atrasadas / concluídas)
// ---------------------------------------------------------------------------
export function DialogTarefas({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [carregando, setCarregando] = useState(false)
  const [tarefas, setTarefas] = useState<NineLeadDetalhe['tarefas']>([])
  const [aba, setAba] = useState<'pendentes' | 'hoje' | 'atrasadas' | 'concluidas'>('pendentes')

  const handleOpen = async (v: boolean) => {
    if (v) {
      setCarregando(true)
      try {
        const r = await NineComercialService.listarTarefas()
        setTarefas(r.tarefas as unknown as NineLeadDetalhe['tarefas'])
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Falha ao carregar tarefas'
        toast.error(msg)
      } finally {
        setCarregando(false)
      }
    }
    onOpenChange(v)
  }

  const hoje = new Date().toISOString().slice(0, 10)
  const filtradas = tarefas.filter((t) => {
    if (aba === 'concluidas') return t.status === 'concluida'
    if (t.status !== 'pendente') return false
    if (aba === 'hoje') return t.prazo === hoje
    if (aba === 'atrasadas') return !!t.prazo && t.prazo < hoje
    return true
  })

  const concluir = async (id: string) => {
    try {
      await NineComercialService.acaoTarefa(id, 'concluida')
      setTarefas((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'concluida' } : t)))
      toast.success('Tarefa concluída.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao concluir tarefa'
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-xl bg-marfim border-dourado/30">
        <DialogHeader>
          <DialogTitle className="font-serif text-vinho">Tarefas de Retorno</DialogTitle>
          <DialogDescription className="text-vinho/60">
            Pendências de retorno da equipe comercial (responsável padrão: Aline Lana)
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1">
          {(['pendentes', 'hoje', 'atrasadas', 'concluidas'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAba(t)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                aba === t ? 'bg-vinho text-white' : 'bg-white text-vinho/70 hover:bg-vinho/5',
              )}
            >
              {t === 'pendentes'
                ? 'Pendentes'
                : t === 'hoje'
                  ? 'Hoje'
                  : t === 'atrasadas'
                    ? 'Atrasadas'
                    : 'Concluídas'}
            </button>
          ))}
        </div>

        {carregando ? (
          <div className="flex items-center justify-center gap-2 py-8 text-vinho/70">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando tarefas…
          </div>
        ) : (
          <ScrollArea className="max-h-96 pr-3">
            <div className="space-y-2">
              {filtradas.length === 0 && (
                <p className="py-4 text-center text-sm text-vinho/60">
                  Nenhuma tarefa nesta categoria. 🎉
                </p>
              )}
              {filtradas.map((t) => {
                const atrasada = t.status === 'pendente' && !!t.prazo && t.prazo < hoje
                return (
                  <div
                    key={t.id}
                    className={cn(
                      'rounded-xl border bg-white/70 p-3 text-sm',
                      atrasada ? 'border-red-300 bg-red-50/50' : 'border-dourado/25',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-vinho">{t.titulo}</p>
                        <p className="text-xs text-vinho/70">
                          {t.nome || 'Lead'} · {fmtDataHora(t.created)}
                          {t.prazo ? ` · Prazo: ${t.prazo.split('-').reverse().join('/')}` : ''}
                        </p>
                      </div>
                      {t.status === 'pendente' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 border-dourado text-[#7a5b0d] hover:bg-[#D4AF37]/10"
                          onClick={() => concluir(t.id)}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Concluir
                        </Button>
                      )}
                    </div>
                    {t.motivo && <p className="mt-1 text-xs text-vinho/80">{t.motivo}</p>}
                    {t.resumo_conversa && (
                      <p className="mt-1 text-xs text-vinho/60">{t.resumo_conversa}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <Badge variant="outline" className="border-vinho/20 text-vinho/70">
                        {t.responsavel || 'Aline Lana'}
                      </Badge>
                      <Badge variant="outline" className="border-vinho/20 text-vinho/70">
                        {t.prioridade || 'média'}
                      </Badge>
                      <Badge variant="outline" className="border-vinho/20 text-vinho/70">
                        {ROTULO_CANAL[t.canal_preferido] || t.canal_preferido || 'canal livre'}
                      </Badge>
                      {atrasada && (
                        <Badge className="bg-red-600 text-white">Atrasada — atenção</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Etiquetas usadas pela tela principal
export { ROTULO_INTERESSE, ROTULO_CANAL, ROTULO_STATUS_COMERCIAL, fmtDataHora }

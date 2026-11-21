// src/components/admin/LeadsLogicaTela.tsx
// Botão "Lógica da Tela" do Painel Comercial de Leads — documenta indicadores,
// status comerciais, ações rápidas, tarefas de retorno e regras de acompanhamento.
// Regra permanente: contato com o lead é SEMPRE manual (wa.me/tel:/mailto:) —
// NUNCA envio automático de WhatsApp.

import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

const SECOES: { titulo: string; itens: string[] }[] = [
  {
    titulo: '🎯 Objetivo do painel',
    itens: [
      'Painel comercial dos leads captados pela Nine IA no chat público do site — continuidade humana do atendimento digital.',
      'Cada lead é um registro da coleção "contatos", vinculado à conversa do chat (conversation_id) e ao usuário criado/identificado pela Nine.',
      'A Nine coleta nome, WhatsApp e e-mail, qualifica o interesse e sinaliza o lead aqui; a equipe assume a partir de então.',
    ],
  },
  {
    titulo: '📊 Indicadores (clique filtra a lista)',
    itens: [
      'NOVOS LEADS: registros recentes ainda sem atendimento comercial (status novo_lead).',
      'AGUARDANDO CONTATO: leads que pediram retorno e aguardam a primeira ação da equipe.',
      'CONTATOS AGENDADOS: retorno combinado com o lead e pendente de execução.',
      'EM ATENDIMENTO: conversa comercial em andamento com a equipe.',
      'CONVERTIDOS: lead que virou cliente/parceiro/participação confirmada.',
      'CONTATOS ATRASADOS: qualquer lead ativo com data_proximo_retorno vencida (exclui convertidos e encerrados).',
    ],
  },
  {
    titulo: '🏷️ Status comerciais',
    itens: [
      'NOVO LEAD: registrado pela Nine, ainda não acionado pela equipe.',
      'AGUARDANDO CONTATO: solicitação de retorno registrada (no chat ou pelo painel).',
      'CONTATO AGENDADO: novo retorno agendado com data marcada.',
      'EM ATENDIMENTO: atendimento comercial em curso.',
      'CONVERTIDO: negócio fechado (cliente, patrocínio, parceria ou participação confirmada).',
      'ENCERRADO: encerrado sem conversão (com motivo registrado nas observações).',
      'O status só muda por AÇÃO REAL da equipe (registrar contato, agendar, alterar status) — abrir o cadastro não altera nada.',
    ],
  },
  {
    titulo: '⚡ Ações rápidas (por lead)',
    itens: [
      'VER CONVERSA: histórico real da conversa com a Nine (coleção nine_mensagens, vinculada por conversation_id).',
      'VER RESUMO: resumo estruturado da IA (resumo_ia) — Quem é o visitante / O que deseja / Informações relevantes / Expectativa / Canal preferido / Próxima ação. Dado não informado aparece como "não informado"; nada é inventado.',
      'REGISTRAR CONTATO: registra canal, resultado e observações, grava histórico_atendimento e marca data_contato. Pode promover o status (ex.: para contato_agendado ou em_atendimento).',
      'AGENDAR RETORNO: define data_proximo_retorno e cria/atualiza a tarefa "Retornar contato — Lead CoffeeCast 4.0" (idempotente — nunca duplica).',
      'ALTERAR STATUS: muda o status comercial com observação opcional.',
      'OBSERVAÇÃO: registra nota comercial em notas_comerciais.',
      'CONTATO: abre o canal escolhido — link wa.me do WhatsApp, ligação (tel:) ou e-mail — SEMPRE redirecionamento manual.',
    ],
  },
  {
    titulo: '📌 Tarefas de retorno',
    itens: [
      'Toda solicitação de contato no chat gera a tarefa "Retornar contato — Lead CoffeeCast 4.0" em nine_tarefas, responsável Aline Lana.',
      'Tarefas são idempotentes: uma única tarefa pendente por lead/agendamento; reagendar atualiza a pendente.',
      'Filtros: Pendentes, Hoje, Atrasadas, Concluídas — com contadores próprios.',
      'Concluir a tarefa não altera o status comercial do lead; status só muda por ação da equipe.',
    ],
  },
  {
    titulo: '🔁 Regras de acompanhamento',
    itens: [
      'NENHUM envio automático de WhatsApp (nunca API, nunca mensagem automática): o wa.me da Aline Lana (31) 99129-7619 é apenas LINK manual de redirecionamento; quem faz o contato é a equipe.',
      'Sem duplicidade: lead é identificado por e-mail OU telefone/WhatsApp — visitante que retorna tem o mesmo contato atualizado, não recriado.',
      'Lead em atraso (retorno vencido) fica destacado em vermelho na lista.',
      'Autorização de contato (LGPD) fica registrada no campo autorizacao_contato; se o visitante recusar dados, a Nine respeita e o lead não é criado.',
      'Perfis com acesso: Master, Gerencial e Administrativo (regra de staff no backend).',
    ],
  },
]

export default function LeadsLogicaTela() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpen className="mr-2 h-4 w-4" />
          Lógica da Tela
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-marfim">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-vinho">
            Lógica da Tela — Painel Comercial de Leads
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-3">
          <div className="space-y-5">
            {SECOES.map((s) => (
              <div key={s.titulo}>
                <h4 className="font-semibold text-[#4B1E3F]">{s.titulo}</h4>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {s.itens.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

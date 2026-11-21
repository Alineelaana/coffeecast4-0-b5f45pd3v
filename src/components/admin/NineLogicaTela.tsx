// src/components/admin/NineLogicaTela.tsx
// Botão "Lógica da Tela" da Nine IA (módulo do chat) — documenta o comportamento
// comercial da recepcionista digital premium do CoffeeCast 4.0.
// Regra permanente: NENHUM envio automático de WhatsApp — o contato com o lead
// é sempre manual, pela equipe, através do link wa.me/5531991297619 da Aline.

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
    titulo: '☕ Quem é a Nine',
    itens: [
      'Recepcionista digital premium do CoffeeCast 4.0: recepciona o visitante no chat do site, apresenta o programa e conduz o atendimento.',
      'Personalidade: acolhedora, elegante, profissional e calorosa — o mesmo padrão premium da marca (vinho, dourado, café).',
      'Preserva as funções editoriais originais (roteiros e pautas) — o comportamento comercial é uma EXTENSÃO, sem substituir nada.',
    ],
  },
  {
    titulo: '🤝 Atendimento comercial (fluxo do lead)',
    itens: [
      'APRESENTAÇÃO: cumprimenta o visitante, apresenta o CoffeeCast 4.0 ("Mais que conversas, histórias que transformam") e pergunta como pode ajudar.',
      'COLETA DE DADOS: quando há interesse comercial (participar, patrocinar, parceria, convite, contato), pede gentilmente NOME, WHATSAPP e E-MAIL.',
      'CONSENTIMENTO LGPD: pede autorização para contato; se o visitante recusar, a Nine respeita e NÃO registra o lead.',
      'QUALIFICAÇÃO: identifica o interesse (participar como convidado, patrocínio, parceria, imprensa, outros) e o canal preferido de retorno.',
      'REGISTRO: gravado o contato, o lead aparece no Painel Comercial de Leads (/admin/leads) com status inicial "aguardando contato".',
      'NUNCA INVENTAR: a Nine responde apenas com a base de conhecimento institucional — dado que não existe na base vira "não sei informar, vou encaminhar para a equipe".',
    ],
  },
  {
    titulo: '📲 Encaminhamento à Aline (regra permanente)',
    itens: [
      'O WhatsApp da Aline Lana — (31) 99129-7619 — aparece APENAS como LINK MANUAL (wa.me/5531991297619): a Nine mostra o link e a pessoa decide clicar.',
      'NENHUM envio automático de WhatsApp: nunca API, nunca mensagem disparada, nunca integração de envio. O contato com o lead é sempre MANUAL, pela equipe.',
      'No site/chat, o WhatsApp é sempre botão de redirecionamento (wa.me) — nunca formulário de envio automático.',
      'Toda solicitação de retorno gera a tarefa "Retornar contato — Lead CoffeeCast 4.0" para a Aline no Painel de Leads.',
    ],
  },
  {
    titulo: '🧠 Base de conhecimento e regras',
    itens: [
      'A Nine usa a base de conhecimento dinâmica (aba "Base de Conhecimento" desta tela): FAQ, informações institucionais e orientações cadastradas pela equipe.',
      'Prioridade de resposta: base de conhecimento > site institucional > "não sei informar" (com encaminhamento à equipe).',
      'O atendimento automático pode ser ligado/desligado pela chave desta tela; com a chave desligada, a Nine só coleta e a equipe responde.',
      'Conversas e mensagens ficam registradas e podem ser assumidas pela equipe na aba "Conversas & Atendimento".',
    ],
  },
  {
    titulo: '🔗 Onde o lead é trabalhado',
    itens: [
      'Painel Comercial de Leads (/admin/leads): histórico da conversa, resumo da IA, ações rápidas (registrar contato, agendar retorno, alterar status, observação) e tarefas de retorno.',
      'A documentação completa do painel está no botão "Lógica da Tela" da própria tela de Leads.',
      'O resumo da IA (resumo_ia) é gerado no backend no momento da qualificação, a partir da conversa real — sem inventar dados.',
    ],
  },
]

export default function NineLogicaTela() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs border-vinho/20">
          <BookOpen className="mr-1.5 h-3.5 w-3.5 text-dourado" />
          Lógica da Tela
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-marfim">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-vinho">
            Lógica da Tela — Nine IA (Chat do Site)
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

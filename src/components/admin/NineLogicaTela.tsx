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
      'INDICADOR AGUARDANDO CONTATO (no painel): reúne os leads que solicitaram retorno e ainda não foram atendidos — abrir o cadastro NÃO marca como atendido; o status só muda por ação real da equipe (registrar contato, agendar, alterar status).',
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
    titulo: '🤝 Modalidades comerciais (treinamento da Nine)',
    itens: [
      'As 4 MODALIDADES comerciais que a Nine reconhece: CONVITE (iniciativa da equipe — a equipe convida a pessoa para participar), CONTRATAÇÃO (pessoa/empresa contrata participação no CoffeeCast), PATROCÍNIO (marca/empresa avalia associação comercial ao projeto) e PARCERIA (colaboração que pode ou não envolver contratação).',
      'INTERESSES MÚLTIPLOS: o visitante pode ter mais de um interesse na mesma conversa (ex.: patrocínio + participar como convidado) — a Nine registra tudo no campo JSON "interesses" do MESMO cadastro de contato, sem duplicar lead.',
      'NUNCA INVENTAR VALORES, PACOTES, BENEFÍCIOS OU RETORNO: "quanto custa patrocinar?" → a Nine não informa valores; a equipe apresenta as condições. "minha empresa vai aparecer nos episódios?" → a Nine NÃO confirma exposição/retorno automaticamente — explica que a equipe conversa os formatos e condições.',
      'QUALIFICAÇÃO DE PATROCINADOR: a Nine coleta empresa, segmento, representante (nome e cargo), objetivo, prazo e canal preferido — SEM exigir orçamento na primeira interação.',
      'RESUMO COMERCIAL AUTOMÁTICO: ao qualificar, a Nine gera um resumo com contato, interesse, objetivo, contexto, canal preferido, prioridade sugerida e próxima ação — sempre a partir do que o visitante realmente disse ("não informado" quando faltar dado).',
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
    titulo: '📝 Geração de roteiros (Nine Roteirista) e template oficial',
    itens: [
      'A Nine também é a roteirista editorial: em Roteiros → "Preparar Episódio com IA", o botão "Analisar dados e sugerir estrutura de roteiro" gera a pauta completa no leiaute oficial do PDF de referência (seções "NN / TÍTULO (~X MINUTOS)", subtítulos de contexto, perguntas numeradas, blocos CONDUÇÃO:/CUIDADO EDITORIAL:/OBSERVAÇÃO: e notas de produção).',
      'Template do formato oficial vive na base de conhecimento (nine_conhecimento, título fixo, ativo=true) e é lido pelo backend a cada geração — editável pela equipe, sem código fixo.',
      'Motor: ChatGPT (gpt-4.1) via segredo GCHAT_GPT, somente no backend — a resposta é decodificada UTF-8 byte a byte (aceita também string "num1,num2,..."), o que corrigiu o erro "Ocorreu um erro ao gerar o roteiro com IA".',
      'A Nine NUNCA inventa dados: usa apenas as respostas reais do formulário do convidado e respeita os temas sensíveis declarados.',
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
  {
    titulo: '🏢 Local de Gravação — Estúdio Filme (base "Local de Gravação")',
    itens: [
      'Base de conhecimento da categoria "Local de Gravação" (aba Base de Conhecimento): local de gravação ATUAL do CoffeeCast — Estúdio Filme, Unidade Vitória/ES, Praia do Suá (Rua Ulisses Sarmento, nº 24, salas 407 e 408, CEP 29052-320). Horário divulgado: seg–sáb, 8h às 20h.',
      'Fontes oficiais: site do estúdio https://www.estudiofilme.com.br/vitoria/ e link de localização https://www.google.com/maps/search/?api=1&query=Rua+Ulisses+Sarmento+24+Praia+do+Sua+Vitoria+ES.',
      'DIFERENCIAÇÃO: CoffeeCast ≠ Estúdio Filme. O estúdio é um espaço profissional utilizado para as gravações — NUNCA dizer que o CoffeeCast é dono do estúdio nem que ele pertence à Aline Lana. Tom modelo: "Atualmente, nossas gravações acontecem no Estúdio Filme, em Vitória, um espaço profissional preparado para produções audiovisuais. ☕✨".',
      'Nunca inventar: equipamentos (marcas, 4K, quantidade de câmeras), preços, agenda, premiações. Preços do estúdio → equipe do estúdio/site oficial; dúvidas do CoffeeCast → Aline (link manual).',
      'ESTACIONAMENTO CONFIRMADO: o Estúdio Filme conta com estacionamento PRÓPRIO, disponível para os convidados do CoffeeCast — segurança e conforto do início ao fim da gravação. Resposta modelo da Nine: "Sim! O Estúdio Filme conta com estacionamento próprio, disponível para os nossos convidados. Assim, você chega, grava e vai embora com total segurança e conforto. ☕✨".',
      'Horário do estúdio (seg–sáb 8h–20h) NÃO é o horário das gravações do CoffeeCast — programação própria, confirmada pela equipe.',
      'Interesse EXCLUSIVAMENTE nos serviços do estúdio (alugar, gravar seu conteúdo) → site oficial do estúdio, NÃO é lead do CoffeeCast. Interesse relacionado ao CoffeeCast (participar, gravar episódio) → fluxo de lead normal.',
      'EDITÁVEL: o local de gravação é dado institucional configurável — se mudar de estúdio, a equipe atualiza os registros da categoria "Local de Gravação" na base de conhecimento, sem reescrever o treinamento.',
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
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl bg-marfim">
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

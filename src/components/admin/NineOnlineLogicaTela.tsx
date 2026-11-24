// src/components/admin/NineOnlineLogicaTela.tsx
// Botão "Lógica da Tela" da Nine Online — documenta a assistente virtual do
// painel administrativo (agente nativo Skip Cloud "nine-online").

import React, { useState } from 'react'
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
    titulo: '🎯 Objetivo',
    itens: [
      'A Nine Online é a assistente virtual do PAINEL ADMINISTRATIVO: a mesma Nine recepcionista digital premium do site, agora a serviço da equipe dentro do sistema.',
      'Ela responde dúvidas consultando os DADOS REAIS do banco — episódios, agenda, leads, contatos, convidados, roteiros, tarefas de retorno e portfolios — e sempre cita a origem ("consultando os episódios do sistema…").',
      'Se o dado não existe, ela diz que não encontrou. Ela NUNCA inventa números, nomes, datas ou status.',
    ],
  },
  {
    titulo: '🔓 Onde aparece (visibilidade)',
    itens: [
      'A aba/etiqueta da Nine Online só existe DENTRO do AdminLayout — ou seja, só para usuários logados na área administrativa (perfis Master, ADM e Gerencial).',
      'No site público e nas telas de login/recuperação de senha a Nine Online NUNCA aparece — a Nine do site é o widget próprio (NineChatWidget) e continua intacto.',
      'Se a sessão expirar, o componente deixa de ser renderizado junto com o painel: o botão some sozinho.',
    ],
  },
  {
    titulo: '🛡️ Permissões de tela (regra inegociável)',
    itens: [
      'A cada mensagem, o backend calcula a lista de telas do usuário logado com a MESMA lógica do hasScreenPermission: Master = todas as telas; ADM = telas marcadas em adm_permissions.allowedScreens; Gerencial = lista operacional fixa.',
      'Essa lista é injetada na conversa e a Nine Online só consulta e comenta dados de telas que o usuário pode ver — quem não tem a tela Financeiro não recebe números financeiros.',
      'Dados comerciais confidenciais (preços negociados, condições, valores) NUNCA são revelados: valores só com a Aline Lana, em reunião.',
      'A lista literal de telas nunca é exibida ao usuário — serve apenas para limitar as consultas.',
    ],
  },
  {
    titulo: '🗂️ Fontes de dados (somente leitura)',
    itens: [
      'Episódios e status de publicação → coleção "episodios".',
      'Gravações agendadas, datas e convidados → coleção "agenda".',
      'Leads e status comercial (ex.: "Aguardando contato") → coleção "contatos".',
      'Tarefas de retorno → coleção "nine_tarefas". Roteiros de convidados → "roteiros_convidados".',
      'Convites, portfolios, momentos, depoimentos e integrantes → coleções "convites", "portfolios", "momentos", "depoimentos" e "integrantes".',
      'Todas as ferramentas do agente são somente leitura (list/read): a Nine Online NÃO cria, NÃO edita e NÃO exclui registros — ela indica a tela correta do painel para a ação.',
    ],
  },
  {
    titulo: '⚖️ Regras de ouro preservadas',
    itens: [
      'NUNCA informa preços, valores, descontos ou condições — valores são tratados exclusivamente pela Aline Lana, em reunião.',
      'NUNCA envia WhatsApp automático — contato sempre manual; quando apropriado, oferece o link manual wa.me/5531991297619.',
      'Estacionamento próprio no Estúdio Filme (Vitória/ES) é diferencial confirmado: comunica como segurança e conforto para convidados.',
      'Responde sempre em português do Brasil, norma-padrão rigorosa, tom CoffeeCast (vinho/dourado, elegante e acolhedor), com no máximo um emoji por resposta.',
      'Não acessa usuários, senhas, auditoria, backups, lojas (storefront) nem conversas privadas do chat da equipe.',
    ],
  },
  {
    titulo: '💬 Comportamento do chat',
    itens: [
      'O disparador é uma ABA/ETIQUETA VERTICAL grudada na borda DIREITA da tela (estilo "tab recolhida"), com a foto da Nine dentro — visual exclusivo da Nine Online, para diferenciar da Nine do site público.',
      'No desktop ela fica na metade vertical da janela (top-1/2), colada em right-0 com cantos arredondados só do lado esquerdo — ~48px de largura, fica na margem da janela, não sobrepõe conteúdo de leitura e não afeta o scroll.',
      'No celular a mesma aba fica na borda direita, posicionada mais abaixo (~5,5rem da base + safe-area do iPhone), com área de toque de 44px+ (44x64px) e camada z-40 — abaixo de gavetas (z-50), modais e cabeçalho móvel: nunca cobre leitura nem navegação.',
      'Ao passar o mouse (desktop) aparece o tooltip "Nine Online — Assistente IA".',
      'Ao clicar, o painel desliza pela lateral direita: ~408px de largura no desktop, largura total no celular (respeitando o cabeçalho mobile de ~96px e a safe-area do iPhone). Com o painel aberto, a aba desliza para fora da tela; ao fechar, ela volta e o histórico continua.',
      'O histórico da sessão é preservado ao fechar e reabrir o painel; carregando e erros seguem o padrão do sistema (banner vermelho dentro do painel + toast na base).',
      'Cabeçalho do painel: foto da Nine, nome "Nine Online" e botão fechar (X). Botão e itens de toque com mínimo 44px no celular.',
    ],
  },
]

interface NineOnlineLogicaTelaProps {
  /** Gatilho alternativo (ex.: ícone no cabeçalho do painel de chat). */
  children?: React.ReactNode
}

export default function NineOnlineLogicaTela({ children }: NineOnlineLogicaTelaProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button
            variant="outline"
            size="sm"
            className="h-auto min-h-[44px] w-full justify-center text-dourado border-dourado/60 font-semibold bg-transparent hover:bg-dourado/10 hover:text-dourado active:bg-dourado/15 md:h-8 md:w-auto md:min-h-0 md:text-xs md:text-foreground md:font-medium md:border-vinho/20 md:hover:bg-accent md:hover:text-accent-foreground md:active:bg-transparent"
          >
            <BookOpen className="mr-1.5 h-3.5 w-3.5 text-dourado" />
            Lógica da Tela
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl bg-marfim">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-vinho">
            Lógica da Tela — Nine Online (Assistente do Painel)
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

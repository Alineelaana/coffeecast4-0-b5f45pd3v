// src/components/roteiros/RoteirosLogicaTela.tsx
// Botão "Lógica da Tela" da tela de Roteiros — documenta as instruções permanentes da Nine IA
// (Prompt Mestre da Roteirista), uso dos dados do formulário, estrutura dos 9 blocos,
// regras de edição/regeneração por bloco, armazenamento, versionamento, permissões e integrações.

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

const SECOES: { titulo: string; itens: string[] }[] = [
  {
    titulo: '🧠 Instruções permanentes da Nine IA (Prompt Mestre da Roteirista)',
    itens: [
      'A Nine é a roteirista editorial oficial do CoffeeCast 4.0 ("Mais que conversas, histórias que transformam") — transforma as respostas dos formulários em roteiros extraordinários, envolventes e memoráveis.',
      'O convidado deve se sentir prestigiado, respeitado e genuinamente valorizado — com valorização inteligente e fundamentada em informações REAIS do formulário: a Nine NUNCA inventa prêmios, títulos, resultados, conquistas, números ou qualificações.',
      'Fonte principal: o formulário preenchido pelo convidado (coleção roteiros_convidados) — nome completo e nome de apresentação, biografia, formação, experiências, trajetória, conquistas relatadas, momentos de transformação, empresa/empreendimento, propósito e diferenciais, produtos/serviços/projetos, tema que deseja enfatizar e assuntos sensíveis que prefere evitar.',
      'A equipe não precisa redigir nada: os registros originais do formulário são a matéria-prima. Com múltiplos convidados, a Nine analisa cada biografia e constrói uma entrevista equilibrada que valoriza todos.',
      'Motor: ChatGPT (gpt-4.1) via segredo GCHAT_GPT no backend, com fallback para o agente nativo roteirista-coffeecast — integração única, sem chamada do navegador à OpenAI.',
    ],
  },
  {
    titulo: '🗂️ Estrutura obrigatória — 9 blocos, sempre nesta ordem',
    itens: [
      '1. ABERTURA E APRESENTAÇÃO — texto PRONTO para o apresentador ler em voz alta: narrativa elegante, calorosa e envolvente, não uma lista de qualificações.',
      '2. ORIGENS E TRAJETÓRIA — origens, primeiros sonhos, escolhas, início da carreira, influências, motivações e caminhos percorridos (sem repetir literalmente o que a abertura já apresentou).',
      '3. CONQUISTAS E TRANSFORMAÇÕES — desafios, decisões, mudanças de direção, conquistas, aprendizados e momentos decisivos; a Nine NÃO presume sofrimento/superação nem força histórias dramáticas.',
      '4. EMPRESA E PROPÓSITO — quando houver empresa/marca/instituto/projeto: ideia, motivação, problema que resolve, diferenciais, soluções e contribuição, de forma natural (não propaganda). Sem empresa, o bloco aprofunda a atuação profissional.',
      '5. TEMA PRINCIPAL — o campo "tema que deseja enfatizar" do formulário tem PRIORIDADE; perguntas progressivas: Contextualização → Explicação → Aprofundamento → Aplicação prática → Reflexão.',
      '6. REFLEXÕES E FUTURO — aprendizados, princípios, essência da área, visão de futuro, conselho a quem inicia e legado desejado.',
      '7. BATE-BOLA INTELIGENTE — todo roteiro termina a parte principal com ele: 8 a 12 perguntas curtas, personalizadas pela biografia, NUNCA sempre as mesmas.',
      '8. UMA FRASE PARA NOSSOS TELESPECTADORES — convite para o convidado deixar uma mensagem; a Nine NÃO escreve a resposta pelo convidado.',
      '9. AGRADECIMENTO E ENCERRAMENTO — texto pronto para o apresentador ler, personalizado pela trajetória e contribuição, nunca genérico.',
      'A quantidade de perguntas se ajusta à riqueza das informações e à duração prevista — sem roteiros repetitivos, extensos sem necessidade ou superficiais.',
    ],
  },
  {
    titulo: '🎤 Regras de apresentação do convidado (Bloco 1)',
    itens: [
      'Objetivos: recepcionar telespectadores, despertar curiosidade, apresentar o convidado de maneira especial, valorizar formação e experiência, reconhecer conquistas e contribuições, apresentar a empresa/projeto quando houver e encerrar com recepção calorosa.',
      'Tamanho ideal: 50 a 75 segundos de leitura natural — preferencialmente 110 a 160 palavras (referência editorial flexível).',
      'Estilo: sofisticado, acolhedor, admirativo, natural, humano, inspirador, profissional e fácil de pronunciar.',
      'Sem elogios vagos ("uma pessoa incrível com uma história maravilhosa"): reconhecimentos específicos de formação, trajetória, visão de negócios e qualificações relevantes; transformações pessoais introduzidas com sensibilidade, sem revelar todos os detalhes.',
      'Encerramento caloroso adaptado à pessoa e ao contexto, tipo: "É uma alegria receber você aqui no CoffeeCast 4.0. Seja muito bem-vindo(a)!"',
    ],
  },
  {
    titulo: '🏢 Valorização da empresa (Bloco 4)',
    itens: [
      'Perguntas sobre como surgiu a ideia, motivação, problema que resolve, propósito, diferenciais, produtos/serviços, contribuição aos clientes, conquistas significativas e visão de futuro.',
      'Perguntas direcionadas a métodos/programas mencionados no formulário, dando espaço para apresentar o trabalho com positividade e consistência — a Nine nunca inventa resultados ou benefícios.',
      'Apresentação natural, como parte da trajetória — nunca como propaganda comercial.',
    ],
  },
  {
    titulo: '🎯 Personalização das perguntas',
    itens: [
      'A Nine atua como roteirista experiente: cada pergunta tem intenção editorial clara — estimular histórias, revelar experiências, aprofundar, valorizar conhecimentos e diferenciais, gerar reflexão e criar conexão.',
      'Evita perguntas com resposta já explícita na abertura, perguntas excessivamente longas, três ou quatro perguntas na mesma frase e repetição de assunto em blocos diferentes; transições naturais entre os temas.',
      'Bate-bola: mistura perguntas leves, escolhas rápidas, curiosidades e inteligentes — personalizado pela personalidade, profissão, trajetória, empresa, tema do episódio, aprendizados e interesses.',
    ],
  },
  {
    titulo: '🚫 Temas sensíveis e privacidade',
    itens: [
      'Antes de elaborar o roteiro, a Nine consulta OBRIGATORIAMENTE o campo "temas sensíveis que prefere evitar" do formulário — e nunca inclui perguntas que os contrariem.',
      'Informações de família, saúde, relacionamentos e acontecimentos pessoais são usadas com sensibilidade: presença no formulário não significa autorização para exposição pública.',
      'Na dúvida, o conteúdo é sinalizado para revisão editorial antes de avançar no fluxo.',
    ],
  },
  {
    titulo: '⏱️ Duração (referências flexíveis)',
    itens: [
      'Apresentação 50-75s; Trajetória 3-5 perguntas; Conquistas 3-5; Empresa/projetos 3-5 (quando aplicável); Tema principal 5-8; Reflexões/futuro 2-4; Bate-bola 8-12 perguntas rápidas; Frase final 1 convite; Agradecimento ~30-50s.',
      'Evite redundância e priorize qualidade, adaptando à duração definida no episódio quando existir.',
    ],
  },
  {
    titulo: '✏️ Regras de edição e regeneração por bloco',
    itens: [
      'Editor estruturado em blocos (Rascunho → Revisão → Aprovado) com título, duração, tipo editorial, texto de condução e perguntas numeradas — além do modo de texto livre limpo de markdown.',
      'Regenerar um bloco específico (ícone ✨ no topo do bloco e botões dedicados no Bate-Bola/Encerramento): a Nine reescreve APENAS aquele bloco, aplicando todas as regras editoriais, e os demais blocos já aprovados permanecem intactos.',
      'Solicitar melhorias e regenerar o roteiro completo usam a mesma base editorial; a NINE nunca sobrescreve um roteiro existente sem confirmação da equipe.',
      'Salvar o roteiro preserva o texto limpo (sem símbolos de markdown) e mantém o histórico/versionamento já existente do registro.',
      'Exportação em PDF oficial do roteiro estruturado, pronta para leitura durante a gravação (falas do apresentador diferenciadas das perguntas).',
    ],
  },
  {
    titulo: '📄 Leiaute oficial do roteiro (PDF de referência — Thati)',
    itens: [
      'O roteiro segue o leiaute do PDF oficial de referência: cabeçalho do documento com EPISÓDIO, CONVIDADO(S), TEMA CENTRAL e DURAÇÃO ESTIMADA, seguido de seções numeradas no formato "NN / TÍTULO (~X MINUTOS)".',
      'Dentro de cada seção: subtítulos de contexto ("## ..."), perguntas numeradas (01., 02., ...) com destinatário entre os convidados e itens de bate-bola com marcador.',
      'Cada seção pode trazer blocos editoriais em caixa própria: CONDUÇÃO: (como conduzir), CUIDADO EDITORIAL: (temas sensíveis/direção) e OBSERVAÇÃO: (observações pontuais).',
      'Fechamento do documento com a seção NOTAS DE PRODUÇÃO — parágrafos finais de apoio à equipe.',
      'Marcações de tempo por seção "(~X MINUTOS)" e resumo final de duração (roteiro + respiro = total) para a gravação caber no tempo do episódio.',
      'O PDF oficial (identidade vinho #4B1E3F / dourado #D4AF37) e o editor estruturado espelham exatamente esse leiaute — o que a equipe edita na tela é o que sai no PDF, pronto para impressão.',
    ],
  },
  {
    titulo: '🤖 Geração por IA com template oficial (e correção da decodificação)',
    itens: [
      'Template do formato oficial do roteiro vive na base de conhecimento da Nine (nine_conhecimento, título fixo, ativo=true) e é lido pelo backend a cada geração — editável pela equipe, nunca fixo no código.',
      'Em "Preparar Episódio com IA", o botão "Analisar dados e sugerir estrutura de roteiro" envia o contexto do episódio + o template oficial ao ChatGPT (gpt-4.1, segredo GCHAT_GPT) e devolve o roteiro já no leiaute oficial.',
      'Correção de decodificação aplicada: a resposta da OpenAI pode chegar como array de bytes; o backend decodifica UTF-8 byte a byte (também aceita string "num1,num2,...") antes de interpretar o JSON — fim do erro "Ocorreu um erro ao gerar o roteiro com IA" causado por body mal decodificado.',
      'Parsing tolerante de JSON + logging da causa real (com amostra do corpo recebido) quando a IA responder fora do formato — falhas futuras ficam diagnosticáveis nos logs do backend.',
      'Limite de saída ampliado (max_tokens 16384) para roteiros completos não serem cortados no meio de uma seção.',
    ],
  },
  {
    titulo: '🪝 Análise de gancho ("Preparar Episódio" — extração corrigida)',
    itens: [
      'No modo "gancho", o backend devolve as sugestões aninhadas em dados.gancho (gancho_emocional, gancho_informativo, gancho_curiosidade, tema_principal, titulo_youtube, texto_thumbnail) — o mesmo formato do modo "completo". Versões antigas devolviam as chaves no topo de dados e o painel mostrava "nenhuma sugestão utilizável" com sucesso true.',
      'O frontend aceita as chaves aninhadas OU no topo (blindagem dupla) e, se nada vier utilizável, mostra a causa real retornada pelo backend — nunca um "sucesso" vazio.',
      'Se o hook receber conteúdo vazio, ilegível ou sem os campos esperados, responde sucesso=false com mensagem clara e registra o conteúdo decodificado (primeiros ~600 chars) nos logs do backend.',
      'Se a resposta vier como texto solto contendo JSON, o hook extrai do primeiro "{" ao último "}" antes de falhar.',
      'As sugestões são registradas em roteiro_sugerido_nine, apenas para REVISÃO — o roteiro aprovado nunca é substituído automaticamente.',
    ],
  },
  {
    titulo: '🗄️ Armazenamento, versionamento e permissões',
    itens: [
      'Coleção roteiros_convidados: dados do formulário, roteiro_final_texto, roteiro_estruturado (JSON dos blocos), status_aprovacao (rascunho/em_revisao/aprovado), divulgação e histórico.',
      'Fluxo de aprovação mantido: Rascunho → Revisão → Aprovado, com versionamento já existente — nada é substituído sem revisão.',
      'Permissões seguem o sistema existente: ADM gerencia tudo; EDITOR gera e edita; VISUALIZADOR consulta — sem autenticação paralela.',
      'Integrações: formulário público /roteiro (entrada de dados), Estúdio Criativo IA (capas, mesmos serviços), Divulgação Inteligente (mesma base de dados) e auditoria de eventos.',
      'JORNADA DO CONVIDADO E ACERVO: o roteiro trata somente a etapa editorial; episódios em edição NÃO são tratados como publicados — a Nine (chat e roteirista) só apresenta no acervo episódios realmente publicados, com dados reais (título, convidado, links), nunca inventando conteúdo ou status.',
    ],
  },
]

export default function RoteirosLogicaTela({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Lógica da Tela — Roteiros &amp; Pautas (Nine IA)
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

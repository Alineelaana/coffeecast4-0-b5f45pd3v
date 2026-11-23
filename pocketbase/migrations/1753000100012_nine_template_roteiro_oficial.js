// pocketbase/migrations/1753000100012_nine_template_roteiro_oficial.js
// Treinamento da Nine IA — TEMPLATE DO FORMATO OFICIAL DOS ROTEIROS CoffeeCast 4.0.
//
// O usuário criou manualmente um roteiro exemplar (PDF "roteirocoffeecast40thatiannefabiano")
// e pediu: "ensine pra IA Nine que deve criar roteiros assim, inclusive com esse leiaute do PDF".
//
// O que esta migration faz:
// 1. Semeia na collection nine_conhecimento (base de conhecimento EDITÁVEL da equipe, categoria
//    "Roteiros") o registro "Roteiros — Template do formato oficial (leiaute do PDF de referência)",
//    com a estrutura completa: cabeçalho, seções numeradas 01/ … 10/, blocos com subtítulo ##,
//    perguntas numeradas, CONDUÇÃO/CUIDADO EDITORIAL, marcações de tempo e NOTAS DE PRODUÇÃO.
// 2. Regras comportamentais gravadas como registro tipo "orientacao" para o chat da Nine.
//
// NADA do conteúdo do roteiro exemplar vira hardcode nos hooks: o hook assistente_roteiro.js LÊ
// este registro da base e injeta no prompt. Se a equipe quiser ajustar o formato, edita o cadastro
// em Administração → Nine IA — sem deploy. Migration idempotente: não duplica em re-run.
//
// Regras preservadas: NUNCA inventar preços (valores só pela Aline em reunião); WhatsApp da Aline
// só como link manual wa.me/5531991297619 — nunca envio automático.

const TITULO_TEMPLATE = 'Roteiros — Template do formato oficial (leiaute do PDF de referência)'
const TITULO_ORIENTACAO = 'Roteiros — Regras do formato oficial e leiaute (orientação da Nine)'
const CATEGORIA = 'Roteiros'

const CONTEUDO_TEMPLATE = [
  'ESTRUTURA E LEIAUTE OBRIGATÓRIOS de todo roteiro CoffeeCast 4.0 gerado por IA (espelham o PDF oficial de referência).',
  'LEIAUTE GERAL (texto do roteiro, SEM markdown decorativo — só a hierarquia abaixo):',
  '• Cabeçalho: título do episódio em caixa alta ("ROTEIRO COFFECAST 4.0"), linha "CONVIDADO(S):" com nome(s), linha "EPISÓDIO: <tema> — <data e hora da gravação>" e linha "DURAÇÃO PREVISTA: ~XX min".',
  '• Seções numeradas no formato "NN / TÍTULO" em caixa alta (01 / ABERTURA DA APRESENTADORA). A numeração é contínua de 01 até 10 e NUNCA se repete.',
  '• Cada seção abre com um subtítulo em linha própria iniciado por "##" (ex.: "## Contexto do episódio" ou "## Perguntas da seção").',
  '• Perguntas numeradas em duas casas ("01.", "02.", "03."...), uma por linha; perguntas opcionais terminam com a marca "(se houver espaço)".',
  '• Marcações de tempo entre parênteses no início de linhas de condução (ex.: "(~2 min)", "(~10 min — do primeiro bloco até o fim da seção anterior)").',
  '• Linhas "CONDUÇÃO:" — instrução em 1-2 frases para o apresentador conduzir o bloco.',
  '• Linhas "CUIDADO EDITORIAL:" — 1 frase com a atenção editorial da seção (tema sensível, tom, privacidade).',
  '• Linhas "OBSERVAÇÃO:" — nota pontual de produção (ex.: confirmar nome de empresa, checar dado no formulário).',
  '• Ao final, a seção "10 / NOTAS DE PRODUÇÃO" em lista com marcadores "•" (não numerada) — logística, técnica, avisos de produção e lembretes finais.',
  '',
  'ORDEM EXATA DAS SEÇÕES (títulos podem se adaptar ao convidado, a estrutura não):',
  '01 / ABERTURA DA APRESENTADORA — texto pronto para leitura em voz alta (~50-75s, 110-160 palavras); subtítulo "## Apresentação inicial" e parágrafo corrido caloroso.',
  '02 / CONTEXTO DO EPISÓDIO — subtítulo "## Contexto do episódio"; condução de abertura + as 2-3 perguntas "quebra-gelo" iniciais com tempo estimado.',
  '03 / BLOCO 1 — TRAJETÓRIA E ORIGENS — perguntas numeradas sobre origens, primeiros passos e caminhos da carreira; subtítulo "## Perguntas do Bloco 1".',
  '04 / BLOCO 2 — CONQUISTAS E TRANSFORMAÇÕES — perguntas numeradas sobre desafios, decisões e conquistas; subtítulo "## Perguntas do Bloco 2".',
  '05 / BLOCO 3 — EMPRESA E PROJETOS — perguntas numeradas sobre empresa/marca/projeto e propósito; quando não houver, a seção vira "ATUAÇÃO PROFISSIONAL" com o mesmo leiaute.',
  '06 / BLOCO 4 — TEMA PRINCIPAL DO EPISÓDIO — o tema que o convidado deseja enfatizar, em profundidade crescente (Contextualização → Explicação → Aprofundamento → Aplicação prática → Reflexão).',
  '07 / BLOCO 5 — REFLEXÕES E FUTURO — aprendizados, visão de futuro, conselho a quem está começando e legado.',
  '08 / BATE-BOLA INTELIGENTE — 8 a 12 perguntas curtas e rápidas, personalizadas pela biografia (nunca as mesmas de episódio para episódio), com tempo total estimado.',
  '09 / ENCERRAMENTO E AGRADECIMENTO — texto pronto para o apresentador ler, personalizado pela trajetória do convidado, + convite "UMA FRASE PARA NOSSOS TELESPECTADORES" (a frase o convidado é que diz — a IA não escreve por ele).',
  '10 / NOTAS DE PRODUÇÃO — lista com "•": logística do estúdio, itens técnicos (microfone, enquadramento), avisos para a equipe (ex.: confirmar estacionamento, entrega de materiais) e lembretes editoriais.',
  '',
  'REGRAS DO CONTEÚDO (vale para todas as seções):',
  '• Toda marcação de tempo é ESTIMATIVA e usa "~" (aproximado); a soma das seções deve fechar com a duração prevista do episódio.',
  '• Perguntas de um mesmo bloco seguem ordem de profundidade: contextualizar → aprofundar → aplicar → refletir.',
  '• Se houver tema sensível declarado no formulário, a seção correspondente recebe linha "CUIDADO EDITORIAL:" explícita e nenhuma pergunta contrária ao pedido do convidado.',
  '• Sem markdown decorativo: NÃO usar "**" para negrito, "*" para itálico, listas com "-" no meio de seções nem tabelas — apenas "##", numeração "NN." e "•" nas notas.',
  '• Nada de valores/preços no roteiro (valores só pela Aline em reunião) e nada de envio automático de WhatsApp — a menção ao contato da Aline é só link manual wa.me/5531991297619 quando pertinente à produção.',
].join('\n')

const CONTEUDO_ORIENTACAO = [
  'ORIENTAÇÃO COMPORTAMENTAL — Quando o assunto for CRIAÇÃO ou EDIÇÃO de roteiros (chat ou gerador), a Nine segue o registro "Roteiros — Template do formato oficial (leiaute do PDF de referência)" desta base de conhecimento.',
  'Gerar roteiro = produzir o texto completo já nesse formato: seções "NN / TÍTULO", subtítulos "##", perguntas numeradas "01.", CONDUÇÃO:, CUIDADO EDITORIAL:, OBSERVAÇÃO: e a seção final 10 / NOTAS DE PRODUÇÃO.',
  'Nunca responder a um pedido de roteiro com resumo, esboço ou lista de tópicos soltos: o formato oficial é o do template. Se faltar informação do convidado, marcar com "OBSERVAÇÃO:" o que precisa confirmar — nunca inventar.',
  'Regras preservadas: sem preços (valores só pela Aline em reunião) e sem envio automático de WhatsApp (contato da Aline é só link manual wa.me/5531991297619).',
].join('\n')

migrate(
  (app) => {
    // ---------- Seeds idempotentes por título em `nine_conhecimento` ----------
    const seeds = [
      {
        tipo: 'institucional',
        titulo: TITULO_TEMPLATE,
        conteudo: CONTEUDO_TEMPLATE,
      },
      {
        tipo: 'orientacao',
        titulo: TITULO_ORIENTACAO,
        conteudo: CONTEUDO_ORIENTACAO,
      },
    ]
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i]
      let existentes = []
      try {
        existentes = app.findRecordsByFilter(
          'nine_conhecimento',
          'titulo = "' + seed.titulo + '"',
          '-created',
          1,
          0,
        )
      } catch (_) {
        existentes = []
      }
      if (!existentes || existentes.length === 0) {
        const col = app.findCollectionByNameOrId('nine_conhecimento')
        const rec = new Record(col)
        rec.set('tipo', seed.tipo)
        rec.set('titulo', seed.titulo)
        rec.set('conteudo', seed.conteudo)
        rec.set('categoria', CATEGORIA)
        rec.set('ativo', true)
        rec.set('ordem', 30 + i)
        app.save(rec)
      }
    }
  },
  (app) => {
    // Reversível: remove apenas os seeds desta migration.
    const titulos = [TITULO_TEMPLATE, TITULO_ORIENTACAO]
    for (let i = 0; i < titulos.length; i++) {
      try {
        const existentes = app.findRecordsByFilter(
          'nine_conhecimento',
          'titulo = "' + titulos[i] + '"',
          '-created',
          50,
          0,
        )
        existentes.forEach(function (r) {
          app.delete(r)
        })
      } catch (_) {
        /* coleção pode não existir */
      }
    }
  },
)

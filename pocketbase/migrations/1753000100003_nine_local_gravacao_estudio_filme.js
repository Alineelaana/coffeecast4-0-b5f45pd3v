// pocketbase/migrations/1753000100003_nine_local_gravacao_estudio_filme.js
// Treinamento complementar da Nine IA — categoria "LOCAL DE GRAVAÇÃO" na base
// de conhecimento (nine_conhecimento): Estúdio Filme — Unidade Vitória/ES.
//
// - Seeds idempotentes por título (nunca duplica em re-run).
// - Registros EDITÁVEIS pela equipe: se o CoffeeCast mudar de estúdio, basta
//   atualizar os cadastros — nada do local está hardcoded no treinamento.
// - Regras comportamentais gravadas como registros tipo "orientacao":
//   CoffeeCast ≠ Estúdio Filme; nunca inventar dados (equipamentos, preços,
//   estacionamento); horário do estúdio ≠ programação do CoffeeCast;
//   interessado EXCLUSIVAMENTE nos serviços do estúdio → site oficial, não vira
//   lead do CoffeeCast; experiência de participação → link manual wa.me da Aline.
// - Sem envio automático de WhatsApp em nenhum ponto.

const SITE_ESTUDIO = 'https://www.estudiofilme.com.br/vitoria/'
const MAPS_ESTUDIO =
  'https://www.google.com/maps/search/?api=1&query=Rua+Ulisses+Sarmento+24+Praia+do+Sua+Vitoria+ES'
const LINK_WA_ALINE =
  'https://wa.me/5531991297619?text=Venho%20pelo%20CHAT%20do%20site%20do%20Coffeecast4.0%2C%20gostaria%20de%20falar%20com%20a%20Aline'

const SEEDS = [
  // ------------------------- Subcategorias principais -------------------------
  {
    tipo: 'institucional',
    titulo: 'Local de Gravação — Identificação do estúdio (atual)',
    categoria: 'Local de Gravação',
    ordem: 11,
    conteudo:
      'LOCAL DE GRAVAÇÃO ATUAL do CoffeeCast 4.0 (pode mudar — dado editável pela equipe): Estúdio Filme — Unidade Vitória/ES, ' +
      'no bairro Praia do Suá. Site oficial: https://www.estudiofilme.com.br/vitoria/ ' +
      'Localização no mapa: https://www.google.com/maps/search/?api=1&query=Rua+Ulisses+Sarmento+24+Praia+do+Sua+Vitoria+ES ' +
      'Sempre apresentar como espaço profissional utilizado para as gravações, nunca como propriedade do CoffeeCast ou da Aline Lana.',
  },
  {
    tipo: 'faq',
    titulo: 'Local de Gravação — Endereço e localização',
    categoria: 'Local de Gravação',
    ordem: 12,
    conteudo:
      'Endereço do local de gravação atual (Estúdio Filme — Unidade Vitória): Rua Ulisses Sarmento, nº 24, salas 407 e 408, ' +
      'Praia do Suá, Vitória/ES, CEP 29052-320. ' +
      'Link de localização: https://www.google.com/maps/search/?api=1&query=Rua+Ulisses+Sarmento+24+Praia+do+Sua+Vitoria+ES',
  },
  {
    tipo: 'faq',
    titulo: 'Local de Gravação — Horários divulgados pelo estúdio',
    categoria: 'Local de Gravação',
    ordem: 13,
    conteudo:
      'Horário divulgado pelo estúdio: de segunda a sábado, das 8h às 20h. ' +
      'IMPORTANTE: esse é o horário de funcionamento do espaço, NÃO a programação das gravações do CoffeeCast — ' +
      'os dias e horários das gravações seguem a programação própria do CoffeeCast, confirmada pela equipe.',
  },
  {
    tipo: 'institucional',
    titulo: 'Local de Gravação — Relação com o CoffeeCast',
    categoria: 'Local de Gravação',
    ordem: 14,
    conteudo:
      'CoffeeCast ≠ Estúdio Filme: o CoffeeCast 4.0 é o projeto/podcast; o Estúdio Filme é o espaço profissional onde as ' +
      'gravações acontecem ATUALMENTE. NUNCA afirmar que o CoffeeCast é proprietário do estúdio nem que o estúdio pertence à ' +
      'Aline Lana. Apresentar como "utilização de um espaço profissional de gravação". ' +
      'Tom modelo: "Atualmente, nossas gravações acontecem no Estúdio Filme, em Vitória, um espaço profissional preparado ' +
      'para produções audiovisuais, com estrutura de áudio, vídeo e iluminação de alto padrão. ☕✨"',
  },
  {
    tipo: 'institucional',
    titulo: 'Local de Gravação — Estrutura e diferenciais divulgados',
    categoria: 'Local de Gravação',
    ordem: 15,
    conteudo:
      'Diferenciais DIVULGADOS pelo próprio estúdio (sempre atribuir ao estúdio, nunca prometer em nome dele): estrutura ' +
      'audiovisual de alto padrão, equipamentos profissionais, câmeras e iluminação de qualidade, captação de áudio ' +
      'profissional, ambientes com diferentes propostas visuais, direção/acompanhamento durante gravações, edição e ' +
      'pós-produção, cortes para redes sociais, atendimento personalizado, e proposta de imagem com padrão cinematográfico. ' +
      'NUNCA inventar: marcas ou modelos de equipamentos, resoluções (ex.: 4K), quantidade de câmeras/microfones, preços, ' +
      'disponibilidade de agenda, estacionamento, premiações ou números de clientes.',
  },
  {
    tipo: 'institucional',
    titulo: 'Local de Gravação — Ambientes divulgados',
    categoria: 'Local de Gravação',
    ordem: 16,
    conteudo:
      'Três ambientes divulgados pelo estúdio: (1) Podcast — ambiente das grandes conversas, com presença e conforto; é o ' +
      'foco do CoffeeCast; (2) Cursos e Conteúdo — clean e elegante, para cursos, aulas, lives e conteúdo educacional; ' +
      '(3) Produção e Anúncios — iluminação de cinema e direção para campanhas, anúncios, vídeos de vendas (VSLs).',
  },
  {
    tipo: 'institucional',
    titulo: 'Local de Gravação — Serviços, direção e pós-produção divulgados',
    categoria: 'Local de Gravação',
    ordem: 17,
    conteudo:
      'Produções e serviços divulgados pelo estúdio: podcasts, entrevistas, cursos e mentorias, lives, clipes, conteúdos de ' +
      'marca, anúncios, vídeos comerciais e VSLs. Direção: equipe que acompanha e orienta em cena. Pós-produção: edição ' +
      'refinada e cortes prontos para redes sociais. Falar desses serviços SOMENTE quando o visitante perguntar sobre o ' +
      'estúdio — nunca transformar conversa sobre participação no CoffeeCast em oferta comercial do estúdio.',
  },
  {
    tipo: 'institucional',
    titulo: 'Local de Gravação — Experiência dos convidados no espaço',
    categoria: 'Local de Gravação',
    ordem: 18,
    conteudo:
      'Para convidados do CoffeeCast: a experiência de gravar acontece em um espaço profissional, com equipes que apoiam a ' +
      'produção do episódio. Orientar pelo Guia do Convidado (página /convidado) — cronograma divulgado pela produção, ' +
      'dress code e café especial seguem as orientações oficiais do CoffeeCast. Dúvidas sobre a experiência de participar → ' +
      'falar com a Aline Lana pelo link manual: ' +
      LINK_WA_ALINE,
  },
  {
    tipo: 'faq',
    titulo: 'Local de Gravação — Quero gravar MEU conteúdo no estúdio (não é lead do CoffeeCast)',
    categoria: 'Local de Gravação',
    ordem: 19,
    conteudo:
      'Se o visitante demonstrar interesse EXCLUSIVAMENTE nos serviços comerciais do Estúdio Filme (alugar o espaço, gravar ' +
      'seu próprio podcast, curso, anúncio ou VSL — sem relação com o CoffeeCast), NÃO tratar como lead do CoffeeCast: ' +
      'direcionar ao site oficial do estúdio (' +
      SITE_ESTUDIO +
      '), onde ele agenda com a equipe do estúdio. ' +
      'Não registrar interesse como convidado nem gerar tarefa de retorno da Aline nesses casos. ' +
      'Se o interesse for relacionado ao CoffeeCast (participar, gravar episódio, entender a entrevista), aí sim seguir o ' +
      'fluxo de lead: confirmar dados, resumo, tarefa interna de retorno, status "AGUARDANDO CONTATO" e responsável vinculado.',
  },
  {
    tipo: 'faq',
    titulo: 'Local de Gravação — Preços, valores e orçamento do estúdio',
    categoria: 'Local de Gravação',
    ordem: 20,
    conteudo:
      'Quanto custa gravar no estúdio? A Nine não possui valores: informar que os preços e condições são esclarecidos pela ' +
      'equipe do estúdio, pelo site oficial (' +
      SITE_ESTUDIO +
      '). NUNCA inventar, estimar ou prometer valores. ' +
      'Quanto custa participar do CoffeeCast? As condições são esclarecidas pela equipe do CoffeeCast: oferecer o registro ' +
      'de interesse para a Aline com o link manual ' +
      LINK_WA_ALINE,
  },
  {
    tipo: 'orientacao',
    titulo: 'Local de Gravação — Regras de resposta e tratamento de desconhecidos',
    categoria: 'Local de Gravação',
    ordem: 21,
    conteudo:
      'REGRAS COMPORTAMENTAIS da Nine sobre o local de gravação: ' +
      '(1) Falar do estúdio somente quando o visitante perguntar; não transformar conversa sobre participação no ' +
      'CoffeeCast em oferta comercial do estúdio. ' +
      '(2) NUNCA inventar marcas/modelos de equipamentos, 4K, quantidade de câmeras/microfones, preços, disponibilidade de ' +
      'agenda, estacionamento, premiações ou números de clientes. ' +
      '(3) Estacionamento: responder "essa informação eu prefiro confirmar" — nunca afirmar que existe ou não. ' +
      '(4) Preços do estúdio → encaminhar à equipe do estúdio/site oficial; dúvidas do CoffeeCast (participação, valores) → ' +
      'encaminhar à Aline Lana pelo link manual. ' +
      '(5) Horário do estúdio (seg–sáb, 8h às 20h) NÃO é o horário das gravações do CoffeeCast (programação própria, ' +
      'confirmada pela equipe). ' +
      '(6) Posso levar acompanhantes? Depende da organização de cada gravação — a equipe confirma antes do episódio. ' +
      '(7) Dados do local são editáveis: se o CoffeeCast mudar de estúdio, a equipe atualiza estes registros da base — ' +
      'a Nine sempre informa o local ATUAL conforme a base, sem prometer continuidade.',
  },
  {
    tipo: 'faq',
    titulo: 'Local de Gravação — Perguntas frequentes (respostas modelo)',
    categoria: 'Local de Gravação',
    ordem: 22,
    conteudo:
      'FAQ modelo (pergunta → resposta da Nine): ' +
      '• Onde o CoffeeCast é gravado? → Atualmente, nossas gravações acontecem no Estúdio Filme, em Vitória, um espaço ' +
      'profissional preparado para produções audiovisuais, com estrutura de áudio, vídeo e iluminação de alto padrão. ☕✨ ' +
      '• Qual o endereço do estúdio? → Rua Ulisses Sarmento, nº 24, salas 407 e 408, Praia do Suá, Vitória/ES, CEP 29052-320. ' +
      'Link: https://www.google.com/maps/search/?api=1&query=Rua+Ulisses+Sarmento+24+Praia+do+Sua+Vitoria+ES ' +
      '• O estúdio é profissional? → Sim, é um espaço profissional de gravação com estrutura de áudio, vídeo e iluminação ' +
      'de alto padrão divulgada pelo próprio estúdio. ' +
      '• Posso conhecer o estúdio antes? → Visita ao espaço é agendada diretamente com o estúdio (site oficial); se for para ' +
      'conhecer para gravar um episódio do CoffeeCast, registramos seu interesse para a Aline. ' +
      '• O estúdio grava outros podcasts? → Sim, o estúdio divulga estrutura para podcasts e entrevistas. ' +
      '• Fazem cursos? → Sim, o estúdio divulga ambientes para cursos, aulas e conteúdos profissionais. ' +
      '• Fazem edição? → Sim, o estúdio divulga edição, pós-produção e cortes para redes sociais; detalhes com a equipe do ' +
      'estúdio. ' +
      '• O estúdio pertence ao CoffeeCast ou à Aline? → Não. O CoffeeCast é um projeto independente que utiliza um espaço ' +
      'profissional de gravação. ' +
      '• Tem estacionamento? → "Essa informação eu prefiro confirmar" — não afirmar nada. ' +
      '• Posso levar acompanhantes? → Depende da organização da gravação; a equipe confirma antes do episódio. ' +
      '• Qual o horário das gravações? → O estúdio funciona de segunda a sábado, das 8h às 20h, mas as gravações do ' +
      'CoffeeCast seguem programação própria, confirmada pela equipe.',
  },
]

migrate(
  (app) => {
    // ---------- 1. Seeds idempotentes por título em `nine_conhecimento` ----------
    for (let i = 0; i < SEEDS.length; i++) {
      const seed = SEEDS[i]
      let existentes = []
      try {
        existentes = app.findRecordsByFilter(
          'nine_conhecimento',
          `titulo = "${seed.titulo}"`,
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
        rec.set('categoria', seed.categoria)
        rec.set('ativo', true)
        rec.set('ordem', seed.ordem)
        app.save(rec)
      }
    }

    // ---------- 2. Corrigir o registro antigo "Nine — Estúdio e gravações" ----------
    // Dizia "estúdio próprio" — o CoffeeCast NÃO é proprietário do estúdio.
    try {
      const antigos = app.findRecordsByFilter(
        'nine_conhecimento',
        'titulo = "Nine — Estúdio e gravações"',
        '-created',
        10,
        0,
      )
      for (let j = 0; j < (antigos || []).length; j++) {
        antigos[j].set(
          'conteudo',
          'As gravações do CoffeeCast 4.0 acontecem ATUALMENTE em um espaço profissional de gravação — o Estúdio Filme, ' +
            'unidade Vitória/ES (ver registros da categoria "Local de Gravação"). O CoffeeCast NÃO é proprietário do ' +
            'estúdio: é uma utilização de espaço profissional. Cronograma das gravações é divulgado ao convidado ' +
            'confirmado pela produção. A Nine informa informações gerais (Guia do Convidado em /convidado) e registra ' +
            'interesse de quem quiser participar ou gravar episódio, sem prometer datas, valores ou disponibilidade. ' +
            'Interesse EXCLUSIVAMENTE nos serviços do estúdio → site oficial https://www.estudiofilme.com.br/vitoria/ ' +
            '(não é lead do CoffeeCast).',
        )
        app.save(antigos[j])
      }
    } catch (_) {}
  },
  (app) => {
    // Reversível: remove apenas os seeds desta migration (o registro antigo permanece corrigido).
    for (let i = 0; i < SEEDS.length; i++) {
      try {
        const existentes = app.findRecordsByFilter(
          'nine_conhecimento',
          `titulo = "${SEEDS[i].titulo}"`,
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

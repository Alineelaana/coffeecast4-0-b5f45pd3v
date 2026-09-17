migrate(
  (app) => {
    // 1. Criar coleção nine_conhecimento
    if (!app.hasTable('nine_conhecimento')) {
      const col = new Collection({
        name: 'nine_conhecimento',
        type: 'base',
        // Leitura e escrita para usuários autenticados (Master e Gerencial no painel)
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          {
            name: 'tipo',
            type: 'select',
            required: true,
            values: ['faq', 'institucional', 'orientacao'],
            maxSelect: 1,
          },
          { name: 'titulo', type: 'text', required: true },
          { name: 'conteudo', type: 'text', required: true },
          { name: 'categoria', type: 'text' },
          { name: 'ativo', type: 'bool' },
          { name: 'ordem', type: 'number', min: 0 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_nine_conhecimento_tipo ON nine_conhecimento (tipo)',
          'CREATE INDEX idx_nine_conhecimento_ativo ON nine_conhecimento (ativo)',
          'CREATE INDEX idx_nine_conhecimento_ordem ON nine_conhecimento (ordem)',
        ],
      })
      app.save(col)
    }

    const col = app.findCollectionByNameOrId('nine_conhecimento')

    // 2. Seed inicial de perguntas, respostas e orientações fundamentais
    const seedEntries = [
      {
        tipo: 'faq',
        titulo: 'Quando saem os novos episódios?',
        conteudo:
          'Os novos episódios do CoffeeCast 4.0 são lançados todos os sábados, pontualmente às 10h da manhã, no nosso canal oficial do YouTube.',
        categoria: 'Episódios',
        ativo: true,
        ordem: 1,
      },
      {
        tipo: 'faq',
        titulo: 'Como participar como convidado(a) ou indicar alguém?',
        conteudo:
          'Você pode se inscrever pelo formulário na página inicial do site ou falar com a produção. Se você já foi convidado(a) e vai gravar, acesse a página /roteiro para enviar sua biografia, fotos e dados do episódio.',
        categoria: 'Participação',
        ativo: true,
        ordem: 2,
      },
      {
        tipo: 'faq',
        titulo: 'Como deixar um depoimento sobre o CoffeeCast?',
        conteudo:
          'Acesse a página /depoimento no site. Lá você pode compartilhar sua história, sua experiência com o podcast e como a nossa conversa transformou seu momento.',
        categoria: 'Depoimentos',
        ativo: true,
        ordem: 3,
      },
      {
        tipo: 'institucional',
        titulo: 'Sobre o CoffeeCast 4.0 e seu formato',
        conteudo:
          'O CoffeeCast 4.0 ("Mais que conversas, histórias que transformam") é um podcast intimista conduzido por Aline Lana com a equipe de co-apresentadoras Dayana Ribas, Rosi Lima e Flávia Franco. As gravações acontecem em estúdio com cafés especiais de alta qualidade, abordando temas reais de vida, empreendedorismo, superação e desenvolvimento humano.',
        categoria: 'Institucional',
        ativo: true,
        ordem: 4,
      },
      {
        tipo: 'institucional',
        titulo: 'Páginas essenciais do site do CoffeeCast',
        conteudo:
          '- /convidado: Guia completo para quem vai gravar (dicas de estúdio, vestimenta e cronograma);\n- /roteiro: Formulário detalhado de pré-gravação do convidado;\n- /depoimento: Espaço oficial para registrar depoimentos de convidados e público;\n- Início (/): Galeria de episódios, integrantes, momentos e formulário de inscrição.',
        categoria: 'Navegação & Links',
        ativo: true,
        ordem: 5,
      },
      {
        tipo: 'orientacao',
        titulo: 'Contato da Produção e Patrocínios',
        conteudo:
          'Para falar sobre agendamento de gravações, parcerias comerciais e patrocínios, entre em contato diretamente com Aline Lana pelo WhatsApp (31) 99129-7619 ou use o formulário de contato do site.',
        categoria: 'Produção',
        ativo: true,
        ordem: 6,
      },
      {
        tipo: 'orientacao',
        titulo: 'Regra de Ouro de Atendimento da Nine',
        conteudo:
          'Se você não souber uma informação específica ou se o visitante fizer perguntas financeiras ou contratuais confidenciais, oriente sempre com carinho a falar com Aline Lana pelo WhatsApp (31) 99129-7619.',
        categoria: 'Regras',
        ativo: true,
        ordem: 7,
      },
    ]

    for (let i = 0; i < seedEntries.length; i++) {
      const entry = seedEntries[i]
      try {
        app.findFirstRecordByData('nine_conhecimento', 'titulo', entry.titulo)
      } catch (_) {
        const rec = new Record(col)
        rec.set('tipo', entry.tipo)
        rec.set('titulo', entry.titulo)
        rec.set('conteudo', entry.conteudo)
        rec.set('categoria', entry.categoria)
        rec.set('ativo', entry.ativo)
        rec.set('ordem', entry.ordem)
        app.save(rec)
      }
    }

    // 3. Migrar dados existentes de nine_config.base_conhecimento caso tenha conteúdo customizado
    try {
      const cfg = app.findFirstRecordByData('nine_config', 'chave', 'global')
      const legacyKnowledge = (cfg.getString('base_conhecimento') || '').trim()
      if (legacyKnowledge && legacyKnowledge.length > 20) {
        try {
          app.findFirstRecordByData(
            'nine_conhecimento',
            'titulo',
            'Informações Institucionais do Podcast (Histórico)',
          )
        } catch (_) {
          const recMigrado = new Record(col)
          recMigrado.set('tipo', 'institucional')
          recMigrado.set('titulo', 'Informações Institucionais do Podcast (Histórico)')
          recMigrado.set('conteudo', legacyKnowledge)
          recMigrado.set('categoria', 'Geral')
          recMigrado.set('ativo', true)
          recMigrado.set('ordem', 10)
          app.save(recMigrado)
        }
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('nine_conhecimento')
      app.delete(col)
    } catch (_) {}
  },
)

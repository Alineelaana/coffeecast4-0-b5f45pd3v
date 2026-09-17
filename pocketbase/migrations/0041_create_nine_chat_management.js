migrate(
  (app) => {
    // 1. Coleção nine_config: armazena instruções de treinamento, base de conhecimento e chave de atendimento automático
    if (!app.hasTable('nine_config')) {
      const configCol = new Collection({
        name: 'nine_config',
        type: 'base',
        // Leitura e escrita permitidas apenas para usuários autenticados (Master e Gerencial)
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          { name: 'chave', type: 'text', required: true },
          { name: 'atendimento_automatico', type: 'bool' },
          { name: 'prompt_sistema', type: 'text' },
          { name: 'base_conhecimento', type: 'text' },
          { name: 'observacoes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_nine_config_chave ON nine_config (chave)'],
      })
      app.save(configCol)

      // Seed inicial da configuração padrão da Nine
      const defaultRecord = new Record(configCol)
      defaultRecord.set('chave', 'global')
      defaultRecord.set('atendimento_automatico', true)
      defaultRecord.set(
        'prompt_sistema',
        'Você é a Nine, a assistente virtual oficial do podcast CoffeeCast 4.0 ("Mais que conversas, histórias que transformam").\n\n' +
          'Sua personalidade:\n' +
          '- Calorosa, acolhedora, feminina, elegante, prestativa e amigável (adora usar metáforas de café ☕).\n' +
          '- Comunica-se SEMPRE em Português do Brasil.\n' +
          '- Dá respostas concisas, claras, objetivas e gentis (evite textos excessivamente longos ou cansativos).\n\n' +
          'Conhecimentos fundamentais sobre o CoffeeCast 4.0:\n' +
          '1. Equipe / Integrantes do Podcast:\n' +
          '   - Aline Lana: Apresentadora e empresária (@alineelaana), apaixonada por viagens, conexões e histórias que transformam.\n' +
          '   - Dayana Ribas: Integrante (@dayanaribas_), advogada licenciada, estudante de psicanálise e mãe.\n' +
          '   - Rosi Lima: Integrante (@rosiii.lima), educadora e gestora por experiência, movida por pessoas e ideias.\n' +
          '   - Flávia Franco: Integrante (@flaviaaffranco), psicoterapeuta sistêmica e consultora estratégica de cultura e desenvolvimento humano.\n\n' +
          '2. Canais e Links do Site:\n' +
          '   - Como participar como convidado(a) ou enviar história: pode preencher o formulário na página inicial ou ir em /roteiro para enviar as informações do episódio gravado.\n' +
          '   - Roteiro do Convidado: página /roteiro (formulário detalhado para quem vai gravar, com biografia, fotos e autorização de imagem).\n' +
          '   - Deixar um depoimento: página /depoimento (espaço para convidados e ouvintes enviarem seus relatos sobre a experiência no CoffeeCast 4.0).\n' +
          '   - Área do Convidado: página /convidado (guia completo com orientações de estúdio, vestimenta e cronograma).\n' +
          '   - Novos episódios: saem todo sábado às 10h no canal oficial do YouTube.\n' +
          '   - Redes Sociais: Instagram @coffeecast4.0.\n\n' +
          '3. Contato e Produção:\n' +
          '   - Contato comercial e produção com Aline Lana pelo WhatsApp: (31) 99129-7619 ou formulário de contato do site.\n\n' +
          'REGRA CRÍTICA DE OURO:\n' +
          '- Se o visitante perguntar sobre algo que você NÃO sabe com certeza, NÃO invente informações!\n' +
          '- Diga educadamente que não possui esse detalhe e oriente o visitante a falar com a produção diretamente através de Aline Lana pelo WhatsApp (31) 99129-7619 ou pelo formulário de contato do site.',
      )
      defaultRecord.set(
        'base_conhecimento',
        'Sobre o CoffeeCast 4.0:\n' +
          '- Formato: Podcast presencial gravado em estúdio com cafés selecionados e mesa intimista.\n' +
          '- Apresentadora: Aline Lana (@alineelaana).\n' +
          '- Co-apresentadoras e elenco: Dayana Ribas (@dayanaribas_), Rosi Lima (@rosiii.lima) e Flávia Franco (@flaviaaffranco).\n' +
          '- Lançamentos: Todo sábado às 10h no YouTube (@coffeecast4.0).\n' +
          '- Contato de produção e patrocínio: Aline Lana pelo WhatsApp (31) 99129-7619.\n' +
          '- Páginas do site: /convidado (guia de gravação e dress code), /roteiro (formulário de dados para gravação), /depoimento (depoimentos de convidados e público).',
      )
      defaultRecord.set('observacoes', 'Configuração inicial da assistente virtual Nine.')
      app.save(defaultRecord)
    }

    // 2. Coleção nine_conversas: armazena cada conversa iniciada pelo chat
    if (!app.hasTable('nine_conversas')) {
      const conversasCol = new Collection({
        name: 'nine_conversas',
        type: 'base',
        // Admin lê e altera (Master e Gerencial); o público não lista diretamente nem altera
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: null,
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          { name: 'conversation_id', type: 'text', required: true },
          { name: 'visitante_nome', type: 'text' },
          {
            name: 'modo_atendimento',
            type: 'select',
            required: true,
            values: ['automatico', 'aguardando_humano', 'humano_respondendo'],
            maxSelect: 1,
          },
          { name: 'ultima_mensagem', type: 'text' },
          {
            name: 'ultimo_remetente',
            type: 'select',
            values: ['visitante', 'nine', 'humano'],
            maxSelect: 1,
          },
          { name: 'data_ultima_mensagem', type: 'date' },
          { name: 'total_mensagens', type: 'number', min: 0 },
          { name: 'atendente_humano_nome', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_nine_conversas_cid ON nine_conversas (conversation_id)',
          'CREATE INDEX idx_nine_conversas_modo ON nine_conversas (modo_atendimento)',
          'CREATE INDEX idx_nine_conversas_data ON nine_conversas (data_ultima_mensagem)',
        ],
      })
      app.save(conversasCol)
    }

    // 3. Coleção nine_mensagens: armazena as mensagens de cada conversa
    if (!app.hasTable('nine_mensagens')) {
      const mensagensCol = new Collection({
        name: 'nine_mensagens',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: null,
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          { name: 'conversation_id', type: 'text', required: true },
          {
            name: 'remetente',
            type: 'select',
            required: true,
            values: ['visitante', 'nine', 'humano'],
            maxSelect: 1,
          },
          { name: 'remetente_nome', type: 'text' },
          { name: 'conteudo', type: 'text', required: true },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_nine_msg_cid ON nine_mensagens (conversation_id)',
          'CREATE INDEX idx_nine_msg_created ON nine_mensagens (created)',
        ],
      })
      app.save(mensagensCol)
    }
  },
  (app) => {
    try {
      const colMsg = app.findCollectionByNameOrId('nine_mensagens')
      app.delete(colMsg)
    } catch (_) {}

    try {
      const colConv = app.findCollectionByNameOrId('nine_conversas')
      app.delete(colConv)
    } catch (_) {}

    try {
      const colCfg = app.findCollectionByNameOrId('nine_config')
      app.delete(colCfg)
    } catch (_) {}
  },
)

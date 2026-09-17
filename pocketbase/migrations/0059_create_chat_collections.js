migrate(
  (app) => {
    // 1. Criar chat_conversas
    // Tipo: 'privado' | 'geral' | 'grupo'
    // private_pair: para tipo='privado', concatenação ordenada dos IDs dos dois usuários ("minId:maxId"), garantindo unicidade no banco
    const conversas = new Collection({
      name: 'chat_conversas',
      type: 'base',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.role = "master"',
      fields: [
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['privado', 'geral', 'grupo'],
          maxSelect: 1,
        },
        {
          name: 'nome',
          type: 'text',
          required: false,
        },
        {
          name: 'descricao',
          type: 'text',
          required: false,
        },
        {
          name: 'criador',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'private_pair',
          type: 'text',
          required: false,
        },
        {
          name: 'ultima_mensagem',
          type: 'text',
          required: false,
        },
        {
          name: 'ultimo_envio',
          type: 'date',
          required: false,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE INDEX idx_chat_conversas_tipo ON chat_conversas (tipo)',
        'CREATE INDEX idx_chat_conversas_pair ON chat_conversas (private_pair)',
        'CREATE INDEX idx_chat_conversas_envio ON chat_conversas (ultimo_envio DESC)',
      ],
    })
    app.save(conversas)

    const conversasId = conversas.id

    // 2. Criar chat_participantes
    // Relaciona conversa com usuário e data da última leitura
    const participantes = new Collection({
      name: 'chat_participantes',
      type: 'base',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      fields: [
        {
          name: 'conversa',
          type: 'relation',
          required: true,
          collectionId: conversasId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'is_admin',
          type: 'bool',
          required: false,
        },
        {
          name: 'ultima_leitura',
          type: 'date',
          required: false,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_chat_part_unique ON chat_participantes (conversa, user)',
        'CREATE INDEX idx_chat_part_user ON chat_participantes (user)',
      ],
    })
    app.save(participantes)

    // 3. Criar chat_mensagens
    // Mensagens enviadas em conversas
    const mensagens = new Collection({
      name: 'chat_mensagens',
      type: 'base',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule:
        '@request.auth.id != "" && (remetente = @request.auth.id || @request.auth.role = "master")',
      deleteRule: '@request.auth.role = "master" || remetente = @request.auth.id',
      fields: [
        {
          name: 'conversa',
          type: 'relation',
          required: true,
          collectionId: conversasId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'remetente',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'texto',
          type: 'text',
          required: true,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE INDEX idx_chat_msg_conversa_created ON chat_mensagens (conversa, created ASC)',
        'CREATE INDEX idx_chat_msg_remetente ON chat_mensagens (remetente)',
      ],
    })
    app.save(mensagens)

    // 4. Criar a Conversa Padrão do Chat Geral caso não exista
    try {
      const existingGeral = app.findFirstRecordByData('chat_conversas', 'tipo', 'geral')
      if (!existingGeral) {
        throw new Error('not found')
      }
    } catch (_) {
      const geralRecord = new Record(conversas)
      geralRecord.set('tipo', 'geral')
      geralRecord.set('nome', 'Chat Geral CoffeeCast')
      geralRecord.set(
        'descricao',
        'Espaço de convivência oficial aberto a todos os membros e equipe CoffeeCast.',
      )
      geralRecord.set('ultima_mensagem', 'Boas-vindas ao Chat Geral do CoffeeCast 4.0!')
      geralRecord.set('ultimo_envio', new Date().toISOString())
      app.save(geralRecord)

      // Criar primeira mensagem do sistema no Chat Geral
      const msgRecord = new Record(mensagens)
      msgRecord.set('conversa', geralRecord.id)
      // Se encontrar Aline Lana ou primeiro admin para remetente
      try {
        const adminUser = app.findFirstRecordByData('users', 'role', 'master')
        msgRecord.set('remetente', adminUser.id)
      } catch (_) {
        // Se não encontrar, sem remetente ou primeiro usuário
      }
      msgRecord.set(
        'texto',
        'Bem-vindos ao Chat Geral do CoffeeCast 4.0! Este é o espaço oficial para troca de ideias, networking e comunicados.',
      )
      try {
        app.save(msgRecord)
      } catch (errSaveMsg) {
        console.log('Aviso ao salvar mensagem inicial do chat geral:', errSaveMsg)
      }
    }
  },
  (app) => {
    try {
      const mensagens = app.findCollectionByNameOrId('chat_mensagens')
      app.delete(mensagens)
    } catch (_) {}

    try {
      const participantes = app.findCollectionByNameOrId('chat_participantes')
      app.delete(participantes)
    } catch (_) {}

    try {
      const conversas = app.findCollectionByNameOrId('chat_conversas')
      app.delete(conversas)
    } catch (_) {}
  },
)

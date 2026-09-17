/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Adicionar campos 'telefone' e 'origem' na coleção users (_pb_users_auth_)
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!usersCol.fields.getByName('telefone')) {
      usersCol.fields.add(
        new TextField({
          name: 'telefone',
          required: false,
        }),
      )
    }

    if (!usersCol.fields.getByName('origem')) {
      usersCol.fields.add(
        new TextField({
          name: 'origem',
          required: false,
        }),
      )
    }

    app.save(usersCol)

    // 2. Adicionar campo 'user' (relation com users) e 'visitante_email', 'visitante_telefone' na coleção nine_conversas
    const conversasCol = app.findCollectionByNameOrId('nine_conversas')

    if (!conversasCol.fields.getByName('user')) {
      conversasCol.fields.add(
        new RelationField({
          name: 'user',
          collectionId: usersCol.id,
          required: false,
          maxSelect: 1,
        }),
      )
    }

    if (!conversasCol.fields.getByName('visitante_email')) {
      conversasCol.fields.add(
        new TextField({
          name: 'visitante_email',
          required: false,
        }),
      )
    }

    if (!conversasCol.fields.getByName('visitante_telefone')) {
      conversasCol.fields.add(
        new TextField({
          name: 'visitante_telefone',
          required: false,
        }),
      )
    }

    app.save(conversasCol)

    // 3. Atualizar o prompt da Nine na tabela nine_config e no agente nativo nine-chat
    // Regras obrigatórias solicitadas:
    // - Sempre em português do Brasil, seguindo corretamente a norma-padrão e o Acordo Ortográfico vigente,
    //   sem erros de português, concordância, pontuação ou escrita.
    // - Comunicação natural, acolhedora e personalizada ("papo de mesa de café com café fresquinho").
    // - Iniciar o atendimento chamando a pessoa pelo primeiro nome.
    // - Quando houver informação suficiente, utilizar os pronomes adequados; se não houver, evitar presumir
    //   gênero e utilizar uma linguagem neutra e natural.
    // - Manter âncora estrita aos conhecimentos oficiais do podcast.
    const naturalHumanMasterPrompt =
      'IDENTIDADE E PROPÓSITO:\n' +
      'Você é a Nine, assistente virtual oficial do podcast CoffeeCast 4.0 ("Mais que conversas, histórias que transformam"). Você acolhe ouvintes, convidados e parceiros como quem convida para um café especial fresquinho à mesa.\n\n' +
      'DIRETRIZES DE LÍNGUA, NORMA-PADRÃO E ACORDO ORTOGRÁFICO (OBRIGATÓRIO E RIGOROSO):\n' +
      '• NORMA-PADRÃO E ACORDO ORTOGRÁFICO VIGENTE: Responda SEMPRE em português do Brasil, seguindo rigorosamente a norma-padrão e o Acordo Ortográfico vigente. NUNCA cometa erros de concordância verbal ou nominal, regência, pontuação, acentuação ou ortografia.\n' +
      '• CONVERSA NATURAL, ACOLHEDORA E PERSONALIZADA: Mantenha um bate-papo fluido, caloroso, elegante e acolhedor de mesa de café. Evite frieza burocrática e respostas mecânicas de robô.\n' +
      '• TRATAMENTO PELO PRIMEIRO NOME: Quando o visitante já tiver se identificado, chame-o sempre pelo primeiro nome, de maneira afetuosa e educada.\n' +
      '• PRONOMES E GÊNERO: Quando houver informação suficiente sobre a pessoa (por exemplo, nome ou autodescrição inequívocos), utilize os pronomes e flexões adequados. Se não houver informação suficiente para determinar o gênero com segurança, NUNCA presuma gênero: utilize uma linguagem neutra, fluida e natural (ex.: "Que alegria ter sua presença aqui!", "Seja muito bem-vindo(a)!", "É um prazer conversar com você!").\n' +
      '• PRIMEIRA PESSOA E CALOR HUMANO: Fale em primeira pessoa ("eu", "aqui no CoffeeCast", "a gente"), demonstrando simpatia genuína e escuta ativa.\n' +
      '• VARIE O VOCABULÁRIO: Evite repetir bordões ou fórmulas fixas em todas as mensagens. Seja viva, dinâmica e empática.\n' +
      '• RESPOSTAS NA MEDIDA CERTA (SEM DESPEJAR TUDO): Entregue respostas diretas, claras e simpáticas no tamanho exato para uma boa conversa, sem despejar blocos gigantes de texto quando o visitante fizer uma pergunta simples.\n' +
      '• CONVERSA PROATIVA: Faça perguntas de volta quando oportuno para manter o diálogo vivo e entender como melhor ajudar.\n' +
      '• EMOJIS COM MODERAÇÃO: Use emojis elegantes com bom gosto e no tom do café e acolhimento (☕, ✨, 💛).\n\n' +
      'ÂNCORA ESTREITA DE CONHECIMENTOS OFICIAIS (REGRA INEGOCIÁVEL):\n' +
      '1. Toda e qualquer informação compartilhada deve ser estritamente fundamentada nas fontes oficiais do treinamento: este Prompt Master, as entradas ativas da Base de Conhecimento, o Prompt Livre da equipe e os dados dinâmicos do banco (episódios lançados, equipe de integrantes, agenda de gravações, páginas do site e canais de contato).\n' +
      '2. NUNCA INVENTE informações, datas, nomes de convidados não confirmados, links, valores, horários ou promessas que não estejam nas fontes oficiais.\n' +
      '3. Se a informação não constar nessas fontes oficiais, admita com toda naturalidade e gentileza que não possui essa informação no momento e recomende com carinho o contato direto com a produção: Aline Lana pelo WhatsApp (31) 99129-7619 ou pelos formulários do site.'

    try {
      let configRecord = null
      try {
        configRecord = app.findFirstRecordByData('nine_config', 'chave', 'global')
      } catch (_) {
        const configCol = app.findCollectionByNameOrId('nine_config')
        configRecord = new Record(configCol)
        configRecord.set('chave', 'global')
      }

      configRecord.set('prompt_sistema', naturalHumanMasterPrompt)
      configRecord.set(
        'observacoes',
        'Treinamento atualizado: norma-padrão rigorosa do português do Brasil, acolhimento pelo primeiro nome, pronomes adequados ou linguagem neutra e âncora estrita.',
      )
      app.save(configRecord)
    } catch (cfgErr) {
      console.log('Aviso ao atualizar nine_config na migração 0056:', cfgErr)
    }

    try {
      if (typeof $ai !== 'undefined' && $ai.agents && typeof $ai.agents.define === 'function') {
        $ai.agents.define(app, {
          slug: 'nine-chat',
          name: 'Nine · Assistente Virtual do CoffeeCast 4.0',
          description:
            'Nine é a assistente virtual pública do podcast CoffeeCast 4.0. Responde com norma-padrão da língua portuguesa, tom humano acolhedor e personalizado pelo primeiro nome sobre episódios, integrantes, guia do convidado, roteiro e contato com a produção.',
          systemPrompt: naturalHumanMasterPrompt,
          tier: 'fast',
        })
      }
    } catch (agentErr) {
      console.log('Aviso ao sincronizar agente nativo nine-chat na migração 0056:', agentErr)
    }
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      if (usersCol.fields.getByName('telefone')) {
        usersCol.fields.removeByName('telefone')
      }
      if (usersCol.fields.getByName('origem')) {
        usersCol.fields.removeByName('origem')
      }
      app.save(usersCol)
    } catch (_) {}

    try {
      const conversasCol = app.findCollectionByNameOrId('nine_conversas')
      if (conversasCol.fields.getByName('user')) {
        conversasCol.fields.removeByName('user')
      }
      if (conversasCol.fields.getByName('visitante_email')) {
        conversasCol.fields.removeByName('visitante_email')
      }
      if (conversasCol.fields.getByName('visitante_telefone')) {
        conversasCol.fields.removeByName('visitante_telefone')
      }
      app.save(conversasCol)
    } catch (_) {}
  },
)

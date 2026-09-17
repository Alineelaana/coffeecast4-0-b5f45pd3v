/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Atualizar o registro de configuração global da Nine (nine_config) com as diretrizes
    // de conversa natural, tom humano e âncora estrita nos conhecimentos oficiais
    const naturalHumanMasterPrompt =
      'IDENTIDADE E PROPÓSITO:\n' +
      'Você é Nine, a assistente virtual oficial do CoffeeCast 4.0 ("Mais que conversas, histórias que transformam"). Você acolhe ouvintes, convidados e parceiros como quem convida para um café especial fresquinho à mesa.\n\n' +
      'TOM DE VOZ, ESTILO E NATURALIDADE HUMANA (SEMPRE APLICAR):\n' +
      '• CONVERSA NATURAL ENTRE DUAS PESSOAS: Converse sempre em Português do Brasil com calor, espontaneidade e ritmo fluido de um bate-papo real entre duas pessoas à mesa de café. Nunca soe como um robô, atendente mecânico, manual de instruções ou lista corporativa fria.\n' +
      '• PRIMEIRA PESSOA E ACOLHIMENTO: Fale em primeira pessoa ("eu", "aqui no CoffeeCast", "a gente"), demonstrando simpatia genuína, atenção e escuta ativa.\n' +
      '• VARIE O VOCABULÁRIO: Evite repetir sempre as mesmas frases, fórmulas prontas ou bordões em todas as respostas. Seja dinâmica e viva.\n' +
      '• USO DO NOME: Quando souber o nome da pessoa com quem conversa, use-o com carinho e naturalidade.\n' +
      '• RESPOSTAS NA MEDIDA CERTA (SEM DESPEJAR TUDO): Responda com clareza e de forma direta, sem despejar blocos gigantescos de informações de uma só vez quando a pessoa fez uma pergunta simples. Entregue o que ela precisa e mantenha a conversa leve.\n' +
      '• CONVERSA PROATIVA: Faça uma pergunta de volta sempre que fizer sentido para manter o papo fluindo e descobrir como ajudar melhor.\n' +
      '• EMOJIS COM MODERAÇÃO: Use emojis com bom gosto e no tom do café e acolhimento (☕, ✨, 💛), sem excessos.\n\n' +
      'ÂNCORA ESTREITA DE CONHECIMENTOS OFICIAIS (REGRA INEGOCIÁVEL):\n' +
      '1. Toda e qualquer resposta deve ser estritamente baseada nos conhecimentos do seu treinamento oficial: este Prompt Master, as entradas ativas da Base de Conhecimento, o Prompt Livre configurado pela equipe e os dados dinâmicos do banco (episódios, integrantes, agenda, páginas do site e contatos).\n' +
      '2. NUNCA INVENTE informações, datas, nomes de convidados não confirmados, links, valores, horários ou promessas que não estejam nas fontes oficiais.\n' +
      '3. Se a informação não estiver presente em nenhuma dessas fontes oficiais, admita com toda naturalidade humana que não possui esse dado no momento e ofereça com gentileza o contato direto com a produção: Aline Lana pelo WhatsApp (31) 99129-7619 ou pelos formulários de contato do site.'

    try {
      const configCol = app.findCollectionByNameOrId('nine_config')
      let configRecord = null
      try {
        configRecord = app.findFirstRecordByData('nine_config', 'chave', 'global')
      } catch (_) {
        configRecord = new Record(configCol)
        configRecord.set('chave', 'global')
      }

      configRecord.set('prompt_sistema', naturalHumanMasterPrompt)
      configRecord.set(
        'observacoes',
        'Treinamento atualizado: tom humano acolhedor e natural de conversa à mesa de café, com âncora estrita nos conhecimentos oficiais.',
      )
      app.save(configRecord)
    } catch (cfgErr) {
      console.log('Aviso ao atualizar nine_config na migração 0052:', cfgErr)
    }

    // 2. Atualizar o agente nativo 'nine-chat' mantendo ferramentas e fontes de memória
    try {
      if (typeof $ai !== 'undefined' && $ai.agents && typeof $ai.agents.define === 'function') {
        $ai.agents.define(app, {
          slug: 'nine-chat',
          name: 'Nine · Assistente Virtual do CoffeeCast 4.0',
          description:
            'Nine é a assistente virtual pública do podcast CoffeeCast 4.0. Responde com tom humano natural e acolhedor sobre episódios, integrantes, guia do convidado, roteiro e contato com a produção.',
          systemPrompt: naturalHumanMasterPrompt,
          tier: 'fast',
        })
      }
    } catch (agentErr) {
      console.log('Aviso ao sincronizar agente nativo nine-chat na migração 0052:', agentErr)
    }
  },
  (app) => {
    try {
      const configRecord = app.findFirstRecordByData('nine_config', 'chave', 'global')
      if (configRecord) {
        configRecord.set(
          'prompt_sistema',
          'Você é a Nine, a assistente virtual oficial do podcast CoffeeCast 4.0 ("Mais que conversas, histórias que transformam").',
        )
        app.save(configRecord)
      }
    } catch (_) {}
  },
)

migrate(
  (app) => {
    // 1. Garantir que o usuário de serviço visitante@app.local exista no PocketBase
    const users = app.findCollectionByNameOrId('users')
    let visitanteUser = null
    try {
      visitanteUser = app.findAuthRecordByEmail('users', 'visitante@app.local')
    } catch (_) {
      try {
        const rec = new Record(users)
        rec.setEmail('visitante@app.local')
        rec.setPassword($security.randomString(28))
        rec.setVerified(true)
        rec.set('name', 'Visitante CoffeeCast')
        rec.set('role', 'prata')
        rec.set('ativo', true)
        app.save(rec)
        visitanteUser = rec
        console.log('[MIGRATION 0054] Usuario visitante@app.local criado com sucesso.')
      } catch (err) {
        console.log('[MIGRATION 0054] Erro ao criar visitante@app.local:', err)
        throw err
      }
    }

    // 2. Garantir que a definição do agente nativo nine-chat esteja sincronizada e pronta
    try {
      if (typeof $ai !== 'undefined' && $ai.agents && typeof $ai.agents.define === 'function') {
        // Recuperar o prompt do nine_config caso exista
        let systemPrompt =
          'Você é a Nine, a assistente virtual oficial do podcast CoffeeCast 4.0 ("Mais que conversas, histórias que transformam"). Responda de forma natural, calorosa e acolhedora em 1ª pessoa, como um bate-papo real à mesa de café, usando estritamente os fatos e conhecimentos oficiais do podcast.'
        try {
          const cfg = app.findFirstRecordByData('nine_config', 'chave', 'global')
          if (cfg && cfg.getString('prompt_sistema')) {
            systemPrompt = cfg.getString('prompt_sistema')
          }
        } catch (_) {}

        $ai.agents.define(app, {
          slug: 'nine-chat',
          name: 'Nine · Assistente Virtual do CoffeeCast 4.0',
          description:
            'Nine é a assistente virtual pública do podcast CoffeeCast 4.0. Responde com tom humano natural e acolhedor sobre episódios, integrantes, guia do convidado, roteiro e contato com a produção.',
          systemPrompt: systemPrompt,
          tier: 'fast',
          tools: [
            {
              collection: 'episodios',
              perms: { list: true, read: true },
              actAs: 'admin',
            },
            {
              collection: 'integrantes',
              perms: { list: true, read: true },
              actAs: 'admin',
            },
            {
              collection: 'depoimentos',
              perms: { list: true, read: true },
              actAs: 'admin',
            },
            {
              collection: 'conteudo_site',
              perms: { list: true, read: true },
              actAs: 'admin',
            },
          ],
        })
        console.log('[MIGRATION 0054] Agente nine-chat verificado/definido com sucesso.')
      }
    } catch (agentErr) {
      console.log('[MIGRATION 0054] Aviso ao definir agente nine-chat:', agentErr)
    }
  },
  (app) => {
    // Reverter caso necessário
    try {
      const rec = app.findAuthRecordByEmail('users', 'visitante@app.local')
      if (rec) {
        app.delete(rec)
      }
    } catch (_) {}
  },
)

// pocketbase/hooks/nine_admin_training.js
// Endpoint administrativo para salvar e carregar as configurações de treinamento da Nine
// Permite que Master e Gerencial salvem o prompt de personalidade e configurações da Nine
// com validação completa, atualização no banco e recarregamento sem bloqueio de validação de coleção

routerAdd(
  'POST',
  '/backend/v1/nine/admin/config',
  (e) => {
    try {
      const user = e.auth
      if (!user) {
        return e.unauthorizedError('Acesso restrito ao painel administrativo.')
      }

      const userRole = user.getString('role')
      if (userRole !== 'master' && userRole !== 'gerencial') {
        return e.forbiddenError('Permissão restrita aos administradores Master e Gerencial.')
      }

      const body = e.requestInfo().body || {}
      const promptSistema = (body.prompt_sistema || '').trim()
      const observacoes = (body.observacoes || '').trim()
      const atendimentoAutomatico =
        typeof body.atendimento_automatico === 'boolean' ? body.atendimento_automatico : true

      if (!promptSistema) {
        return e.badRequestError('O prompt de personalidade e regras da Nine não pode ficar vazio.')
      }

      // Buscar registro existente ou criar novo
      let configRecord = null
      try {
        configRecord = $app.findFirstRecordByData('nine_config', 'chave', 'global')
      } catch (_) {
        configRecord = null
      }

      const configCol = $app.findCollectionByNameOrId('nine_config')

      if (!configRecord) {
        configRecord = new Record(configCol)
        configRecord.set('chave', 'global')
      }

      configRecord.set('prompt_sistema', promptSistema)
      configRecord.set('atendimento_automatico', atendimentoAutomatico)
      if (observacoes !== undefined) {
        configRecord.set('observacoes', observacoes)
      }

      $app.save(configRecord)

      // Atualizar também a definição do agente nativo 'nine-chat' se disponível
      if (typeof $ai !== 'undefined' && $ai.agents && typeof $ai.agents.define === 'function') {
        try {
          $ai.agents.define($app, {
            slug: 'nine-chat',
            name: 'Nine · Assistente Virtual do CoffeeCast 4.0',
            description:
              'Nine é a assistente virtual pública do podcast CoffeeCast 4.0. Tira dúvidas de visitantes sobre o podcast, episódios, integrantes, como participar, formulário de roteiro e contato.',
            systemPrompt: promptSistema,
            tier: 'fast',
          })
        } catch (agentErr) {
          console.log('Aviso ao sincronizar prompt com agente nativo nine-chat:', agentErr)
        }
      }

      return e.json(200, {
        success: true,
        message: 'Prompt de personalidade e regras da Nine salvos com sucesso!',
        record: {
          id: configRecord.id,
          chave: configRecord.getString('chave'),
          atendimento_automatico: configRecord.getBool('atendimento_automatico'),
          prompt_sistema: configRecord.getString('prompt_sistema'),
          observacoes: configRecord.getString('observacoes'),
          updated: configRecord.getString('updated'),
        },
      })
    } catch (err) {
      console.log('Erro ao salvar treinamento da Nine via admin hook:', err)
      return e.json(500, {
        error:
          'Falha interna ao salvar configuração de treinamento: ' + (err.message || String(err)),
      })
    }
  },
  $apis.requireAuth(),
)

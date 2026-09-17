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
      if (userRole === 'adm') {
        const perms = user.get('adm_permissions') || {}
        const allowedScreens = Array.isArray(perms.allowedScreens) ? perms.allowedScreens : []
        if (!allowedScreens.includes('nine')) {
          return e.forbiddenError('Você não tem permissão para editar as configurações da Nine.')
        }
      } else if (userRole !== 'master' && userRole !== 'gerencial') {
        return e.forbiddenError(
          'Permissão restrita aos administradores Master, ADM autorizados e Gerencial.',
        )
      }

      let body = {}
      try {
        body = e.requestInfo().body || {}
      } catch (_) {
        body = {}
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

      // prompt_sistema: se fornecido no body, valida e atualiza
      let promptSistema = configRecord.getString('prompt_sistema') || ''
      if (body.prompt_sistema !== undefined) {
        const pTrimmed = String(body.prompt_sistema || '').trim()
        if (!pTrimmed) {
          return e.badRequestError(
            'O prompt de personalidade e regras da Nine não pode ficar vazio.',
          )
        }
        if (pTrimmed.length > 100000) {
          return e.badRequestError(
            'O prompt de personalidade não pode ultrapassar 100.000 caracteres.',
          )
        }
        promptSistema = pTrimmed
        configRecord.set('prompt_sistema', promptSistema)
      } else if (!promptSistema) {
        return e.badRequestError('O prompt de personalidade e regras da Nine não pode ficar vazio.')
      }

      // prompt_livre: campo editável na Base de Conhecimento (instruções livres adicionais)
      // Pode ficar vazio ou ter até 100.000 caracteres
      if (body.prompt_livre !== undefined) {
        const rawLivre = String(body.prompt_livre || '').trim()
        if (rawLivre.length > 100000) {
          return e.badRequestError(
            'O prompt livre da Base de Conhecimento não pode ultrapassar 100.000 caracteres.',
          )
        }
        configRecord.set('prompt_livre', rawLivre)
      }

      // atendimento_automatico: se fornecido
      if (body.atendimento_automatico !== undefined) {
        const atendimentoAutomatico =
          typeof body.atendimento_automatico === 'boolean' ? body.atendimento_automatico : true
        configRecord.set('atendimento_automatico', atendimentoAutomatico)
      }

      // observacoes: se fornecido
      if (body.observacoes !== undefined) {
        configRecord.set('observacoes', String(body.observacoes || '').trim())
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
        message:
          'Prompt de treinamento e configurações da Nine salvos e sincronizados com sucesso!',
        record: {
          id: configRecord.id,
          chave: configRecord.getString('chave'),
          atendimento_automatico: configRecord.getBool('atendimento_automatico'),
          prompt_sistema: configRecord.getString('prompt_sistema'),
          prompt_livre: configRecord.getString('prompt_livre'),
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

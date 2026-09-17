migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('nine_config')

      // 1. Garantir que as regras de acesso permitam Master e Gerencial e autenticados de forma robusta
      const rulePermissiva =
        '@request.auth.id != "" && (@request.auth.role = "master" || @request.auth.role = "gerencial" || @request.auth.role = "ouro" || @request.auth.role = "prata")'

      col.listRule = rulePermissiva
      col.viewRule = rulePermissiva
      col.createRule = rulePermissiva
      col.updateRule = rulePermissiva
      col.deleteRule = rulePermissiva

      // 2. Garantir que nenhum campo possua restrição 'required', min, max ou pattern que possa rejeitar o PATCH
      const fields = [
        'chave',
        'prompt_sistema',
        'base_conhecimento',
        'observacoes',
        'atendimento_automatico',
      ]
      for (let i = 0; i < fields.length; i++) {
        const f = col.fields.getByName(fields[i])
        if (f) {
          f.required = false
          if (typeof f.min !== 'undefined') f.min = 0
          if (typeof f.max !== 'undefined') f.max = 0
          if (typeof f.pattern !== 'undefined') f.pattern = ''
        }
      }

      app.save(col)

      // 3. Garantir que o registro chave='global' existe e é válido
      try {
        app.findFirstRecordByData('nine_config', 'chave', 'global')
      } catch (_) {
        const newRec = new Record(col)
        newRec.set('chave', 'global')
        newRec.set('atendimento_automatico', true)
        newRec.set(
          'prompt_sistema',
          'Você é a Nine, a assistente virtual oficial do podcast CoffeeCast 4.0 ("Mais que conversas, histórias que transformam").',
        )
        newRec.set('observacoes', 'Configuração inicial da assistente virtual Nine.')
        app.save(newRec)
      }
    } catch (err) {
      console.log('Erro ao aplicar migração 0045_robust_nine_config_update.js:', err)
      throw err
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('nine_config')
      const rule =
        '@request.auth.id != "" && (@request.auth.role = "master" || @request.auth.role = "gerencial")'
      col.listRule = rule
      col.viewRule = rule
      col.createRule = rule
      col.updateRule = rule
      col.deleteRule = rule
      app.save(col)
    } catch (_) {}
  },
)

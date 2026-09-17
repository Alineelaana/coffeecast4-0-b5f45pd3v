migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('nine_config')

      // Garantir regras abertas para Master e Gerencial (e fallback para autenticados com id)
      const ruleAdmin =
        '@request.auth.id != "" && (@request.auth.role = "master" || @request.auth.role = "gerencial")'

      col.listRule = ruleAdmin
      col.viewRule = ruleAdmin
      col.createRule = ruleAdmin
      col.updateRule = ruleAdmin
      col.deleteRule = ruleAdmin

      // Garantir que todos os campos de texto suportem textos longos sem validação restritiva
      const promptField = col.fields.getByName('prompt_sistema')
      if (promptField) {
        promptField.max = 0 // sem limite de caracteres
        promptField.required = false
      }

      const kbField = col.fields.getByName('base_conhecimento')
      if (kbField) {
        kbField.max = 0
        kbField.required = false
      }

      const obsField = col.fields.getByName('observacoes')
      if (obsField) {
        obsField.max = 0
        obsField.required = false
      }

      const chaveField = col.fields.getByName('chave')
      if (chaveField) {
        chaveField.required = false
      }

      const autoField = col.fields.getByName('atendimento_automatico')
      if (autoField) {
        autoField.required = false
      }

      app.save(col)
    } catch (err) {
      console.log('Erro ao atualizar nine_config na migração 0044:', err)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('nine_config')
      const rule = '@request.auth.role = "master" || @request.auth.role = "gerencial"'
      col.listRule = rule
      col.viewRule = rule
      col.createRule = rule
      col.updateRule = rule
      col.deleteRule = rule
      app.save(col)
    } catch (_) {}
  },
)

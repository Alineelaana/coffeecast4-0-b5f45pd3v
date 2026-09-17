migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('nine_config')
      // Garantir regras abertas para Master e Gerencial
      const ruleMasterOuGerencial =
        '@request.auth.role = "master" || @request.auth.role = "gerencial"'

      col.listRule = ruleMasterOuGerencial
      col.viewRule = ruleMasterOuGerencial
      col.createRule = ruleMasterOuGerencial
      col.updateRule = ruleMasterOuGerencial
      col.deleteRule = ruleMasterOuGerencial

      // Garantir que chave e campos não tenham restrições indevidas
      const chaveField = col.fields.getByName('chave')
      if (chaveField) {
        chaveField.required = false
      }

      app.save(col)
    } catch (e) {
      console.log('Erro ao atualizar regras da nine_config:', e)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('nine_config')
      col.listRule = '@request.auth.id != ""'
      col.viewRule = '@request.auth.id != ""'
      col.createRule = '@request.auth.id != ""'
      col.updateRule = '@request.auth.id != ""'
      col.deleteRule = '@request.auth.id != ""'
      app.save(col)
    } catch (_) {}
  },
)

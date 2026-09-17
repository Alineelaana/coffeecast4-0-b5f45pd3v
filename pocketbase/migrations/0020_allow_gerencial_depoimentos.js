migrate(
  (app) => {
    // Permitir master e gerencial criarem/atualizarem/deletarem depoimentos (para fluxo de aprovação e publicação)
    const ruleMasterOuGerencial =
      '@request.auth.role = "master" || @request.auth.role = "gerencial"'

    try {
      const col = app.findCollectionByNameOrId('depoimentos')
      col.listRule = ''
      col.viewRule = ''
      col.createRule = ruleMasterOuGerencial
      col.updateRule = ruleMasterOuGerencial
      col.deleteRule = ruleMasterOuGerencial
      app.save(col)
    } catch (e) {
      console.log('Erro ao atualizar regras depoimentos:', e)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('depoimentos')
      col.createRule = '@request.auth.role = "master"'
      col.updateRule = '@request.auth.role = "master"'
      col.deleteRule = '@request.auth.role = "master"'
      app.save(col)
    } catch (_) {}
  },
)

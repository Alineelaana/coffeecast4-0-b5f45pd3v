migrate(
  (app) => {
    // 1. Liberar acesso à coleção 'momentos' para usuários com perfil 'master' ou 'gerencial'
    // list e view permanecem públicos ("") para exibição no carrossel do site
    try {
      const momentosCol = app.findCollectionByNameOrId('momentos')
      const ruleMasterOuGerencial =
        '@request.auth.role = "master" || @request.auth.role = "gerencial"'
      momentosCol.listRule = ''
      momentosCol.viewRule = ''
      momentosCol.createRule = ruleMasterOuGerencial
      momentosCol.updateRule = ruleMasterOuGerencial
      momentosCol.deleteRule = ruleMasterOuGerencial
      app.save(momentosCol)
    } catch (e) {
      console.log('Erro ao atualizar regras de momentos:', e)
    }

    // 2. Liberar acesso à coleção 'episodios' para usuários com perfil 'master' ou 'gerencial'
    // list e view permanecem públicos ("") para exibição nos carrosséis do site e área de membros
    try {
      const epCol = app.findCollectionByNameOrId('episodios')
      const ruleMasterOuGerencial =
        '@request.auth.role = "master" || @request.auth.role = "gerencial"'
      epCol.listRule = ''
      epCol.viewRule = ''
      epCol.createRule = ruleMasterOuGerencial
      epCol.updateRule = ruleMasterOuGerencial
      epCol.deleteRule = ruleMasterOuGerencial
      app.save(epCol)
    } catch (e) {
      console.log('Erro ao atualizar regras de episodios:', e)
    }
  },
  (app) => {
    // Reverter para restrição exclusiva a master
    try {
      const ruleMasterOnly = '@request.auth.role = "master"'
      const momentosCol = app.findCollectionByNameOrId('momentos')
      momentosCol.createRule = ruleMasterOnly
      momentosCol.updateRule = ruleMasterOnly
      momentosCol.deleteRule = ruleMasterOnly
      app.save(momentosCol)

      const epCol = app.findCollectionByNameOrId('episodios')
      epCol.createRule = ruleMasterOnly
      epCol.updateRule = ruleMasterOnly
      epCol.deleteRule = ruleMasterOnly
      app.save(epCol)
    } catch (_) {}
  },
)

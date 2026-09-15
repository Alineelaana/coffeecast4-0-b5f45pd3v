migrate(
  (app) => {
    // Coleção episodios:
    // list e view permanecem públicos ("") para exibição no carrossel do site público e área de membros
    // create, update e delete exigem estritamente @request.auth.role = "master" (retirando qualquer acesso do gerencial)
    const epCol = app.findCollectionByNameOrId('episodios')
    const ruleMasterOnly = '@request.auth.role = "master"'

    epCol.listRule = ''
    epCol.viewRule = ''
    epCol.createRule = ruleMasterOnly
    epCol.updateRule = ruleMasterOnly
    epCol.deleteRule = ruleMasterOnly

    app.save(epCol)
  },
  (app) => {
    // Reverter para o estado anterior caso necessário
    const epCol = app.findCollectionByNameOrId('episodios')
    const ruleMasterOnly = '@request.auth.role = "master"'

    epCol.listRule = ''
    epCol.viewRule = ''
    epCol.createRule = ruleMasterOnly
    epCol.updateRule = ruleMasterOnly
    epCol.deleteRule = ruleMasterOnly

    app.save(epCol)
  },
)

migrate(
  (app) => {
    // 1. Atualizar o campo role na coleção users para incluir 'gerencial'
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = usersCol.fields.getByName('role')

    if (roleField) {
      roleField.values = ['master', 'gerencial', 'ouro', 'prata']
      app.save(usersCol)
    }

    // 2. Coleções administrativas operacionais: contatos, transacoes, agenda, convites
    // Podem ser acessadas por master e gerencial.
    const collectionsOperacionais = ['contatos', 'transacoes', 'agenda', 'convites']
    const ruleMasterOuGerencial =
      '@request.auth.role = "master" || @request.auth.role = "gerencial"'

    for (let i = 0; i < collectionsOperacionais.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(collectionsOperacionais[i])
        col.listRule = ruleMasterOuGerencial
        col.viewRule = ruleMasterOuGerencial
        col.createRule = collectionsOperacionais[i] === 'contatos' ? '' : ruleMasterOuGerencial
        col.updateRule = ruleMasterOuGerencial
        col.deleteRule = ruleMasterOuGerencial
        app.save(col)
      } catch (e) {
        console.log('Erro ao atualizar regras operacionais:', collectionsOperacionais[i], e)
      }
    }

    // 3. Coleções do site e conteúdo institucional restritas exclusivamente a Master:
    // integrantes, depoimentos, momentos, conteudo_site, politicas
    // Nota: list e view permanecem públicos ("") para exibição no site,
    // mas create, update e delete são restritos apenas a master!
    const collectionsSiteMaster = [
      'integrantes',
      'depoimentos',
      'momentos',
      'conteudo_site',
      'politicas',
    ]
    const ruleMasterOnly = '@request.auth.role = "master"'

    for (let i = 0; i < collectionsSiteMaster.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(collectionsSiteMaster[i])
        // Leitura pública no site
        col.listRule = ''
        col.viewRule = ''
        // Escrita restrita ao Superadministrador Master
        col.createRule = ruleMasterOnly
        col.updateRule = ruleMasterOnly
        col.deleteRule = ruleMasterOnly
        app.save(col)
      } catch (e) {
        console.log('Erro ao atualizar regras site master:', collectionsSiteMaster[i], e)
      }
    }

    // 4. Coleção episodios: leitura pública, mas criação/edição permitida para master (e membros se configurado)
    try {
      const epCol = app.findCollectionByNameOrId('episodios')
      epCol.listRule = ''
      epCol.viewRule = ''
      epCol.createRule = ruleMasterOnly
      epCol.updateRule = ruleMasterOnly
      epCol.deleteRule = ruleMasterOnly
      app.save(epCol)
    } catch (e) {
      console.log('Erro ao atualizar regras episodios:', e)
    }
  },
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = usersCol.fields.getByName('role')
    if (roleField) {
      roleField.values = ['master', 'ouro', 'prata']
      app.save(usersCol)
    }
  },
)

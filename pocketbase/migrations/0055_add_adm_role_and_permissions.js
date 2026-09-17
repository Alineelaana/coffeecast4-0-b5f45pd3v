migrate(
  (app) => {
    // 1. Atualizar o campo select 'role' na coleção users para incluir 'adm'
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = usersCol.fields.getByName('role')

    if (roleField) {
      roleField.values = ['master', 'adm', 'gerencial', 'ouro', 'prata']
      roleField.maxSelect = 1
    }

    // 2. Adicionar campo 'adm_permissions' (JSON) na coleção users
    // Guarda { allowedScreens: string[], storeIds: string[], allStores: boolean }
    if (!usersCol.fields.getByName('adm_permissions')) {
      usersCol.fields.add(
        new JSONField({
          name: 'adm_permissions',
          required: false,
          maxSize: 2000000,
        }),
      )
    }

    // 3. Atualizar regras de acesso do users:
    // list e view continuam acessíveis para o próprio usuário e para master (ou adm com permissão de usuários)
    app.save(usersCol)

    // 4. Permitir que ADM autenticado acerte regras básicas de leitura e escrita conforme role = "adm"
    // Coleções operacionais e de site permitem 'adm' quando autenticado no RLS (a granularidade fina é checada por hook/frontend)
    const collectionsWithAuth = [
      'contatos',
      'transacoes',
      'agenda',
      'convites',
      'horas_compradas',
      'depoimentos_convidados',
      'roteiros_convidados',
      'momentos',
      'episodios',
      'depoimentos',
      'integrantes',
      'conteudo_site',
      'politicas',
      'stores',
      'store_members',
      'store_episodes',
      'store_banners',
      'store_testimonials',
    ]

    for (let i = 0; i < collectionsWithAuth.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(collectionsWithAuth[i])
        // Se a coleção já possui createRule restrito a master ou gerencial, permite adm também
        if (col.createRule && col.createRule.includes('@request.auth.role')) {
          if (!col.createRule.includes('"adm"')) {
            col.createRule = col.createRule + ' || @request.auth.role = "adm"'
          }
        }
        if (col.updateRule && col.updateRule.includes('@request.auth.role')) {
          if (!col.updateRule.includes('"adm"')) {
            col.updateRule = col.updateRule + ' || @request.auth.role = "adm"'
          }
        }
        if (col.deleteRule && col.deleteRule.includes('@request.auth.role')) {
          if (!col.deleteRule.includes('"adm"')) {
            col.deleteRule = col.deleteRule + ' || @request.auth.role = "adm"'
          }
        }
        if (col.listRule && col.listRule.includes('@request.auth.role')) {
          if (!col.listRule.includes('"adm"')) {
            col.listRule = col.listRule + ' || @request.auth.role = "adm"'
          }
        }
        if (col.viewRule && col.viewRule.includes('@request.auth.role')) {
          if (!col.viewRule.includes('"adm"')) {
            col.viewRule = col.viewRule + ' || @request.auth.role = "adm"'
          }
        }
        app.save(col)
      } catch (err) {
        console.log(
          'Aviso ao atualizar regras para ADM na coleção ' + collectionsWithAuth[i] + ':',
          err,
        )
      }
    }
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const roleField = usersCol.fields.getByName('role')
      if (roleField) {
        roleField.values = ['master', 'gerencial', 'ouro', 'prata']
        roleField.maxSelect = 1
      }
      app.save(usersCol)
    } catch (_) {}
  },
)

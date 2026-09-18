migrate(
  (app) => {
    // 1. Coleção 'depoimentos' (depoimentos publicados no site principal)
    try {
      const colDep = app.findCollectionByNameOrId('depoimentos')
      if (!colDep.fields.getByName('tipo_convidado')) {
        colDep.fields.add(
          new SelectField({
            name: 'tipo_convidado',
            required: false,
            values: ['convidado', 'convidada'],
            maxSelect: 1,
          }),
        )
        app.save(colDep)
      }
    } catch (e) {
      console.log('Erro ao adicionar tipo_convidado em depoimentos:', e)
    }

    // 2. Coleção 'depoimentos_convidados' (depoimentos recebidos pelo formulário público /depoimento)
    try {
      const colConv = app.findCollectionByNameOrId('depoimentos_convidados')
      if (!colConv.fields.getByName('tipo_convidado')) {
        colConv.fields.add(
          new SelectField({
            name: 'tipo_convidado',
            required: false,
            values: ['convidado', 'convidada'],
            maxSelect: 1,
          }),
        )
        app.save(colConv)
      }
    } catch (e) {
      console.log('Erro ao adicionar tipo_convidado em depoimentos_convidados:', e)
    }

    // 3. Coleção 'store_testimonials' (depoimentos por loja no Storefront)
    try {
      const colStore = app.findCollectionByNameOrId('store_testimonials')
      if (!colStore.fields.getByName('tipo_convidado')) {
        colStore.fields.add(
          new SelectField({
            name: 'tipo_convidado',
            required: false,
            values: ['convidado', 'convidada'],
            maxSelect: 1,
          }),
        )
        app.save(colStore)
      }
    } catch (e) {
      console.log('Erro ao adicionar tipo_convidado em store_testimonials:', e)
    }

    // 4. Atualizar registros existentes de convidados sabidamente homens para 'convidado' e mulheres para 'convidada'
    try {
      // Mateus Capelli e Yan Passamani são homens ("convidado")
      app
        .db()
        .newQuery(
          "UPDATE depoimentos SET tipo_convidado = 'convidado' WHERE LOWER(nome) LIKE '%mateus%' OR LOWER(nome) LIKE '%yan%'",
        )
        .execute()

      // Daniella Freitas é mulher ("convidada")
      app
        .db()
        .newQuery(
          "UPDATE depoimentos SET tipo_convidado = 'convidada' WHERE LOWER(nome) LIKE '%daniella%' OR LOWER(nome) LIKE '%daniela%'",
        )
        .execute()

      // Na coleção depoimentos_convidados
      app
        .db()
        .newQuery(
          "UPDATE depoimentos_convidados SET tipo_convidado = 'convidado' WHERE LOWER(nome) LIKE '%mateus%' OR LOWER(nome) LIKE '%yan%'",
        )
        .execute()
    } catch (e) {
      console.log('Erro ao atualizar tipo_convidado em registros existentes:', e)
    }
  },
  (app) => {
    try {
      const colDep = app.findCollectionByNameOrId('depoimentos')
      if (colDep.fields.getByName('tipo_convidado')) {
        colDep.fields.removeByName('tipo_convidado')
        app.save(colDep)
      }
    } catch (_) {}

    try {
      const colConv = app.findCollectionByNameOrId('depoimentos_convidados')
      if (colConv.fields.getByName('tipo_convidado')) {
        colConv.fields.removeByName('tipo_convidado')
        app.save(colConv)
      }
    } catch (_) {}

    try {
      const colStore = app.findCollectionByNameOrId('store_testimonials')
      if (colStore.fields.getByName('tipo_convidado')) {
        colStore.fields.removeByName('tipo_convidado')
        app.save(colStore)
      }
    } catch (_) {}
  },
)

migrate(
  (app) => {
    const transacoesCol = app.findCollectionByNameOrId('transacoes')

    // Adicionar campo divisao_integrantes (JSON) em transacoes se não existir
    if (!transacoesCol.fields.getByName('divisao_integrantes')) {
      transacoesCol.fields.add(
        new JSONField({
          name: 'divisao_integrantes',
          required: false,
          maxSize: 1048576, // 1MB
        }),
      )
      app.save(transacoesCol)
    }
  },
  (app) => {
    try {
      const transacoesCol = app.findCollectionByNameOrId('transacoes')
      if (transacoesCol.fields.getByName('divisao_integrantes')) {
        transacoesCol.fields.removeByName('divisao_integrantes')
        app.save(transacoesCol)
      }
    } catch (e) {
      console.log('Erro no rollback da migração 0037:', e)
    }
  },
)

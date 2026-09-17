migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('transacoes')
    const tipoField = col.fields.getByName('tipo')

    if (tipoField) {
      // Valores existentes preservados: gravacao, edicao, equipamento, marketing, outros
      // Novos valores para receitas solicitados pelo usuário:
      // participacao_convidado, entrevista, monetizacao_youtube, monetizacao_instagram, monetizacao_tiktok, monetizacao
      tipoField.values = [
        'gravacao',
        'edicao',
        'equipamento',
        'marketing',
        'outros',
        'participacao_convidado',
        'entrevista',
        'monetizacao_youtube',
        'monetizacao_instagram',
        'monetizacao_tiktok',
        'monetizacao',
      ]
      col.fields.add(tipoField)
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('transacoes')
      const tipoField = col.fields.getByName('tipo')
      if (tipoField) {
        tipoField.values = ['gravacao', 'edicao', 'equipamento', 'marketing', 'outros']
        col.fields.add(tipoField)
        app.save(col)
      }
    } catch (e) {
      console.log('Erro no rollback da migração 0038:', e)
    }
  },
)

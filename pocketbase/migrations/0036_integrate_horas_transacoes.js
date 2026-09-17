migrate(
  (app) => {
    const transacoesCol = app.findCollectionByNameOrId('transacoes')
    const horasCol = app.findCollectionByNameOrId('horas_compradas')

    // 1. Adicionar campo tipo_movimentacao ('receita' | 'despesa') em transacoes se não existir
    if (!transacoesCol.fields.getByName('tipo_movimentacao')) {
      transacoesCol.fields.add(
        new SelectField({
          name: 'tipo_movimentacao',
          required: false,
          values: ['receita', 'despesa'],
          maxSelect: 1,
        }),
      )
    }

    // 2. Adicionar relation/referência horas_compradas_id em transacoes se não existir
    if (!transacoesCol.fields.getByName('horas_compradas_id')) {
      transacoesCol.fields.add(
        new RelationField({
          name: 'horas_compradas_id',
          collectionId: horasCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    // 3. Adicionar campo origem em transacoes ('manual' | 'horas_compradas') se não existir
    if (!transacoesCol.fields.getByName('origem')) {
      transacoesCol.fields.add(
        new SelectField({
          name: 'origem',
          required: false,
          values: ['manual', 'horas_compradas'],
          maxSelect: 1,
        }),
      )
    }

    // Salvar schema da coleção transacoes
    app.save(transacoesCol)

    // Adicionar índice para horas_compradas_id
    try {
      transacoesCol.addIndex('idx_transacoes_horas_compradas', false, 'horas_compradas_id', '')
      app.save(transacoesCol)
    } catch (idxErr) {
      console.log('Índice idx_transacoes_horas_compradas já existe ou aviso:', idxErr)
    }

    // 4. Preencher registros existentes de transacoes que não tinham tipo_movimentacao definida como 'despesa'
    app
      .db()
      .newQuery(
        "UPDATE transacoes SET tipo_movimentacao = 'despesa' WHERE tipo_movimentacao IS NULL OR tipo_movimentacao = ''",
      )
      .execute()

    app
      .db()
      .newQuery("UPDATE transacoes SET origem = 'manual' WHERE origem IS NULL OR origem = ''")
      .execute()

    // 5. Migração retroativa: gerar movimentação financeira (receita) para todos os pacotes de horas_compradas existentes
    // que possuam valor > 0 e ainda não tenham transação vinculada
    const pacotesHoras = app.findRecordsByFilter('horas_compradas', 'valor > 0', 'data', 0, 0)
    console.log(
      '[Migração 0036] Total de pacotes de horas com valor encontrados:',
      pacotesHoras.length,
    )

    for (let i = 0; i < pacotesHoras.length; i++) {
      const pacote = pacotesHoras[i]
      const pacoteId = pacote.id
      const valor = pacote.getFloat('valor') || 0
      const qtdHoras = pacote.getFloat('quantidade_horas') || 0
      const dataPacote = pacote.getString('data') || pacote.getString('created')
      const situacaoHoras = pacote.getString('situacao')
      const descPacote = pacote.getString('descricao') || 'Pacote de horas'

      // Verificar se já existe transação vinculada a este horas_compradas_id (idempotência)
      let jaExiste = false
      try {
        const existente = app.findFirstRecordByData('transacoes', 'horas_compradas_id', pacoteId)
        if (existente) {
          jaExiste = true
        }
      } catch (_) {
        jaExiste = false
      }

      if (!jaExiste) {
        console.log(
          '[Migração 0036] Gerando transação financeira retroativa para pacote de horas:',
          pacoteId,
          descPacote,
          valor,
        )
        const novaTransacao = new Record(transacoesCol)
        novaTransacao.set(
          'descricao',
          'Compra de horas do estúdio (' + qtdHoras + 'h) — ' + descPacote,
        )
        novaTransacao.set('tipo', 'gravacao')
        novaTransacao.set('tipo_movimentacao', 'receita')
        novaTransacao.set('origem', 'horas_compradas')
        novaTransacao.set('valor', valor)
        novaTransacao.set('data_vencimento', dataPacote)
        // Mapear situacao: 'paga' -> 'quitado', 'em_aberto' -> 'em_aberto'
        novaTransacao.set('situacao', situacaoHoras === 'paga' ? 'quitado' : 'em_aberto')
        novaTransacao.set('horas_compradas_id', pacoteId)
        app.save(novaTransacao)
      } else {
        console.log(
          '[Migração 0036] Pacote de horas já possui transação vinculada, pulando:',
          pacoteId,
        )
      }
    }
  },
  (app) => {
    try {
      // Excluir movimentações retroativas geradas
      app.db().newQuery("DELETE FROM transacoes WHERE origem = 'horas_compradas'").execute()

      const transacoesCol = app.findCollectionByNameOrId('transacoes')
      if (transacoesCol.fields.getByName('horas_compradas_id')) {
        transacoesCol.fields.removeByName('horas_compradas_id')
      }
      if (transacoesCol.fields.getByName('tipo_movimentacao')) {
        transacoesCol.fields.removeByName('tipo_movimentacao')
      }
      if (transacoesCol.fields.getByName('origem')) {
        transacoesCol.fields.removeByName('origem')
      }
      app.save(transacoesCol)
    } catch (e) {
      console.log('Erro no rollback da migração 0036:', e)
    }
  },
)

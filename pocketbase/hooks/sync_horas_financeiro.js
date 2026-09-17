// PocketBase hook para sincronização automática entre Controle de Horas e Financeiro.
// Quando um pacote de horas é criado ou editado, uma transação correspondente (receita)
// é criada ou atualizada automaticamente na coleção 'transacoes'.
// Se um pacote de horas for excluído, a transação vinculada é removida automaticamente.
//
// Regra crítica do Goja/PocketBase: tudo deve ser inline nos callbacks sem variáveis ou funções
// no escopo de módulo / topo do arquivo para evitar ReferenceError.

onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    if (!record) return

    const pacoteId = record.id
    const valor = record.getFloat('valor') || 0
    const qtdHoras = record.getFloat('quantidade_horas') || 0
    const dataPacote = record.getString('data') || record.getString('created')
    const situacaoHoras = record.getString('situacao')
    const descPacote = record.getString('descricao') || 'Pacote de horas'

    // Só sincroniza movimentação financeira se houver valor > 0 lançado
    if (valor <= 0) {
      console.log(
        '[Sync Horas -> Financeiro] Pacote criado sem valor monetário (valor <= 0), nenhuma transação gerada.',
        pacoteId,
      )
      return
    }

    // Anti-duplicação: verificar se já existe transação vinculada
    let transacaoExistente = null
    try {
      transacaoExistente = $app.findFirstRecordByData('transacoes', 'horas_compradas_id', pacoteId)
    } catch (_) {
      transacaoExistente = null
    }

    if (transacaoExistente) {
      console.log(
        '[Sync Horas -> Financeiro] Transação já existe para o pacote ' +
          pacoteId +
          ', atualizando.',
      )
      transacaoExistente.set(
        'descricao',
        'Compra de horas do estúdio (' + qtdHoras + 'h) — ' + descPacote,
      )
      transacaoExistente.set('valor', valor)
      transacaoExistente.set('data_vencimento', dataPacote)
      transacaoExistente.set('situacao', situacaoHoras === 'paga' ? 'quitado' : 'em_aberto')
      transacaoExistente.set('tipo_movimentacao', 'receita')
      transacaoExistente.set('origem', 'horas_compradas')
      $app.save(transacaoExistente)
      return
    }

    // Criar nova movimentação financeira (receita)
    const transacoesCol = $app.findCollectionByNameOrId('transacoes')
    const novaTransacao = new Record(transacoesCol)
    novaTransacao.set('descricao', 'Compra de horas do estúdio (' + qtdHoras + 'h) — ' + descPacote)
    novaTransacao.set('tipo', 'gravacao')
    novaTransacao.set('tipo_movimentacao', 'receita')
    novaTransacao.set('origem', 'horas_compradas')
    novaTransacao.set('valor', valor)
    novaTransacao.set('data_vencimento', dataPacote)
    novaTransacao.set('situacao', situacaoHoras === 'paga' ? 'quitado' : 'em_aberto')
    novaTransacao.set('horas_compradas_id', pacoteId)

    $app.save(novaTransacao)
    console.log(
      '[Sync Horas -> Financeiro] Movimentação financeira criada com sucesso para pacote ' +
        pacoteId +
        ' no valor de ' +
        valor,
    )
  } catch (err) {
    console.log(
      '[Sync Horas -> Financeiro] Erro ao criar transação a partir de horas_compradas:',
      err,
    )
  }
}, 'horas_compradas')

onRecordAfterUpdateSuccess((e) => {
  try {
    const record = e.record
    if (!record) return

    const pacoteId = record.id
    const valor = record.getFloat('valor') || 0
    const qtdHoras = record.getFloat('quantidade_horas') || 0
    const dataPacote = record.getString('data') || record.getString('created')
    const situacaoHoras = record.getString('situacao')
    const descPacote = record.getString('descricao') || 'Pacote de horas'

    // Buscar transação vinculada
    let transacaoExistente = null
    try {
      transacaoExistente = $app.findFirstRecordByData('transacoes', 'horas_compradas_id', pacoteId)
    } catch (_) {
      transacaoExistente = null
    }

    if (transacaoExistente) {
      if (valor > 0) {
        // Atualiza transação existente
        transacaoExistente.set(
          'descricao',
          'Compra de horas do estúdio (' + qtdHoras + 'h) — ' + descPacote,
        )
        transacaoExistente.set('valor', valor)
        transacaoExistente.set('data_vencimento', dataPacote)
        transacaoExistente.set('situacao', situacaoHoras === 'paga' ? 'quitado' : 'em_aberto')
        transacaoExistente.set('tipo_movimentacao', 'receita')
        transacaoExistente.set('origem', 'horas_compradas')
        $app.save(transacaoExistente)
        console.log(
          '[Sync Horas -> Financeiro] Transação atualizada para pacote ' +
            pacoteId +
            ' (R$ ' +
            valor +
            ')',
        )
      } else {
        // Se o valor foi zerado ou removido, exclui a transação vinculada
        $app.delete(transacaoExistente)
        console.log(
          '[Sync Horas -> Financeiro] Valor do pacote foi zerado, transação vinculada removida.',
        )
      }
    } else if (valor > 0) {
      // Se não existia transação (ex.: pacote antes não tinha valor) e agora tem valor > 0, cria
      const transacoesCol = $app.findCollectionByNameOrId('transacoes')
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
      novaTransacao.set('situacao', situacaoHoras === 'paga' ? 'quitado' : 'em_aberto')
      novaTransacao.set('horas_compradas_id', pacoteId)
      $app.save(novaTransacao)
      console.log(
        '[Sync Horas -> Financeiro] Nova transação criada em update de pacote ' + pacoteId,
      )
    }
  } catch (err) {
    console.log('[Sync Horas -> Financeiro] Erro ao sincronizar update de horas_compradas:', err)
  }
}, 'horas_compradas')

onRecordAfterDeleteSuccess((e) => {
  try {
    const record = e.record
    if (!record) return

    const pacoteId = record.id
    console.log(
      '[Sync Horas -> Financeiro] Pacote de horas excluído (' +
        pacoteId +
        '), limpando transações vinculadas...',
    )

    // Buscar e excluir movimentação financeira vinculada
    let transacaoExistente = null
    try {
      transacaoExistente = $app.findFirstRecordByData('transacoes', 'horas_compradas_id', pacoteId)
    } catch (_) {
      transacaoExistente = null
    }

    if (transacaoExistente) {
      $app.delete(transacaoExistente)
      console.log(
        '[Sync Horas -> Financeiro] Transação ' +
          transacaoExistente.id +
          ' vinculada ao pacote ' +
          pacoteId +
          ' foi excluída.',
      )
    }
  } catch (err) {
    console.log(
      '[Sync Horas -> Financeiro] Erro ao excluir transação vinculada a horas_compradas:',
      err,
    )
  }
}, 'horas_compradas')

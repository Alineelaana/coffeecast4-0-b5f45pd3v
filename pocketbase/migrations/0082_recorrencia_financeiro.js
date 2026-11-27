/**
 * Migration 0082 — Recorrência de lançamentos financeiros.
 *
 * Campos novos em `transacoes`:
 *  - grupo_recorrencia_id (text): mesmo id para todos os lançamentos gerados
 *    pela mesma recorrência; nulo em lançamentos avulsos.
 *  - recorrencia_rotulo (text): rótulo legível da recorrência de origem
 *    (ex.: "Mensal · 01/01 até 01/06"), exibido como badge na listagem.
 *  - origem: novos valores "recorrencia" (lançamento gerado) e
 *    "recorrencia_origem" (primeiro lançamento, preenchido pelo formulário).
 *
 * Idempotente: só adiciona cada campo/valor se ainda não existir.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('transacoes')

    if (!col.fields.getByName('grupo_recorrencia_id')) {
      col.fields.add(new TextField({ name: 'grupo_recorrencia_id', max: 64 }))
    }
    if (!col.fields.getByName('recorrencia_rotulo')) {
      col.fields.add(new TextField({ name: 'recorrencia_rotulo', max: 160 }))
    }

    const origem = col.fields.getByName('origem')
    if (origem && origem.type === 'select') {
      const valores = origem.values || []
      const novos = ['recorrencia', 'recorrencia_origem']
      novos.forEach((v) => {
        if (!valores.includes(v)) valores.push(v)
      })
      origem.values = valores
      if (origem.maxSelect < valores.length) {
        origem.maxSelect = 1
      }
    }

    col.addIndex('idx_transacoes_grupo_recorrencia', false, 'grupo_recorrencia_id', '')

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('transacoes')
    col.removeIndex('idx_transacoes_grupo_recorrencia')

    const campoGrupo = col.fields.getByName('grupo_recorrencia_id')
    if (campoGrupo) col.fields.removeByName('grupo_recorrencia_id')
    const campoRotulo = col.fields.getByName('recorrencia_rotulo')
    if (campoRotulo) col.fields.removeByName('recorrencia_rotulo')

    const origem = col.fields.getByName('origem')
    if (origem && origem.type === 'select') {
      origem.values = ['manual', 'horas_compradas']
    }

    app.save(col)
  },
)

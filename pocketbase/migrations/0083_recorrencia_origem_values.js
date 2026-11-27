/**
 * Migration 0083 — valores de `origem` para lançamentos gerados por recorrência.
 *
 * O field `origem` (select) da coleção `transacoes` precisa aceitar:
 *  - "recorrencia_origem": primeiro lançamento criado pelo formulário
 *  - "recorrencia": lançamentos repetidos gerados automaticamente
 *
 * Idempotente: só adiciona os valores que ainda não existem.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('transacoes')
    const field = col.fields.getByName('origem')
    if (field && field.type === 'select') {
      const valores = field.values || []
      const desejados = ['manual', 'horas_compradas', 'recorrencia_origem', 'recorrencia']
      const novos = desejados.filter((v) => !valores.includes(v))
      if (novos.length > 0) {
        field.values = desejados
        app.save(col)
      }
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('transacoes')
    const field = col.fields.getByName('origem')
    if (field && field.type === 'select') {
      field.values = ['manual', 'horas_compradas']
      app.save(col)
    }
  },
)

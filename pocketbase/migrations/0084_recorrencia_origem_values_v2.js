/**
 * Migration 0084 — valores de `origem` para lançamentos gerados por recorrência.
 *
 * O field `origem` (select) da coleção `transacoes` precisa aceitar:
 *  - "recorrencia_origem": primeiro lançamento criado pelo formulário
 *  - "recorrencia": lançamentos repetidos gerados automaticamente
 *
 * Padrão da migration 0038 (comprovado neste projeto): mutar `field.values`
 * e re-adicionar o field com `col.fields.add(field)` antes de `app.save`.
 * Idempotente: só salva quando algum valor novo for adicionado.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('transacoes')
    const field = col.fields.getByName('origem')
    if (!field) return

    const atuais = (field.values || []).map((v) => String(v))
    const desejados = ['manual', 'horas_compradas', 'recorrencia_origem', 'recorrencia']
    const faltando = desejados.filter((v) => !atuais.includes(v))
    if (faltando.length === 0) return

    field.values = desejados
    col.fields.add(field)
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('transacoes')
    const field = col.fields.getByName('origem')
    if (field) {
      field.values = ['manual', 'horas_compradas']
      col.fields.add(field)
      app.save(col)
    }
  },
)

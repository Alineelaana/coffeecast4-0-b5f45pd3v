// Migration 1753000100010 — Corrige as regras de acesso da collection "portfolios":
// o operador ~ do PocketBase é LIKE (contains literal), não regex, então a versão original
// ('master|adm|gerencial') nunca casaria. Substitui pelo padrão já usado nas demais collections
// do painel: role igual a master/adm/gerencial.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('portfolios')
    const roleOk =
      '@request.auth.role = "master" || @request.auth.role = "adm" || @request.auth.role = "gerencial"'
    col.listRule = `@request.auth.id != '' && (${roleOk})`
    col.viewRule = `@request.auth.id != '' && (${roleOk})`
    col.createRule = `@request.auth.id != '' && (${roleOk}) && enviado_por = @request.auth.id`
    col.updateRule = null
    col.deleteRule = null
    app.save(col)
  },
  (app) => {
    // down: restaura as regras originais (versionadas para referência)
    const col = app.findCollectionByNameOrId('portfolios')
    col.listRule = "@request.auth.id != '' && @request.auth.role ~ 'master|adm|gerencial'"
    col.viewRule = "@request.auth.id != '' && @request.auth.role ~ 'master|adm|gerencial'"
    col.createRule =
      "@request.auth.id != '' && @request.auth.role ~ 'master|adm|gerencial' && enviado_por = @request.auth.id"
    app.save(col)
  },
)

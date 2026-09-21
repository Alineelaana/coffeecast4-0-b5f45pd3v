// pocketbase/migrations/0069_expand_roteiro_final_texto_limit.js
// Permite que o campo 'roteiro_final_texto' na coleção 'roteiros_convidados' armazene
// roteiros completos, estruturados e detalhados gerados pela assistente virtual Nine (até 100.000 caracteres),
// sem ser bloqueado pelo limite padrão de 5.000 caracteres de TextFields no PocketBase.

migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('roteiros_convidados')
      const field = col.fields.getByName('roteiro_final_texto')

      if (field) {
        field.max = 100000
        field.min = 0
        field.required = false
        field.pattern = ''
      }

      // Também garantir que 'biografia', 'sobre_empresa' e 'tema_sensivel_detalhes' tenham limite amplo caso necessário
      const bioField = col.fields.getByName('biografia')
      if (bioField) {
        bioField.max = 50000
      }

      const sobreEmpresaField = col.fields.getByName('sobre_empresa')
      if (sobreEmpresaField) {
        sobreEmpresaField.max = 50000
      }

      app.save(col)
    } catch (err) {
      console.log('Erro ao aplicar migração 0069_expand_roteiro_final_texto_limit.js:', err)
      throw err
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('roteiros_convidados')
      const field = col.fields.getByName('roteiro_final_texto')
      if (field) {
        field.max = 5000
      }
      app.save(col)
    } catch (_) {}
  },
)

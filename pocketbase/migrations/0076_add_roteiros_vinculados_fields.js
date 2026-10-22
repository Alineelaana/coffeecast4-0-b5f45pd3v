// pocketbase/migrations/0076_add_roteiros_vinculados_fields.js
// Adiciona campos de suporte para a funcionalidade "Juntar Roteiros" (episódios conjuntos / casal / parceria)
// na coleção 'roteiros_convidados':
// - roteiros_vinculados_ids: JSONField para armazenar lista de IDs dos roteiros agrupados
// - roteiro_conjunto_titulo: TextField para o título do episódio conjunto ou nomes dos convidados reunidos
// Sem tocar nos dados existentes nem alterar roteiros individuais.

migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('roteiros_convidados')

      if (!col.fields.getByName('roteiros_vinculados_ids')) {
        col.fields.add(
          new JSONField({
            name: 'roteiros_vinculados_ids',
            required: false,
            maxSize: 100000,
          }),
        )
      }

      if (!col.fields.getByName('roteiro_conjunto_titulo')) {
        col.fields.add(
          new TextField({
            name: 'roteiro_conjunto_titulo',
            required: false,
            max: 500,
          }),
        )
      }

      app.save(col)
    } catch (err) {
      console.log('Erro ao aplicar migração 0076_add_roteiros_vinculados_fields.js:', err)
      throw err
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('roteiros_convidados')
      const f1 = col.fields.getByName('roteiros_vinculados_ids')
      if (f1) col.fields.removeByName('roteiros_vinculados_ids')

      const f2 = col.fields.getByName('roteiro_conjunto_titulo')
      if (f2) col.fields.removeByName('roteiro_conjunto_titulo')

      app.save(col)
    } catch (_) {}
  },
)

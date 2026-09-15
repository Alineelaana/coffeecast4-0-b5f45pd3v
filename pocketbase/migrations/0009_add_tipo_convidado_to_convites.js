migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('convites')
    if (!col.fields.getByName('tipo_convidado')) {
      col.fields.add(
        new SelectField({
          name: 'tipo_convidado',
          required: false,
          values: ['convidado', 'convidada'],
          maxSelect: 1,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('convites')
    const field = col.fields.getByName('tipo_convidado')
    if (field) {
      col.fields.removeByName('tipo_convidado')
      app.save(col)
    }
  },
)

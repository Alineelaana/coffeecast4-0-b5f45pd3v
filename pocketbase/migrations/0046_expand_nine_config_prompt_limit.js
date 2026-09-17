migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('nine_config')

      // Configurar max explícito alto (100.000 caracteres) nos campos de texto
      // Nota do PocketBase: se max for 0 ou omitido em TextField, o PocketBase assume fallback de 5000.
      // Portanto, para permitir textos longos de até 100.000 caracteres, definimos max = 100000.
      const textFieldsToExpand = ['prompt_sistema', 'base_conhecimento', 'observacoes']

      for (let i = 0; i < textFieldsToExpand.length; i++) {
        const fieldName = textFieldsToExpand[i]
        const f = col.fields.getByName(fieldName)
        if (f) {
          f.max = 100000
          f.min = 0
          f.required = false
          f.pattern = ''
        }
      }

      const chaveField = col.fields.getByName('chave')
      if (chaveField) {
        chaveField.max = 255
        chaveField.required = false
      }

      app.save(col)
    } catch (err) {
      console.log('Erro ao aplicar migração 0046_expand_nine_config_prompt_limit.js:', err)
      throw err
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('nine_config')
      const promptField = col.fields.getByName('prompt_sistema')
      if (promptField) {
        promptField.max = 5000
      }
      app.save(col)
    } catch (_) {}
  },
)

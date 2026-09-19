migrate(
  (app) => {
    const conteudoCol = app.findCollectionByNameOrId('conteudo_site')
    const seedDefaults = [
      {
        chave: 'convites_padrao_endereco',
        valor: '',
      },
      {
        chave: 'convites_padrao_localizacao',
        valor: '',
      },
    ]

    for (let i = 0; i < seedDefaults.length; i++) {
      const item = seedDefaults[i]
      try {
        app.findFirstRecordByData('conteudo_site', 'chave', item.chave)
      } catch (_) {
        const rec = new Record(conteudoCol)
        rec.set('chave', item.chave)
        rec.set('valor', item.valor)
        app.save(rec)
      }
    }
  },
  (app) => {
    const keys = ['convites_padrao_endereco', 'convites_padrao_localizacao']
    for (let i = 0; i < keys.length; i++) {
      try {
        const rec = app.findFirstRecordByData('conteudo_site', 'chave', keys[i])
        app.delete(rec)
      } catch (_) {}
    }
  },
)

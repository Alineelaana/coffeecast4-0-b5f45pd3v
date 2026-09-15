migrate(
  (app) => {
    const conteudoCol = app.findCollectionByNameOrId('conteudo_site')
    const seedSocials = [
      {
        chave: 'social_instagram',
        valor: 'https://instagram.com/coffeecast4.0',
      },
      {
        chave: 'social_tiktok',
        valor: 'https://tiktok.com/@coffeecast4.0',
      },
      {
        chave: 'social_facebook',
        valor: 'https://facebook.com/coffeecast4.0',
      },
      {
        chave: 'social_linkedin',
        valor: 'https://linkedin.com/company/coffeecast40',
      },
    ]

    for (let i = 0; i < seedSocials.length; i++) {
      const item = seedSocials[i]
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
    const keys = ['social_instagram', 'social_tiktok', 'social_facebook', 'social_linkedin']
    for (let i = 0; i < keys.length; i++) {
      try {
        const rec = app.findFirstRecordByData('conteudo_site', 'chave', keys[i])
        app.delete(rec)
      } catch (_) {}
    }
  },
)

migrate(
  (app) => {
    const conteudoCol = app.findCollectionByNameOrId('conteudo_site')

    const initialDomainSettings = [
      {
        chave: 'dominio_personalizado',
        valor: '',
      },
      {
        chave: 'dominio_status',
        valor: 'pendente_dns', // pendente_dns | aguardando_propagacao | ativo
      },
      {
        chave: 'dominio_redirecionar_www',
        valor: 'true',
      },
      {
        chave: 'dominio_aliases',
        valor: '',
      },
      {
        chave: 'dominio_ativado_suporte',
        valor: 'false',
      },
      {
        chave: 'dominio_data_solicitacao',
        valor: '',
      },
    ]

    for (let i = 0; i < initialDomainSettings.length; i++) {
      const item = initialDomainSettings[i]
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
    const keys = [
      'dominio_personalizado',
      'dominio_status',
      'dominio_redirecionar_www',
      'dominio_aliases',
      'dominio_ativado_suporte',
      'dominio_data_solicitacao',
    ]

    for (let i = 0; i < keys.length; i++) {
      try {
        const rec = app.findFirstRecordByData('conteudo_site', 'chave', keys[i])
        app.delete(rec)
      } catch (_) {}
    }
  },
)

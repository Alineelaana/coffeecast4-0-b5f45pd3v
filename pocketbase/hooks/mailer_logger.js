onMailerSend((e) => {
  try {
    const subject = (e.message && e.message.subject) || 'sem assunto'
    const html = (e.message && e.message.html) || ''
    const text = (e.message && e.message.text) || ''

    // Verifica presença de URLs http(s)
    const urlMatches = html.match(/https?:\/\/[^\s"'<>]+/gi) || []
    const hasHttpUrl = urlMatches.length > 0
    const rawPlaceholderLeft =
      html.indexOf('{ACTION_URL}') !== -1 || text.indexOf('{ACTION_URL}') !== -1

    // Extrai os atributos href encontrados para auditoria sem expor o token completo
    const hrefs = (html.match(/href="([^"]*)"/gi) || []).map((h) => {
      // Mascara parte sensível do token da URL se houver
      return h.replace(/(token=|\/)([a-zA-Z0-9_\-\.]{15,})/g, '$1[PROTECTED_TOKEN]')
    })

    console.log(
      '[CoffeeCast Mailer] E-mail despachado:',
      JSON.stringify({
        subject: subject,
        hasResolvedUrl: hasHttpUrl,
        urlCount: urlMatches.length,
        rawPlaceholderRemaining: rawPlaceholderLeft,
        detectedHrefs: hrefs,
      }),
    )
  } catch (err) {
    console.log('[CoffeeCast Mailer] Erro ao registrar e-mail:', err)
  }

  e.next()
})

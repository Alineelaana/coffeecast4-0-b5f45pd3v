onMailerSend((e) => {
  try {
    const msg = e.message || {}
    const subject = msg.subject || 'sem assunto'
    const to = msg.to || []
    const from = msg.from || {}
    const html = msg.html || ''
    const text = msg.text || ''

    // Mascara e-mails de destinatário para auditoria segura nos logs
    const recipients = Array.isArray(to)
      ? to.map((addr) => {
          if (typeof addr === 'string') {
            const parts = addr.split('@')
            if (parts.length === 2) {
              const u = parts[0]
              const masked = u.length > 2 ? u.slice(0, 2) + '***' : u + '***'
              return masked + '@' + parts[1]
            }
            return addr
          }
          if (addr && addr.address) {
            const parts = String(addr.address).split('@')
            if (parts.length === 2) {
              const u = parts[0]
              const masked = u.length > 2 ? u.slice(0, 2) + '***' : u + '***'
              return masked + '@' + parts[1]
            }
            return addr.address
          }
          return 'destinatário_desconhecido'
        })
      : []

    // Remetente configurado
    const sender = typeof from === 'string' ? from : from.address || from.name || 'padrão PB'

    // Verifica presença de URLs http(s)
    const urlMatches = html.match(/https?:\/\/[^\s"'<>]+/gi) || []
    const hasHttpUrl = urlMatches.length > 0
    const rawPlaceholderLeft =
      html.indexOf('{ACTION_URL}') !== -1 || text.indexOf('{ACTION_URL}') !== -1

    // Extrai atributos href encontrados para auditoria sem expor tokens completos
    const hrefs = (html.match(/href="([^"]*)"/gi) || []).map((h) => {
      return h.replace(/(token=|\/)([a-zA-Z0-9_\-\.]{15,})/g, '$1[PROTECTED_TOKEN]')
    })

    console.log(
      '[CoffeeCast Mailer] Tentativa de envio interceptada:',
      JSON.stringify({
        subject: subject,
        recipients: recipients,
        sender: sender,
        hasResolvedUrl: hasHttpUrl,
        urlCount: urlMatches.length,
        rawPlaceholderRemaining: rawPlaceholderLeft,
        detectedHrefs: hrefs,
      }),
    )
  } catch (err) {
    console.log('[CoffeeCast Mailer] Erro ao auditar mensagem pré-envio:', err)
  }

  try {
    e.next()
    console.log(
      '[CoffeeCast Mailer] onMailerSend despachado com sucesso para o transportador do PocketBase.',
    )
  } catch (sendErr) {
    console.log('[CoffeeCast Mailer] Falha no transportador do mailer ao enviar e-mail:', sendErr)
    throw sendErr
  }
})

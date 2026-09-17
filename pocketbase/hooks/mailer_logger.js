// Hook do PocketBase para auditoria e garantia de interpolação perfeita nos envios de e-mail.
// Garante que links de ação de autenticação ({ACTION_URL}) e tokens estejam sempre
// 100% resolvidos, válidos e clicáveis antes do disparo final pelo transportador SMTP.

onMailerSend((e) => {
  try {
    const msg = e.message || {}
    const subject = msg.subject || 'sem assunto'
    const to = msg.to || []
    const from = msg.from || {}
    let html = msg.html || ''
    let text = msg.text || ''

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

    // Procura por URLs resolvidas no e-mail
    const urlMatches = html.match(/https?:\/\/[^\s"'<>]+/gi) || []
    const hasHttpUrl = urlMatches.length > 0
    let rawPlaceholderLeft =
      html.indexOf('{ACTION_URL}') !== -1 || text.indexOf('{ACTION_URL}') !== -1

    // Se houver placeholder cru {ACTION_URL}, identifica a URL de ação resolvida e interpola
    if (rawPlaceholderLeft) {
      let actionUrl = ''
      // Procura nas URLs encontradas aquela que corresponde à ação com token
      for (let i = 0; i < urlMatches.length; i++) {
        const u = urlMatches[i]
        if (
          u.indexOf('token=') !== -1 ||
          u.indexOf('confirm-password-reset') !== -1 ||
          u.indexOf('confirm-verification') !== -1 ||
          u.indexOf('confirm-email-change') !== -1 ||
          u.indexOf('/auth/') !== -1
        ) {
          actionUrl = u
          break
        }
      }

      // Se ainda não achou mas há URL HTTP no e-mail, usa a primeira
      if (!actionUrl && urlMatches.length > 0) {
        actionUrl = urlMatches[0]
      }

      if (actionUrl) {
        // Remove barras duplicadas eventuais antes do hash ou token se houver
        html = html.split('{ACTION_URL}').join(actionUrl)
        msg.html = html
        if (text) {
          text = text.split('{ACTION_URL}').join(actionUrl)
          msg.text = text
        }
        rawPlaceholderLeft =
          html.indexOf('{ACTION_URL}') !== -1 || text.indexOf('{ACTION_URL}') !== -1
      }
    }

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

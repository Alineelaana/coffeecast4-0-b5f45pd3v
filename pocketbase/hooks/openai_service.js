// pocketbase/hooks/openai_service.js
// Integração do ChatGPT (OpenAI) ao CoffeeCast 4.0 — motor de IA principal do Master.
// A chave de API é armazenada apenas como variável de ambiente GCHAT_GPT e NUNCA é
// exposta em respostas, logs ou telas. Toda chamada acontece exclusivamente no servidor.
//
// Endpoints:
//   GET  /backend/v1/openai/status    — indica se o motor ChatGPT está ativo (sem expor dados sensíveis)
//   POST /backend/v1/openai/gerar-capa — gera a capa de um episódio na identidade visual do podcast
//
// NOTA: a imagem volta em base64 para o painel, que a salva como arquivo do episódio
// pelos meios normais do SDK (mantendo a capa anterior caso o salvamento falhe).

routerAdd(
  'GET',
  '/backend/v1/openai/status',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Autenticação necessária')
      }

      const userRole = authUser.getString('role')
      if (userRole === 'adm') {
        const perms = authUser.get('adm_permissions') || {}
        const allowedScreens = Array.isArray(perms.allowedScreens) ? perms.allowedScreens : []
        if (!allowedScreens.includes('episodios') && !allowedScreens.includes('roteiros')) {
          return e.forbiddenError('Você não tem permissão para consultar o motor de IA.')
        }
      } else if (userRole !== 'master' && userRole !== 'gerencial') {
        return e.forbiddenError(
          'Acesso restrito a administradores Master, Gerencial e ADM autorizados.',
        )
      }

      const chave = ($os.getenv('GCHAT_GPT') || '').trim()
      return e.json(200, {
        disponivel: chave.length > 0,
        motor: chave.length > 0 ? 'ChatGPT (OpenAI)' : 'Nine (padrão)',
      })
    } catch (err) {
      console.log('[openai_service] Erro no status:', err)
      return e.json(200, { disponivel: false, motor: 'Nine (padrão)' })
    }
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/openai/gerar-capa',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Autenticação necessária')
      }

      const userRole = authUser.getString('role')
      if (userRole === 'adm') {
        const perms = authUser.get('adm_permissions') || {}
        const allowedScreens = Array.isArray(perms.allowedScreens) ? perms.allowedScreens : []
        if (!allowedScreens.includes('episodios')) {
          return e.forbiddenError('Você não tem permissão para gerar capas de episódios.')
        }
      } else if (userRole !== 'master' && userRole !== 'gerencial') {
        return e.forbiddenError(
          'Acesso restrito a administradores Master, Gerencial e ADM autorizados.',
        )
      }

      const body = e.requestInfo().body || {}
      const episodioId = (body.episodio_id || '').trim()
      const nomesConvidados = ((body.nomes_convidados || '') + '').trim()

      if (!episodioId) {
        return e.badRequestError('ID do episódio é obrigatório')
      }

      let episodio = null
      try {
        episodio = $app.findRecordById('episodios', episodioId)
      } catch (_) {}

      if (!episodio) {
        return e.notFoundError('Episódio não encontrado')
      }

      const chave = ($os.getenv('GCHAT_GPT') || '').trim()
      if (!chave) {
        return e.json(503, {
          error:
            'O ChatGPT não está conectado no momento (chave de API ausente no servidor). A capa não foi gerada — tente novamente mais tarde.',
        })
      }

      const titulo = episodio.getString('titulo') || 'Episódio especial do CoffeeCast 4.0'
      const numeroEpisodio = String(episodio.get('numero') || '')

      const promptImagem = [
        'Arte de capa premium para um episódio de podcast de entrevistas em vídeo, estética editorial de revista de luxo.',
        'Identidade visual oficial do podcast CoffeeCast 4.0: paleta dominante em vinho profundo (#4B1E3F), com detalhes em dourado suave, rosé e marfim; iluminação elegante e aconchegante de cafeteria gourmet sofisticada.',
        'Composição refinada e minimalista, atmosfera de conversa inspiradora entre mulheres de negócios, textura nobre, alto padrão fotográfico.',
        'NÃO inclua nenhum texto, letra, número, título, logotipo, marca ou assinatura na imagem. Não recrie nenhuma logomarca oficial.',
        'Tema do episódio: ' + titulo + '.',
        nomesConvidados
          ? 'Referência de contextualização dos convidados do episódio: ' + nomesConvidados + '.'
          : '',
      ]
        .filter(Boolean)
        .join(' ')

      const res = $http.send({
        url: 'https://api.openai.com/v1/images/generations',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + chave,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'chatgpt-image-latest',
          prompt: promptImagem,
          n: 1,
          size: '1024x1024',
          quality: 'high',
        }),
        timeout: 120,
      })

      let dadosImagem = null
      let corpoNaoJson = false
      try {
        dadosImagem = JSON.parse(res.raw || res.body || '{}')
      } catch (_) {
        corpoNaoJson = true
      }
      if (!dadosImagem && res.json) {
        try {
          dadosImagem = res.json
        } catch (_) {}
      }

      // Se o corpo veio com erro embutido (HTTP 200 com error), trata como falha
      if (dadosImagem && dadosImagem.error) {
        console.log(
          '[openai_service] OpenAI retornou erro embutido no corpo (status ' +
            (res.statusCode !== undefined ? res.statusCode : 'desconhecido') +
            '): ' +
            String(
              dadosImagem.error.message ||
                dadosImagem.error.code ||
                JSON.stringify(dadosImagem.error),
            ).slice(0, 300) +
            ' — body: ' +
            String(res.raw || res.body || '')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 600),
        )
        dadosImagem = null
      }

      let imagemBase64 = ''
      if (
        dadosImagem &&
        dadosImagem.data &&
        dadosImagem.data.length > 0 &&
        dadosImagem.data[0].b64_json
      ) {
        imagemBase64 = dadosImagem.data[0].b64_json
      }

      if (!imagemBase64) {
        console.log(
          '[openai_service] Falha na geração de capa (status HTTP ' +
            (res.statusCode !== undefined ? res.statusCode : 'desconhecido') +
            '; ' +
            (corpoNaoJson
              ? 'corpo não é JSON válido (possível HTML de proxy/gateway)'
              : 'resposta sem data[0].b64_json') +
            '). Caindo para aviso amigável no painel. body: ' +
            String(res.raw || res.body || '')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 600),
        )
        return e.json(502, {
          error:
            'O ChatGPT não conseguiu gerar a capa neste instante (limite ou instabilidade temporária). Sua capa atual foi mantida — tente novamente em alguns instantes.',
        })
      }

      return e.json(200, {
        sucesso: true,
        motor: 'ChatGPT (OpenAI)',
        episodio_id: episodioId,
        episodio_numero: numeroEpisodio,
        imagem_base64: imagemBase64,
      })
    } catch (err) {
      console.log('[openai_service] Erro na geração de capa:', err)
      return e.json(502, {
        error:
          'O ChatGPT não conseguiu gerar a capa neste instante. Sua capa atual foi mantida — tente novamente em alguns instantes.',
      })
    }
  },
  $apis.requireAuth(),
)

// pocketbase/hooks/episodio_capa_ia.js
// Geração de capas de episódios com IA (OpenAI Images API — gpt-image-1) para o CoffeeCast 4.0.
// A chave é lida do segredo de ambiente GCHAT_GPT e NUNCA é exposta em respostas ou logs.
//
// Endpoint:
//   POST /backend/v1/episodios/capa-ia   body: { episodio_id }
//
// Identidade visual: paleta vinho #4B1E3F, dourado, rosé e marfim, elegância premium.
// A logomarca oficial NÃO é recriada (a logo real é sobreposta pela plataforma).
// Mantém a capa anterior até a nova ser salva (regeneração segura).

routerAdd(
  'POST',
  '/backend/v1/episodios/capa-ia',
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

      const apiKey = ($os.getenv('GCHAT_GPT') || '').trim()
      if (!apiKey) {
        return e.json(200, {
          sucesso: false,
          chatgptAtivo: false,
          mensagem:
            'O ChatGPT (OpenAI) não está configurado neste ambiente. Configure a chave GCHAT_GPT para gerar capas com IA.',
        })
      }

      const body = e.requestInfo().body || {}
      const episodioId = (body.episodio_id || '').trim()
      if (!episodioId) {
        return e.badRequestError('ID do episódio é obrigatório')
      }

      const episodio = $app.findRecordById('episodios', episodioId)
      if (!episodio) {
        return e.notFoundError('Episódio não encontrado')
      }

      const titulo = (episodio.getString('titulo') || '').trim()

      const promptImagem = [
        'Capa editorial premium para um episódio do podcast brasileiro CoffeeCast 4.0.',
        'Tema do episódio: ' + (titulo || 'Histórias que inspiram'),
        'Identidade visual oficial: paleta vinho profundo (#4B1E3F), dourado, rosé e marfim; elegância premium e sofisticada; iluminação suave; composição limpa e moderna, sem texto e sem letras.',
        'NÃO recrie logomarcas, letras ou símbolos do podcast — apenas elementos visuais abstratos e elegantes (xícaras estilizadas, texturas, luz e formas orgânicas são bem-vindos).',
      ]
        .filter(Boolean)
        .join('. ')

      const imgRes = $http.send({
        url: 'https://api.openai.com/v1/images/generations',
        method: 'POST',
        timeout: 60,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey,
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: promptImagem,
          n: 1,
          size: '1024x1024',
        }),
      })

      let parsed = null
      try {
        parsed = JSON.parse(imgRes.body)
      } catch (_) {
        parsed = null
      }

      const b64 =
        parsed && parsed.data && parsed.data[0] && typeof parsed.data[0].b64_json === 'string'
          ? parsed.data[0].b64_json
          : ''

      if (!(imgRes.statusCode >= 200 && imgRes.statusCode < 300) || !b64) {
        console.log(
          '[episodio_capa_ia] OpenAI Images falhou (status ' + imgRes.statusCode + ') — sem b64',
        )
        return e.json(200, {
          sucesso: false,
          chatgptAtivo: true,
          mensagem:
            'O ChatGPT não conseguiu gerar a capa neste momento (limite ou indisponibilidade). Tente novamente em alguns instantes — a capa atual foi mantida.',
        })
      }

      // Salva a imagem como arquivo PocketBase com metadados de imagem válidos
      const bytes = $security.base64Decode(b64)
      const nomeArquivo = 'capa-ia-' + episodioId + '-' + new Date().getTime() + '.png'
      const arquivo = $filesystem.fileFromBytes(bytes, nomeArquivo)

      episodio.set('capa_ia', arquivo)
      $app.save(episodio)

      // Auditoria
      try {
        const colAudit = $app.findCollectionByNameOrId('auditoria_eventos')
        if (colAudit) {
          const auditRec = new Record(colAudit)
          auditRec.set('usuario_id', authUser.id)
          auditRec.set('usuario_email', authUser.getString('email'))
          auditRec.set('usuario_nome', authUser.getString('name') || 'Administrador')
          auditRec.set('usuario_role', userRole)
          auditRec.set('tipo_acao', 'edicao')
          auditRec.set('area_sistema', 'Episódios')
          auditRec.set(
            'descricao',
            'Capa gerada com IA (ChatGPT/OpenAI) para o episódio "' + (titulo || episodioId) + '".',
          )
          auditRec.set('registro_afetado', episodioId)
          auditRec.set('tabela_afetada', 'episodios')
          auditRec.set('resultado', 'sucesso')
          auditRec.set('metadata', {
            motor: 'chatgpt-openai',
            modelo_imagem: 'gpt-image-1',
            titulo: titulo || null,
          })
          $app.save(auditRec)
        }
      } catch (auditErr) {
        console.log('[episodio_capa_ia] Auditoria falhou (não impeditiva):', auditErr)
      }

      return e.json(200, {
        sucesso: true,
        chatgptAtivo: true,
        mensagem: 'Capa gerada com IA e salva com sucesso!',
        capa_ia_url: episodio.get('capa_ia'),
      })
    } catch (err) {
      console.log('[episodio_capa_ia] Erro ao gerar capa com IA:', err)
      return e.json(200, {
        sucesso: false,
        chatgptAtivo: true,
        mensagem:
          'Não foi possível gerar a capa com IA neste momento. Tente novamente em alguns instantes — a capa atual foi mantida.',
      })
    }
  },
  $apis.requireAuth(),
)

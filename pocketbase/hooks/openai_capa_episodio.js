// pocketbase/hooks/openai_capa_episodio.js
// Geração de capas de episódios do CoffeeCast 4.0 com IA (OpenAI via chave GCHAT_GPT).
// O backend chama a API de imagens da OpenAI, salva o arquivo na coleção 'episodios'
// (campo 'capa_ia') e registra o evento na Auditoria. A chave nunca é exposta.

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

      const body = e.requestInfo().body || {}
      const episodioId = (body.episodio_id || '').trim()
      if (!episodioId) {
        return e.badRequestError('ID do episódio é obrigatório')
      }

      let episodio = null
      try {
        episodio = $app.findRecordById('episodios', episodioId)
      } catch (_) {
        episodio = null
      }
      if (!episodio) {
        return e.notFoundError('Episódio não encontrado')
      }

      const apiKey = ($os.getenv('GCHAT_GPT') || '').trim()
      if (!apiKey) {
        return e.json(503, {
          error:
            'O ChatGPT (OpenAI) ainda não está conectado neste ambiente. A integração será ativada assim que a chave for configurada.',
          codigo: 'sem_chave',
        })
      }

      const tituloEpisodio = (episodio.getString('titulo') || 'Episódio do CoffeeCast 4.0').trim()

      // Contexto opcional: convidados vinculados a roteiros, quando existirem
      let nomesConvidados = ''
      try {
        const vinc = episodio.getString('roteiro_convidado_id') || ''
        if (vinc) {
          const rec = $app.findRecordById('roteiros_convidados', vinc)
          if (rec) nomesConvidados = rec.getString('nome') || ''
        }
      } catch (_) {}
      if (!nomesConvidados) {
        try {
          const vinc = episodio.get('roteiros_vinculados_ids')
          if (Array.isArray(vinc) && vinc.length > 0) {
            const nomes = []
            for (let i = 0; i < vinc.length; i++) {
              try {
                const rec = $app.findRecordById('roteiros_convidados', vinc[i])
                if (rec) nomes.push(rec.getString('nome') || '')
              } catch (_) {}
            }
            nomesConvidados = nomes.filter(Boolean).join(', ')
          }
        } catch (_) {}
      }

      const promptImagem = [
        'Capa institucional premium para um episódio do podcast brasileiro CoffeeCast 4.0.',
        'Tema do episódio: ' + tituloEpisodio + '.',
        nomesConvidados
          ? 'Convidados do episódio: ' + nomesConvidados + '.'
          : 'Episódio sem convidados nominais.',
        'Identidade visual oficial obrigatória: paleta vinho profundo (#4B1E3F), detalhes dourados elegantes, toques rosé e marfim.',
        'Estilo sofisticado, premium e acolhedor: ambiance de estúdio de podcast com cafeteira/xícara de café elegante ao fundo, luz quente e difusa, profundidade de campo suave.',
        'Sem texto, sem letras, sem palavras e sem logotipos na imagem (a logomarca oficial é sobreposta posteriormente pela plataforma).',
        'Composição horizontal 16:9, nível fotográfico editorial de alta qualidade.',
      ].join('\n')

      // Chamada à API de imagens da OpenAI (modelo gpt-image-1.5; GPT Image sempre retorna base64)
      const httpResp = $http.send({
        url: 'https://api.openai.com/v1/images/generations',
        method: 'POST',
        timeout: 120,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey,
        },
        body: JSON.stringify({
          model: 'gpt-image-1.5',
          prompt: promptImagem,
          n: 1,
          size: '1536x1024',
          quality: 'high',
        }),
      })

      let parsed = null
      try {
        parsed = JSON.parse(httpResp.body)
      } catch (_) {
        parsed = null
      }

      if (httpResp.statusCode < 200 || httpResp.statusCode >= 300) {
        const errType =
          parsed && parsed.error && parsed.error.type ? parsed.error.type : 'erro_desconhecido'
        console.log(
          '[capa_ia] OpenAI imagens falhou (status ' + httpResp.statusCode + '): ' + errType,
        )
        return e.json(502, {
          error:
            'O ChatGPT (OpenAI) não conseguiu gerar a capa neste momento. Tente novamente em instantes.',
          codigo: 'falha_geracao',
        })
      }

      const b64 =
        parsed && parsed.data && parsed.data[0] && parsed.data[0].b64_json
          ? parsed.data[0].b64_json
          : ''
      if (!b64) {
        return e.json(502, {
          error: 'A IA não retornou uma imagem válida. Tente gerar a capa novamente em instantes.',
          codigo: 'sem_imagem',
        })
      }

      // Salvar a imagem como arquivo no campo capa_ia do episódio
      const bytes = $filesystem.bytesToBlob(base64Decode(b64), 'image/png')
      const nomeArquivo = 'capa-ia-episodio-' + episodioId + '-' + Date.now() + '.png'
      episodio.set('capa_ia', $filesystem.createFileFromBytes(bytes, nomeArquivo))
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
          auditRec.set('tipo_acao', 'criacao')
          auditRec.set('area_sistema', 'Episódios')
          auditRec.set(
            'descricao',
            'Capa gerada com IA (ChatGPT/OpenAI) para o episódio #' +
              episodio.getString('numero') +
              ' "' +
              tituloEpisodio +
              '".',
          )
          auditRec.set('registro_afetado', episodioId)
          auditRec.set('tabela_afetada', 'episodios')
          auditRec.set('resultado', 'sucesso')
          auditRec.set('metadata', {
            motor: 'chatgpt-openai',
            modelo_imagem: 'gpt-image-1.5',
            episodio_id: episodioId,
            episodio_numero: episodio.getString('numero'),
            episodio_titulo: tituloEpisodio,
            convidados: nomesConvidados || null,
          })
          $app.save(auditRec)
        }
      } catch (auditErr) {
        console.log('[capa_ia] Falha não impeditiva na auditoria:', auditErr)
      }

      return e.json(200, {
        sucesso: true,
        motor: 'chatgpt-openai',
        mensagem: 'Capa gerada com IA e salva no episódio com sucesso!',
        capa_url: '/api/files/' + episodio.collectionId + '/' + episodioId + '/' + nomeArquivo,
      })
    } catch (err) {
      console.log('Erro na geração de capa com IA:', err)
      return e.json(500, {
        error: 'Não foi possível gerar a capa com IA neste momento. Tente novamente em instantes.',
        codigo: 'erro_interno',
      })
    }
  },
  $apis.requireAuth(),
)

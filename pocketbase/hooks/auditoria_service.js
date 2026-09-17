// pocketbase/hooks/auditoria_service.js
// Hook central de Auditoria do Sistema CoffeeCast 4.0
//
// Responsabilidades:
// 1. Endpoint HTTP seguro /backend/v1/auditoria/log para registrar ações do front-end com dados de contexto
// 2. Endpoint HTTP /backend/v1/auditoria/alerta/update-status para atualizar status do alerta com histórico de auditoria
// 3. Avaliação automática de regras de monitoramento ativas e criação de alertas quando houver correspondência
// 4. Utilitário inline para calcular diff antes/depois e capturar dispositivo/IP

// Endpoint para registro explícito de eventos de auditoria pelo front-end ou chamadas autenticadas
routerAdd('POST', '/backend/v1/auditoria/log', (e) => {
  try {
    const authUser = e.auth
    const body = e.requestInfo().body || {}
    const headers = e.requestInfo().headers || {}

    // Extração de IP
    let ip = headers['x-forwarded-for'] || headers['x-real-ip'] || headers['cf-connecting-ip'] || ''
    if (ip && ip.includes(',')) {
      ip = ip.split(',')[0].trim()
    }

    // Extração de User-Agent
    const userAgent = headers['user-agent'] || ''
    let dispositivo = 'Desktop'
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      dispositivo = 'Mobile'
    } else if (/tablet/i.test(userAgent)) {
      dispositivo = 'Tablet'
    }

    let navegador = 'Desconhecido'
    if (/edg/i.test(userAgent)) navegador = 'Edge'
    else if (/chrome/i.test(userAgent)) navegador = 'Chrome'
    else if (/firefox/i.test(userAgent)) navegador = 'Firefox'
    else if (/safari/i.test(userAgent)) navegador = 'Safari'
    else if (/opera|opr/i.test(userAgent)) navegador = 'Opera'

    const colEventos = $app.findCollectionByNameOrId('auditoria_eventos')
    const rec = new Record(colEventos)

    if (authUser) {
      rec.set('usuario_id', authUser.id)
      rec.set('usuario_email', authUser.getString('email'))
      rec.set('usuario_nome', authUser.getString('name') || authUser.getString('email'))
      rec.set('usuario_role', authUser.getString('role') || 'prata')
    } else {
      rec.set('usuario_id', body.usuario_id || '')
      rec.set('usuario_email', body.usuario_email || '')
      rec.set('usuario_nome', body.usuario_nome || 'Anônimo / Visitante')
      rec.set('usuario_role', body.usuario_role || '')
    }

    rec.set('loja_id', body.loja_id || '')
    rec.set('loja_nome', body.loja_nome || '')
    rec.set('tipo_acao', body.tipo_acao || 'outro')
    rec.set('area_sistema', body.area_sistema || 'Geral')
    rec.set('descricao', body.descricao || 'Ação registrada no sistema')
    rec.set('registro_afetado', body.registro_afetado || '')
    rec.set('tabela_afetada', body.tabela_afetada || '')
    rec.set('ip', ip || body.ip || '')
    rec.set('dispositivo', dispositivo)
    rec.set('navegador', navegador)
    rec.set('resultado', body.resultado || 'sucesso')
    rec.set('diff_antes', body.diff_antes || null)
    rec.set('diff_depois', body.diff_depois || null)
    rec.set('metadata', body.metadata || null)
    rec.set('suspeito', Boolean(body.suspeito))
    rec.set('motivo_suspeito', body.motivo_suspeito || '')

    $app.save(rec)

    // Avaliação de Regras de Monitoramento inline
    try {
      const regrasAtivas = $app.findRecordsByFilter('auditoria_regras', 'ativo = true', '', 100, 0)
      const colAlertas = $app.findCollectionByNameOrId('auditoria_alertas')
      const eventoTipo = rec.getString('tipo_acao')
      const eventoArea = rec.getString('area_sistema').toLowerCase()
      const eventoDesc = rec.getString('descricao').toLowerCase()
      const uId = rec.getString('usuario_id')
      const uRole = rec.getString('usuario_role')
      const uNome = rec.getString('usuario_nome')
      const uEmail = rec.getString('usuario_email')
      const lojaId = rec.getString('loja_id')
      const lojaNome = rec.getString('loja_nome')
      const diffAntesStr = JSON.stringify(body.diff_antes || '').toLowerCase()
      const diffDepoisStr = JSON.stringify(body.diff_depois || '').toLowerCase()

      for (let i = 0; i < regrasAtivas.length; i++) {
        const r = regrasAtivas[i]
        let disparar = false
        let motivoDisparo = ''

        const eventoMonitorado = r.getString('evento_monitorado')
        const palavraChave = (r.getString('palavra_chave') || '').trim().toLowerCase()
        const niveisMonitorados = r.get('niveis_monitorados') || []
        const usuariosMonitorados = r.get('usuarios_monitorados') || []
        const lojasMonitoradas = r.get('lojas_monitoradas') || []
        const areasMonitoradas = r.get('areas_monitoradas') || []

        // Filtro por nível se configurado
        if (Array.isArray(niveisMonitorados) && niveisMonitorados.length > 0) {
          if (!niveisMonitorados.includes(uRole)) {
            continue
          }
        }

        // Filtro por usuário se configurado
        if (Array.isArray(usuariosMonitorados) && usuariosMonitorados.length > 0) {
          if (!usuariosMonitorados.includes(uId)) {
            continue
          }
        }

        // Filtro por loja se configurado
        if (Array.isArray(lojasMonitoradas) && lojasMonitoradas.length > 0 && lojaId) {
          if (!lojasMonitoradas.includes(lojaId)) {
            continue
          }
        }

        // Filtro por área se configurado
        if (Array.isArray(areasMonitoradas) && areasMonitoradas.length > 0) {
          const matchArea = areasMonitoradas.some((a) =>
            eventoArea.includes(String(a).toLowerCase()),
          )
          if (!matchArea) {
            continue
          }
        }

        // Checagem do tipo de evento / palavra-chave
        if (palavraChave) {
          if (
            eventoDesc.includes(palavraChave) ||
            diffAntesStr.includes(palavraChave) ||
            diffDepoisStr.includes(palavraChave)
          ) {
            disparar = true
            motivoDisparo =
              'Menção à expressão monitorada "' +
              r.getString('palavra_chave') +
              '" na ação: ' +
              rec.getString('descricao')
          }
        } else if (eventoMonitorado === 'todos') {
          disparar = true
          motivoDisparo = 'Regra ampla de monitoramento ativada para ' + eventoTipo
        } else if (eventoMonitorado === 'exclusao' && eventoTipo === 'exclusao') {
          disparar = true
          motivoDisparo = 'Exclusão de registro detectada: ' + rec.getString('descricao')
        } else if (
          eventoMonitorado === 'financeiro' &&
          (eventoTipo === 'movimentacao_financeira' || eventoArea.includes('financeiro'))
        ) {
          disparar = true
          motivoDisparo = 'Ação em registros financeiros: ' + rec.getString('descricao')
        } else if (
          eventoMonitorado === 'alteracao_permissao' &&
          (eventoTipo === 'alteracao_permissao' ||
            eventoTipo === 'mudanca_nivel' ||
            eventoArea.includes('usuario'))
        ) {
          disparar = true
          motivoDisparo =
            'Alteração em perfil de acesso ou permissões: ' + rec.getString('descricao')
        } else if (
          eventoMonitorado === 'bloqueio_acesso' &&
          (eventoTipo === 'bloqueio_acesso' || rec.getString('resultado') === 'bloqueio')
        ) {
          disparar = true
          motivoDisparo = 'Tentativa de acesso não autorizada: ' + rec.getString('descricao')
        } else if (
          eventoMonitorado === 'falha_login' &&
          (eventoTipo === 'falha_login' || eventoTipo === 'tentativa_login')
        ) {
          disparar = true
          motivoDisparo = 'Tentativa ou falha de login registrada: ' + rec.getString('descricao')
        } else if (eventoMonitorado === eventoTipo) {
          disparar = true
          motivoDisparo = 'Evento monitorado correspondente: ' + rec.getString('descricao')
        }

        if (disparar) {
          const alerta = new Record(colAlertas)
          alerta.set('regra_id', r.id)
          alerta.set('regra_nome', r.getString('nome'))
          alerta.set('evento_id', rec.id)
          alerta.set('prioridade', r.getString('prioridade') || 'alta')
          alerta.set('status', 'novo')
          alerta.set('motivo', motivoDisparo)
          alerta.set('detalhes', rec.getString('descricao'))
          alerta.set('usuario_envolvido_id', uId)
          alerta.set('usuario_envolvido_nome', uNome)
          alerta.set('usuario_envolvido_email', uEmail)
          alerta.set('loja_id', lojaId)
          alerta.set('loja_nome', lojaNome)
          alerta.set('area_sistema', rec.getString('area_sistema'))
          alerta.set(
            'link_relacionado',
            '/admin/auditoria?tab=registros&busca=' + encodeURIComponent(rec.id),
          )
          alerta.set('historico_status', [
            {
              status: 'novo',
              data: new Date().toISOString(),
              alterado_por_nome: 'Sistema (Regra Automática)',
              observacao: 'Alerta gerado automaticamente pela regra ' + r.getString('nome'),
            },
          ])
          $app.save(alerta)
        }
      }
    } catch (errRegras) {
      console.log('Aviso ao avaliar regras de monitoramento:', errRegras)
    }

    return e.json(200, {
      success: true,
      evento_id: rec.id,
    })
  } catch (err) {
    console.log('Erro ao salvar evento de auditoria:', err)
    return e.json(500, {
      error: 'Falha ao registrar auditoria: ' + (err.message || String(err)),
    })
  }
})

// Endpoint para gerenciar e atualizar status do alerta mantendo o histórico de quem visualizou e resolveu
routerAdd(
  'POST',
  '/backend/v1/auditoria/alerta/update-status',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Acesso restrito.')
      }

      const userRole = authUser.getString('role')
      if (userRole !== 'master' && userRole !== 'adm') {
        return e.forbiddenError('Apenas Master ou ADM podem alterar status de alertas.')
      }

      const body = e.requestInfo().body || {}
      const alertaId = (body.alerta_id || '').trim()
      const newStatus = (body.status || '').trim() // 'novo' | 'visualizado' | 'em_analise' | 'resolvido'
      const observacao = (body.observacao || '').trim()

      if (!alertaId || !newStatus) {
        return e.badRequestError('ID do alerta e status são obrigatórios.')
      }

      const alerta = $app.findFirstRecordByData('auditoria_alertas', 'id', alertaId)
      const currentStatus = alerta.getString('status')
      const userName = authUser.getString('name') || authUser.getString('email')
      const userId = authUser.id
      const nowIso = new Date().toISOString()

      let historico = alerta.get('historico_status') || []
      if (!Array.isArray(historico)) historico = []

      historico.push({
        status_anterior: currentStatus,
        status: newStatus,
        alterado_por_id: userId,
        alterado_por_nome: userName,
        data: nowIso,
        observacao: observacao || 'Status alterado de ' + currentStatus + ' para ' + newStatus,
      })

      alerta.set('status', newStatus)
      alerta.set('historico_status', historico)

      if (newStatus === 'visualizado' && !alerta.getString('visualizado_por_id')) {
        alerta.set('visualizado_por_id', userId)
        alerta.set('visualizado_por_nome', userName)
        alerta.set('data_visualizacao', nowIso)
      }

      if (newStatus === 'resolvido') {
        alerta.set('resolvido_por_id', userId)
        alerta.set('resolvido_por_nome', userName)
        alerta.set('data_resolucao', nowIso)
        if (observacao) {
          alerta.set('resolucao_notas', observacao)
        }
      }

      $app.save(alerta)

      return e.json(200, {
        success: true,
        alerta: {
          id: alerta.id,
          status: alerta.getString('status'),
          resolvido_por_nome: alerta.getString('resolvido_por_nome'),
          visualizado_por_nome: alerta.getString('visualizado_por_nome'),
        },
      })
    } catch (err) {
      console.log('Erro ao atualizar alerta:', err)
      return e.json(500, {
        error: 'Falha ao atualizar status do alerta: ' + (err.message || String(err)),
      })
    }
  },
  $apis.requireAuth(),
)

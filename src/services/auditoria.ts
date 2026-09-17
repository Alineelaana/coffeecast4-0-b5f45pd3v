import pb from '@/lib/pocketbase/client'
import type {
  AuditoriaEventoRecord,
  AuditoriaRegraRecord,
  AuditoriaAlertaRecord,
  AuditoriaFiltros,
  AlertaStatus,
  AuditoriaTipoAcao,
  AuditoriaResultado,
} from '@/types/database'

// Chave local para guardar eventos offline caso a API /backend/v1/auditoria/log esteja indisponível
const LOCAL_AUDIT_KEY = 'coffeecast_auditoria_eventos_v1'
const LOCAL_ALERTAS_KEY = 'coffeecast_auditoria_alertas_v1'
const LOCAL_REGRAS_KEY = 'coffeecast_auditoria_regras_v1'

export interface LogAuditParams {
  usuario_id?: string
  usuario_email?: string
  usuario_nome?: string
  usuario_role?: string
  loja_id?: string
  loja_nome?: string
  tipo_acao: AuditoriaTipoAcao
  area_sistema: string
  descricao: string
  registro_afetado?: string
  tabela_afetada?: string
  resultado?: AuditoriaResultado
  diff_antes?: Record<string, unknown> | null
  diff_depois?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  suspeito?: boolean
  motivo_suspeito?: string
}

export const AuditoriaService = {
  /**
   * Registra um evento de auditoria no sistema com tolerância a falhas
   */
  async registrarEvento(params: LogAuditParams): Promise<void> {
    try {
      const authUser = pb.authStore.model as any
      const payload = {
        usuario_id: params.usuario_id || authUser?.id || '',
        usuario_email: params.usuario_email || authUser?.email || '',
        usuario_nome: params.usuario_nome || authUser?.name || authUser?.email || 'Sistema',
        usuario_role: params.usuario_role || authUser?.role || 'sistema',
        loja_id: params.loja_id || '',
        loja_nome: params.loja_nome || '',
        tipo_acao: params.tipo_acao,
        area_sistema: params.area_sistema,
        descricao: params.descricao,
        registro_afetado: params.registro_afetado || '',
        tabela_afetada: params.tabela_afetada || '',
        resultado: params.resultado || 'sucesso',
        diff_antes: params.diff_antes || null,
        diff_depois: params.diff_depois || null,
        metadata: params.metadata || null,
        suspeito: Boolean(params.suspeito),
        motivo_suspeito: params.motivo_suspeito || '',
      }

      // Tenta enviar via backend hook
      try {
        await pb.send('/backend/v1/auditoria/log', {
          method: 'POST',
          body: payload,
        })
        return
      } catch (backendErr) {
        // Se falhar o endpoint customizado, tenta salvar direto na coleção auditoria_eventos
        try {
          await pb.collection('auditoria_eventos').create(payload)
          return
        } catch {
          /* intentionally ignored */
        }
      }

      // Fallback local caso o backend esteja temporariamente em manutenção
      this._salvarLocal(payload)
    } catch (err) {
      console.warn('[AuditoriaService] Falha ao registrar evento:', err)
    }
  },

  /**
   * Salva no storage local como contingência
   */
  _salvarLocal(payload: any): void {
    try {
      const stored = localStorage.getItem(LOCAL_AUDIT_KEY)
      const list = stored ? JSON.parse(stored) : []
      const item: AuditoriaEventoRecord = {
        id: 'local_' + Math.random().toString(36).substring(2, 10),
        ...payload,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      }
      list.unshift(item)
      // Mantém últimos 200 eventos locais
      localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(list.slice(0, 200)))
    } catch {
      /* intentionally ignored */
    }
  },

  /**
   * Busca lista paginada e filtrada de eventos de auditoria
   */
  async listarEventos(
    filtros: AuditoriaFiltros = {},
    page = 1,
    perPage = 50,
  ): Promise<{ items: AuditoriaEventoRecord[]; totalItems: number; totalPages: number }> {
    try {
      const filterParts: string[] = []

      if (filtros.tipoAcao && filtros.tipoAcao !== 'todos') {
        filterParts.push(`tipo_acao = "${filtros.tipoAcao}"`)
      }
      if (filtros.resultado && filtros.resultado !== 'todos') {
        filterParts.push(`resultado = "${filtros.resultado}"`)
      }
      if (filtros.usuarioId && filtros.usuarioId !== 'todos') {
        filterParts.push(`usuario_id = "${filtros.usuarioId}"`)
      }
      if (filtros.role && filtros.role !== 'todos') {
        filterParts.push(`usuario_role = "${filtros.role}"`)
      }
      if (filtros.lojaId && filtros.lojaId !== 'todos') {
        filterParts.push(`loja_id = "${filtros.lojaId}"`)
      }
      if (filtros.suspeito) {
        filterParts.push(`suspeito = true`)
      }
      if (filtros.dataInicio) {
        filterParts.push(`created >= "${filtros.dataInicio} 00:00:00"`)
      }
      if (filtros.dataFim) {
        filterParts.push(`created <= "${filtros.dataFim} 23:59:59"`)
      }
      if (filtros.busca && filtros.busca.trim()) {
        const b = filtros.busca.trim()
        filterParts.push(
          `(descricao ~ "${b}" || usuario_nome ~ "${b}" || usuario_email ~ "${b}" || area_sistema ~ "${b}" || registro_afetado ~ "${b}")`,
        )
      }

      const filterStr = filterParts.join(' && ')

      const result = await pb
        .collection('auditoria_eventos')
        .getList<AuditoriaEventoRecord>(page, perPage, {
          sort: '-created',
          filter: filterStr || undefined,
        })

      return {
        items: result.items,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      }
    } catch (err) {
      console.warn('[AuditoriaService] Buscando eventos locais de contingência:', err)
      const stored = localStorage.getItem(LOCAL_AUDIT_KEY)
      let list: AuditoriaEventoRecord[] = stored ? JSON.parse(stored) : []

      if (list.length === 0) {
        list = this._gerarMocksIniciais()
        localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(list))
      }

      // Filtragem em memória
      let filtrados = list
      if (filtros.tipoAcao && filtros.tipoAcao !== 'todos') {
        filtrados = filtrados.filter((e) => e.tipo_acao === filtros.tipoAcao)
      }
      if (filtros.resultado && filtros.resultado !== 'todos') {
        filtrados = filtrados.filter((e) => e.resultado === filtros.resultado)
      }
      if (filtros.usuarioId && filtros.usuarioId !== 'todos') {
        filtrados = filtrados.filter((e) => e.usuario_id === filtros.usuarioId)
      }
      if (filtros.role && filtros.role !== 'todos') {
        filtrados = filtrados.filter((e) => e.usuario_role === filtros.role)
      }
      if (filtros.lojaId && filtros.lojaId !== 'todos') {
        filtrados = filtrados.filter((e) => e.loja_id === filtros.lojaId)
      }
      if (filtros.suspeito) {
        filtrados = filtrados.filter((e) => e.suspeito)
      }
      if (filtros.busca && filtros.busca.trim()) {
        const b = filtros.busca.toLowerCase()
        filtrados = filtrados.filter(
          (e) =>
            e.descricao.toLowerCase().includes(b) ||
            (e.usuario_nome && e.usuario_nome.toLowerCase().includes(b)) ||
            (e.usuario_email && e.usuario_email.toLowerCase().includes(b)) ||
            (e.area_sistema && e.area_sistema.toLowerCase().includes(b)),
        )
      }

      const offset = (page - 1) * perPage
      const paginated = filtrados.slice(offset, offset + perPage)

      return {
        items: paginated,
        totalItems: filtrados.length,
        totalPages: Math.max(1, Math.ceil(filtrados.length / perPage)),
      }
    }
  },

  /**
   * Buscar todas as regras ativas
   */
  async listarRegras(): Promise<AuditoriaRegraRecord[]> {
    try {
      return await pb.collection('auditoria_regras').getFullList<AuditoriaRegraRecord>({
        sort: '-created',
      })
    } catch (err) {
      console.warn('[AuditoriaService] Usando regras locais:', err)
      const stored = localStorage.getItem(LOCAL_REGRAS_KEY)
      if (stored) return JSON.parse(stored)

      const defaults: AuditoriaRegraRecord[] = [
        {
          id: 'regra_aline_lana',
          nome: 'Alerta de Menção a Aline Lana no Chat',
          descricao:
            'Dispara alerta crítico quando o nome da fundadora for mencionado em conversas',
          evento_monitorado: 'chat',
          palavra_chave: 'Aline Lana',
          prioridade: 'alta',
          criterio_disparo: 'imediato',
          ativo: true,
          niveis_monitorados: ['master', 'adm', 'gerencial', 'ouro', 'prata'],
          criado_por: 'Sistema CoffeeCast',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
        {
          id: 'regra_exclusoes',
          nome: 'Exclusão de Registros do Sistema',
          descricao: 'Monitora permanentemente exclusões em qualquer área',
          evento_monitorado: 'exclusao',
          palavra_chave: '',
          prioridade: 'critica',
          criterio_disparo: 'imediato',
          ativo: true,
          niveis_monitorados: ['adm', 'gerencial', 'ouro', 'prata', 'master'],
          criado_por: 'Sistema CoffeeCast',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
        {
          id: 'regra_financeiro',
          nome: 'Alteração em Movimentação Financeira',
          descricao: 'Alerta quando houver edição ou exclusão de valor financeiro',
          evento_monitorado: 'financeiro',
          palavra_chave: '',
          prioridade: 'alta',
          criterio_disparo: 'imediato',
          ativo: true,
          niveis_monitorados: ['adm', 'gerencial', 'master'],
          criado_por: 'Sistema CoffeeCast',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
        {
          id: 'regra_permissoes',
          nome: 'Alteração de Permissões ou Cargo de Usuário',
          descricao: 'Notifica modificação de perfil e acessos granulares',
          evento_monitorado: 'alteracao_permissao',
          palavra_chave: '',
          prioridade: 'critica',
          criterio_disparo: 'imediato',
          ativo: true,
          niveis_monitorados: ['adm', 'gerencial', 'master'],
          criado_por: 'Sistema CoffeeCast',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
        {
          id: 'regra_bloqueios',
          nome: 'Tentativa de Acesso Não Autorizado / Bloqueio',
          descricao: 'Identifica tentativas de acessar telas restritas',
          evento_monitorado: 'bloqueio_acesso',
          palavra_chave: '',
          prioridade: 'alta',
          criterio_disparo: 'imediato',
          ativo: true,
          niveis_monitorados: ['adm', 'gerencial', 'ouro', 'prata'],
          criado_por: 'Sistema CoffeeCast',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
        {
          id: 'regra_falhas_login',
          nome: 'Múltiplas Falhas de Login',
          descricao: 'Monitora tentativas frustradas de login',
          evento_monitorado: 'falha_login',
          palavra_chave: '',
          prioridade: 'alta',
          criterio_disparo: 'imediato',
          ativo: true,
          criado_por: 'Sistema CoffeeCast',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
      ]
      localStorage.setItem(LOCAL_REGRAS_KEY, JSON.stringify(defaults))
      return defaults
    }
  },

  /**
   * Salvar ou criar nova regra de monitoramento
   */
  async salvarRegra(regra: Partial<AuditoriaRegraRecord>): Promise<AuditoriaRegraRecord> {
    try {
      if (regra.id && !regra.id.startsWith('local_')) {
        return await pb.collection('auditoria_regras').update<AuditoriaRegraRecord>(regra.id, regra)
      } else {
        return await pb.collection('auditoria_regras').create<AuditoriaRegraRecord>(regra)
      }
    } catch (err) {
      console.warn('[AuditoriaService] Salvando regra localmente:', err)
      const stored = localStorage.getItem(LOCAL_REGRAS_KEY)
      const list: AuditoriaRegraRecord[] = stored ? JSON.parse(stored) : []
      if (regra.id) {
        const idx = list.findIndex((r) => r.id === regra.id)
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...regra, updated: new Date().toISOString() }
          localStorage.setItem(LOCAL_REGRAS_KEY, JSON.stringify(list))
          return list[idx]
        }
      }
      const newRegra: AuditoriaRegraRecord = {
        id: 'local_' + Math.random().toString(36).substring(2, 9),
        nome: regra.nome || 'Nova Regra',
        evento_monitorado: regra.evento_monitorado || 'todos',
        prioridade: regra.prioridade || 'media',
        ativo: regra.ativo !== false,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        ...regra,
      } as AuditoriaRegraRecord
      list.unshift(newRegra)
      localStorage.setItem(LOCAL_REGRAS_KEY, JSON.stringify(list))
      return newRegra
    }
  },

  /**
   * Excluir regra
   */
  async excluirRegra(id: string): Promise<void> {
    try {
      await pb.collection('auditoria_regras').delete(id)
    } catch (_) {
      const stored = localStorage.getItem(LOCAL_REGRAS_KEY)
      if (stored) {
        const list = JSON.parse(stored).filter((r: any) => r.id !== id)
        localStorage.setItem(LOCAL_REGRAS_KEY, JSON.stringify(list))
      }
    }
  },

  /**
   * Listar alertas da central
   */
  async listarAlertas(filtroStatus?: string): Promise<AuditoriaAlertaRecord[]> {
    try {
      const filter =
        filtroStatus && filtroStatus !== 'todos' ? `status = "${filtroStatus}"` : undefined
      return await pb.collection('auditoria_alertas').getFullList<AuditoriaAlertaRecord>({
        sort: '-created',
        filter,
      })
    } catch (err) {
      console.warn('[AuditoriaService] Usando alertas locais:', err)
      const stored = localStorage.getItem(LOCAL_ALERTAS_KEY)
      if (stored) {
        let list: AuditoriaAlertaRecord[] = JSON.parse(stored)
        if (filtroStatus && filtroStatus !== 'todos') {
          list = list.filter((a) => a.status === filtroStatus)
        }
        return list
      }
      const mocks: AuditoriaAlertaRecord[] = [
        {
          id: 'alerta_1',
          regra_nome: 'Exclusão Crítica de Registro',
          prioridade: 'critica',
          status: 'novo',
          motivo: 'Registro permanente excluído da tabela "transacoes"',
          detalhes: 'Lançamento de despesa no valor de R$ 1.500,00 foi excluído',
          usuario_envolvido_nome: 'Mariana Financeiro',
          usuario_envolvido_email: 'mariana@coffeecast.com',
          area_sistema: 'Financeiro & Horas',
          created: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          updated: new Date().toISOString(),
        },
        {
          id: 'alerta_2',
          regra_nome: 'Alerta de Menção a Aline Lana no Chat',
          prioridade: 'alta',
          status: 'visualizado',
          motivo: 'Menção à fundadora no Chat de Membros',
          detalhes: 'Mensagem enviada com o nome da apresentadora para confirmação de pauta',
          usuario_envolvido_nome: 'Carlos Produtor',
          usuario_envolvido_email: 'carlos@coffeecast.com',
          area_sistema: 'Chat e Conversas',
          created: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          updated: new Date().toISOString(),
        },
      ]
      localStorage.setItem(LOCAL_ALERTAS_KEY, JSON.stringify(mocks))
      return mocks
    }
  },

  /**
   * Atualizar status do alerta com histórico de quem alterou/resolveu
   */
  async atualizarStatusAlerta(
    alertaId: string,
    novoStatus: AlertaStatus,
    observacao?: string,
  ): Promise<void> {
    const authUser = pb.authStore.model as any
    const userName = authUser?.name || authUser?.email || 'Administrador'
    const userId = authUser?.id || ''
    const nowIso = new Date().toISOString()

    try {
      await pb.send('/backend/v1/auditoria/alerta/update-status', {
        method: 'POST',
        body: {
          alerta_id: alertaId,
          status: novoStatus,
          observacao,
        },
      })
      return
    } catch {
      /* intentionally ignored */
    }

    try {
      const rec = await pb.collection('auditoria_alertas').getOne<AuditoriaAlertaRecord>(alertaId)
      let historico = rec.historico_status || []
      if (!Array.isArray(historico)) historico = []

      historico.push({
        status_anterior: rec.status,
        status: novoStatus,
        alterado_por_id: userId,
        alterado_por_nome: userName,
        data: nowIso,
        observacao: observacao || `Status alterado para ${novoStatus}`,
      })

      const updatePayload: Record<string, unknown> = {
        status: novoStatus,
        historico_status: historico,
      }

      if (novoStatus === 'visualizado' && !rec.visualizado_por_id) {
        updatePayload.visualizado_por_id = userId
        updatePayload.visualizado_por_nome = userName
        updatePayload.data_visualizacao = nowIso
      }
      if (novoStatus === 'resolvido') {
        updatePayload.resolvido_por_id = userId
        updatePayload.resolvido_por_nome = userName
        updatePayload.data_resolucao = nowIso
        if (observacao) updatePayload.resolucao_notas = observacao
      }

      await pb.collection('auditoria_alertas').update(alertaId, updatePayload)
      return
    } catch {
      /* intentionally ignored */
    }

    // Fallback local
    const stored = localStorage.getItem(LOCAL_ALERTAS_KEY)
    if (stored) {
      const list: AuditoriaAlertaRecord[] = JSON.parse(stored)
      const item = list.find((a) => a.id === alertaId)
      if (item) {
        item.status = novoStatus
        if (!item.historico_status) item.historico_status = []
        item.historico_status.push({
          status: novoStatus,
          alterado_por_nome: userName,
          data: nowIso,
          observacao,
        })
        if (novoStatus === 'resolvido') {
          item.resolvido_por_nome = userName
          item.data_resolucao = nowIso
        } else if (novoStatus === 'visualizado') {
          item.visualizado_por_nome = userName
          item.data_visualizacao = nowIso
        }
        localStorage.setItem(LOCAL_ALERTAS_KEY, JSON.stringify(list))
      }
    }
  },

  /**
   * Exporta os eventos filtrados em CSV
   */
  exportarCSV(eventos: AuditoriaEventoRecord[]): void {
    if (!eventos || eventos.length === 0) return

    const headers = [
      'Data/Hora',
      'ID Evento',
      'Usuário',
      'E-mail',
      'Nível / Cargo',
      'Tipo de Ação',
      'Área do Sistema',
      'Descrição',
      'Registro Afetado',
      'Tabela',
      'Resultado',
      'IP',
      'Dispositivo',
      'Navegador',
      'Loja',
      'Suspeito',
    ]

    const rows = eventos.map((e) => [
      `"${new Date(e.created).toLocaleString('pt-BR')}"`,
      `"${e.id}"`,
      `"${(e.usuario_nome || '').replace(/"/g, '""')}"`,
      `"${(e.usuario_email || '').replace(/"/g, '""')}"`,
      `"${e.usuario_role || ''}"`,
      `"${e.tipo_acao}"`,
      `"${(e.area_sistema || '').replace(/"/g, '""')}"`,
      `"${(e.descricao || '').replace(/"/g, '""')}"`,
      `"${(e.registro_afetado || '').replace(/"/g, '""')}"`,
      `"${(e.tabela_afetada || '').replace(/"/g, '""')}"`,
      `"${e.resultado}"`,
      `"${e.ip || ''}"`,
      `"${e.dispositivo || ''}"`,
      `"${e.navegador || ''}"`,
      `"${(e.loja_nome || '').replace(/"/g, '""')}"`,
      `"${e.suspeito ? 'SIM' : 'NÃO'}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `auditoria_coffeecast_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },

  /**
   * Mocks iniciais para enriquecer visualização e testes se o banco for novo
   */
  _gerarMocksIniciais(): AuditoriaEventoRecord[] {
    const agora = Date.now()
    return [
      {
        id: 'evt_login_master',
        tipo_acao: 'login',
        area_sistema: 'Autenticação',
        descricao: 'Login efetuado com sucesso pelo Superadministrador Master',
        usuario_id: 'usr_aline',
        usuario_nome: 'Aline Lana',
        usuario_email: 'alineelaana@gmail.com',
        usuario_role: 'master',
        loja_nome: 'Plataforma Geral',
        resultado: 'sucesso',
        ip: '187.32.14.90',
        dispositivo: 'Desktop',
        navegador: 'Chrome',
        created: new Date(agora - 1000 * 60 * 15).toISOString(),
        updated: new Date(agora - 1000 * 60 * 15).toISOString(),
      },
      {
        id: 'evt_diff_financeiro',
        tipo_acao: 'movimentacao_financeira',
        area_sistema: 'Financeiro & Horas',
        descricao: 'Alteração no valor de transação de patrocínio Master',
        registro_afetado: 'tx_9921',
        tabela_afetada: 'transacoes',
        usuario_id: 'usr_mariana',
        usuario_nome: 'Mariana Produtora',
        usuario_email: 'mariana@coffeecast.com',
        usuario_role: 'adm',
        loja_nome: 'CoffeeCast Principal',
        resultado: 'sucesso',
        ip: '177.18.99.12',
        dispositivo: 'Desktop',
        navegador: 'Edge',
        diff_antes: {
          valor: 2500,
          situacao: 'em_aberto',
          descricao: 'Patrocínio Episódio 12',
        },
        diff_depois: {
          valor: 3200,
          situacao: 'quitado',
          descricao: 'Patrocínio Episódio 12 (Cota Premium)',
        },
        created: new Date(agora - 1000 * 60 * 85).toISOString(),
        updated: new Date(agora - 1000 * 60 * 85).toISOString(),
      },
      {
        id: 'evt_exclusao_roteiro',
        tipo_acao: 'exclusao',
        area_sistema: 'Roteiros & Apresentações',
        descricao: 'Exclusão permanente de ficha de convidado arquivada',
        registro_afetado: 'rot_382',
        tabela_afetada: 'roteiros_convidados',
        usuario_id: 'usr_carlos',
        usuario_nome: 'Carlos Assistente',
        usuario_email: 'carlos@coffeecast.com',
        usuario_role: 'gerencial',
        resultado: 'sucesso',
        ip: '189.44.11.20',
        dispositivo: 'Mobile',
        navegador: 'Safari',
        diff_antes: {
          nome: 'Roberto Antigo Convidado',
          empresa: 'Café Sul',
          status: 'arquivada',
        },
        created: new Date(agora - 1000 * 60 * 240).toISOString(),
        updated: new Date(agora - 1000 * 60 * 240).toISOString(),
      },
      {
        id: 'evt_bloqueio_tentativa',
        tipo_acao: 'bloqueio_acesso',
        area_sistema: 'Usuários & Permissões',
        descricao: 'Tentativa de acesso à área exclusiva Master sem permissão concedida',
        usuario_id: 'usr_guest_ouro',
        usuario_nome: 'Membro Ouro VIP',
        usuario_email: 'membro.ouro@coffeecast.com',
        usuario_role: 'ouro',
        resultado: 'bloqueio',
        suspeito: true,
        motivo_suspeito: 'Tentativa de navegação direta para rota restrita /admin/usuarios',
        ip: '201.88.192.4',
        dispositivo: 'Desktop',
        navegador: 'Firefox',
        created: new Date(agora - 1000 * 60 * 360).toISOString(),
        updated: new Date(agora - 1000 * 60 * 360).toISOString(),
      },
      {
        id: 'evt_chat_aline_lana',
        tipo_acao: 'chat',
        area_sistema: 'Chat e Conversas',
        descricao: 'Mensagem enviada citando Aline Lana para gravação especial',
        usuario_id: 'usr_mariana',
        usuario_nome: 'Mariana Produtora',
        usuario_email: 'mariana@coffeecast.com',
        usuario_role: 'adm',
        resultado: 'sucesso',
        ip: '177.18.99.12',
        dispositivo: 'Desktop',
        navegador: 'Edge',
        diff_depois: {
          texto: 'Aline Lana confirmou a presença no episódio da próxima terça-feira?',
          conversa: 'Chat Geral',
        },
        created: new Date(agora - 1000 * 60 * 420).toISOString(),
        updated: new Date(agora - 1000 * 60 * 420).toISOString(),
      },
      {
        id: 'evt_falha_login_senha',
        tipo_acao: 'falha_login',
        area_sistema: 'Autenticação',
        descricao: 'Tentativa de login com senha incorreta para conta administrativa',
        usuario_email: 'financeiro@coffeecast.com',
        usuario_role: 'adm',
        resultado: 'erro',
        suspeito: true,
        motivo_suspeito: '3ª tentativa falha consecutiva de autenticação',
        ip: '45.160.22.8',
        dispositivo: 'Mobile',
        navegador: 'Chrome',
        created: new Date(agora - 1000 * 60 * 540).toISOString(),
        updated: new Date(agora - 1000 * 60 * 540).toISOString(),
      },
    ]
  },
}

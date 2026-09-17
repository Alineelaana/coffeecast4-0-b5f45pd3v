import pb from '@/lib/pocketbase/client'
import type {
  ChatConversaRecord,
  ChatParticipanteRecord,
  ChatMensagemRecord,
  ChatUserItem,
  ChatOverviewItem,
} from '@/types/database'

export class ChatService {
  /**
   * Busca lista de usuários cadastrados e ativos para iniciar conversas privadas ou grupos.
   */
  static async getChatUsers(): Promise<ChatUserItem[]> {
    try {
      const res = await pb.send<{ success: boolean; users: ChatUserItem[] }>(
        '/backend/v1/chat/users',
        { method: 'GET' },
      )
      if (res?.users) {
        return res.users
      }
    } catch (err) {
      console.warn('Endpoint /backend/v1/chat/users falhou, usando fallback SDK:', err)
    }

    // Fallback direto via SDK
    try {
      const list = await pb.collection('users').getFullList({
        filter: 'ativo = true',
        sort: 'name',
      })
      const nowMs = Date.now()
      return list.map((u: any) => {
        let status = u.status || 'offline'
        if (status !== 'em_pausa') {
          if (u.last_seen && nowMs - new Date(u.last_seen).getTime() <= 3 * 60 * 1000) {
            status = 'online'
          } else {
            status = 'offline'
          }
        }
        return {
          id: u.id,
          name: u.name || u.email?.split('@')[0] || 'Membro',
          email: u.email || '',
          avatar: u.avatar || '',
          role: u.role || 'prata',
          bio: u.bio || '',
          status,
          pause_reason: status === 'em_pausa' ? u.pause_reason || '' : '',
          last_seen: u.last_seen || '',
          status_updated: u.status_updated || '',
        }
      })
    } catch {
      return []
    }
  }

  /**
   * Atualiza o status do usuário autenticado no Chat e registra na auditoria
   */
  static async updateUserStatus(
    status: 'online' | 'offline' | 'em_pausa',
    pauseReason?: string,
  ): Promise<{ status: string; pause_reason?: string; status_updated: string }> {
    const res = await pb.send<{
      success: boolean
      status: string
      pause_reason: string
      status_updated: string
    }>('/backend/v1/chat/status', {
      method: 'POST',
      body: {
        status,
        pause_reason: status === 'em_pausa' ? pauseReason || '' : '',
      },
    })
    return res
  }

  /**
   * Envia sinal de heartbeat para manter status online
   */
  static async sendHeartbeat(): Promise<void> {
    try {
      await pb.send('/backend/v1/chat/heartbeat', {
        method: 'POST',
      })
    } catch {
      /* intentionally ignored */
    }
  }

  /**
   * Busca ou garante a conversa do Chat Geral
   */
  static async getGeralConversation(): Promise<ChatConversaRecord> {
    try {
      const geral = await pb
        .collection('chat_conversas')
        .getFirstListItem<ChatConversaRecord>('tipo = "geral"')
      return geral
    } catch {
      // Se não existir, tenta criar
      const nova = await pb.collection('chat_conversas').create<ChatConversaRecord>({
        tipo: 'geral',
        nome: 'Chat Geral CoffeeCast',
        descricao: 'Espaço de convivência oficial aberto a todos os membros e equipe CoffeeCast.',
        ultima_mensagem: 'Boas-vindas ao Chat Geral!',
        ultimo_envio: new Date().toISOString(),
      })
      return nova
    }
  }

  /**
   * Inicia conversa privada anti-duplicidade (no servidor)
   */
  static async startPrivateChat(targetUserId: string): Promise<{
    conversa: { id: string; tipo: 'privado'; private_pair: string }
    createdNew: boolean
  }> {
    const res = await pb.send<{
      success: boolean
      createdNew: boolean
      conversa: { id: string; tipo: 'privado'; private_pair: string }
    }>('/backend/v1/chat/private/start', {
      method: 'POST',
      body: { target_user_id: targetUserId },
    })
    return { conversa: res.conversa, createdNew: res.createdNew }
  }

  /**
   * Cria novo grupo com nome, descrição, foto opcional e participantes selecionados
   */
  static async createGroupChat(
    nome: string,
    descricao: string,
    participantIds: string[],
    fotoFile?: File | null,
  ): Promise<ChatConversaRecord> {
    const res = await pb.send<{
      success: boolean
      conversa: ChatConversaRecord
    }>('/backend/v1/chat/group/create', {
      method: 'POST',
      body: {
        nome: nome.trim(),
        descricao: descricao.trim(),
        participant_ids: participantIds,
      },
    })

    const grupoCriado = res.conversa
    if (fotoFile && grupoCriado?.id) {
      try {
        const formData = new FormData()
        formData.append('foto', fotoFile)
        const updated = await pb
          .collection('chat_conversas')
          .update<ChatConversaRecord>(grupoCriado.id, formData)
        return updated
      } catch (errFoto) {
        console.warn('Grupo criado, porém falha no upload da foto:', errFoto)
      }
    }

    return grupoCriado
  }

  /**
   * Atualiza detalhes do grupo (nome, descrição e/ou foto)
   * Preserva todos os demais dados existentes
   */
  static async updateGroup(
    conversaId: string,
    data: {
      nome?: string
      descricao?: string
      fotoFile?: File | null
      removeFoto?: boolean
    },
  ): Promise<ChatConversaRecord> {
    if (data.fotoFile || data.removeFoto) {
      const formData = new FormData()
      if (data.nome !== undefined) formData.append('nome', data.nome.trim())
      if (data.descricao !== undefined) formData.append('descricao', data.descricao.trim())

      if (data.fotoFile) {
        formData.append('foto', data.fotoFile)
      } else if (data.removeFoto) {
        formData.append('foto', '')
      }

      return await pb.collection('chat_conversas').update<ChatConversaRecord>(conversaId, formData)
    }

    const payload: Record<string, any> = {}
    if (data.nome !== undefined) payload.nome = data.nome.trim()
    if (data.descricao !== undefined) payload.descricao = data.descricao.trim()

    return await pb.collection('chat_conversas').update<ChatConversaRecord>(conversaId, payload)
  }

  /**
   * Busca as conversas privadas e grupos em que o usuário logado participa
   */
  static async getMyConversations(userId: string): Promise<{
    participacoes: ChatParticipanteRecord[]
    conversas: ChatConversaRecord[]
  }> {
    // 1. Buscar participações do usuário com a conversa expandida
    const participacoes = await pb
      .collection('chat_participantes')
      .getFullList<ChatParticipanteRecord>({
        filter: `user = "${userId}"`,
        expand: 'conversa,conversa.criador',
      })

    const conversaIds = participacoes.map((p) => p.conversa)
    if (conversaIds.length === 0) {
      return { participacoes: [], conversas: [] }
    }

    // 2. Buscar dados completos das conversas
    const filter = conversaIds.map((id) => `id = "${id}"`).join(' || ')
    const conversas = await pb.collection('chat_conversas').getFullList<ChatConversaRecord>({
      filter,
      sort: '-updated',
    })

    return { participacoes, conversas }
  }

  /**
   * Busca participantes de uma conversa específica com dados do usuário expandidos
   */
  static async getConversationParticipants(conversaId: string): Promise<ChatParticipanteRecord[]> {
    return await pb.collection('chat_participantes').getFullList<ChatParticipanteRecord>({
      filter: `conversa = "${conversaId}"`,
      expand: 'user',
    })
  }

  /**
   * Carrega mensagens de uma conversa com remetente expandido
   */
  static async getMessages(
    conversaId: string,
    page: number = 1,
    perPage: number = 50,
  ): Promise<{ items: ChatMensagemRecord[]; totalPages: number; totalItems: number }> {
    const res = await pb.collection('chat_mensagens').getList<ChatMensagemRecord>(page, perPage, {
      filter: `conversa = "${conversaId}"`,
      sort: 'created',
      expand: 'remetente',
    })
    return {
      items: res.items,
      totalPages: res.totalPages,
      totalItems: res.totalItems,
    }
  }

  /**
   * Envia uma mensagem em uma conversa e atualiza a última mensagem na conversa
   */
  static async sendMessage(
    conversaId: string,
    remetenteId: string,
    texto: string,
  ): Promise<ChatMensagemRecord> {
    const msg = await pb.collection('chat_mensagens').create<ChatMensagemRecord>(
      {
        conversa: conversaId,
        remetente: remetenteId,
        texto: texto.trim(),
      },
      {
        expand: 'remetente',
      },
    )

    // Atualiza preview da conversa
    try {
      await pb.collection('chat_conversas').update(conversaId, {
        ultima_mensagem: texto.trim(),
        ultimo_envio: new Date().toISOString(),
      })
    } catch (err) {
      console.warn('Aviso ao atualizar última mensagem da conversa:', err)
    }

    return msg
  }

  /**
   * Atualiza a data de última leitura do usuário em uma conversa
   */
  static async markConversationAsRead(conversaId: string, userId: string): Promise<void> {
    try {
      const part = await pb
        .collection('chat_participantes')
        .getFirstListItem<ChatParticipanteRecord>(
          `conversa = "${conversaId}" && user = "${userId}"`,
        )
      await pb.collection('chat_participantes').update(part.id, {
        ultima_leitura: new Date().toISOString(),
      })
    } catch (_) {
      // Se for Chat Geral ou ainda não tiver registro de participante, pode criar ou ignorar
      try {
        await pb.collection('chat_participantes').create({
          conversa: conversaId,
          user: userId,
          ultima_leitura: new Date().toISOString(),
        })
      } catch {
        /* intentionally ignored */
      }
    }
  }

  /**
   * Conta quantas mensagens não lidas existem em uma conversa para o usuário logado
   */
  static async getUnreadCount(
    conversaId: string,
    userId: string,
    ultimaLeitura?: string,
  ): Promise<number> {
    try {
      let filter = `conversa = "${conversaId}" && remetente != "${userId}"`
      if (ultimaLeitura) {
        filter += ` && created > "${ultimaLeitura}"`
      }
      const res = await pb.collection('chat_mensagens').getList(1, 1, {
        filter,
        fields: 'id',
      })
      return res.totalItems
    } catch {
      return 0
    }
  }

  /**
   * MASTER ONLY: Overview com todas as conversas do sistema
   */
  static async getMasterOverview(): Promise<ChatOverviewItem[]> {
    const res = await pb.send<{
      success: boolean
      conversas: ChatOverviewItem[]
    }>('/backend/v1/chat/admin/overview', {
      method: 'GET',
    })
    return res.conversas || []
  }

  /**
   * MASTER ONLY: Excluir mensagem específica
   */
  static async deleteMessage(messageId: string): Promise<void> {
    await pb.send('/backend/v1/chat/admin/message/delete', {
      method: 'POST',
      body: { message_id: messageId },
    })
  }

  /**
   * MASTER ONLY: Excluir conversa inteira
   */
  static async deleteConversation(conversaId: string): Promise<void> {
    await pb.send('/backend/v1/chat/admin/conversa/delete', {
      method: 'POST',
      body: { conversa_id: conversaId },
    })
  }
}

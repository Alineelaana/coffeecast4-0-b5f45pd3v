import React, { useState, useEffect } from 'react'
import { useStorefront } from '@/context/StorefrontContext'
import { StorefrontService } from '@/services/storefront'
import { getFileUrl, extractYouTubeId, parseInstagramHandle } from '@/lib/formatters'
import type {
  StoreRecord,
  StoreWithCounts,
  StoreMemberRecord,
  StoreEpisodeRecord,
  StoreBannerRecord,
  StoreTestimonialRecord,
  StoreSectionsToggles,
} from '@/types/database'
import {
  Store,
  Plus,
  Settings,
  ExternalLink,
  Users,
  Tv,
  Image as ImageIcon,
  MessageSquareQuote,
  Trash2,
  Edit,
  Save,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Eye,
  Layers,
  ChevronRight,
  Globe,
  Upload,
  Play,
  Palette,
  AlignLeft,
  Sliders,
  Send,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function AdminStorefrontScreen() {
  const { isMaster } = useAuth()
  const {
    stores,
    activeStore,
    activeStoreId,
    setActiveStoreId,
    refreshStores,
    refreshActiveStore,
    isLoadingStores,
  } = useStorefront()

  const [activeMainTab, setActiveMainTab] = useState<'minhas_lojas' | 'conteudo'>('minhas_lojas')

  // Modais de Loja
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [storeToDelete, setStoreToDelete] = useState<StoreWithCounts | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Form State: Nova Loja
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newDomain, setNewDomain] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Form State: Editar Loja Completa
  const [editingStore, setEditingStore] = useState<StoreRecord | null>(null)
  const [editTab, setEditTab] = useState<
    'geral' | 'cores' | 'hero' | 'secoes' | 'proposito' | 'contato'
  >('geral')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [heroFile, setHeroFile] = useState<File | null>(null)

  // Sub-aba de conteúdo da loja ativa
  const [contentTab, setContentTab] = useState<
    'integrantes' | 'episodios' | 'banners' | 'depoimentos'
  >('integrantes')

  // Conteúdos da loja ativa
  const [members, setMembers] = useState<StoreMemberRecord[]>([])
  const [episodes, setEpisodes] = useState<StoreEpisodeRecord[]>([])
  const [banners, setBanners] = useState<StoreBannerRecord[]>([])
  const [testimonials, setTestimonials] = useState<StoreTestimonialRecord[]>([])
  const [loadingContent, setLoadingContent] = useState(false)

  // Modais de Conteúdo
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editingMember, setEditingMember] = useState<StoreMemberRecord | null>(null)
  const [mName, setMName] = useState('')
  const [mRole, setMRole] = useState('')
  const [mBio, setMBio] = useState('')
  const [mInstagram, setMInstagram] = useState('')
  const [mOrder, setMOrder] = useState<number>(1)
  const [mPhoto, setMPhoto] = useState<File | null>(null)
  const [savingMember, setSavingMember] = useState(false)

  const [showEpisodeModal, setShowEpisodeModal] = useState(false)
  const [editingEpisode, setEditingEpisode] = useState<StoreEpisodeRecord | null>(null)
  const [epTitle, setEpTitle] = useState('')
  const [epDescription, setEpDescription] = useState('')
  const [epYoutubeUrl, setEpYoutubeUrl] = useState('')
  const [epDate, setEpDate] = useState('')
  const [epStatus, setEpStatus] = useState<'published' | 'draft'>('published')
  const [epOrder, setEpOrder] = useState<number>(1)
  const [epCover, setEpCover] = useState<File | null>(null)
  const [savingEpisode, setSavingEpisode] = useState(false)

  const [showBannerModal, setShowBannerModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<StoreBannerRecord | null>(null)
  const [bTitle, setBTitle] = useState('')
  const [bLinkUrl, setBLinkUrl] = useState('')
  const [bPosition, setBPosition] = useState<'hero' | 'inline'>('hero')
  const [bActive, setBActive] = useState(true)
  const [bOrder, setBOrder] = useState<number>(1)
  const [bImage, setBImage] = useState<File | null>(null)
  const [savingBanner, setSavingBanner] = useState(false)

  const [showTestimonialModal, setShowTestimonialModal] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<StoreTestimonialRecord | null>(null)
  const [tName, setTName] = useState('')
  const [tRole, setTRole] = useState('')
  const [tInstagram, setTInstagram] = useState('')
  const [tMessage, setTMessage] = useState('')
  const [tApproved, setTApproved] = useState(true)
  const [tOrder, setTOrder] = useState<number>(1)
  const [tPhoto, setTPhoto] = useState<File | null>(null)
  const [savingTestimonial, setSavingTestimonial] = useState(false)

  // Copiado
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  // Auto-gerar slug a partir do nome
  const generateSlug = (val: string) => {
    return val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  const handleNameChange = (val: string) => {
    setNewName(val)
    if (!newSlug || newSlug === generateSlug(newName)) {
      setNewSlug(generateSlug(val))
    }
  }

  // Carrega conteúdo da loja ativa
  const loadActiveStoreContent = async () => {
    if (!activeStoreId) {
      setMembers([])
      setEpisodes([])
      setBanners([])
      setTestimonials([])
      return
    }

    try {
      setLoadingContent(true)
      const [m, ep, b, t] = await Promise.all([
        StorefrontService.getMembers(activeStoreId),
        StorefrontService.getEpisodes(activeStoreId),
        StorefrontService.getBanners(activeStoreId),
        StorefrontService.getTestimonials(activeStoreId),
      ])
      setMembers(m)
      setEpisodes(ep)
      setBanners(b)
      setTestimonials(t)
    } catch (e) {
      console.error('Erro ao carregar conteúdo da loja ativa:', e)
      toast.error('Erro ao carregar conteúdo da loja ativa.')
    } finally {
      setLoadingContent(false)
    }
  }

  useEffect(() => {
    if (isMaster) {
      loadActiveStoreContent()
    }
  }, [activeStoreId, isMaster])

  if (!isMaster) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-vinho/10 p-8 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-vinho">Área Restrita ao Master</h2>
        <p className="text-sm text-vinho/70 leading-relaxed">
          A plataforma Storefront Multi-Lojas é restrita exclusivamente ao Superadministrador
          Master. Sua categoria não possui permissão para acessar esta área.
        </p>
        <div className="pt-2">
          <Link to="/admin">
            <Button className="bg-vinho hover:bg-vinho-light text-white text-xs font-semibold rounded-full px-6 min-h-[44px] inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar à Visão Geral
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // ==========================================
  // HANDLERS DE LOJA
  // ==========================================
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newSlug.trim()) {
      toast.error('Informe o nome e o slug da nova loja.')
      return
    }

    setIsCreating(true)
    try {
      const cleanSlug = generateSlug(newSlug)
      // Checar se já existe slug
      const existing = await StorefrontService.getStoreBySlug(cleanSlug)
      if (existing) {
        toast.error(`O slug "${cleanSlug}" já está sendo usado por outra loja. Escolha outro.`)
        setIsCreating(false)
        return
      }

      let cleanDomain = newDomain.trim().toLowerCase()
      if (cleanDomain.startsWith('http://') || cleanDomain.startsWith('https://')) {
        cleanDomain = cleanDomain.replace(/^https?:\/\//, '')
      }
      cleanDomain = cleanDomain.split('/')[0].split(':')[0].trim()

      const created = await StorefrontService.createStore({
        name: newName.trim(),
        slug: cleanSlug,
        domain: cleanDomain || undefined,
        status: 'active',
        color_primary: '#4A0E17',
        color_secondary: '#D4AF37',
        color_background: '#FAF8F5',
        color_surface: '#2D050B',
        color_accent: '#E5C158',
        sections_toggles: {
          integrantes: true,
          episodios: true,
          depoimentos: true,
          banners_inline: true,
          missao: true,
          manifesto: true,
          contato: true,
        },
      })

      toast.success(`Loja "${created.name}" criada com sucesso!`)
      setShowCreateModal(false)
      setNewName('')
      setNewSlug('')
      setNewDomain('')
      await refreshStores()
      setActiveStoreId(created.id)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao criar loja. Verifique os campos.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenEditStore = (s: StoreWithCounts) => {
    // Clona garantindo que nenhum campo existente se perca
    setEditingStore({
      ...s,
      name: s.name || '',
      slug: s.slug || '',
      domain: s.domain || '',
      tagline: s.tagline || '',
      description: s.description || '',
      company_name: s.company_name || '',
      color_primary: s.color_primary || '#4A0E17',
      color_secondary: s.color_secondary || '#D4AF37',
      color_background: s.color_background || '#FAF8F5',
      color_surface: s.color_surface || '#2D050B',
      color_accent: s.color_accent || '#E5C158',
      hero_title: s.hero_title || '',
      hero_subtitle: s.hero_subtitle || '',
      hero_tagline_words: s.hero_tagline_words || '',
      hero_phrase: s.hero_phrase || '',
      mission_text: s.mission_text || '',
      vision_text: s.vision_text || '',
      values_text: s.values_text || '',
      manifesto_text: s.manifesto_text || '',
      whatsapp_contato: s.whatsapp_contato || '',
      instagram: s.instagram || '',
      email_contato: s.email_contato || '',
      youtube_canal: s.youtube_canal || '',
      sections_toggles: s.sections_toggles || {},
    })
    setLogoFile(null)
    setHeroFile(null)
    setEditTab('geral')
    setShowEditModal(true)
  }

  const handleSaveStoreEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStore?.id) return

    setIsSavingEdit(true)
    try {
      const formData = new FormData()
      formData.append('name', (editingStore.name || '').trim())
      formData.append('slug', generateSlug(editingStore.slug || ''))

      let cleanDomain = (editingStore.domain || '').trim().toLowerCase()
      if (cleanDomain.startsWith('http://') || cleanDomain.startsWith('https://')) {
        cleanDomain = cleanDomain.replace(/^https?:\/\//, '')
      }
      cleanDomain = cleanDomain.split('/')[0].split(':')[0].trim()
      formData.append('domain', cleanDomain)

      formData.append('status', editingStore.status || 'active')
      formData.append('tagline', editingStore.tagline || '')
      formData.append('description', editingStore.description || '')
      formData.append('color_primary', editingStore.color_primary || '#4A0E17')
      formData.append('color_secondary', editingStore.color_secondary || '#D4AF37')
      formData.append('color_background', editingStore.color_background || '#FAF8F5')
      formData.append('color_surface', editingStore.color_surface || '#2D050B')
      formData.append('color_accent', editingStore.color_accent || '#E5C158')
      formData.append('font_display', editingStore.font_display || '')
      formData.append('font_body', editingStore.font_body || '')
      formData.append('whatsapp_contato', editingStore.whatsapp_contato || '')
      formData.append('instagram', editingStore.instagram || '')
      formData.append('email_contato', editingStore.email_contato || '')
      formData.append('youtube_canal', editingStore.youtube_canal || '')
      formData.append('hero_title', editingStore.hero_title || '')
      formData.append('hero_subtitle', editingStore.hero_subtitle || '')
      formData.append('hero_tagline_words', editingStore.hero_tagline_words || '')
      formData.append('hero_phrase', editingStore.hero_phrase || '')
      formData.append('mission_text', editingStore.mission_text || '')
      formData.append('vision_text', editingStore.vision_text || '')
      formData.append('values_text', editingStore.values_text || '')
      formData.append('manifesto_text', editingStore.manifesto_text || '')
      formData.append('company_name', editingStore.company_name || '')
      formData.append('sections_toggles', JSON.stringify(editingStore.sections_toggles || {}))

      // Preservação de arquivos: só anexa se houver um novo arquivo selecionado
      if (logoFile) {
        formData.append('logo_url', logoFile)
      }
      if (heroFile) {
        formData.append('hero_url', heroFile)
      }

      await StorefrontService.updateStore(editingStore.id, formData)
      toast.success('Configurações da loja salvas com sucesso!')
      setShowEditModal(false)
      await refreshStores()
      await refreshActiveStore()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao salvar alterações da loja.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteStore = async () => {
    if (!storeToDelete) return
    if (deleteConfirmName.trim() !== storeToDelete.name.trim()) {
      toast.error('O nome digitado não confere.')
      return
    }

    setIsDeleting(true)
    try {
      await StorefrontService.deleteStore(storeToDelete.id)
      toast.success(`Loja "${storeToDelete.name}" excluída com sucesso.`)
      setShowDeleteModal(false)
      setStoreToDelete(null)
      setDeleteConfirmName('')
      if (activeStoreId === storeToDelete.id) {
        setActiveStoreId(null)
      }
      await refreshStores()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao excluir loja.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleStoreStatus = async (s: StoreWithCounts) => {
    try {
      const nextStatus = s.status === 'active' ? 'inactive' : 'active'
      await StorefrontService.updateStore(s.id, { status: nextStatus })
      toast.success(
        nextStatus === 'active'
          ? `Loja "${s.name}" agora está ATIVA!`
          : `Loja "${s.name}" agora está INATIVA.`,
      )
      await refreshStores()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao alternar status da loja.')
    }
  }

  const handleCopy = (text: string, slugKey: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSlug(slugKey)
    toast.success('Link copiado!')
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  // ==========================================
  // HANDLERS DE INTEGRANTES
  // ==========================================
  const handleOpenMemberModal = (member?: StoreMemberRecord) => {
    if (member) {
      setEditingMember(member)
      setMName(member.name || '')
      setMRole(member.role || '')
      setMBio(member.bio || '')
      setMInstagram(member.instagram || '')
      setMOrder(member.order !== undefined && member.order !== null ? member.order : 1)
    } else {
      setEditingMember(null)
      setMName('')
      setMRole('')
      setMBio('')
      setMInstagram('')
      setMOrder(members.length + 1)
    }
    setMPhoto(null)
    setShowMemberModal(true)
  }

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeStoreId) return
    if (!mName.trim()) {
      toast.error('Informe o nome do integrante.')
      return
    }

    setSavingMember(true)
    try {
      const formData = new FormData()
      formData.append('store', activeStoreId)
      formData.append('name', mName.trim())
      formData.append('role', mRole.trim())
      formData.append('bio', mBio.trim())
      formData.append('instagram', mInstagram.trim())
      formData.append('order', String(mOrder || 1))
      if (mPhoto) {
        formData.append('photo_url', mPhoto)
      }

      if (editingMember) {
        await StorefrontService.updateMember(editingMember.id, formData)
        toast.success('Integrante atualizado com sucesso!')
      } else {
        await StorefrontService.createMember(formData)
        toast.success('Integrante adicionado com sucesso!')
      }

      setShowMemberModal(false)
      loadActiveStoreContent()
      refreshStores()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao salvar integrante.')
    } finally {
      setSavingMember(false)
    }
  }

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Deseja realmente remover este integrante?')) return
    try {
      await StorefrontService.deleteMember(id)
      toast.success('Integrante removido.')
      loadActiveStoreContent()
      refreshStores()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao remover integrante.')
    }
  }

  // ==========================================
  // HANDLERS DE EPISÓDIOS
  // ==========================================
  const handleOpenEpisodeModal = (ep?: StoreEpisodeRecord) => {
    if (ep) {
      setEditingEpisode(ep)
      setEpTitle(ep.title || '')
      setEpDescription(ep.description || '')
      setEpYoutubeUrl(ep.youtube_url || '')
      setEpDate(ep.publish_date ? ep.publish_date.split(' ')[0] : '')
      setEpStatus(ep.status || 'published')
      setEpOrder(ep.order !== undefined && ep.order !== null ? ep.order : 1)
    } else {
      setEditingEpisode(null)
      setEpTitle('')
      setEpDescription('')
      setEpYoutubeUrl('')
      setEpDate(new Date().toISOString().split('T')[0])
      setEpStatus('published')
      setEpOrder(episodes.length + 1)
    }
    setEpCover(null)
    setShowEpisodeModal(true)
  }

  const handleSaveEpisode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeStoreId) return
    if (!epTitle.trim() || !epYoutubeUrl.trim()) {
      toast.error('Informe ao menos o título e o link do YouTube.')
      return
    }

    setSavingEpisode(true)
    try {
      const formData = new FormData()
      formData.append('store', activeStoreId)
      formData.append('title', epTitle.trim())
      formData.append('description', epDescription.trim())
      formData.append('youtube_url', epYoutubeUrl.trim())
      if (epDate) formData.append('publish_date', epDate)
      formData.append('status', epStatus)
      formData.append('order', String(epOrder || 1))
      if (epCover) {
        formData.append('cover_url', epCover)
      }

      if (editingEpisode) {
        await StorefrontService.updateEpisode(editingEpisode.id, formData)
        toast.success('Episódio atualizado!')
      } else {
        await StorefrontService.createEpisode(formData)
        toast.success('Episódio cadastrado!')
      }

      setShowEpisodeModal(false)
      loadActiveStoreContent()
      refreshStores()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao salvar episódio.')
    } finally {
      setSavingEpisode(false)
    }
  }

  const handleDeleteEpisode = async (id: string) => {
    if (!confirm('Deseja realmente excluir este episódio?')) return
    try {
      await StorefrontService.deleteEpisode(id)
      toast.success('Episódio excluído.')
      loadActiveStoreContent()
      refreshStores()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir episódio.')
    }
  }

  // ==========================================
  // HANDLERS DE BANNERS
  // ==========================================
  const handleOpenBannerModal = (b?: StoreBannerRecord) => {
    if (b) {
      setEditingBanner(b)
      setBTitle(b.title || '')
      setBLinkUrl(b.link_url || '')
      setBPosition(b.position || 'hero')
      setBActive(b.active !== false)
      setBOrder(b.order !== undefined && b.order !== null ? b.order : 1)
    } else {
      setEditingBanner(null)
      setBTitle('')
      setBLinkUrl('')
      setBPosition('hero')
      setBActive(true)
      setBOrder(banners.length + 1)
    }
    setBImage(null)
    setShowBannerModal(true)
  }

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeStoreId) return
    if (!bTitle.trim()) {
      toast.error('Informe o título do banner.')
      return
    }
    if (!editingBanner && !bImage) {
      toast.error('Selecione uma imagem para o banner.')
      return
    }

    setSavingBanner(true)
    try {
      const formData = new FormData()
      formData.append('store', activeStoreId)
      formData.append('title', bTitle.trim())
      formData.append('link_url', bLinkUrl.trim())
      formData.append('position', bPosition)
      formData.append('active', bActive ? 'true' : 'false')
      formData.append('order', String(bOrder || 1))
      if (bImage) {
        formData.append('image_url', bImage)
      }

      if (editingBanner) {
        await StorefrontService.updateBanner(editingBanner.id, formData)
        toast.success('Banner atualizado!')
      } else {
        await StorefrontService.createBanner(formData)
        toast.success('Banner criado com sucesso!')
      }

      setShowBannerModal(false)
      loadActiveStoreContent()
      refreshStores()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao salvar banner.')
    } finally {
      setSavingBanner(false)
    }
  }

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Deseja excluir este banner?')) return
    try {
      await StorefrontService.deleteBanner(id)
      toast.success('Banner removido.')
      loadActiveStoreContent()
      refreshStores()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao remover banner.')
    }
  }

  // ==========================================
  // HANDLERS DE DEPOIMENTOS
  // ==========================================
  const handleOpenTestimonialModal = (t?: StoreTestimonialRecord) => {
    if (t) {
      setEditingTestimonial(t)
      setTName(t.name || '')
      setTRole(t.role || '')
      setTInstagram(t.instagram || '')
      setTMessage(t.message || '')
      setTApproved(t.approved !== false)
      setTOrder(t.order !== undefined && t.order !== null ? t.order : 1)
    } else {
      setEditingTestimonial(null)
      setTName('')
      setTRole('')
      setTInstagram('')
      setTMessage('')
      setTApproved(true)
      setTOrder(testimonials.length + 1)
    }
    setTPhoto(null)
    setShowTestimonialModal(true)
  }

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeStoreId) return
    if (!tName.trim() || !tMessage.trim()) {
      toast.error('Informe o nome e o depoimento.')
      return
    }

    setSavingTestimonial(true)
    try {
      const formData = new FormData()
      formData.append('store', activeStoreId)
      formData.append('name', tName.trim())
      formData.append('role', tRole.trim())
      formData.append('instagram', tInstagram.trim())
      formData.append('message', tMessage.trim())
      formData.append('approved', tApproved ? 'true' : 'false')
      formData.append('order', String(tOrder || 1))
      if (tPhoto) {
        formData.append('photo_url', tPhoto)
      }

      if (editingTestimonial) {
        await StorefrontService.updateTestimonial(editingTestimonial.id, formData)
        toast.success('Depoimento atualizado!')
      } else {
        await StorefrontService.createTestimonial(formData)
        toast.success('Depoimento cadastrado!')
      }

      setShowTestimonialModal(false)
      loadActiveStoreContent()
      refreshStores()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao salvar depoimento.')
    } finally {
      setSavingTestimonial(false)
    }
  }

  const handleToggleTestimonialApproval = async (testim: StoreTestimonialRecord) => {
    try {
      const nextApproved = !testim.approved
      await StorefrontService.updateTestimonial(testim.id, { approved: nextApproved })
      toast.success(
        nextApproved ? 'Depoimento aprovado e visível no site!' : 'Depoimento ocultado.',
      )
      loadActiveStoreContent()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao alterar aprovação.')
    }
  }

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('Deseja excluir este depoimento?')) return
    try {
      await StorefrontService.deleteTestimonial(id)
      toast.success('Depoimento excluído.')
      loadActiveStoreContent()
      refreshStores()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir depoimento.')
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* CABEÇALHO DA ABA STOREFRONT */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-2xl border border-vinho/10 p-6 sm:p-7 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-vinho to-vinho-dark text-dourado flex items-center justify-center shrink-0 border border-dourado/40 shadow-sm">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-2xl font-bold text-vinho">Storefront · Multi-Lojas</h1>
              <Badge className="bg-dourado text-vinho font-bold text-[10px] px-2 py-0.5">
                Exclusivo Master
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50"
              >
                Sem Limite de Lojas
              </Badge>
            </div>
            <p className="text-xs text-vinho/70 mt-1">
              Crie novas lojas personalizadas em branco, configure a identidade visual única e
              gerencie o conteúdo de cada cliente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          <Button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto bg-vinho hover:bg-vinho-dark text-dourado font-bold text-xs rounded-xl shadow-sm min-h-[42px] px-4"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nova Loja
          </Button>
        </div>
      </div>

      {/* TABS PRINCIPAIS: MINHAS LOJAS vs CONTEÚDO DA LOJA ATIVA */}
      <div className="flex items-center gap-2 border-b border-vinho/15 pb-2">
        <button
          onClick={() => setActiveMainTab('minhas_lojas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === 'minhas_lojas'
              ? 'bg-vinho text-white shadow-sm'
              : 'text-vinho/70 hover:text-vinho hover:bg-vinho/5'
          }`}
        >
          <Layers className="w-4 h-4 text-dourado" />
          <span>Minhas Lojas ({stores.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('conteudo')}
          disabled={!activeStore}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === 'conteudo'
              ? 'bg-vinho text-white shadow-sm'
              : 'text-vinho/70 hover:text-vinho hover:bg-vinho/5 disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          <Sliders className="w-4 h-4 text-dourado" />
          <span>Conteúdo da Loja Ativa {activeStore ? `(${activeStore.name})` : ''}</span>
        </button>
      </div>

      {/* ABA 1: MINHAS LOJAS */}
      {activeMainTab === 'minhas_lojas' && (
        <div className="space-y-6">
          {stores.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-vinho/10 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-vinho/5 text-vinho mx-auto flex items-center justify-center">
                <Store className="w-8 h-8 text-dourado-dark" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-vinho">
                  Nenhuma loja criada ainda
                </h3>
                <p className="text-xs text-vinho/60 max-w-md mx-auto">
                  Clique no botão &quot;Nova Loja&quot; para criar o primeiro espaço em branco e
                  vender este sistema como produto para seu cliente.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="bg-vinho text-dourado font-bold text-xs rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Criar Minha Primeira Loja
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((s) => {
                const isActiveContext = s.id === activeStoreId
                const logo = s.logo_url ? getFileUrl(s, s.logo_url) : null
                const pathUrl = `${window.location.origin}/loja/${s.slug}`

                return (
                  <div
                    key={s.id}
                    className={`bg-white rounded-3xl border p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-md relative ${
                      isActiveContext
                        ? 'border-dourado ring-2 ring-dourado/40 shadow-sm'
                        : 'border-vinho/10'
                    }`}
                  >
                    {/* Badge de Contexto Ativo */}
                    {isActiveContext && (
                      <div className="absolute -top-3 left-6">
                        <Badge className="bg-dourado text-vinho font-black text-[10px] px-2.5 py-0.5 shadow-xs uppercase tracking-wider">
                          ★ Loja Selecionada
                        </Badge>
                      </div>
                    )}

                    <div>
                      {/* Topo do Card */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          {logo ? (
                            <img
                              src={logo}
                              alt={s.name}
                              className="w-12 h-12 rounded-2xl object-contain border p-1 bg-marfim/50"
                              style={{ borderColor: `${s.color_primary || '#4A0E17'}30` }}
                            />
                          ) : (
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold font-serif text-white text-base shadow-xs"
                              style={{ backgroundColor: s.color_primary || '#4A0E17' }}
                            >
                              {s.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h3 className="font-serif font-bold text-base text-vinho leading-tight">
                              {s.name}
                            </h3>
                            <span className="font-mono text-[11px] text-vinho/60">
                              /loja/{s.slug}
                            </span>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            s.status === 'active'
                              ? 'border-emerald-300 text-emerald-800 bg-emerald-50'
                              : 'border-zinc-300 text-zinc-600 bg-zinc-50'
                          }`}
                        >
                          {s.status === 'active' ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>

                      {/* Tagline ou Descrição */}
                      {s.tagline ? (
                        <p className="text-xs text-vinho/70 line-clamp-2 mb-4 italic">
                          &quot;{s.tagline}&quot;
                        </p>
                      ) : (
                        <p className="text-xs text-vinho/40 line-clamp-2 mb-4 italic">
                          Sem descrição cadastrada
                        </p>
                      )}

                      {/* Domínio Próprio (se configurado) */}
                      {s.domain ? (
                        <div className="bg-marfim/80 rounded-xl p-2.5 border border-vinho/10 mb-4 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-vinho">
                            <Globe className="w-3.5 h-3.5 text-dourado-dark shrink-0" />
                            <span className="font-mono text-[11px] truncate max-w-[160px] font-semibold">
                              {s.domain}
                            </span>
                          </div>
                          <Badge className="bg-dourado/20 text-vinho text-[9px] font-bold px-1.5 py-0">
                            Domínio Próprio
                          </Badge>
                        </div>
                      ) : null}

                      {/* Contadores da Loja */}
                      <div className="grid grid-cols-4 gap-2 py-3 border-y border-vinho/10 text-center mb-4">
                        <div>
                          <span className="block font-bold text-xs text-vinho">
                            {s.counts?.members ?? 0}
                          </span>
                          <span className="text-[10px] text-vinho/60">Membros</span>
                        </div>
                        <div>
                          <span className="block font-bold text-xs text-vinho">
                            {s.counts?.episodes ?? 0}
                          </span>
                          <span className="text-[10px] text-vinho/60">Episódios</span>
                        </div>
                        <div>
                          <span className="block font-bold text-xs text-vinho">
                            {s.counts?.banners ?? 0}
                          </span>
                          <span className="text-[10px] text-vinho/60">Banners</span>
                        </div>
                        <div>
                          <span className="block font-bold text-xs text-vinho">
                            {s.counts?.testimonials ?? 0}
                          </span>
                          <span className="text-[10px] text-vinho/60">Depoim.</span>
                        </div>
                      </div>
                    </div>

                    {/* Ações do Card */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2">
                        {!isActiveContext ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setActiveStoreId(s.id)}
                            className="flex-1 text-xs bg-vinho/10 hover:bg-vinho text-vinho hover:text-white font-bold rounded-xl"
                          >
                            Selecionar Loja
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setActiveMainTab('conteudo')}
                            className="flex-1 text-xs bg-vinho text-dourado hover:bg-vinho-dark font-bold rounded-xl"
                          >
                            Gerenciar Conteúdo →
                          </Button>
                        )}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditStore(s)}
                          className="text-xs border-vinho/20 text-vinho rounded-xl"
                          title="Editar Identidade & Configurações"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setStoreToDelete(s)
                            setDeleteConfirmName('')
                            setShowDeleteModal(true)
                          }}
                          className="text-xs border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
                          title="Excluir Loja"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Links Rápidos */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <a
                          href={`/loja/${s.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-vinho/70 hover:text-dourado-dark flex items-center gap-1 font-medium"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver Loja</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleCopy(pathUrl, s.slug)}
                          className="text-vinho/70 hover:text-vinho flex items-center gap-1 font-medium"
                        >
                          {copiedSlug === s.slug ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar Link</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStoreStatus(s)}
                          className="text-vinho/70 hover:text-vinho text-[11px]"
                        >
                          {s.status === 'active' ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: CONTEÚDO DA LOJA ATIVA */}
      {activeMainTab === 'conteudo' && (
        <div className="space-y-6">
          {!activeStore ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-vinho/10">
              <p className="text-sm text-vinho/70">
                Selecione uma loja na aba &quot;Minhas Lojas&quot; para gerenciar seu conteúdo.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-vinho/10 p-6 sm:p-8 shadow-xs space-y-6">
              {/* Banner de Contexto Ativo */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-vinho/10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-base shadow-xs"
                    style={{ backgroundColor: activeStore.color_primary || '#4A0E17' }}
                  >
                    {activeStore.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-vinho">
                      Gerenciando: {activeStore.name}
                    </h2>
                    <p className="text-xs text-vinho/60 font-mono">
                      /loja/{activeStore.slug} {activeStore.domain ? `• ${activeStore.domain}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/loja/${activeStore.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-vinho/10 text-vinho hover:bg-vinho hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Visualizar Loja</span>
                  </a>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditStore(activeStore)}
                    className="text-xs rounded-xl"
                  >
                    <Settings className="w-3.5 h-3.5 mr-1.5" />
                    Configurar Identidade
                  </Button>
                </div>
              </div>

              {/* Sub-navegação do Conteúdo */}
              <div className="flex flex-wrap items-center gap-2 border-b border-vinho/10 pb-3">
                <button
                  type="button"
                  onClick={() => setContentTab('integrantes')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    contentTab === 'integrantes'
                      ? 'bg-vinho text-white'
                      : 'text-vinho/70 hover:bg-vinho/5'
                  }`}
                >
                  <Users className="w-4 h-4 text-dourado" />
                  <span>Integrantes ({members.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setContentTab('episodios')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    contentTab === 'episodios'
                      ? 'bg-vinho text-white'
                      : 'text-vinho/70 hover:bg-vinho/5'
                  }`}
                >
                  <Tv className="w-4 h-4 text-dourado" />
                  <span>Episódios ({episodes.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setContentTab('banners')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    contentTab === 'banners'
                      ? 'bg-vinho text-white'
                      : 'text-vinho/70 hover:bg-vinho/5'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-dourado" />
                  <span>Banners ({banners.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setContentTab('depoimentos')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    contentTab === 'depoimentos'
                      ? 'bg-vinho text-white'
                      : 'text-vinho/70 hover:bg-vinho/5'
                  }`}
                >
                  <MessageSquareQuote className="w-4 h-4 text-dourado" />
                  <span>Depoimentos ({testimonials.length})</span>
                </button>
              </div>

              {/* SUB-ABA INTEGRANTES */}
              {contentTab === 'integrantes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-base text-vinho">
                        Equipe & Apresentadores
                      </h3>
                      <p className="text-xs text-vinho/60">
                        Integrantes exibidos na seção &quot;Quem Faz&quot; desta loja.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenMemberModal()}
                      className="bg-vinho text-dourado font-bold text-xs rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Novo Integrante
                    </Button>
                  </div>

                  {members.length === 0 ? (
                    <div className="p-8 text-center bg-marfim/50 rounded-2xl border border-dashed border-vinho/20">
                      <p className="text-xs text-vinho/60">
                        Nenhum integrante cadastrado nesta loja.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {members.map((m) => {
                        const photo = m.photo_url ? getFileUrl(m, m.photo_url) : null
                        return (
                          <div
                            key={m.id}
                            className="bg-white rounded-2xl p-4 border border-vinho/10 shadow-xs flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-vinho/5 border shrink-0">
                                {photo ? (
                                  <img
                                    src={photo}
                                    alt={m.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-bold text-xs text-vinho">
                                    {m.name.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="overflow-hidden">
                                <h4 className="font-serif font-bold text-sm text-vinho truncate">
                                  {m.name}
                                </h4>
                                <p className="text-[11px] text-vinho/60 truncate">
                                  {m.role || 'Sem cargo'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenMemberModal(m)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-3.5 h-3.5 text-vinho" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMember(m.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-ABA EPISÓDIOS */}
              {contentTab === 'episodios' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-base text-vinho">
                        Episódios & Gravações
                      </h3>
                      <p className="text-xs text-vinho/60">
                        Vídeos do YouTube exibidos na seção de episódios.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenEpisodeModal()}
                      className="bg-vinho text-dourado font-bold text-xs rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Novo Episódio
                    </Button>
                  </div>

                  {episodes.length === 0 ? (
                    <div className="p-8 text-center bg-marfim/50 rounded-2xl border border-dashed border-vinho/20">
                      <p className="text-xs text-vinho/60">
                        Nenhum episódio cadastrado nesta loja.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {episodes.map((ep) => {
                        const ytId = extractYouTubeId(ep.youtube_url)
                        const cover = ep.cover_url
                          ? getFileUrl(ep, ep.cover_url)
                          : ytId
                            ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                            : null

                        return (
                          <div
                            key={ep.id}
                            className="bg-white rounded-2xl p-4 border border-vinho/10 shadow-xs flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-2">
                              <div className="aspect-video bg-zinc-100 rounded-xl overflow-hidden relative">
                                {cover ? (
                                  <img
                                    src={cover}
                                    alt={ep.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                    <Play className="w-8 h-8" />
                                  </div>
                                )}
                              </div>
                              <h4 className="font-serif font-bold text-sm text-vinho line-clamp-2">
                                {ep.title}
                              </h4>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-vinho/10 text-[11px]">
                              <span className="text-vinho/60">
                                {ep.status === 'draft' ? 'Rascunho' : 'Publicado'}
                              </span>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEpisodeModal(ep)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="w-3.5 h-3.5 text-vinho" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteEpisode(ep.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-ABA BANNERS */}
              {contentTab === 'banners' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-base text-vinho">
                        Banners Publicitários / Destaque
                      </h3>
                      <p className="text-xs text-vinho/60">
                        Banners posicionados no topo (hero) ou inline entre as seções.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenBannerModal()}
                      className="bg-vinho text-dourado font-bold text-xs rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Novo Banner
                    </Button>
                  </div>

                  {banners.length === 0 ? (
                    <div className="p-8 text-center bg-marfim/50 rounded-2xl border border-dashed border-vinho/20">
                      <p className="text-xs text-vinho/60">Nenhum banner cadastrado nesta loja.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {banners.map((b) => (
                        <div
                          key={b.id}
                          className="bg-white rounded-2xl p-4 border border-vinho/10 shadow-xs flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-2">
                            <img
                              src={getFileUrl(b, b.image_url)}
                              alt={b.title}
                              className="w-full h-32 object-cover rounded-xl"
                            />
                            <h4 className="font-serif font-bold text-sm text-vinho truncate">
                              {b.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                {b.position === 'hero' ? 'Hero / Topo' : 'Inline'}
                              </Badge>
                              <Badge
                                className={`text-[10px] ${
                                  b.active
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-zinc-100 text-zinc-600'
                                }`}
                              >
                                {b.active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-1 pt-2 border-t border-vinho/10">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenBannerModal(b)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-3.5 h-3.5 text-vinho" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBanner(b.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-ABA DEPOIMENTOS */}
              {contentTab === 'depoimentos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-base text-vinho">
                        Depoimentos & Avaliações
                      </h3>
                      <p className="text-xs text-vinho/60">
                        Depoimentos deixados pelos visitantes ou cadastrados pela equipe.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenTestimonialModal()}
                      className="bg-vinho text-dourado font-bold text-xs rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Novo Depoimento
                    </Button>
                  </div>

                  {testimonials.length === 0 ? (
                    <div className="p-8 text-center bg-marfim/50 rounded-2xl border border-dashed border-vinho/20">
                      <p className="text-xs text-vinho/60">
                        Nenhum depoimento cadastrado nesta loja.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {testimonials.map((t) => {
                        const photo = t.photo_url ? getFileUrl(t, t.photo_url) : null
                        return (
                          <div
                            key={t.id}
                            className="bg-white rounded-2xl p-4 border border-vinho/10 shadow-xs flex flex-col justify-between space-y-3"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-vinho/10 flex items-center justify-center text-xs font-bold text-vinho">
                                    {photo ? (
                                      <img
                                        src={photo}
                                        alt={t.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      t.name.slice(0, 2).toUpperCase()
                                    )}
                                  </div>
                                  <div className="overflow-hidden">
                                    <h4 className="font-serif font-bold text-xs text-vinho truncate">
                                      {t.name}
                                    </h4>
                                    <p className="text-[10px] text-vinho/60 truncate">{t.role}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleToggleTestimonialApproval(t)}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    t.approved
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {t.approved ? 'Aprovado' : 'Pendente'}
                                </button>
                              </div>
                              <p className="text-xs text-zinc-600 line-clamp-3 italic">
                                &quot;{t.message}&quot;
                              </p>
                            </div>

                            <div className="flex items-center justify-end gap-1 pt-2 border-t border-vinho/10">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenTestimonialModal(t)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-3.5 h-3.5 text-vinho" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTestimonial(t.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAIS */}
      {/* ======================================================== */}

      {/* MODAL CRIAR NOVA LOJA */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative text-vinho animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-serif font-bold text-xl text-vinho mb-1">Criar Nova Loja</h3>
            <p className="text-xs text-vinho/70 mb-5">
              A nova loja nascerá vazia, pronta para você cadastrar a identidade do seu cliente.
            </p>

            <form onSubmit={handleCreateStore} className="space-y-4">
              <div>
                <Label className="text-xs font-bold text-vinho">Nome da Loja / Projeto *</Label>
                <Input
                  value={newName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex.: Café & Negócios Podcast"
                  required
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-vinho">Slug Único do Caminho *</Label>
                <div className="flex items-center mt-1">
                  <span className="bg-marfim border border-r-0 border-vinho/20 rounded-l-md px-3 py-2 text-xs font-mono text-vinho/70 select-none">
                    /loja/
                  </span>
                  <Input
                    value={newSlug}
                    onChange={(e) => setNewSlug(generateSlug(e.target.value))}
                    placeholder="cafe-e-negocios"
                    required
                    className="rounded-l-none text-xs font-mono"
                  />
                </div>
                <p className="text-[11px] text-vinho/50 mt-1">
                  Endereço público: {window.location.origin}/loja/{newSlug || 'slug'}
                </p>
              </div>

              <div>
                <Label className="text-xs font-bold text-vinho">Domínio Próprio (Opcional)</Label>
                <Input
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="Ex.: cafepodcast.com.br"
                  className="mt-1 text-xs font-mono"
                />
                <p className="text-[11px] text-vinho/50 mt-1">
                  Quando o cliente apontar o domínio dele para cá, o site abrirá direto na home
                  desta loja.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-vinho/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="bg-vinho text-dourado font-bold text-xs rounded-xl"
                >
                  {isCreating ? 'Criando...' : 'Criar Loja'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAR IDENTIDADE DA LOJA */}
      {showEditModal && editingStore && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative text-vinho animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="p-6 border-b border-vinho/10 flex items-center justify-between bg-marfim/30">
              <div>
                <h3 className="font-serif font-bold text-xl text-vinho">
                  Configurações: {editingStore.name}
                </h3>
                <p className="text-xs text-vinho/60">
                  Ajuste paleta de cores, tipografia, seções ativas e textos institucionais.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(false)}
                className="rounded-full"
              >
                ✕
              </Button>
            </div>

            {/* Abas internas do modal */}
            <div className="flex border-b border-vinho/10 px-6 gap-2 bg-white overflow-x-auto">
              {[
                { id: 'geral', label: 'Geral & Domínio' },
                { id: 'cores', label: 'Cores & Paleta' },
                { id: 'hero', label: 'Hero & Topo' },
                { id: 'secoes', label: 'Seções Ativas' },
                { id: 'proposito', label: 'Propósito & Manifesto' },
                { id: 'contato', label: 'Contatos & Redes' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEditTab(tab.id as any)}
                  className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                    editTab === tab.id
                      ? 'border-dourado text-vinho'
                      : 'border-transparent text-vinho/60 hover:text-vinho'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveStoreEdit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB GERAL */}
              {editTab === 'geral' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-vinho">Nome da Loja *</Label>
                      <Input
                        value={editingStore.name}
                        onChange={(e) => setEditingStore({ ...editingStore, name: e.target.value })}
                        required
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-vinho">Slug Único *</Label>
                      <Input
                        value={editingStore.slug}
                        onChange={(e) => setEditingStore({ ...editingStore, slug: e.target.value })}
                        required
                        className="mt-1 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-vinho">
                        Domínio Próprio (Opcional)
                      </Label>
                      <Input
                        value={editingStore.domain || ''}
                        onChange={(e) =>
                          setEditingStore({ ...editingStore, domain: e.target.value })
                        }
                        placeholder="Ex.: podcastcliente.com.br"
                        className="mt-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-vinho">Status da Loja</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <Switch
                          checked={editingStore.status === 'active'}
                          onCheckedChange={(val) =>
                            setEditingStore({
                              ...editingStore,
                              status: val ? 'active' : 'inactive',
                            })
                          }
                        />
                        <span className="text-xs font-semibold">
                          {editingStore.status === 'active'
                            ? 'Loja Ativa (Pública)'
                            : 'Loja Inativa'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-vinho">Tagline / Slogan Curto</Label>
                    <Input
                      value={editingStore.tagline || ''}
                      onChange={(e) =>
                        setEditingStore({ ...editingStore, tagline: e.target.value })
                      }
                      placeholder="Ex.: Histórias que inspiram e conectam pessoas"
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-vinho">
                      Razão Social / CNPJ no Rodapé
                    </Label>
                    <Input
                      value={editingStore.company_name || ''}
                      onChange={(e) =>
                        setEditingStore({ ...editingStore, company_name: e.target.value })
                      }
                      placeholder="Ex.: CLIENTE PRODUCOES LTDA - CNPJ 00.000.000/0001-00"
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <Label className="text-xs font-bold text-vinho">Logo da Loja</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        className="mt-1 text-xs file:text-xs"
                      />
                      {editingStore.logo_url && !logoFile && (
                        <p className="text-[11px] text-vinho/60 mt-1">Logo atual já cadastrada.</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-vinho">
                        Foto do Hero / Apresentação
                      </Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
                        className="mt-1 text-xs file:text-xs"
                      />
                      {editingStore.hero_url && !heroFile && (
                        <p className="text-[11px] text-vinho/60 mt-1">Foto atual já cadastrada.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CORES & PALETA */}
              {editTab === 'cores' && (
                <div className="space-y-6">
                  <p className="text-xs text-vinho/70">
                    Defina a paleta personalizada que estilizará todos os botões, gradientes e
                    superfícies da loja.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5 p-3 rounded-2xl border border-vinho/10 bg-marfim/30">
                      <Label className="text-xs font-bold text-vinho">
                        Cor Primária (Principal)
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingStore.color_primary || '#4A0E17'}
                          onChange={(e) =>
                            setEditingStore({ ...editingStore, color_primary: e.target.value })
                          }
                          className="w-10 h-10 rounded-lg cursor-pointer border border-vinho/20"
                        />
                        <Input
                          value={editingStore.color_primary || '#4A0E17'}
                          onChange={(e) =>
                            setEditingStore({ ...editingStore, color_primary: e.target.value })
                          }
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-2xl border border-vinho/10 bg-marfim/30">
                      <Label className="text-xs font-bold text-vinho">
                        Cor Secundária (Destaques)
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingStore.color_secondary || '#D4AF37'}
                          onChange={(e) =>
                            setEditingStore({ ...editingStore, color_secondary: e.target.value })
                          }
                          className="w-10 h-10 rounded-lg cursor-pointer border border-vinho/20"
                        />
                        <Input
                          value={editingStore.color_secondary || '#D4AF37'}
                          onChange={(e) =>
                            setEditingStore({ ...editingStore, color_secondary: e.target.value })
                          }
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-2xl border border-vinho/10 bg-marfim/30">
                      <Label className="text-xs font-bold text-vinho">Cor de Fundo da Loja</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingStore.color_background || '#FAF8F5'}
                          onChange={(e) =>
                            setEditingStore({ ...editingStore, color_background: e.target.value })
                          }
                          className="w-10 h-10 rounded-lg cursor-pointer border border-vinho/20"
                        />
                        <Input
                          value={editingStore.color_background || '#FAF8F5'}
                          onChange={(e) =>
                            setEditingStore({ ...editingStore, color_background: e.target.value })
                          }
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-2xl border border-vinho/10 bg-marfim/30">
                      <Label className="text-xs font-bold text-vinho">
                        Cor de Superfície (Escuro)
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingStore.color_surface || '#2D050B'}
                          onChange={(e) =>
                            setEditingStore({ ...editingStore, color_surface: e.target.value })
                          }
                          className="w-10 h-10 rounded-lg cursor-pointer border border-vinho/20"
                        />
                        <Input
                          value={editingStore.color_surface || '#2D050B'}
                          onChange={(e) =>
                            setEditingStore({ ...editingStore, color_surface: e.target.value })
                          }
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-2xl border border-vinho/10 bg-marfim/30">
                      <Label className="text-xs font-bold text-vinho">Cor de Realce (Accent)</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingStore.color_accent || '#E5C158'}
                          onChange={(e) =>
                            setEditingStore({ ...editingStore, color_accent: e.target.value })
                          }
                          className="w-10 h-10 rounded-lg cursor-pointer border border-vinho/20"
                        />
                        <Input
                          value={editingStore.color_accent || '#E5C158'}
                          onChange={(e) =>
                            setEditingStore({ ...editingStore, color_accent: e.target.value })
                          }
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pré-visualização da Paleta */}
                  <div className="p-4 rounded-2xl border border-vinho/10 space-y-2">
                    <span className="text-[11px] font-bold uppercase text-vinho/70">
                      Pré-visualização da Combinação
                    </span>
                    <div
                      className="p-6 rounded-xl flex items-center justify-between text-white"
                      style={{
                        background: `radial-gradient(ellipse at top, ${editingStore.color_primary || '#4A0E17'} 0%, ${editingStore.color_surface || '#2D050B'} 100%)`,
                      }}
                    >
                      <div>
                        <span
                          className="text-[10px] uppercase font-bold tracking-widest"
                          style={{ color: editingStore.color_accent || '#E5C158' }}
                        >
                          Paleta da Loja
                        </span>
                        <h4 className="font-serif font-bold text-lg">{editingStore.name}</h4>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-full font-bold text-xs"
                        style={{
                          backgroundColor: editingStore.color_secondary || '#D4AF37',
                          color: editingStore.color_surface || '#2D050B',
                        }}
                      >
                        Botão de Ação
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB HERO & TOPO */}
              {editTab === 'hero' && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-bold text-vinho">
                      Frases em Small Caps (separadas por •)
                    </Label>
                    <Input
                      value={editingStore.hero_tagline_words || ''}
                      onChange={(e) =>
                        setEditingStore({ ...editingStore, hero_tagline_words: e.target.value })
                      }
                      placeholder="Ex.: AUTONOMIA • PROPÓSITO • LIBERDADE"
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-vinho">Título Principal do Hero</Label>
                    <Input
                      value={editingStore.hero_title || ''}
                      onChange={(e) =>
                        setEditingStore({ ...editingStore, hero_title: e.target.value })
                      }
                      placeholder="Ex.: Histórias que Transformam Destinos"
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-vinho">Subtítulo do Hero</Label>
                    <Textarea
                      value={editingStore.hero_subtitle || ''}
                      onChange={(e) =>
                        setEditingStore({ ...editingStore, hero_subtitle: e.target.value })
                      }
                      placeholder="Ex.: Um bate-papo descontraído com quem faz a diferença."
                      rows={2}
                      className="mt-1 text-xs resize-none"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-vinho">
                      Frase em Fonte Manuscrita / Destaque
                    </Label>
                    <Input
                      value={editingStore.hero_phrase || ''}
                      onChange={(e) =>
                        setEditingStore({ ...editingStore, hero_phrase: e.target.value })
                      }
                      placeholder="Ex.: Porque aqui a conversa nunca esfria!"
                      className="mt-1 text-xs italic"
                    />
                  </div>
                </div>
              )}

              {/* TAB SEÇÕES ATIVAS */}
              {editTab === 'secoes' && (
                <div className="space-y-4">
                  <p className="text-xs text-vinho/70">
                    Ligue ou desligue as seções que deseja exibir no site público desta loja:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'integrantes', label: 'Quem Somos (Integrantes)' },
                      { key: 'episodios', label: 'Episódios & Gravações (YouTube)' },
                      { key: 'depoimentos', label: 'Depoimentos de Convidados' },
                      { key: 'banners_inline', label: 'Banners Publicitários Inline' },
                      { key: 'missao', label: 'Missão, Visão e Valores' },
                      { key: 'manifesto', label: 'Manifesto Institucional' },
                      { key: 'contato', label: 'Seção de Contato & Redes' },
                    ].map((item) => {
                      const toggles = editingStore.sections_toggles || {}
                      const isChecked = (toggles as any)[item.key] !== false

                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between p-3.5 rounded-2xl border border-vinho/10 bg-marfim/30"
                        >
                          <span className="text-xs font-bold text-vinho">{item.label}</span>
                          <Switch
                            checked={isChecked}
                            onCheckedChange={(val) => {
                              const updated = { ...toggles, [item.key]: val }
                              setEditingStore({ ...editingStore, sections_toggles: updated })
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* TAB PROPÓSITO & MANIFESTO */}
              {editTab === 'proposito' && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-bold text-vinho">Missão</Label>
                    <Textarea
                      value={editingStore.mission_text || ''}
                      onChange={(e) =>
                        setEditingStore({ ...editingStore, mission_text: e.target.value })
                      }
                      rows={2}
                      className="mt-1 text-xs"
                      placeholder="Qual é a missão desta loja ou podcast?"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-vinho">Visão</Label>
                    <Textarea
                      value={editingStore.vision_text || ''}
                      onChange={(e) =>
                        setEditingStore({ ...editingStore, vision_text: e.target.value })
                      }
                      rows={2}
                      className="mt-1 text-xs"
                      placeholder="Onde este projeto quer chegar?"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-vinho">Valores</Label>
                    <Textarea
                      value={editingStore.values_text || ''}
                      onChange={(e) =>
                        setEditingStore({ ...editingStore, values_text: e.target.value })
                      }
                      rows={2}
                      className="mt-1 text-xs"
                      placeholder="Ex.: Ética, Inovação, Parceria, Qualidade"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-vinho">Manifesto</Label>
                    <Textarea
                      value={editingStore.manifesto_text || ''}
                      onChange={(e) =>
                        setEditingStore({ ...editingStore, manifesto_text: e.target.value })
                      }
                      rows={4}
                      className="mt-1 text-xs"
                      placeholder="Texto do manifesto da loja..."
                    />
                  </div>
                </div>
              )}

              {/* TAB CONTATO & REDES */}
              {editTab === 'contato' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-vinho">WhatsApp de Contato</Label>
                      <Input
                        value={editingStore.whatsapp_contato || ''}
                        onChange={(e) =>
                          setEditingStore({ ...editingStore, whatsapp_contato: e.target.value })
                        }
                        placeholder="Ex.: (31) 99999-9999"
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-vinho">Instagram Oficial</Label>
                      <Input
                        value={editingStore.instagram || ''}
                        onChange={(e) =>
                          setEditingStore({ ...editingStore, instagram: e.target.value })
                        }
                        placeholder="Ex.: @meupodcast"
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-vinho">E-mail de Contato</Label>
                      <Input
                        value={editingStore.email_contato || ''}
                        onChange={(e) =>
                          setEditingStore({ ...editingStore, email_contato: e.target.value })
                        }
                        placeholder="Ex.: contato@loja.com"
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-vinho">Canal no YouTube</Label>
                      <Input
                        value={editingStore.youtube_canal || ''}
                        onChange={(e) =>
                          setEditingStore({ ...editingStore, youtube_canal: e.target.value })
                        }
                        placeholder="Ex.: https://youtube.com/@canal"
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-vinho/10 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="text-xs rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingEdit}
                  className="bg-vinho text-dourado font-bold text-xs rounded-xl"
                >
                  {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR LOJA (COM DIGITAÇÃO DO NOME) */}
      {showDeleteModal && storeToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-vinho space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-serif font-bold text-lg text-red-600">
                Excluir Loja Definitivamente
              </h3>
              <p className="text-xs text-vinho/70">
                Esta ação é irreversível. Todos os membros, episódios, banners e depoimentos desta
                loja serão excluídos.
              </p>
            </div>

            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800">
              Digite exatamente <strong>{storeToDelete.name}</strong> para confirmar:
            </div>

            <Input
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder="Digite o nome da loja..."
              className="text-xs"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting || deleteConfirmName.trim() !== storeToDelete.name.trim()}
                onClick={handleDeleteStore}
                className="text-xs rounded-xl font-bold"
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INTEGRANTE */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-vinho">
            <h3 className="font-serif font-bold text-lg text-vinho mb-4">
              {editingMember ? 'Editar Integrante' : 'Novo Integrante'}
            </h3>
            <form onSubmit={handleSaveMember} className="space-y-3">
              <div>
                <Label className="text-xs font-bold text-vinho">Nome Completo *</Label>
                <Input
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  required
                  className="mt-1 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-vinho">Cargo / Papel</Label>
                  <Input
                    value={mRole}
                    onChange={(e) => setMRole(e.target.value)}
                    placeholder="Ex.: Apresentador"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-vinho">Instagram</Label>
                  <Input
                    value={mInstagram}
                    onChange={(e) => setMInstagram(e.target.value)}
                    placeholder="Ex.: @nome"
                    className="mt-1 text-xs"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold text-vinho">Foto do Integrante</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setMPhoto(e.target.files?.[0] || null)}
                  className="mt-1 text-xs file:text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-vinho">Mini Biografia</Label>
                <Textarea
                  value={mBio}
                  onChange={(e) => setMBio(e.target.value)}
                  rows={3}
                  className="mt-1 text-xs resize-none"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-vinho">Ordem de Exibição</Label>
                <Input
                  type="number"
                  value={mOrder}
                  onChange={(e) => setMOrder(Number(e.target.value))}
                  className="mt-1 text-xs"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMemberModal(false)}
                  className="text-xs rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={savingMember}
                  className="bg-vinho text-dourado font-bold text-xs rounded-xl"
                >
                  {savingMember ? 'Salvando...' : 'Salvar Integrante'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EPISÓDIO */}
      {showEpisodeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-vinho">
            <h3 className="font-serif font-bold text-lg text-vinho mb-4">
              {editingEpisode ? 'Editar Episódio' : 'Novo Episódio'}
            </h3>
            <form onSubmit={handleSaveEpisode} className="space-y-3">
              <div>
                <Label className="text-xs font-bold text-vinho">Título do Episódio *</Label>
                <Input
                  value={epTitle}
                  onChange={(e) => setEpTitle(e.target.value)}
                  required
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-vinho">Link do YouTube *</Label>
                <Input
                  value={epYoutubeUrl}
                  onChange={(e) => setEpYoutubeUrl(e.target.value)}
                  placeholder="https://youtu.be/..."
                  required
                  className="mt-1 text-xs font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-vinho">Data de Publicação</Label>
                  <Input
                    type="date"
                    value={epDate}
                    onChange={(e) => setEpDate(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-vinho">Status</Label>
                  <select
                    value={epStatus}
                    onChange={(e) => setEpStatus(e.target.value as any)}
                    className="mt-1 w-full text-xs rounded-md border border-vinho/20 p-2 bg-white"
                  >
                    <option value="published">Publicado</option>
                    <option value="draft">Rascunho</option>
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold text-vinho">
                  Capa Personalizada (Opcional)
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEpCover(e.target.files?.[0] || null)}
                  className="mt-1 text-xs file:text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-vinho">Descrição Curta</Label>
                <Textarea
                  value={epDescription}
                  onChange={(e) => setEpDescription(e.target.value)}
                  rows={2}
                  className="mt-1 text-xs resize-none"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEpisodeModal(false)}
                  className="text-xs rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={savingEpisode}
                  className="bg-vinho text-dourado font-bold text-xs rounded-xl"
                >
                  {savingEpisode ? 'Salvando...' : 'Salvar Episódio'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BANNER */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-vinho">
            <h3 className="font-serif font-bold text-lg text-vinho mb-4">
              {editingBanner ? 'Editar Banner' : 'Novo Banner'}
            </h3>
            <form onSubmit={handleSaveBanner} className="space-y-3">
              <div>
                <Label className="text-xs font-bold text-vinho">
                  Título / Descrição do Banner *
                </Label>
                <Input
                  value={bTitle}
                  onChange={(e) => setBTitle(e.target.value)}
                  required
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-vinho">Link de Destino (Opcional)</Label>
                <Input
                  value={bLinkUrl}
                  onChange={(e) => setBLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 text-xs font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-vinho">Posição</Label>
                  <select
                    value={bPosition}
                    onChange={(e) => setBPosition(e.target.value as any)}
                    className="mt-1 w-full text-xs rounded-md border border-vinho/20 p-2 bg-white"
                  >
                    <option value="hero">Hero (Topo)</option>
                    <option value="inline">Inline (Entre Seções)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-bold text-vinho">Ordem</Label>
                  <Input
                    type="number"
                    value={bOrder}
                    onChange={(e) => setBOrder(Number(e.target.value))}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold text-vinho">Imagem do Banner *</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBImage(e.target.files?.[0] || null)}
                  className="mt-1 text-xs file:text-xs"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={bActive} onCheckedChange={setBActive} />
                <Label className="text-xs font-semibold text-vinho">Banner Ativo</Label>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBannerModal(false)}
                  className="text-xs rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={savingBanner}
                  className="bg-vinho text-dourado font-bold text-xs rounded-xl"
                >
                  {savingBanner ? 'Salvando...' : 'Salvar Banner'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DEPOIMENTO */}
      {showTestimonialModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-vinho">
            <h3 className="font-serif font-bold text-lg text-vinho mb-4">
              {editingTestimonial ? 'Editar Depoimento' : 'Novo Depoimento'}
            </h3>
            <form onSubmit={handleSaveTestimonial} className="space-y-3">
              <div>
                <Label className="text-xs font-bold text-vinho">Nome da Pessoa *</Label>
                <Input
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  required
                  className="mt-1 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-vinho">Cargo / Profissão</Label>
                  <Input
                    value={tRole}
                    onChange={(e) => setTRole(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-vinho">Instagram</Label>
                  <Input
                    value={tInstagram}
                    onChange={(e) => setTInstagram(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold text-vinho">Foto da Pessoa</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setTPhoto(e.target.files?.[0] || null)}
                  className="mt-1 text-xs file:text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-vinho">Depoimento *</Label>
                <Textarea
                  value={tMessage}
                  onChange={(e) => setTMessage(e.target.value)}
                  rows={3}
                  required
                  className="mt-1 text-xs resize-none"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={tApproved} onCheckedChange={setTApproved} />
                <Label className="text-xs font-semibold text-vinho">
                  Aprovado (Exibir no Site)
                </Label>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTestimonialModal(false)}
                  className="text-xs rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={savingTestimonial}
                  className="bg-vinho text-dourado font-bold text-xs rounded-xl"
                >
                  {savingTestimonial ? 'Salvando...' : 'Salvar Depoimento'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

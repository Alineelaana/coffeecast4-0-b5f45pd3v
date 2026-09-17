import pb from '@/lib/pocketbase/client'
import type {
  StoreRecord,
  StoreWithCounts,
  StoreMemberRecord,
  StoreEpisodeRecord,
  StoreBannerRecord,
  StoreTestimonialRecord,
} from '@/types/database'

export const StorefrontService = {
  // Lojas
  async getAllStores(): Promise<StoreRecord[]> {
    return pb.collection('stores').getFullList<StoreRecord>({
      sort: '-created',
    })
  },

  async getStoresOverview(): Promise<StoreWithCounts[]> {
    try {
      const response = await pb.send<{ stores: StoreWithCounts[] }>('/backend/v1/stores/overview', {
        method: 'GET',
      })
      if (response && response.stores) {
        return response.stores
      }
    } catch (e) {
      console.warn('Fallback para getFullList de stores:', e)
    }

    const stores = await pb.collection('stores').getFullList<StoreRecord>({
      sort: '-created',
    })
    return stores.map((s) => ({
      ...s,
      counts: {
        members: 0,
        episodes: 0,
        banners: 0,
        testimonials: 0,
      },
    }))
  },

  async getStoreById(id: string): Promise<StoreRecord> {
    return pb.collection('stores').getOne<StoreRecord>(id)
  },

  async getStoreBySlug(slug: string): Promise<StoreRecord | null> {
    try {
      const store = await pb
        .collection('stores')
        .getFirstListItem<StoreRecord>(`slug = "${slug.toLowerCase()}"`)
      return store
    } catch (_) {
      return null
    }
  },

  async getStoreByDomain(domain: string): Promise<StoreRecord | null> {
    try {
      const clean = domain.trim().toLowerCase().split(':')[0]
      const store = await pb
        .collection('stores')
        .getFirstListItem<StoreRecord>(`domain = "${clean}"`)
      return store
    } catch (_) {
      return null
    }
  },

  async createStore(data: FormData | Partial<StoreRecord>): Promise<StoreRecord> {
    return pb.collection('stores').create<StoreRecord>(data)
  },

  async updateStore(id: string, data: FormData | Partial<StoreRecord>): Promise<StoreRecord> {
    return pb.collection('stores').update<StoreRecord>(id, data)
  },

  async deleteStore(id: string): Promise<boolean> {
    return pb.collection('stores').delete(id)
  },

  // Integrantes da Loja
  async getMembers(storeId: string): Promise<StoreMemberRecord[]> {
    return pb.collection('store_members').getFullList<StoreMemberRecord>({
      filter: `store = "${storeId}"`,
      sort: 'order,created',
    })
  },

  async createMember(data: FormData | Partial<StoreMemberRecord>): Promise<StoreMemberRecord> {
    return pb.collection('store_members').create<StoreMemberRecord>(data)
  },

  async updateMember(
    id: string,
    data: FormData | Partial<StoreMemberRecord>,
  ): Promise<StoreMemberRecord> {
    return pb.collection('store_members').update<StoreMemberRecord>(id, data)
  },

  async deleteMember(id: string): Promise<boolean> {
    return pb.collection('store_members').delete(id)
  },

  // Episódios da Loja
  async getEpisodes(storeId: string, onlyPublished = false): Promise<StoreEpisodeRecord[]> {
    const filter = onlyPublished
      ? `store = "${storeId}" && (status = "published" || status = "" || status = null)`
      : `store = "${storeId}"`
    return pb.collection('store_episodes').getFullList<StoreEpisodeRecord>({
      filter,
      sort: '-publish_date,order,-created',
    })
  },

  async createEpisode(data: FormData | Partial<StoreEpisodeRecord>): Promise<StoreEpisodeRecord> {
    return pb.collection('store_episodes').create<StoreEpisodeRecord>(data)
  },

  async updateEpisode(
    id: string,
    data: FormData | Partial<StoreEpisodeRecord>,
  ): Promise<StoreEpisodeRecord> {
    return pb.collection('store_episodes').update<StoreEpisodeRecord>(id, data)
  },

  async deleteEpisode(id: string): Promise<boolean> {
    return pb.collection('store_episodes').delete(id)
  },

  // Banners da Loja
  async getBanners(storeId: string, onlyActive = false): Promise<StoreBannerRecord[]> {
    const filter = onlyActive ? `store = "${storeId}" && active = true` : `store = "${storeId}"`
    return pb.collection('store_banners').getFullList<StoreBannerRecord>({
      filter,
      sort: 'order,created',
    })
  },

  async createBanner(data: FormData | Partial<StoreBannerRecord>): Promise<StoreBannerRecord> {
    return pb.collection('store_banners').create<StoreBannerRecord>(data)
  },

  async updateBanner(
    id: string,
    data: FormData | Partial<StoreBannerRecord>,
  ): Promise<StoreBannerRecord> {
    return pb.collection('store_banners').update<StoreBannerRecord>(id, data)
  },

  async deleteBanner(id: string): Promise<boolean> {
    return pb.collection('store_banners').delete(id)
  },

  // Depoimentos da Loja
  async getTestimonials(storeId: string, onlyApproved = false): Promise<StoreTestimonialRecord[]> {
    const filter = onlyApproved ? `store = "${storeId}" && approved = true` : `store = "${storeId}"`
    return pb.collection('store_testimonials').getFullList<StoreTestimonialRecord>({
      filter,
      sort: 'order,-created',
    })
  },

  async createTestimonial(
    data: FormData | Partial<StoreTestimonialRecord>,
  ): Promise<StoreTestimonialRecord> {
    return pb.collection('store_testimonials').create<StoreTestimonialRecord>(data)
  },

  async updateTestimonial(
    id: string,
    data: FormData | Partial<StoreTestimonialRecord>,
  ): Promise<StoreTestimonialRecord> {
    return pb.collection('store_testimonials').update<StoreTestimonialRecord>(id, data)
  },

  async deleteTestimonial(id: string): Promise<boolean> {
    return pb.collection('store_testimonials').delete(id)
  },
}

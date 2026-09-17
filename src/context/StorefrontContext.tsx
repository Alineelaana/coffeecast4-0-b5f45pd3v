import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { StoreRecord, StoreWithCounts } from '@/types/database'
import { StorefrontService } from '@/services/storefront'
import { useAuth } from '@/context/AuthContext'
import pb from '@/lib/pocketbase/client'

const STORAGE_ACTIVE_STORE_KEY = 'coffeecast_active_store_id'

interface StorefrontContextType {
  stores: StoreWithCounts[]
  activeStore: StoreWithCounts | null
  activeStoreId: string | null
  isLoadingStores: boolean
  setActiveStoreId: (storeId: string | null) => void
  refreshStores: () => Promise<void>
  refreshActiveStore: () => Promise<void>
}

const StorefrontContext = createContext<StorefrontContextType | undefined>(undefined)

export const StorefrontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMaster, user } = useAuth()
  const [stores, setStores] = useState<StoreWithCounts[]>([])
  const [activeStoreId, setActiveStoreIdState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_ACTIVE_STORE_KEY) || null
  })
  const [isLoadingStores, setIsLoadingStores] = useState(false)

  const refreshStores = useCallback(async () => {
    if (!user || !isMaster) {
      setStores([])
      return
    }

    try {
      setIsLoadingStores(true)
      const list = await StorefrontService.getStoresOverview()
      setStores(list)

      // Se há lojas e a ativa não estiver na lista ou for nula, seleciona a primeira
      if (list.length > 0) {
        setActiveStoreIdState((current) => {
          if (!current || !list.some((s) => s.id === current)) {
            const firstId = list[0].id
            localStorage.setItem(STORAGE_ACTIVE_STORE_KEY, firstId)
            return firstId
          }
          return current
        })
      } else {
        setActiveStoreIdState(null)
        localStorage.removeItem(STORAGE_ACTIVE_STORE_KEY)
      }
    } catch (err) {
      console.error('Erro ao carregar lojas no StorefrontContext:', err)
    } finally {
      setIsLoadingStores(false)
    }
  }, [user, isMaster])

  const refreshActiveStore = useCallback(async () => {
    if (!activeStoreId) return
    try {
      const updated = await StorefrontService.getStoreById(activeStoreId)
      setStores((prev) => prev.map((s) => (s.id === activeStoreId ? { ...s, ...updated } : s)))
    } catch (e) {
      console.warn('Erro ao atualizar loja ativa:', e)
    }
  }, [activeStoreId])

  useEffect(() => {
    refreshStores()
  }, [refreshStores])

  // Realtime subscription para atualizar quando alguma store mudar
  useEffect(() => {
    if (!user || !isMaster) return

    let unsub: (() => void) | undefined
    pb.collection('stores')
      .subscribe('*', () => {
        refreshStores()
      })
      .then((u) => {
        unsub = u
      })
      .catch(() => {})

    return () => {
      if (unsub) unsub()
    }
  }, [user, isMaster, refreshStores])

  const setActiveStoreId = (id: string | null) => {
    setActiveStoreIdState(id)
    if (id) {
      localStorage.setItem(STORAGE_ACTIVE_STORE_KEY, id)
    } else {
      localStorage.removeItem(STORAGE_ACTIVE_STORE_KEY)
    }
  }

  const activeStore = stores.find((s) => s.id === activeStoreId) || null

  return (
    <StorefrontContext.Provider
      value={{
        stores,
        activeStore,
        activeStoreId,
        isLoadingStores,
        setActiveStoreId,
        refreshStores,
        refreshActiveStore,
      }}
    >
      {children}
    </StorefrontContext.Provider>
  )
}

export function useStorefront() {
  const ctx = useContext(StorefrontContext)
  if (!ctx) {
    throw new Error('useStorefront deve ser usado dentro de um StorefrontProvider')
  }
  return ctx
}

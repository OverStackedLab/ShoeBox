import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useMMKVString } from "react-native-mmkv"

import { useAuth } from "@/context/AuthContext"
import {
  deleteReceiptRemote,
  fetchRemoteReceipts,
  upsertReceiptRemote,
} from "@/services/supabase/receipts"
import { deleteReceiptImages } from "@/utils/receiptStorage"
import { storage } from "@/utils/storage"

const LEGACY_RECEIPTS_KEY = "ReceiptsProvider.receipts"
const SIGNED_OUT_RECEIPTS_KEY = "ReceiptsProvider.receipts.__signed_out__"

export interface ScannedImage {
  uri: string
  width: number
  height: number
}

export interface ReceiptProduct {
  name: string
  price?: number | null
}

export interface Receipt {
  id: string
  storeName?: string
  address?: string
  date?: string
  total?: number
  category?: string
  products?: ReceiptProduct[]
  scannedImages: ScannedImage[]
  createdAt: number
}

interface ReceiptsContextType {
  receipts: Receipt[]
  addReceipt: (receipt: Receipt) => void
  removeReceipt: (id: string) => void
  updateReceipt: (id: string, updates: Partial<Omit<Receipt, "id" | "createdAt">>) => void
  categorizingIds: Set<string>
  setCategorizing: (id: string, value: boolean) => void
  isInitialSyncing: boolean
}

const ReceiptsContext = createContext<ReceiptsContextType | null>(null)

export const ReceiptsProvider: FC<PropsWithChildren> = ({ children }) => {
  const { session } = useAuth()
  const userId = session?.user?.id
  const cacheKey = userId ? `ReceiptsProvider.receipts.${userId}` : SIGNED_OUT_RECEIPTS_KEY
  const [receiptsJson, setReceiptsJson] = useMMKVString(cacheKey)

  // One-time wipe of any legacy unscoped cache from earlier app versions.
  useEffect(() => {
    if (storage.contains(LEGACY_RECEIPTS_KEY)) storage.delete(LEGACY_RECEIPTS_KEY)
  }, [])

  const receipts = useMemo<Receipt[]>(() => {
    try {
      return receiptsJson ? JSON.parse(receiptsJson) : []
    } catch {
      return []
    }
  }, [receiptsJson])

  const receiptsRef = useRef(receipts)
  receiptsRef.current = receipts

  const [categorizingIds, setCategorizingIds] = useState<Set<string>>(() => new Set())
  const [isInitialSyncing, setIsInitialSyncing] = useState(false)

  const setCategorizing = useCallback((id: string, value: boolean) => {
    setCategorizingIds((prev) => {
      const next = new Set(prev)
      if (value) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  // Fetch from Supabase whenever the logged-in user changes
  useEffect(() => {
    if (!userId) {
      setIsInitialSyncing(false)
      return
    }
    setIsInitialSyncing(true)
    fetchRemoteReceipts(userId)
      .then((remote) => setReceiptsJson(JSON.stringify(remote)))
      .catch(console.error)
      .finally(() => setIsInitialSyncing(false))
  }, [userId, setReceiptsJson])

  const addReceipt = useCallback(
    (receipt: Receipt) => {
      const next = [receipt, ...receiptsRef.current]
      receiptsRef.current = next
      setReceiptsJson(JSON.stringify(next))
      if (userId) upsertReceiptRemote(receipt, userId).catch(console.error)
    },
    [setReceiptsJson, userId],
  )

  const removeReceipt = useCallback(
    (id: string) => {
      const next = receiptsRef.current.filter((r) => r.id !== id)
      receiptsRef.current = next
      setReceiptsJson(JSON.stringify(next))
      deleteReceiptImages(id)
      if (userId) deleteReceiptRemote(id).catch(console.error)
    },
    [setReceiptsJson, userId],
  )

  const updateReceipt = useCallback(
    (id: string, updates: Partial<Omit<Receipt, "id" | "createdAt">>) => {
      const next = receiptsRef.current.map((r) => (r.id === id ? { ...r, ...updates } : r))
      receiptsRef.current = next
      setReceiptsJson(JSON.stringify(next))
      if (userId) {
        const receipt = next.find((r) => r.id === id)
        if (receipt) upsertReceiptRemote(receipt, userId).catch(console.error)
      }
    },
    [setReceiptsJson, userId],
  )

  return (
    <ReceiptsContext.Provider
      value={{
        receipts,
        addReceipt,
        removeReceipt,
        updateReceipt,
        categorizingIds,
        setCategorizing,
        isInitialSyncing,
      }}
    >
      {children}
    </ReceiptsContext.Provider>
  )
}

export const useReceipts = () => {
  const context = useContext(ReceiptsContext)
  if (!context) throw new Error("useReceipts must be used within a ReceiptsProvider")
  return context
}

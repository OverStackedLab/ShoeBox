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
}

const ReceiptsContext = createContext<ReceiptsContextType | null>(null)

export const ReceiptsProvider: FC<PropsWithChildren> = ({ children }) => {
  const [receiptsJson, setReceiptsJson] = useMMKVString("ReceiptsProvider.receipts")
  const { session } = useAuth()
  const userId = session?.user?.id

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
    if (!userId) return
    fetchRemoteReceipts(userId)
      .then((remote) => setReceiptsJson(JSON.stringify(remote)))
      .catch(console.error)
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

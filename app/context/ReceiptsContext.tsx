import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

export interface Receipt {
  id: string
  storeName?: string
  date?: string
  total?: number
  category?: string
  scannedImages: ScannedImage[]
  createdAt: number
}

interface ReceiptsContextType {
  receipts: Receipt[]
  addReceipt: (receipt: Receipt) => void
  removeReceipt: (id: string) => void
  updateReceipt: (id: string, updates: Partial<Omit<Receipt, "id" | "createdAt">>) => void
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

  // Fetch from Supabase whenever the logged-in user changes
  useEffect(() => {
    if (!userId) return
    fetchRemoteReceipts(userId)
      .then((remote) => setReceiptsJson(JSON.stringify(remote)))
      .catch(console.error)
  }, [userId, setReceiptsJson])

  const addReceipt = useCallback(
    (receipt: Receipt) => {
      setReceiptsJson(JSON.stringify([receipt, ...receipts]))
      if (userId) upsertReceiptRemote(receipt, userId).catch(console.error)
    },
    [receipts, setReceiptsJson, userId],
  )

  const removeReceipt = useCallback(
    (id: string) => {
      setReceiptsJson(JSON.stringify(receipts.filter((r) => r.id !== id)))
      if (userId) deleteReceiptRemote(id).catch(console.error)
    },
    [receipts, setReceiptsJson, userId],
  )

  const updateReceipt = useCallback(
    (id: string, updates: Partial<Omit<Receipt, "id" | "createdAt">>) => {
      const updated = receipts.map((r) => (r.id === id ? { ...r, ...updates } : r))
      setReceiptsJson(JSON.stringify(updated))
      if (userId) {
        const receipt = updated.find((r) => r.id === id)
        if (receipt) upsertReceiptRemote(receipt, userId).catch(console.error)
      }
    },
    [receipts, setReceiptsJson, userId],
  )

  return (
    <ReceiptsContext.Provider value={{ receipts, addReceipt, removeReceipt, updateReceipt }}>
      {children}
    </ReceiptsContext.Provider>
  )
}

export const useReceipts = () => {
  const context = useContext(ReceiptsContext)
  if (!context) throw new Error("useReceipts must be used within a ReceiptsProvider")
  return context
}

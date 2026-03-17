import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo } from "react"
import { MMKV, useMMKVString } from "react-native-mmkv"

// TEMP: clear stale test receipts — remove after one run
new MMKV().delete("ReceiptsProvider.receipts")

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

  const receipts = useMemo<Receipt[]>(() => {
    try {
      return receiptsJson ? JSON.parse(receiptsJson) : []
    } catch {
      return []
    }
  }, [receiptsJson])

  const addReceipt = useCallback(
    (receipt: Receipt) => {
      setReceiptsJson(JSON.stringify([receipt, ...receipts]))
    },
    [receipts, setReceiptsJson],
  )

  const removeReceipt = useCallback(
    (id: string) => {
      setReceiptsJson(JSON.stringify(receipts.filter((r) => r.id !== id)))
    },
    [receipts, setReceiptsJson],
  )

  const updateReceipt = useCallback(
    (id: string, updates: Partial<Omit<Receipt, "id" | "createdAt">>) => {
      setReceiptsJson(
        JSON.stringify(receipts.map((r) => (r.id === id ? { ...r, ...updates } : r))),
      )
    },
    [receipts, setReceiptsJson],
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

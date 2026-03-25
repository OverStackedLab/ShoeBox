import { File, Directory, Paths } from "expo-file-system"

import { supabase } from "./supabase"
import type { Receipt } from "@/context/ReceiptsContext"

const RECEIPTS_DIR = new Directory(Paths.document, "receipts")

function ensureDir() {
  if (!RECEIPTS_DIR.exists) {
    RECEIPTS_DIR.create({ intermediates: true })
  }
}

export async function upsertReceiptRemote(receipt: Receipt, userId: string): Promise<void> {
  const { error } = await supabase.from("receipts").upsert({
    id: receipt.id,
    user_id: userId,
    store_name: receipt.storeName ?? null,
    date: receipt.date ?? null,
    total: receipt.total ?? null,
    category: receipt.category ?? null,
    created_at: receipt.createdAt,
  })
  if (error) throw error

  // Delete existing image records then re-upload
  await supabase.from("receipt_images").delete().eq("receipt_id", receipt.id)

  for (let i = 0; i < receipt.scannedImages.length; i++) {
    const img = receipt.scannedImages[i]
    const path = `${userId}/${receipt.id}_${i}.jpg`

    if (img.uri.startsWith("file://")) {
      const response = await fetch(img.uri)
      const blob = await response.blob()
      const { error: uploadError } = await supabase.storage
        .from("receipt-images")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true })
      if (uploadError) throw uploadError
    }

    const { error: imgError } = await supabase.from("receipt_images").insert({
      receipt_id: receipt.id,
      user_id: userId,
      storage_path: path,
      width: img.width,
      height: img.height,
      position: i,
    })
    if (imgError) throw imgError
  }
}

export async function deleteReceiptRemote(receiptId: string): Promise<void> {
  const { data: images } = await supabase
    .from("receipt_images")
    .select("storage_path")
    .eq("receipt_id", receiptId)

  if (images?.length) {
    await supabase.storage.from("receipt-images").remove(images.map((r) => r.storage_path))
  }

  await supabase.from("receipts").delete().eq("id", receiptId)
}

export async function fetchRemoteReceipts(userId: string): Promise<Receipt[]> {
  const { data, error } = await supabase
    .from("receipts")
    .select("*, receipt_images(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error

  ensureDir()

  const receipts: Receipt[] = []

  for (const row of data ?? []) {
    const images = (row.receipt_images as any[]).sort((a, b) => a.position - b.position)
    const scannedImages: Receipt["scannedImages"] = []

    for (const img of images) {
      const localFile = new File(RECEIPTS_DIR, `${row.id}_${img.position}.jpg`)

      if (!localFile.exists) {
        const { data: signedData, error: signError } = await supabase.storage
          .from("receipt-images")
          .createSignedUrl(img.storage_path, 3600)
        if (!signError && signedData) {
          await File.downloadFileAsync(signedData.signedUrl, localFile, { idempotent: true })
        }
      }

      scannedImages.push({ uri: localFile.uri, width: img.width, height: img.height })
    }

    receipts.push({
      id: row.id,
      storeName: row.store_name ?? undefined,
      date: row.date ?? undefined,
      total: row.total ?? undefined,
      category: row.category ?? undefined,
      createdAt: row.created_at,
      scannedImages,
    })
  }

  return receipts
}

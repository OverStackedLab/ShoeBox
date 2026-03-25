import { Directory, File, Paths } from "expo-file-system"

const receiptsDir = new Directory(Paths.document, "receipts")

function ensureDir() {
  if (!receiptsDir.exists) {
    receiptsDir.create()
  }
}

/**
 * Copies a temp URI from the scanner to permanent app storage.
 * Returns the permanent URI.
 */
export function saveReceiptImage(tempUri: string, receiptId: string, index: number): string {
  ensureDir()
  const src = new File(tempUri)
  const dest = new File(receiptsDir, `${receiptId}_${index}.jpg`)
  if (dest.exists) dest.delete()
  src.copy(dest)
  return dest.uri
}

/**
 * Deletes all stored images for a receipt.
 */
export function deleteReceiptImages(receiptId: string): void {
  if (!receiptsDir.exists) return
  receiptsDir
    .list()
    .filter((f): f is File => f instanceof File && f.name.startsWith(`${receiptId}_`))
    .forEach((f) => f.delete())
}

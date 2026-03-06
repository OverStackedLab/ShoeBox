export function parseAmount(raw: string): number {
  const s = raw.trim().replace(/\s/g, "")
  if (/,\d{1,2}$/.test(s)) return parseFloat(s.replace(/\./g, "").replace(",", "."))
  if (/\.\d{2}$/.test(s)) return parseFloat(s.replace(/,/g, ""))
  return parseFloat(s.replace(/[,.]/g, ""))
}

export function parseReceiptText(raw: string): { storeName?: string; date?: string; total?: number } {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  const storeName = lines[0]

  const dateMatch = raw.match(
    /\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/,
  )
  const date = dateMatch?.[1]

  // OCR often misreads ÖSSZESEN as "(STESEN", "OSSZESEN", etc.
  const HU_KEYWORD = /ÖSSZESEN|OSSZESEN|\(?S[TZ]ESEN/i
  const EN_KEYWORD = /TOTAL(?:\s+(?:AMOUNT|DUE|PURCHASE))?|BALANCE\s+DUE|AMOUNT\s+DUE/i

  const keywordMatch =
    // HU: keyword anywhere above — require Ft suffix to skip intermediate bare numbers
    raw.match(
      new RegExp(
        `(?:${HU_KEYWORD.source}|${EN_KEYWORD.source})[\\s\\S]*?([0-9][0-9 .,]*)\\s*Ft\\b`,
        "i",
      ),
    ) ??
    // EN: keyword + $ or bare amount on same/next line
    raw.match(new RegExp(`(?:${EN_KEYWORD.source})[^0-9$]*\\$?\\s*([0-9][0-9.,]*)`, "i"))

  let total: number | undefined

  if (keywordMatch) {
    const n = parseAmount(keywordMatch[1])
    if (!isNaN(n)) total = n
  }

  // Fallback: largest Ft-suffixed amount (unit prices like "469 Ft/KG" are excluded)
  if (total === undefined) {
    const ftAmounts = [...raw.matchAll(/([0-9][0-9 .,]*[0-9]|[0-9]+)\s*Ft\b(?!\/)/g)]
      .map((m) => parseAmount(m[1]))
      .filter((n) => !isNaN(n))
    if (ftAmounts.length > 0) total = Math.max(...ftAmounts)
  }

  // Last resort: largest number in the receipt
  if (total === undefined) {
    const allAmounts = [...raw.matchAll(/\b([0-9][0-9 .,]*[0-9]|[0-9]{3,})\b/g)]
      .map((m) => parseAmount(m[1]))
      .filter((n) => !isNaN(n))
    if (allAmounts.length > 0) total = Math.max(...allAmounts)
  }

  return { storeName, date, total }
}

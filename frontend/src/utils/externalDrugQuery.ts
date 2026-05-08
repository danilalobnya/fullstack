/**
 * RxNorm `drugs.json?name=…` не находит полную строку SCD («ibuprofen 400 MG Oral Tablet»),
 * зато находит «ibuprofen».
 */
export function stripRxnormDoseForLookup(name: string): string {
  const t = name.trim()
  const m = t.match(/^(.+?)\s+\d+(?:\.\d+)?\s*(MG|MCG|ML)\b/i)
  if (m) {
    const base = m[1].trim()
    if (base.length >= 2) return base
  }
  return t
}

/**
 * Для карточки лекарства имя может быть длинной строкой RxNav (например набор упаковок).
 * Поиск во внешнем API по полной строке часто ничего не находит; берём короткий «бренд» из [ … ].
 */
export function externalLookupQuery(fullName: string): string {
  const t = stripRxnormDoseForLookup(fullName.trim())
  if (t.length <= 100) return t.length >= 2 ? t : fullName.trim().slice(0, 100)

  const inside = [...t.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1].trim())
  const candidates = inside
    .filter((s) => s.length >= 2 && s.length <= 120)
    .map((s) => {
      const looksLikeStrength =
        /\d+\s*(MG|MCG|ML|\/)/i.test(s) || /\b(oral|tablet|capsule|powder|pack|tab)\b/i.test(s)
      return { s, bad: looksLikeStrength || s.includes('{') }
    })

  const brands = candidates.filter((x) => !x.bad).map((x) => x.s)
  if (brands.length) {
    brands.sort((a, b) => a.length - b.length)
    const pick = brands[0]
    if (pick.trim().length >= 2) return pick
  }

  const firstToken = t.split(/\s+/)[0]?.replace(/^[{(]+/, '') ?? ''
  if (firstToken.length >= 2 && firstToken.length <= 50) return firstToken

  const tail = t.slice(0, 100).trim()
  return tail.length >= 2 ? tail : t.slice(0, 200).trim()
}

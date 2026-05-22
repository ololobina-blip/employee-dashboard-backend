const normalizeValue = (value?: string | null): string => (value ?? '').trim()

export const parseSheetDate = (value: string | Date): Date => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date() : value
  }

  const normalized = normalizeValue(value)
  if (!normalized) return new Date()

  const dotMatch = normalized.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})(?:\s|$)/)
  if (dotMatch) {
    const day = Number(dotMatch[1])
    const month = Number(dotMatch[2])
    let year = Number(dotMatch[3])
    if (year < 100) year += 2000
    return new Date(year, month - 1, day)
  }

  const iso = new Date(normalized)
  if (!Number.isNaN(iso.getTime())) return iso

  return new Date()
}

export const formatTicketDate = (value: string | Date): string => {
  const date = parseSheetDate(value)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

export const formatRatingDate = (value: string | Date): string => {
  const date = parseSheetDate(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export const formatIsoDate = (value: string | Date | null | undefined): string => {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString()
  return value
}

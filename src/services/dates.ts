const normalizeValue = (value?: string | null): string => (value ?? '').trim()

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime())

export const parseSheetDate = (value: string | Date): Date => {
  if (value instanceof Date) {
    return isValidDate(value) ? value : new Date(NaN)
  }

  const normalized = normalizeValue(value)
  if (!normalized) return new Date(NaN)

  const dotMatch = normalized.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  )

  if (dotMatch) {
    const day = Number(dotMatch[1])
    const month = Number(dotMatch[2])
    let year = Number(dotMatch[3])

    if (year < 100) year += 2000

    const hours = Number(dotMatch[4] ?? 0)
    const minutes = Number(dotMatch[5] ?? 0)
    const seconds = Number(dotMatch[6] ?? 0)

    return new Date(year, month - 1, day, hours, minutes, seconds)
  }

  const iso = new Date(normalized)
  return isValidDate(iso) ? iso : new Date(NaN)
}

export const formatTicketDate = (value: string | Date): string => {
  const date = parseSheetDate(value)
  if (!isValidDate(date)) return ''

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}.${month}.${year}`
}

export const formatRatingDate = (value: string | Date): string => {
  const date = parseSheetDate(value)
  if (!isValidDate(date)) return ''

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

  const date = parseSheetDate(value)
  if (!isValidDate(date)) return ''

  return date.toISOString()
}

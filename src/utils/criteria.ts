export interface ParsedCriterion {
  raw: string
  penalty: number
  details: string
  hasPenalty: boolean
  isEmpty: boolean
  normalized: string
}

export const normalizeCriterionInput = (value?: string | null): string => {
  return String(value ?? '').trim()
}

export const parseCriterion = (value?: string | null): ParsedCriterion => {
  const raw = normalizeCriterionInput(value)

  if (!raw || raw === '—' || raw === '-') {
    return {
      raw,
      penalty: 0,
      details: '—',
      hasPenalty: false,
      isEmpty: true,
      normalized: '0: —',
    }
  }

  if (/^[\-–—]?\s*0(?:\s*:?\s*—?)?$/u.test(raw)) {
    return {
      raw,
      penalty: 0,
      details: '—',
      hasPenalty: false,
      isEmpty: true,
      normalized: '0: —',
    }
  }

  const match = raw.match(/^[\s]*([\-–—]?)\s*(\d{1,3})(?:\s*[:.]|\s+|$)/u)

  if (!match) {
    return {
      raw,
      penalty: 0,
      details: raw,
      hasPenalty: false,
      isEmpty: false,
      normalized: `0: ${raw}`,
    }
  }

  const penalty = Math.abs(Number.parseInt(match[2], 10)) || 0
  let rest = raw.slice(match[0].length).trim()
  if (rest.startsWith(':')) rest = rest.slice(1).trimStart()
  const details = rest || '—'

  return {
    raw,
    penalty,
    details,
    hasPenalty: penalty > 0,
    isEmpty: penalty === 0 && (!rest || rest === '—'),
    normalized: penalty === 0 ? `0: ${details || '—'}` : `-${penalty}: ${details || '—'}`,
  }
}

export const isPenaltyCriterion = (value?: string | null): boolean => {
  return parseCriterion(value).hasPenalty
}

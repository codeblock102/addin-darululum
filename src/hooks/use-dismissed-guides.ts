import { useCallback, useEffect, useState } from 'react'

const KEY = 'darululum:dismissed-guides:v1'

function read(): Record<string, true> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function useDismissedGuides() {
  const [state, setState] = useState<Record<string, true>>({})
  useEffect(() => setState(read()), [])
  const isDismissed = useCallback((id: string) => !!state[id], [state])
  const dismiss = useCallback((id: string) => {
    const next = { ...read(), [id]: true as const }
    localStorage.setItem(KEY, JSON.stringify(next))
    setState(next)
  }, [])
  const reset = useCallback(() => { localStorage.removeItem(KEY); setState({}) }, [])
  return { isDismissed, dismiss, reset }
}

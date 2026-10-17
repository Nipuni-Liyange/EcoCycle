import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage } from '../lib/api'

export default function useApi(url) {
  const [state, setState] = useState({ key: null, data: null, error: '' })
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => setRevision(value => value + 1), [])
  const key = `${url}:${revision}`
  useEffect(() => {
    const controller = new AbortController()
    api.get(url, { signal: controller.signal }).then(({ data }) => { if (!controller.signal.aborted) setState({ key, data, error: '' }) }).catch(error => {
      if (!controller.signal.aborted) setState({ key, data: null, error: errorMessage(error) })
    })
    return () => controller.abort()
  }, [url, key])
  return state.key === key ? { ...state, loading: false, reload } : { data: null, error: '', loading: true, reload }
}

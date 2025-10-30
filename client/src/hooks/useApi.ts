import { useCallback, useState } from 'react'
import { type AxiosRequestConfig } from 'axios'
import { type ApiError, request } from '../services/apiClient'

interface UseApiState<T> {
  data: T | null
  error: ApiError | null
  loading: boolean
}

export function useApi<T = unknown>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    loading: false,
  })

  const execute = useCallback(async (config: AxiosRequestConfig) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const data = await request<T>(config)
      setState({ data, error: null, loading: false })
      return data
    } catch (error) {
      const apiError = error as ApiError
      setState({ data: null, error: apiError, loading: false })
      throw apiError
    }
  }, [])

  return {
    ...state,
    execute,
  }
}

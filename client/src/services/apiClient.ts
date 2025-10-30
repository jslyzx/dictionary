import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

export interface ApiError {
  message: string
  status?: number
  details?: unknown
}

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiError>) => {
    const apiError: ApiError = {
      message: error.response?.data?.message ?? error.message,
      status: error.response?.status,
      details: error.response?.data?.details ?? error.response?.data,
    }

    return Promise.reject(apiError)
  },
)

export const request = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.request<T>(config)
  return response.data
}

export default apiClient

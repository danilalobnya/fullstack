import axios, { AxiosHeaders } from 'axios'
import type { LoginResponse } from '../types/models'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

export interface SetTokensPayload {
  access_token?: string
  refresh_token?: string
  user_id?: number | string
  role?: string
}

export const setTokens = ({
  access_token,
  refresh_token,
  user_id,
  role,
}: SetTokensPayload) => {
  if (access_token) localStorage.setItem('access_token', access_token)
  if (refresh_token) localStorage.setItem('refresh_token', refresh_token)
  if (user_id) localStorage.setItem('user_id', String(user_id))
  if (role) localStorage.setItem('user_role', role)
  if (access_token) {
    api.defaults.headers.common.Authorization = `Bearer ${access_token}`
    api.defaults.headers.common.authorization = `Bearer ${access_token}`
  }
}

export const clearTokens = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user_id')
  localStorage.removeItem('user_role')
  delete api.defaults.headers.common.Authorization
  delete api.defaults.headers.common.authorization
  window.dispatchEvent(new Event('auth-changed'))
}

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 30_000,
})

const initToken = localStorage.getItem('access_token')
if (initToken) {
  api.defaults.headers.common.Authorization = `Bearer ${initToken}`
  api.defaults.headers.common.authorization = `Bearer ${initToken}`
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    if (!(config.headers instanceof AxiosHeaders)) {
      config.headers = new AxiosHeaders(config.headers)
    }
    config.headers.set('Authorization', `Bearer ${token}`)
    config.headers.set('authorization', `Bearer ${token}`)
  }
  return config
})

let refreshPromise: Promise<string> | null = null

const refreshTokens = async (): Promise<string> => {
  if (refreshPromise) return refreshPromise

  const refresh_token = localStorage.getItem('refresh_token')
  if (!refresh_token) {
    clearTokens()
    return Promise.reject(new Error('No refresh token'))
  }

  refreshPromise = axios
    .post<LoginResponse>(`${API_BASE}/auth/refresh`, { refresh_token })
    .then((response) => {
      const { access_token: access, refresh_token: refresh, user_id, role } =
        response.data
      setTokens({
        access_token: access,
        refresh_token: refresh,
        user_id,
        role,
      })
      return access as string
    })
    .catch((error: unknown) => {
      clearTokens()
      throw error
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const newAccess = await refreshTokens()
        if (!(originalRequest.headers instanceof AxiosHeaders)) {
          originalRequest.headers = new AxiosHeaders(originalRequest.headers)
        }
        originalRequest.headers.set('Authorization', `Bearer ${newAccess}`)
        return api(originalRequest)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default api

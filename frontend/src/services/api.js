import axios, { AxiosHeaders } from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

export const setTokens = ({ access_token, refresh_token, user_id }) => {
  if (access_token) localStorage.setItem('access_token', access_token)
  if (refresh_token) localStorage.setItem('refresh_token', refresh_token)
  if (user_id) localStorage.setItem('user_id', user_id)
  if (access_token) {
    api.defaults.headers.common.Authorization = `Bearer ${access_token}`
    api.defaults.headers.common.authorization = `Bearer ${access_token}`
  }
}

export const clearTokens = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user_id')
  delete api.defaults.headers.common.Authorization
  delete api.defaults.headers.common.authorization
  window.dispatchEvent(new Event('auth-changed'))
}

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Подхватываем токен из localStorage при загрузке страницы
const initToken = localStorage.getItem('access_token')
if (initToken) {
  api.defaults.headers.common.Authorization = `Bearer ${initToken}`
  api.defaults.headers.common.authorization = `Bearer ${initToken}`
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    // Приводим заголовки к AxiosHeaders, чтобы точно записать Authorization
    if (!(config.headers instanceof AxiosHeaders)) {
      config.headers = new AxiosHeaders(config.headers)
    }
    config.headers.set('Authorization', `Bearer ${token}`)
    config.headers.set('authorization', `Bearer ${token}`)
  }
  return config
})

let refreshPromise = null

const refreshTokens = async () => {
  if (refreshPromise) return refreshPromise

  const refresh_token = localStorage.getItem('refresh_token')
  if (!refresh_token) {
    clearTokens()
    return Promise.reject(new Error('No refresh token'))
  }

  refreshPromise = axios
    .post(`${API_BASE}/auth/refresh`, { refresh_token })
    .then((response) => {
      const { access_token: access, refresh_token: refresh, user_id } = response.data
      setTokens({ access_token: access, refresh_token: refresh, user_id })
      return access
    })
    .catch((error) => {
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

    if (status === 401 && !originalRequest._retry) {
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

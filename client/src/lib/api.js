import axios from 'axios'

export const api = axios.create({ baseURL: '/api', withCredentials: true, timeout: 15000, headers: { 'Content-Type': 'application/json' } })
let csrfToken = ''
export function setCsrfToken(value) { csrfToken = value || '' }
api.interceptors.request.use(config => {
  if (csrfToken && !['get', 'head', 'options'].includes(config.method)) config.headers['X-CSRF-Token'] = csrfToken
  return config
})
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !/\/auth\/(login|register|me)/.test(error.config?.url || '')) window.dispatchEvent(new Event('ecocycle:expired'))
  return Promise.reject(error)
})
export function errorMessage(error) {
  return error.response?.data?.message || (error.code === 'ECONNABORTED' ? 'This is taking longer than expected. Please try again.' : 'We could not reach EcoCycle. Please try again in a moment.')
}

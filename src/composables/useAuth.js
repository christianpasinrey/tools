import { ref, computed } from 'vue'
import { useAppCrypto } from './useAppCrypto'

const API_URL = import.meta.env.VITE_SYNC_API_URL || 'http://localhost:3001'
const AUTH_SALT = new TextEncoder().encode('tools-sync-auth-key-derivation')

// Derive an auth key from password using PBKDF2 (one-way).
// This is what gets sent to the server — never the raw password.
// The server cannot reverse this to obtain the encryption password.
async function deriveAuthKey(password) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: AUTH_SALT, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  )
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Singleton state
const user = ref(null)
const accessToken = ref(null)
const refreshToken = ref(null)
const isAuthenticated = computed(() => !!accessToken.value)
const authLoading = ref(false)
const authError = ref('')

export function useAuth() {
  const cryptoModule = useAppCrypto()

  function init() {
    const stored = localStorage.getItem('tools-sync-auth')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        user.value = parsed.user
        accessToken.value = parsed.accessToken
        refreshToken.value = parsed.refreshToken
      } catch { /* corrupt data, ignore */ }
    }
    // Restore password from sessionStorage (persists within tab, cleared on browser close)
    const sessionPwd = sessionStorage.getItem('tools-sync-pwd')
    if (sessionPwd && accessToken.value) {
      cryptoModule.setPassword(sessionPwd)
    }
  }

  function persistAuth() {
    localStorage.setItem('tools-sync-auth', JSON.stringify({
      user: user.value,
      accessToken: accessToken.value,
      refreshToken: refreshToken.value
    }))
  }

  function clearAuth() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('tools-sync-auth')
  }

  async function register(email, password) {
    authLoading.value = true
    authError.value = ''
    try {
      const authKey = await deriveAuthKey(password)
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: authKey })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      user.value = data.user
      accessToken.value = data.token
      refreshToken.value = data.refreshToken
      cryptoModule.setPassword(password)
      sessionStorage.setItem('tools-sync-pwd', password)
      persistAuth()
      return true
    } catch (err) {
      authError.value = err.message
      return false
    } finally {
      authLoading.value = false
    }
  }

  async function login(email, password) {
    authLoading.value = true
    authError.value = ''
    try {
      const authKey = await deriveAuthKey(password)
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: authKey })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      user.value = data.user
      accessToken.value = data.token
      refreshToken.value = data.refreshToken
      cryptoModule.setPassword(password)
      sessionStorage.setItem('tools-sync-pwd', password)
      persistAuth()
      return true
    } catch (err) {
      authError.value = err.message
      return false
    } finally {
      authLoading.value = false
    }
  }

  async function logout() {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken.value}` }
      })
    } catch { /* ignore */ }
    cryptoModule.lock()
    sessionStorage.removeItem('tools-sync-pwd')
    clearAuth()
  }

  async function refreshAccessToken() {
    if (!refreshToken.value) return false
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshToken.value })
      })
      if (!res.ok) return false
      const data = await res.json()
      accessToken.value = data.token
      refreshToken.value = data.refreshToken
      persistAuth()
      return true
    } catch {
      return false
    }
  }

  async function changePassword(currentPassword, newPassword) {
    const currentAuthKey = await deriveAuthKey(currentPassword)
    const newAuthKey = await deriveAuthKey(newPassword)
    const res = await authFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: currentAuthKey, newPassword: newAuthKey })
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Change password failed')
    }
    cryptoModule.setPassword(newPassword)
    sessionStorage.setItem('tools-sync-pwd', newPassword)
    return true
  }

  async function authFetch(url, options = {}) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${accessToken.value}`,
      'Content-Type': 'application/json'
    }
    let response = await fetch(`${API_URL}${url}`, options)

    if (response.status === 401) {
      const data = await response.json()
      if (data.code === 'TOKEN_EXPIRED') {
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          options.headers['Authorization'] = `Bearer ${accessToken.value}`
          response = await fetch(`${API_URL}${url}`, options)
        } else {
          clearAuth()
          throw new Error('Session expired')
        }
      }
    }
    return response
  }

  return {
    user,
    isAuthenticated,
    authLoading,
    authError,
    init,
    register,
    login,
    logout,
    changePassword,
    authFetch
  }
}

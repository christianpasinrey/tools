import { ref, computed } from 'vue'
import { useAppCrypto } from './useAppCrypto'

const API_URL = import.meta.env.VITE_SYNC_API_URL || 'http://localhost:3001'
const AUTH_SALT = new TextEncoder().encode('tools-sync-auth-key-derivation')

// Derive an auth key from password using PBKDF2 (one-way).
// This is what gets sent to the server — never the raw password.
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

// Singleton state — memory only, no localStorage
const user = ref(null)
const accessToken = ref(null)
const isAuthenticated = computed(() => !!accessToken.value)
const authLoading = ref(false)
const authError = ref('')
const resetLoading = ref(false)
const resetError = ref('')
const resetSuccess = ref('')

export function useAuth() {
  const cryptoModule = useAppCrypto()

  async function init() {
    // Try to restore session via HttpOnly refresh cookie
    const sessionPwd = sessionStorage.getItem('tools-sync-pwd')
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        user.value = data.user
        accessToken.value = data.token
        // Restore encryption password from sessionStorage if available
        if (sessionPwd) {
          cryptoModule.setPassword(sessionPwd)
        }
      }
    } catch { /* no session, stay unauthenticated */ }
  }

  async function register(email, password) {
    authLoading.value = true
    authError.value = ''
    try {
      const authKey = await deriveAuthKey(password)
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password: authKey })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      user.value = data.user
      accessToken.value = data.token
      cryptoModule.setPassword(password)
      sessionStorage.setItem('tools-sync-pwd', password)
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
        credentials: 'include',
        body: JSON.stringify({ email, password: authKey })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      user.value = data.user
      accessToken.value = data.token
      cryptoModule.setPassword(password)
      sessionStorage.setItem('tools-sync-pwd', password)
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
        headers: { 'Authorization': `Bearer ${accessToken.value}` },
        credentials: 'include'
      })
    } catch { /* ignore */ }
    cryptoModule.lock()
    sessionStorage.removeItem('tools-sync-pwd')
    user.value = null
    accessToken.value = null
  }

  async function refreshAccessToken() {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      })
      if (!res.ok) return false
      const data = await res.json()
      accessToken.value = data.token
      user.value = data.user
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

  async function requestPasswordReset(email) {
    resetLoading.value = true
    resetError.value = ''
    resetSuccess.value = ''
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      resetSuccess.value = 'Si existe una cuenta con ese email, recibiras un enlace de recuperacion.'
      return true
    } catch (err) {
      resetError.value = err.message
      return false
    } finally {
      resetLoading.value = false
    }
  }

  async function verifyResetToken(email, token) {
    try {
      const res = await fetch(`${API_URL}/auth/verify-reset-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token })
      })
      if (!res.ok) return { valid: false }
      return { valid: true }
    } catch {
      return { valid: false }
    }
  }

  async function resetAccountWithNewPassword(email, token, newPassword) {
    resetLoading.value = true
    resetError.value = ''
    resetSuccess.value = ''
    try {
      const newAuthKey = await deriveAuthKey(newPassword)
      const res = await fetch(`${API_URL}/auth/reset-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword: newAuthKey })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Reset failed')
      resetSuccess.value = 'Cuenta restablecida. Todos los datos anteriores han sido eliminados.'
      return true
    } catch (err) {
      resetError.value = err.message
      return false
    } finally {
      resetLoading.value = false
    }
  }

  async function authFetch(url, options = {}) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${accessToken.value}`,
      'Content-Type': 'application/json'
    }
    options.credentials = 'include'
    let response = await fetch(`${API_URL}${url}`, options)

    if (response.status === 401) {
      const data = await response.json()
      if (data.code === 'TOKEN_EXPIRED') {
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          options.headers['Authorization'] = `Bearer ${accessToken.value}`
          response = await fetch(`${API_URL}${url}`, options)
        } else {
          user.value = null
          accessToken.value = null
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
    resetLoading,
    resetError,
    resetSuccess,
    init,
    register,
    login,
    logout,
    changePassword,
    requestPasswordReset,
    verifyResetToken,
    resetAccountWithNewPassword,
    authFetch
  }
}

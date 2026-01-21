import { ref, computed, watch } from 'vue'

export function useCyberSecurity() {
  // ==========================================
  // ESTADO GENERAL
  // ==========================================
  const activeTab = ref('jwt')
  const themeColor = ref('#ef4444')
  const copied = ref(false)

  // ==========================================
  // JWT DEBUGGER
  // ==========================================
  const jwtInput = ref('')
  const jwtDecoded = ref(null)
  const jwtError = ref(null)
  const jwtSecret = ref('')

  const base64UrlDecode = (str) => {
    // Reemplazar caracteres URL-safe
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    // Añadir padding si es necesario
    const pad = base64.length % 4
    if (pad) {
      base64 += '='.repeat(4 - pad)
    }
    return atob(base64)
  }

  const decodeJwt = () => {
    jwtError.value = null
    jwtDecoded.value = null

    const token = jwtInput.value.trim()
    if (!token) {
      jwtError.value = 'Introduce un token JWT'
      return
    }

    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('El JWT debe tener 3 partes separadas por puntos')
      }

      const header = JSON.parse(base64UrlDecode(parts[0]))
      const payload = JSON.parse(base64UrlDecode(parts[1]))

      jwtDecoded.value = {
        header,
        payload,
        signature: parts[2]
      }
    } catch (e) {
      jwtError.value = `Error al decodificar: ${e.message}`
    }
  }

  const isExpired = computed(() => {
    if (!jwtDecoded.value?.payload?.exp) return null
    const expDate = new Date(jwtDecoded.value.payload.exp * 1000)
    return expDate < new Date()
  })

  const expirationDate = computed(() => {
    if (!jwtDecoded.value?.payload?.exp) return null
    return new Date(jwtDecoded.value.payload.exp * 1000).toLocaleString()
  })

  const issuedAtDate = computed(() => {
    if (!jwtDecoded.value?.payload?.iat) return null
    return new Date(jwtDecoded.value.payload.iat * 1000).toLocaleString()
  })

  // Verificación de firma (HMAC-SHA256)
  const verifySignature = async () => {
    if (!jwtDecoded.value || !jwtSecret.value) return null

    try {
      const token = jwtInput.value.trim()
      const parts = token.split('.')
      const data = `${parts[0]}.${parts[1]}`

      // Usar Web Crypto API
      const encoder = new TextEncoder()
      const keyData = encoder.encode(jwtSecret.value)
      const algorithm = { name: 'HMAC', hash: 'SHA-256' }

      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        algorithm,
        false,
        ['sign']
      )

      const signature = await crypto.subtle.sign(
        algorithm,
        key,
        encoder.encode(data)
      )

      // Convertir a base64url
      const signatureArray = new Uint8Array(signature)
      let binary = ''
      signatureArray.forEach(byte => binary += String.fromCharCode(byte))
      const base64 = btoa(binary)
      const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

      return base64url === parts[2]
    } catch {
      return null
    }
  }

  const signatureValid = ref(null)

  watch([jwtSecret, jwtDecoded], async () => {
    if (jwtSecret.value && jwtDecoded.value) {
      signatureValid.value = await verifySignature()
    } else {
      signatureValid.value = null
    }
  })

  const clearJwt = () => {
    jwtInput.value = ''
    jwtDecoded.value = null
    jwtError.value = null
    jwtSecret.value = ''
    signatureValid.value = null
  }

  // ==========================================
  // BASE64 ENCODER/DECODER
  // ==========================================
  const base64Input = ref('')
  const base64Output = ref('')
  const base64Mode = ref('encode')
  const base64Error = ref(null)

  const base64Process = () => {
    base64Error.value = null
    base64Output.value = ''

    if (!base64Input.value) {
      base64Error.value = 'Introduce texto para procesar'
      return
    }

    try {
      if (base64Mode.value === 'encode') {
        // Soportar UTF-8
        const utf8Bytes = new TextEncoder().encode(base64Input.value)
        let binary = ''
        utf8Bytes.forEach(byte => binary += String.fromCharCode(byte))
        base64Output.value = btoa(binary)
      } else {
        // Decodificar
        const binary = atob(base64Input.value)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }
        base64Output.value = new TextDecoder().decode(bytes)
      }
    } catch (e) {
      base64Error.value = `Error: ${e.message}`
    }
  }

  const handleFileUpload = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        // Obtener solo la parte base64 del data URL
        const dataUrl = e.target.result
        const base64 = dataUrl.split(',')[1]
        base64Input.value = base64
        base64Mode.value = 'decode'
        base64Output.value = `[Archivo binario: ${file.name}]`
        resolve(base64)
      }
      reader.readAsDataURL(file)
    })
  }

  const swapBase64 = () => {
    const temp = base64Input.value
    base64Input.value = base64Output.value
    base64Output.value = temp
    base64Mode.value = base64Mode.value === 'encode' ? 'decode' : 'encode'
  }

  const clearBase64 = () => {
    base64Input.value = ''
    base64Output.value = ''
    base64Error.value = null
  }

  // ==========================================
  // HASH GENERATOR
  // ==========================================
  const hashInput = ref('')
  const hashResults = ref({})
  const hashAlgorithm = ref('SHA-256')
  const hashLoading = ref(false)

  const algorithms = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512']

  const generateHash = async (algo) => {
    if (!hashInput.value) return ''

    // MD5 requiere implementación propia (no está en Web Crypto)
    if (algo === 'MD5') {
      return generateMD5(hashInput.value)
    }

    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(hashInput.value)
      const hashBuffer = await crypto.subtle.digest(algo, data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch {
      return 'Error'
    }
  }

  // Implementación simple de MD5
  const generateMD5 = (string) => {
    function md5cycle(x, k) {
      let a = x[0], b = x[1], c = x[2], d = x[3]
      a = ff(a, b, c, d, k[0], 7, -680876936)
      d = ff(d, a, b, c, k[1], 12, -389564586)
      c = ff(c, d, a, b, k[2], 17, 606105819)
      b = ff(b, c, d, a, k[3], 22, -1044525330)
      a = ff(a, b, c, d, k[4], 7, -176418897)
      d = ff(d, a, b, c, k[5], 12, 1200080426)
      c = ff(c, d, a, b, k[6], 17, -1473231341)
      b = ff(b, c, d, a, k[7], 22, -45705983)
      a = ff(a, b, c, d, k[8], 7, 1770035416)
      d = ff(d, a, b, c, k[9], 12, -1958414417)
      c = ff(c, d, a, b, k[10], 17, -42063)
      b = ff(b, c, d, a, k[11], 22, -1990404162)
      a = ff(a, b, c, d, k[12], 7, 1804603682)
      d = ff(d, a, b, c, k[13], 12, -40341101)
      c = ff(c, d, a, b, k[14], 17, -1502002290)
      b = ff(b, c, d, a, k[15], 22, 1236535329)
      a = gg(a, b, c, d, k[1], 5, -165796510)
      d = gg(d, a, b, c, k[6], 9, -1069501632)
      c = gg(c, d, a, b, k[11], 14, 643717713)
      b = gg(b, c, d, a, k[0], 20, -373897302)
      a = gg(a, b, c, d, k[5], 5, -701558691)
      d = gg(d, a, b, c, k[10], 9, 38016083)
      c = gg(c, d, a, b, k[15], 14, -660478335)
      b = gg(b, c, d, a, k[4], 20, -405537848)
      a = gg(a, b, c, d, k[9], 5, 568446438)
      d = gg(d, a, b, c, k[14], 9, -1019803690)
      c = gg(c, d, a, b, k[3], 14, -187363961)
      b = gg(b, c, d, a, k[8], 20, 1163531501)
      a = gg(a, b, c, d, k[13], 5, -1444681467)
      d = gg(d, a, b, c, k[2], 9, -51403784)
      c = gg(c, d, a, b, k[7], 14, 1735328473)
      b = gg(b, c, d, a, k[12], 20, -1926607734)
      a = hh(a, b, c, d, k[5], 4, -378558)
      d = hh(d, a, b, c, k[8], 11, -2022574463)
      c = hh(c, d, a, b, k[11], 16, 1839030562)
      b = hh(b, c, d, a, k[14], 23, -35309556)
      a = hh(a, b, c, d, k[1], 4, -1530992060)
      d = hh(d, a, b, c, k[4], 11, 1272893353)
      c = hh(c, d, a, b, k[7], 16, -155497632)
      b = hh(b, c, d, a, k[10], 23, -1094730640)
      a = hh(a, b, c, d, k[13], 4, 681279174)
      d = hh(d, a, b, c, k[0], 11, -358537222)
      c = hh(c, d, a, b, k[3], 16, -722521979)
      b = hh(b, c, d, a, k[6], 23, 76029189)
      a = hh(a, b, c, d, k[9], 4, -640364487)
      d = hh(d, a, b, c, k[12], 11, -421815835)
      c = hh(c, d, a, b, k[15], 16, 530742520)
      b = hh(b, c, d, a, k[2], 23, -995338651)
      a = ii(a, b, c, d, k[0], 6, -198630844)
      d = ii(d, a, b, c, k[7], 10, 1126891415)
      c = ii(c, d, a, b, k[14], 15, -1416354905)
      b = ii(b, c, d, a, k[5], 21, -57434055)
      a = ii(a, b, c, d, k[12], 6, 1700485571)
      d = ii(d, a, b, c, k[3], 10, -1894986606)
      c = ii(c, d, a, b, k[10], 15, -1051523)
      b = ii(b, c, d, a, k[1], 21, -2054922799)
      a = ii(a, b, c, d, k[8], 6, 1873313359)
      d = ii(d, a, b, c, k[15], 10, -30611744)
      c = ii(c, d, a, b, k[6], 15, -1560198380)
      b = ii(b, c, d, a, k[13], 21, 1309151649)
      a = ii(a, b, c, d, k[4], 6, -145523070)
      d = ii(d, a, b, c, k[11], 10, -1120210379)
      c = ii(c, d, a, b, k[2], 15, 718787259)
      b = ii(b, c, d, a, k[9], 21, -343485551)
      x[0] = add32(a, x[0])
      x[1] = add32(b, x[1])
      x[2] = add32(c, x[2])
      x[3] = add32(d, x[3])
    }

    function cmn(q, a, b, x, s, t) {
      a = add32(add32(a, q), add32(x, t))
      return add32((a << s) | (a >>> (32 - s)), b)
    }

    function ff(a, b, c, d, x, s, t) {
      return cmn((b & c) | ((~b) & d), a, b, x, s, t)
    }

    function gg(a, b, c, d, x, s, t) {
      return cmn((b & d) | (c & (~d)), a, b, x, s, t)
    }

    function hh(a, b, c, d, x, s, t) {
      return cmn(b ^ c ^ d, a, b, x, s, t)
    }

    function ii(a, b, c, d, x, s, t) {
      return cmn(c ^ (b | (~d)), a, b, x, s, t)
    }

    function md51(s) {
      const n = s.length
      let state = [1732584193, -271733879, -1732584194, 271733878]
      let i
      for (i = 64; i <= n; i += 64) {
        md5cycle(state, md5blk(s.substring(i - 64, i)))
      }
      s = s.substring(i - 64)
      const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      for (i = 0; i < s.length; i++) {
        tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3)
      }
      tail[i >> 2] |= 0x80 << ((i % 4) << 3)
      if (i > 55) {
        md5cycle(state, tail)
        for (i = 0; i < 16; i++) tail[i] = 0
      }
      tail[14] = n * 8
      md5cycle(state, tail)
      return state
    }

    function md5blk(s) {
      const md5blks = []
      for (let i = 0; i < 64; i += 4) {
        md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24)
      }
      return md5blks
    }

    const hex_chr = '0123456789abcdef'.split('')

    function rhex(n) {
      let s = ''
      for (let j = 0; j < 4; j++) {
        s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F]
      }
      return s
    }

    function hex(x) {
      return x.map(rhex).join('')
    }

    function add32(a, b) {
      return (a + b) & 0xFFFFFFFF
    }

    return hex(md51(string))
  }

  const generateAllHashes = async () => {
    if (!hashInput.value) {
      hashResults.value = {}
      return
    }

    hashLoading.value = true
    const results = {}

    for (const algo of algorithms) {
      results[algo] = await generateHash(algo)
    }

    hashResults.value = results
    hashLoading.value = false
  }

  const generateSingleHash = async () => {
    if (!hashInput.value) {
      hashResults.value = {}
      return
    }

    hashLoading.value = true
    hashResults.value[hashAlgorithm.value] = await generateHash(hashAlgorithm.value)
    hashLoading.value = false
  }

  const clearHash = () => {
    hashInput.value = ''
    hashResults.value = {}
  }

  // ==========================================
  // UTILIDADES
  // ==========================================
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      copied.value = true
      setTimeout(() => copied.value = false, 1500)
      return true
    } catch {
      return false
    }
  }

  const setThemeColor = (color) => {
    themeColor.value = color
  }

  return {
    // General
    activeTab,
    themeColor,
    copied,
    setThemeColor,
    copyToClipboard,

    // JWT
    jwtInput,
    jwtDecoded,
    jwtError,
    jwtSecret,
    isExpired,
    expirationDate,
    issuedAtDate,
    signatureValid,
    decodeJwt,
    clearJwt,

    // Base64
    base64Input,
    base64Output,
    base64Mode,
    base64Error,
    base64Process,
    handleFileUpload,
    swapBase64,
    clearBase64,

    // Hash
    hashInput,
    hashResults,
    hashAlgorithm,
    hashLoading,
    algorithms,
    generateAllHashes,
    generateSingleHash,
    clearHash
  }
}

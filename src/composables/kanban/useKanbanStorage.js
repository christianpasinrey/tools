import { ref } from 'vue'

const DB_NAME = 'todo-kanban-db'
const STORE_NAME = 'boards'

// Legacy decoding for migration
function rot13(str) {
  return str.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base)
  })
}

function decodeLegacy(encoded) {
  try {
    const decoded = rot13(decodeURIComponent(escape(atob(encoded))))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function useKanbanStorage(crypto) {
  const boards = ref([])
  const currentBoardId = ref(null)

  async function saveBoard(board) {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    // Deep clone to strip Vue reactive proxies
    const plainBoard = JSON.parse(JSON.stringify(board))
    let record
    if (crypto && crypto.hasKey()) {
      const encrypted = await crypto.encrypt(plainBoard)
      record = { id: plainBoard.id, encrypted: true, ...encrypted }
    } else {
      record = { id: plainBoard.id, data: JSON.stringify(plainBoard) }
    }

    store.put(record)
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => { db.close(); reject(tx.error) }
    })
  }

  async function loadBoard(boardId) {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(boardId)
      return new Promise(async (resolve) => {
        request.onsuccess = async () => {
          db.close()
          const result = request.result
          if (!result) { resolve(null); return }

          if (result.encrypted && crypto && crypto.hasKey()) {
            try {
              const decrypted = await crypto.decrypt(result.iv, result.ciphertext, result.salt)
              resolve(decrypted)
            } catch {
              resolve(null)
            }
          } else if (result.data) {
            try {
              resolve(JSON.parse(result.data))
            } catch {
              resolve(null)
            }
          } else {
            resolve(null)
          }
        }
        request.onerror = () => { db.close(); resolve(null) }
      })
    } catch {
      return null
    }
  }

  async function loadMeta() {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get('boards-meta')
      return new Promise((resolve) => {
        request.onsuccess = () => {
          db.close()
          if (request.result) {
            boards.value = request.result.boards || []
            resolve(request.result)
          } else {
            resolve(null)
          }
        }
        request.onerror = () => { db.close(); resolve(null) }
      })
    } catch {
      return null
    }
  }

  async function saveMeta(extraData = {}) {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(JSON.parse(JSON.stringify({
      id: 'boards-meta',
      boards: boards.value,
      ...extraData
    })))
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => { db.close(); reject(tx.error) }
    })
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  }

  async function createBoard(name) {
    const id = genId()
    const board = {
      id,
      name,
      createdAt: Date.now(),
      tags: [],
      columns: [
        { id: genId(), title: 'To Do', tasks: [] },
        { id: genId(), title: 'In Progress', tasks: [] },
        { id: genId(), title: 'Done', tasks: [] }
      ]
    }
    boards.value.push({ id, name, createdAt: board.createdAt })
    await saveMeta()
    await saveBoard(board)
    currentBoardId.value = id
    return board
  }

  async function deleteBoard(boardId) {
    boards.value = boards.value.filter(b => b.id !== boardId)
    await saveMeta()
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(boardId)
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => { db.close(); reject(tx.error) }
    })
  }

  async function renameBoard(boardId, newName) {
    const entry = boards.value.find(b => b.id === boardId)
    if (entry) {
      entry.name = newName
      await saveMeta()
    }
  }

  // Check if legacy data exists
  async function checkLegacy() {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get('default')
      return new Promise((resolve) => {
        request.onsuccess = () => {
          db.close()
          if (request.result && request.result.data) {
            const columns = decodeLegacy(request.result.data)
            resolve(columns && Array.isArray(columns) ? columns : null)
          } else {
            resolve(null)
          }
        }
        request.onerror = () => { db.close(); resolve(null) }
      })
    } catch {
      return null
    }
  }

  async function deleteLegacy() {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete('default')
    return new Promise(r => { tx.oncomplete = () => { db.close(); r() } })
  }

  async function migrateFromLegacy(columns) {
    const id = genId()
    const board = {
      id,
      name: 'Mi Tablero',
      createdAt: Date.now(),
      tags: [],
      columns
    }
    boards.value = [{ id, name: 'Mi Tablero', createdAt: board.createdAt }]
    await saveMeta()
    await saveBoard(board)
    await deleteLegacy()
    currentBoardId.value = id
    return board
  }

  return {
    boards,
    currentBoardId,
    loadMeta,
    loadBoard,
    saveBoard,
    saveMeta,
    createBoard,
    deleteBoard,
    renameBoard,
    checkLegacy,
    migrateFromLegacy,
    genId
  }
}

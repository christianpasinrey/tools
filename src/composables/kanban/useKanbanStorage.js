import { ref } from 'vue'

/**
 * In-memory board management for Kanban.
 * Persistence is handled exclusively by VaultSaveLoad (encrypted via useVault).
 */
export function useKanbanStorage() {
  const boards = ref([])
  const currentBoardId = ref(null)

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  }

  function createBoard(name) {
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
    currentBoardId.value = id
    return board
  }

  function deleteBoard(boardId) {
    boards.value = boards.value.filter(b => b.id !== boardId)
  }

  function renameBoard(boardId, newName) {
    const entry = boards.value.find(b => b.id === boardId)
    if (entry) entry.name = newName
  }

  return {
    boards,
    currentBoardId,
    createBoard,
    deleteBoard,
    renameBoard,
    genId
  }
}

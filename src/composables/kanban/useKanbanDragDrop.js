import { ref } from 'vue'

export function useKanbanDragDrop(columns) {
  const draggedTask = ref(null)
  const draggedFromColumn = ref(null)
  const dragOverColumn = ref(null)
  const dragOverIndex = ref(-1)
  const draggedColumn = ref(null)
  const dragOverColumnIndex = ref(-1)

  // Task drag
  function onTaskDragStart(e, task, columnId) {
    draggedTask.value = task
    draggedFromColumn.value = columnId
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task.id)
    e.target.classList.add('opacity-50')
  }

  function onTaskDragEnd(e) {
    e.target.classList.remove('opacity-50')
    draggedTask.value = null
    draggedFromColumn.value = null
    dragOverColumn.value = null
    dragOverIndex.value = -1
  }

  function onColumnDragOver(e, columnId, taskIndex) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    dragOverColumn.value = columnId
    dragOverIndex.value = taskIndex
  }

  function onColumnDrop(e, targetColumnId, dropIndex) {
    e.preventDefault()
    if (!draggedTask.value) return

    const sourceCol = columns.value.find(c => c.id === draggedFromColumn.value)
    const targetCol = columns.value.find(c => c.id === targetColumnId)
    if (!sourceCol || !targetCol) return

    const taskIdx = sourceCol.tasks.findIndex(t => t.id === draggedTask.value.id)
    if (taskIdx === -1) return

    const [task] = sourceCol.tasks.splice(taskIdx, 1)
    const insertAt = dropIndex >= 0 ? dropIndex : targetCol.tasks.length
    targetCol.tasks.splice(insertAt, 0, task)

    dragOverColumn.value = null
    dragOverIndex.value = -1
  }

  // Column drag
  function onColumnDragStart(e, index) {
    draggedColumn.value = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', 'column')
  }

  function onColumnDragOverHeader(e, index) {
    e.preventDefault()
    if (draggedColumn.value === null) return
    dragOverColumnIndex.value = index
  }

  function onColumnDropHeader(e, index) {
    e.preventDefault()
    if (draggedColumn.value === null || draggedColumn.value === index) return
    const [col] = columns.value.splice(draggedColumn.value, 1)
    columns.value.splice(index, 0, col)
    draggedColumn.value = null
    dragOverColumnIndex.value = -1
  }

  function onColumnDragEnd() {
    draggedColumn.value = null
    dragOverColumnIndex.value = -1
  }

  return {
    draggedTask,
    draggedFromColumn,
    dragOverColumn,
    dragOverIndex,
    draggedColumn,
    dragOverColumnIndex,
    onTaskDragStart,
    onTaskDragEnd,
    onColumnDragOver,
    onColumnDrop,
    onColumnDragStart,
    onColumnDragOverHeader,
    onColumnDropHeader,
    onColumnDragEnd
  }
}

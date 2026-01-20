import { ref, computed } from 'vue'

export function useSvgElements() {
  const elements = ref([])
  const selectedIds = ref([])
  const currentTool = ref('select')
  const themeColor = ref('#f97316') // orange-500

  // Available tools
  const tools = [
    { id: 'select', name: 'Select', icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122' },
    { id: 'rect', name: 'Rectangle', icon: 'M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z' },
    { id: 'ellipse', name: 'Ellipse', icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z' },
    { id: 'line', name: 'Line', icon: 'M4 20L20 4' },
    { id: 'polygon', name: 'Polygon', icon: 'M12 2l9 7-3.5 9h-11L3 9l9-7z' },
    { id: 'path', name: 'Pen', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { id: 'text', name: 'Text', icon: 'M4 6h16M8 6v12M16 6v12M6 18h4M14 18h4' }
  ]

  // Generate unique ID
  const generateId = () => {
    return 'el_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }

  // Get element count by type for naming
  const getNextName = (type) => {
    const count = elements.value.filter(el => el.type === type).length + 1
    const names = {
      rect: 'Rectangle',
      ellipse: 'Ellipse',
      line: 'Line',
      polygon: 'Polygon',
      path: 'Path',
      text: 'Text',
      group: 'Group'
    }
    return `${names[type] || 'Element'} ${count}`
  }

  // Create default element
  const createDefaultElement = (type) => {
    const base = {
      id: generateId(),
      type,
      name: getNextName(type),
      visible: true,
      locked: false,
      fill: '#3b82f6',
      stroke: '#1e40af',
      strokeWidth: 2,
      strokeDasharray: null,
      opacity: 1,
      rotation: 0
    }

    switch (type) {
      case 'rect':
        return { ...base, x: 0, y: 0, width: 100, height: 100, rx: 0 }
      case 'ellipse':
        return { ...base, cx: 50, cy: 50, rx: 50, ry: 50 }
      case 'line':
        return { ...base, x1: 0, y1: 0, x2: 100, y2: 100, fill: 'none' }
      case 'polygon':
        return { ...base, points: [] }
      case 'path':
        return { ...base, d: '', fill: 'none' }
      case 'text':
        return { ...base, x: 0, y: 0, text: 'Text', fontSize: 24, fontFamily: 'sans-serif', fill: '#000000', stroke: 'none', strokeWidth: 0, _boxX: 0, _boxY: 0, _boxWidth: 100, _boxHeight: 30 }
      default:
        return base
    }
  }

  // Add element
  const addElement = (element) => {
    elements.value.push(element)
    return element
  }

  // Create element at position
  const createElementAt = (type, x, y) => {
    const element = createDefaultElement(type)

    switch (type) {
      case 'rect':
        element.x = x
        element.y = y
        element.width = 0
        element.height = 0
        break
      case 'ellipse':
        element.cx = x
        element.cy = y
        element.rx = 0
        element.ry = 0
        break
      case 'line':
        element.x1 = x
        element.y1 = y
        element.x2 = x
        element.y2 = y
        break
      case 'text':
        element.x = x
        element.y = y
        break
    }

    return addElement(element)
  }

  // Update element
  const updateElement = (id, updates) => {
    const index = elements.value.findIndex(el => el.id === id)
    if (index !== -1) {
      // Create new array to ensure Vue reactivity triggers
      elements.value = elements.value.map(el =>
        el.id === id ? { ...el, ...updates } : el
      )
    }
  }

  // Delete elements
  const deleteElements = (ids) => {
    elements.value = elements.value.filter(el => !ids.includes(el.id))
    selectedIds.value = selectedIds.value.filter(id => !ids.includes(id))
  }

  // Delete selected
  const deleteSelected = () => {
    deleteElements([...selectedIds.value])
  }

  // Selection
  const selectElement = (id, addToSelection = false) => {
    // Deselect all if id is null/undefined
    if (!id) {
      selectedIds.value = []
      return
    }

    if (addToSelection) {
      if (selectedIds.value.includes(id)) {
        selectedIds.value = selectedIds.value.filter(sId => sId !== id)
      } else {
        selectedIds.value = [...selectedIds.value, id]
      }
    } else {
      selectedIds.value = [id]
    }
  }

  const selectAll = () => {
    selectedIds.value = elements.value.filter(el => !el.locked).map(el => el.id)
  }

  const deselectAll = () => {
    selectedIds.value = []
  }

  // Selected elements computed
  const selectedElements = computed(() => {
    return elements.value.filter(el => selectedIds.value.includes(el.id))
  })

  const hasSelection = computed(() => selectedIds.value.length > 0)

  // Z-index operations
  const bringToFront = (id) => {
    const index = elements.value.findIndex(el => el.id === id)
    if (index > -1 && index < elements.value.length - 1) {
      const [element] = elements.value.splice(index, 1)
      elements.value.push(element)
    }
  }

  const sendToBack = (id) => {
    const index = elements.value.findIndex(el => el.id === id)
    if (index > 0) {
      const [element] = elements.value.splice(index, 1)
      elements.value.unshift(element)
    }
  }

  const moveUp = (id) => {
    const index = elements.value.findIndex(el => el.id === id)
    if (index > -1 && index < elements.value.length - 1) {
      const temp = elements.value[index]
      elements.value[index] = elements.value[index + 1]
      elements.value[index + 1] = temp
    }
  }

  const moveDown = (id) => {
    const index = elements.value.findIndex(el => el.id === id)
    if (index > 0) {
      const temp = elements.value[index]
      elements.value[index] = elements.value[index - 1]
      elements.value[index - 1] = temp
    }
  }

  // Duplicate
  const duplicateElements = (ids) => {
    const newElements = []
    ids.forEach(id => {
      const original = elements.value.find(el => el.id === id)
      if (original) {
        const duplicate = {
          ...JSON.parse(JSON.stringify(original)),
          id: generateId(),
          name: original.name + ' copy'
        }
        // Offset position
        if ('x' in duplicate) duplicate.x += 20
        if ('y' in duplicate) duplicate.y += 20
        if ('cx' in duplicate) duplicate.cx += 20
        if ('cy' in duplicate) duplicate.cy += 20
        if ('x1' in duplicate) { duplicate.x1 += 20; duplicate.x2 += 20 }
        if ('y1' in duplicate) { duplicate.y1 += 20; duplicate.y2 += 20 }

        newElements.push(duplicate)
        elements.value.push(duplicate)
      }
    })
    selectedIds.value = newElements.map(el => el.id)
    return newElements
  }

  const duplicateSelected = () => {
    return duplicateElements([...selectedIds.value])
  }

  // Toggle visibility
  const toggleVisibility = (id) => {
    const element = elements.value.find(el => el.id === id)
    if (element) {
      element.visible = !element.visible
    }
  }

  // Toggle lock
  const toggleLock = (id) => {
    const element = elements.value.find(el => el.id === id)
    if (element) {
      element.locked = !element.locked
      if (element.locked) {
        selectedIds.value = selectedIds.value.filter(sId => sId !== id)
      }
    }
  }

  // Get element by ID
  const getElementById = (id) => {
    return elements.value.find(el => el.id === id)
  }

  // Reorder elements (for drag and drop in layers)
  const reorderElements = (fromIndex, toIndex) => {
    const [element] = elements.value.splice(fromIndex, 1)
    elements.value.splice(toIndex, 0, element)
  }

  // Clear all
  const clearAll = () => {
    elements.value = []
    selectedIds.value = []
  }

  return {
    // State
    elements,
    selectedIds,
    currentTool,
    themeColor,
    tools,

    // Computed
    selectedElements,
    hasSelection,

    // Methods
    generateId,
    createDefaultElement,
    addElement,
    createElementAt,
    updateElement,
    deleteElements,
    deleteSelected,
    selectElement,
    selectAll,
    deselectAll,
    bringToFront,
    sendToBack,
    moveUp,
    moveDown,
    duplicateElements,
    duplicateSelected,
    toggleVisibility,
    toggleLock,
    getElementById,
    reorderElements,
    clearAll
  }
}

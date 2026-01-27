import { ref, onMounted, onBeforeUnmount } from 'vue'
import { SuperDoc } from '@harbour-enterprises/superdoc'
import '@harbour-enterprises/superdoc/style.css'

// Toolbar configuration
const createToolbarConfig = () => ({
  groups: {
    left: [
      'undo', 'redo',
      'separator',
      'fontFamily', 'fontSize',
      'separator',
      'bold', 'italic', 'underline', 'strikethrough',
      'separator',
      'color', 'highlight'
    ],
    center: [
      'alignLeft', 'alignCenter', 'alignRight', 'justify',
      'separator',
      'list', 'numberedlist',
      'separator',
      'indentleft', 'indentright',
      'separator',
      'link', 'image'
    ],
    right: [
      'search',
      'separator',
      'ruler',
      'zoom'
    ]
  },
  customButtons: [
    {
      type: 'dropdown',
      name: 'insertTable',
      tooltip: 'Insertar tabla',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>',
      group: 'center',
      options: [
        { label: '2x2', key: '2x2' },
        { label: '3x3', key: '3x3' },
        { label: '4x4', key: '4x4' },
        { label: '5x5', key: '5x5' }
      ],
      command: ({ option, superdoc }) => {
        const editor = superdoc?.activeEditor
        if (editor && option) {
          const [rows, cols] = option.key.split('x').map(Number)
          editor.commands.insertTable({ rows, cols, withHeaderRow: true })
        }
      }
    }
  ]
})

export function useDocxEditor() {
  const editorContainerRef = ref(null)
  const toolbarRef = ref(null)
  let superdoc = null

  const isReady = ref(false)
  const currentFileName = ref('documento.docx')
  const documentMode = ref('editing')
  const zoom = ref(100)
  const isModified = ref(false)

  const createSuperdoc = (file = null) => {
    if (!editorContainerRef.value) return null

    const config = {
      selector: editorContainerRef.value,
      toolbar: toolbarRef.value,
      documentMode: documentMode.value,
      role: 'editor',
      pagination: true,
      rulers: false,
      modules: {
        toolbar: createToolbarConfig()
      },
      onReady: () => {
        isReady.value = true
      },
      onEditorUpdate: () => {
        isModified.value = true
      }
    }

    if (file) {
      config.document = file
    }

    return new SuperDoc(config)
  }

  const init = () => {
    superdoc = createSuperdoc()
  }

  const destroy = () => {
    superdoc?.destroy()
    superdoc = null
  }

  const loadFile = (file) => {
    if (!file || !file.name.match(/\.docx?$/i)) return false

    currentFileName.value = file.name
    isReady.value = false
    isModified.value = false
    destroy()
    superdoc = createSuperdoc(file)
    return true
  }

  const newDocument = () => {
    isReady.value = false
    isModified.value = false
    destroy()
    superdoc = createSuperdoc()
    currentFileName.value = 'documento.docx'
  }

  const exportDocument = async () => {
    if (!superdoc) return null

    const blob = await superdoc.export({
      isFinalDoc: true,
      commentsType: 'clean'
    })
    return blob
  }

  const downloadDocument = async () => {
    const blob = await exportDocument()
    if (!blob) return

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = currentFileName.value
    a.click()
    URL.revokeObjectURL(url)
  }

  const setDocumentMode = (mode) => {
    documentMode.value = mode
    superdoc?.setDocumentMode(mode)
  }

  const adjustZoom = (delta) => {
    zoom.value = Math.min(200, Math.max(50, zoom.value + delta))
  }

  const setZoom = (value) => {
    zoom.value = Math.min(200, Math.max(50, value))
  }

  // Vault serialization
  const serialize = async () => {
    const blob = await exportDocument()
    if (!blob) return null

    const arrayBuffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return {
      content: btoa(binary),
      fileName: currentFileName.value
    }
  }

  const deserialize = async (data) => {
    if (!data?.content) return false

    const binary = atob(data.content)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })
    const file = new File([blob], data.fileName || 'documento.docx', { type: blob.type })

    return loadFile(file)
  }

  const getActiveEditor = () => superdoc?.activeEditor

  return {
    // Refs
    editorContainerRef,
    toolbarRef,

    // State
    isReady,
    currentFileName,
    documentMode,
    zoom,
    isModified,

    // Methods
    init,
    destroy,
    loadFile,
    newDocument,
    exportDocument,
    downloadDocument,
    setDocumentMode,
    adjustZoom,
    setZoom,
    serialize,
    deserialize,
    getActiveEditor
  }
}

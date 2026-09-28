// Acciones del editor de PDF que piden confirmación antes de actuar.
// `confirm(opts)` devuelve una promesa que resuelve true solo si el usuario acepta.

const plural = (n, one, many) => (n === 1 ? one : many)

export async function requestDeletePages(editor, confirm) {
  const count = editor.selectedPages.value.size
  if (count === 0) return
  const ok = await confirm({
    title: 'Eliminar páginas',
    message: `¿Eliminar ${count} ${plural(count, 'página seleccionada', 'páginas seleccionadas')}? Esta acción se puede deshacer.`,
    confirmLabel: 'Eliminar',
    tone: 'danger'
  })
  if (ok) await editor.deleteSelected()
}

export async function requestClose(editor, confirm) {
  const ok = await confirm({
    title: 'Cerrar documento',
    message: '¿Cerrar el documento actual? Se perderán los cambios no guardados.',
    confirmLabel: 'Cerrar',
    tone: 'warning'
  })
  if (!ok) return
  editor.clearFile()
  editor.clearHistory()
}

export async function requestSplitAll(editor, confirm) {
  const ok = await confirm({
    title: 'Dividir PDF',
    message: `Se descargarán ${editor.pageCount.value} archivos PDF individuales. ¿Continuar?`,
    confirmLabel: 'Dividir',
    tone: 'info'
  })
  if (ok) await editor.splitAll()
}

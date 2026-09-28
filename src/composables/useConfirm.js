import { ref } from 'vue'

const request = ref(null)

/** Pide confirmación con el diálogo propio de la app. Resuelve true/false. */
export function confirmAction(options) {
  if (request.value) request.value.resolve(false)
  return new Promise((resolve) => {
    request.value = { confirmLabel: 'Aceptar', cancelLabel: 'Cancelar', tone: 'default', ...options, resolve }
  })
}

export function useConfirmState() {
  const settle = (value) => {
    const r = request.value
    request.value = null
    r?.resolve(value)
  }
  return { request, settle }
}

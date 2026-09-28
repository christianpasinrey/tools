// SuperDoc marca su área editable como role="document" con aria-multiline,
// atributo que ese rol no admite, y la etiqueta en inglés. Un área de texto
// editable es un textbox multilínea.
export function fixSuperdocA11y(root = document) {
  root.querySelectorAll('.ProseMirror[contenteditable]').forEach((el) => {
    el.setAttribute('role', 'textbox')
    el.setAttribute('aria-label', 'Documento')
    if (!el.getAttribute('aria-description')) el.removeAttribute('aria-description')
  })
}

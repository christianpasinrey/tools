import { fixSuperdocA11y } from '@/lib/superdocA11y'

it('el área editable de SuperDoc pasa a textbox con etiqueta en español', () => {
  document.body.innerHTML = '<div class="ProseMirror" contenteditable="true" role="document" aria-multiline="true" aria-label="Main content area" aria-description=""></div>'
  fixSuperdocA11y()
  const el = document.querySelector('.ProseMirror')
  expect(el.getAttribute('role')).toBe('textbox')
  expect(el.getAttribute('aria-label')).toBe('Documento')
  expect(el.hasAttribute('aria-description')).toBe(false)
})

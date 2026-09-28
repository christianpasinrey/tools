import { mount, flushPromises } from '@vue/test-utils'
import TbConfirmHost from '@/components/ui/TbConfirmHost.vue'
import { confirmAction } from '@/composables/useConfirm'

describe('confirmAction', () => {
  it('resuelve true al aceptar y false con Esc', async () => {
    const w = mount(TbConfirmHost, { attachTo: document.body })
    const p1 = confirmAction({ title: '¿Borrar todo?', confirmLabel: 'Borrar', tone: 'danger' })
    await flushPromises()
    expect(document.body.textContent).toContain('¿Borrar todo?')
    ;[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Borrar').click()
    expect(await p1).toBe(true)

    const p2 = confirmAction({ title: 'Otra' })
    await flushPromises()
    document.querySelector('[role="alertdialog"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(await p2).toBe(false)
    w.unmount()
  })
})

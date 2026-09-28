import { mount } from '@vue/test-utils'
import TbEmptyState from '@/components/ui/TbEmptyState.vue'
import TbPanel from '@/components/ui/TbPanel.vue'
import TbProgress from '@/components/ui/TbProgress.vue'

const dragEvent = (type, files = [], types = ['Files']) => {
  const e = new Event(type, { bubbles: true, cancelable: true })
  e.dataTransfer = { types, files }
  return e
}

describe('TbEmptyState', () => {
  it('emite los archivos soltados y resalta al arrastrar', async () => {
    const w = mount(TbEmptyState, { props: { icon: 'file', title: 'Suelta un PDF', accept: '.pdf' } })
    w.element.dispatchEvent(dragEvent('dragenter')); await w.vm.$nextTick()
    expect(w.classes()).toContain('is-dragging')
    const f = new File(['x'], 'a.pdf')
    w.element.dispatchEvent(dragEvent('drop', [f])); await w.vm.$nextTick()
    expect(w.emitted('files')[0][0]).toEqual([f])
    expect(w.classes()).not.toContain('is-dragging')
  })
  it('ignora arrastres sin archivos', async () => {
    const w = mount(TbEmptyState, { props: { icon: 'file', title: 'x' } })
    w.element.dispatchEvent(dragEvent('dragenter', [], ['text/plain'])); await w.vm.$nextTick()
    expect(w.classes()).not.toContain('is-dragging')
  })
  it('el botón abre el selector', async () => {
    const w = mount(TbEmptyState, { props: { icon: 'file', title: 'x' } })
    const click = vi.spyOn(w.find('input[type="file"]').element, 'click')
    await w.find('button').trigger('click')
    expect(click).toHaveBeenCalled()
  })
})

describe('TbPanel', () => {
  it('plegable', async () => {
    const w = mount(TbPanel, { props: { title: 'Páginas', collapsible: true }, slots: { default: '<p class="body">x</p>' } })
    expect(w.find('.body').exists()).toBe(true)
    await w.find('button[aria-expanded]').trigger('click')
    expect(w.find('.body').exists()).toBe(false)
  })
})

describe('TbProgress', () => {
  it('determinado e indeterminado', () => {
    expect(mount(TbProgress, { props: { value: 40, label: 'Procesando' } }).find('[role="progressbar"]').attributes('aria-valuenow')).toBe('40')
    expect(mount(TbProgress, { props: { value: null, label: 'Procesando' } }).find('[role="progressbar"]').attributes('aria-valuenow')).toBeUndefined()
  })
})

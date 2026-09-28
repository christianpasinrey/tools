import { mount } from '@vue/test-utils'
import TbSegmented from '@/components/ui/TbSegmented.vue'

const options = [{ value: 'a', label: 'Uno' }, { value: 'b', label: 'Dos' }, { value: 'c', label: 'Tres' }]

describe('TbSegmented', () => {
  it('marca la opción activa y emite al pulsar otra', async () => {
    const w = mount(TbSegmented, { props: { modelValue: 'a', options, label: 'Modo' } })
    const radios = w.findAll('[role="radio"]')
    expect(w.find('[role="radiogroup"]').attributes('aria-label')).toBe('Modo')
    expect(radios[0].attributes('aria-checked')).toBe('true')
    await radios[2].trigger('click')
    expect(w.emitted('update:modelValue')[0]).toEqual(['c'])
  })
  it('flechas mueven la selección', async () => {
    const w = mount(TbSegmented, { props: { modelValue: 'b', options, label: 'Modo' } })
    await w.findAll('[role="radio"]')[1].trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')[0]).toEqual(['c'])
    await w.findAll('[role="radio"]')[1].trigger('keydown', { key: 'ArrowLeft' })
    expect(w.emitted('update:modelValue')[1]).toEqual(['a'])
  })
})

describe('TbSegmented — foco con flechas', () => {
  it('las flechas avanzan varias posiciones y mueven el foco', async () => {
    const opts = [{ value: 'a', label: 'Uno' }, { value: 'b', label: 'Dos' }, { value: 'c', label: 'Tres' }]
    const w = mount(TbSegmented, { attachTo: document.body, props: { modelValue: 'a', options: opts, label: 'Modo', 'onUpdate:modelValue': (v) => w.setProps({ modelValue: v }) } })
    w.findAll('[role="radio"]')[0].element.focus()
    await w.findAll('[role="radio"]')[0].trigger('keydown', { key: 'ArrowRight' })
    await new Promise(r => setTimeout(r))
    expect(document.activeElement.textContent).toContain('Dos')
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await new Promise(r => setTimeout(r))
    expect(w.props('modelValue')).toBe('c')
    expect(document.activeElement.textContent).toContain('Tres')
    w.unmount()
  })
})

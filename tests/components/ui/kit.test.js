import { mount } from '@vue/test-utils'
import TbButton from '@/components/ui/TbButton.vue'
import TbIconButton from '@/components/ui/TbIconButton.vue'
import TbToolbar from '@/components/ui/TbToolbar.vue'
import TbToolbarGroup from '@/components/ui/TbToolbarGroup.vue'
import TbInput from '@/components/ui/TbInput.vue'
import TbMenu from '@/components/ui/TbMenu.vue'

describe('kit', () => {
  it('TbButton: variante, deshabilitado mientras carga', () => {
    const w = mount(TbButton, { props: { variant: 'primary', loading: true }, slots: { default: 'Guardar' } })
    expect(w.classes()).toContain('tb-btn-primary')
    expect(w.attributes('disabled')).toBeDefined()
    expect(w.attributes('aria-busy')).toBe('true')
  })
  it('TbIconButton: etiqueta accesible y estado activo', () => {
    const w = mount(TbIconButton, { props: { label: 'Negrita', icon: 'bold', active: true } })
    expect(w.attributes('aria-label')).toBe('Negrita')
    expect(w.attributes('title')).toBe('Negrita')
    expect(w.attributes('aria-pressed')).toBe('true')
  })
  it('TbIconButton sin active no declara aria-pressed', () => {
    const w = mount(TbIconButton, { props: { label: 'Abrir', icon: 'folder' } })
    expect(w.attributes('aria-pressed')).toBeUndefined()
  })
  it('TbToolbar y grupos con roles', () => {
    const w = mount(TbToolbar, { props: { label: 'Formato' }, slots: { default: { components: { TbToolbarGroup }, template: '<TbToolbarGroup label="Texto"><button>B</button></TbToolbarGroup>' } } })
    expect(w.attributes('role')).toBe('toolbar')
    expect(w.find('[role="group"]').attributes('aria-label')).toBe('Texto')
  })
  it('TbInput con v-model', async () => {
    const w = mount(TbInput, { props: { modelValue: 'a', 'onUpdate:modelValue': (v) => w.setProps({ modelValue: v }), placeholder: 'Buscar' } })
    await w.find('input').setValue('hola')
    expect(w.props('modelValue')).toBe('hola')
    expect(w.find('input').attributes('placeholder')).toBe('Buscar')
  })
  it('TbMenu: abre, ejecuta la acción y se cierra', async () => {
    const action = vi.fn()
    const w = mount(TbMenu, { props: { label: 'Exportar', items: [{ label: 'Markdown', action }, { label: 'HTML', action: vi.fn() }] }, attachTo: document.body })
    await w.find('button[aria-haspopup="menu"]').trigger('click')
    const items = w.findAll('[role="menuitem"]')
    expect(items).toHaveLength(2)
    await items[0].trigger('click')
    expect(action).toHaveBeenCalled()
    expect(w.find('[role="menu"]').exists()).toBe(false)
    w.unmount()
  })
})

describe('TbMenu — teclado', () => {
  it('Escape cierra y devuelve el foco al botón', async () => {
    const w = mount(TbMenu, { props: { label: 'Exportar', items: [{ label: 'Markdown', action: vi.fn() }] }, attachTo: document.body })
    const trigger = w.find('button[aria-haspopup="menu"]')
    await trigger.trigger('click')
    await new Promise(r => setTimeout(r))
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await new Promise(r => setTimeout(r))
    expect(w.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
    w.unmount()
  })
})

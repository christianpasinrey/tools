import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useTypewriter } from '@/composables/useTypewriter'

function withTypewriter(phrases, opts) {
  let api
  mount(defineComponent({ setup() { api = useTypewriter(phrases, opts); return () => h('div') } }))
  return api
}

describe('useTypewriter', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => { vi.useRealTimers(); window.matchMedia = undefined })

  it('escribe, borra y pasa a la siguiente frase', () => {
    const t = withTypewriter(['ab', 'cd'], { typeMs: 10, holdMs: 50, eraseMs: 10 })
    t.start()
    vi.advanceTimersByTime(10); expect(t.text.value).toBe('a')
    vi.advanceTimersByTime(10); expect(t.text.value).toBe('ab')
    vi.advanceTimersByTime(50 + 10 + 10); expect(t.text.value).toBe('')
    vi.advanceTimersByTime(300); expect(t.text.value).toBe('c')
  })

  it('stop deja la frase completa', () => {
    const t = withTypewriter(['hola'], { typeMs: 10 })
    t.start(); vi.advanceTimersByTime(20); t.stop()
    expect(t.text.value).toBe('hola')
  })

  it('con movimiento reducido no anima', () => {
    window.matchMedia = () => ({ matches: true })
    const t = withTypewriter(['hola'])
    t.start(); vi.advanceTimersByTime(1000)
    expect(t.text.value).toBe('hola')
  })
})

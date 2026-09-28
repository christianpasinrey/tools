import { matchFile, fileExtension } from '@/lib/fileMatch'

const ids = (f) => matchFile(f).map(e => e.id)

describe('fileMatch', () => {
  it('extensión', () => {
    expect(fileExtension('Informe.Final.PDF')).toBe('.pdf')
    expect(fileExtension('README')).toBe('')
  })
  it('PDF por extensión: editor y conversores, primero los que reciben el archivo', () => {
    const res = matchFile({ name: 'a.pdf', type: '' })
    expect(res.map(e => e.id)).toEqual(expect.arrayContaining(['pdf-editor', 'pdf-to-jpg', 'pdf-to-word', 'pdf-to-excel']))
    expect(res.every((e, i, arr) => i === 0 || !!arr[i - 1].launch >= !!e.launch)).toBe(true)
  })
  it('PDF solo por MIME', () => {
    expect(ids({ name: 'blob', type: 'application/pdf' })).toContain('pdf-editor')
  })
  it('comodín image/*', () => {
    expect(ids({ name: 'x.png', type: 'image/png' })).toEqual(expect.arrayContaining(['image-editor', 'jpg-to-pdf']))
    expect(ids({ name: 'x.webp', type: 'image/webp' })).toContain('image-editor')
  })
  it('audio', () => {
    expect(ids({ name: 'x.mp3', type: 'audio/mpeg' })).toEqual(['audio-editor'])
  })
  it('desconocido → []', () => {
    expect(ids({ name: 'x.xyz', type: 'application/octet-stream' })).toEqual([])
  })
})

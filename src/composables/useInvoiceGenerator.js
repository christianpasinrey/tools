import { ref, computed, onMounted } from 'vue'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { useVault } from './useVault'

const VAULT_STORE = 'invoice-configs'

const RECARGO_MAP = { 21: 5.2, 10: 1.4, 4: 0.5, 0: 0 }

const MONEDAS = ['EUR', 'USD', 'GBP']
const MONEDA_SIMBOLO = { EUR: '\u20AC', USD: '$', GBP: '\u00A3' }

const MENCIONES_ESPECIALES = {
  ninguna: '',
  exenta: 'Operaci\u00F3n exenta de IVA (art. 20 LIVA)',
  noSujeta: 'Operaci\u00F3n no sujeta (arts. 69-70 LIVA)',
  inversionSP: 'Inversi\u00F3n del sujeto pasivo (art. 84.Uno.2\u00BA LIVA)',
  criterioCaja: 'R\u00E9gimen especial del criterio de caja'
}

function createEmptyInvoice() {
  return {
    emisor: { nombre: '', nif: '', direccion: '', ciudad: '', cp: '', telefono: '', email: '', registroProfesional: '', logo: null },
    cliente: { nombre: '', nif: '', direccion: '', ciudad: '', cp: '' },
    numero: '',
    fecha: new Date().toISOString().slice(0, 10),
    conVencimiento: false,
    fechaVencimiento: '',
    conFechaOperacion: false,
    fechaOperacion: '',
    moneda: 'EUR',
    desglosarIva: true,
    aplicarRecargo: false,
    mencionEspecial: 'ninguna',
    lineas: [{ concepto: '', cantidad: 1, precioUnitario: 0, descuento: 0, iva: 21 }],
    aplicarIrpf: false,
    irpfPorcentaje: 15,
    notas: '',
    formaPago: 'Transferencia',
    datosBancarios: ''
  }
}

export function useInvoiceGenerator() {
  const invoice = ref(createEmptyInvoice())
  const emisorSaved = ref(false)
  const vault = useVault()

  // === Persistence (vault-based) ===
  const showConfigModal = ref(false)
  const configName = ref('')
  const configError = ref('')
  const savedConfigs = ref([])
  const selectedConfigId = ref('')

  function getConfigData() {
    const inv = invoice.value
    return {
      emisor: { ...inv.emisor },
      moneda: inv.moneda,
      desglosarIva: inv.desglosarIva,
      aplicarRecargo: inv.aplicarRecargo,
      mencionEspecial: inv.mencionEspecial,
      aplicarIrpf: inv.aplicarIrpf,
      irpfPorcentaje: inv.irpfPorcentaje,
      formaPago: inv.formaPago,
      datosBancarios: inv.datosBancarios
    }
  }

  function applyConfig(config) {
    if (config.emisor) invoice.value.emisor = { ...invoice.value.emisor, ...config.emisor }
    if (config.moneda) invoice.value.moneda = config.moneda
    if (config.desglosarIva !== undefined) invoice.value.desglosarIva = config.desglosarIva
    if (config.aplicarRecargo !== undefined) invoice.value.aplicarRecargo = config.aplicarRecargo
    if (config.mencionEspecial) invoice.value.mencionEspecial = config.mencionEspecial
    if (config.aplicarIrpf !== undefined) invoice.value.aplicarIrpf = config.aplicarIrpf
    if (config.irpfPorcentaje) invoice.value.irpfPorcentaje = config.irpfPorcentaje
    if (config.formaPago) invoice.value.formaPago = config.formaPago
    if (config.datosBancarios !== undefined) invoice.value.datosBancarios = config.datosBancarios
  }

  async function loadConfigList() {
    if (vault.isLocked.value) return
    try {
      savedConfigs.value = await vault.list(VAULT_STORE)
    } catch { savedConfigs.value = [] }
  }

  async function saveConfigToList(name) {
    try {
      const config = getConfigData()
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      await vault.save(VAULT_STORE, id, name, config)
      savedConfigs.value = await vault.list(VAULT_STORE)
      emisorSaved.value = true
      setTimeout(() => emisorSaved.value = false, 2000)
      return true
    } catch {
      configError.value = 'Error al guardar'
      setTimeout(() => configError.value = '', 3000)
      return false
    }
  }

  async function loadConfigById(id) {
    try {
      const config = await vault.load(VAULT_STORE, id)
      if (!config) return false
      applyConfig(config)
      configError.value = ''
      return true
    } catch {
      configError.value = 'Error al descifrar. Verifica que la clave sea correcta.'
      setTimeout(() => configError.value = '', 3000)
      return false
    }
  }

  async function deleteConfigById(id) {
    try {
      await vault.remove(VAULT_STORE, id)
      savedConfigs.value = await vault.list(VAULT_STORE)
      if (selectedConfigId.value === id) selectedConfigId.value = ''
      return true
    } catch { return false }
  }

  function promptSaveConfig() {
    configName.value = ''
    configError.value = ''
    showConfigModal.value = true
  }

  async function confirmSave() {
    if (!configName.value.trim()) {
      configError.value = 'Introduce un nombre para la configuración'
      return
    }
    const ok = await saveConfigToList(configName.value.trim())
    if (ok) {
      showConfigModal.value = false
      configName.value = ''
    }
  }

  async function selectConfig(id) {
    selectedConfigId.value = id
    const ok = await loadConfigById(id)
    if (!ok) {
      selectedConfigId.value = ''
    }
  }

  function dismissConfigModal() {
    showConfigModal.value = false
    configName.value = ''
    configError.value = ''
  }

  onMounted(loadConfigList)

  // === Line Management ===
  function addLinea() {
    invoice.value.lineas.push({ concepto: '', cantidad: 1, precioUnitario: 0, descuento: 0, iva: 21 })
  }

  function removeLinea(index) {
    if (invoice.value.lineas.length > 1) {
      invoice.value.lineas.splice(index, 1)
    }
  }

  // === Totals ===
  const totales = computed(() => {
    const lineas = invoice.value.lineas
    const fuerzaSinIva = ['inversionSP', 'noSujeta'].includes(invoice.value.mencionEspecial)
    let subtotal = 0
    const desgloseMap = {}

    for (const l of lineas) {
      const base = l.cantidad * l.precioUnitario * (1 - (l.descuento || 0) / 100)
      subtotal += base

      const tipoIva = fuerzaSinIva ? 0 : (l.iva || 0)
      const tipoRecargo = invoice.value.aplicarRecargo ? (RECARGO_MAP[tipoIva] || 0) : 0
      const key = tipoIva + '-' + tipoRecargo

      if (!desgloseMap[key]) {
        desgloseMap[key] = { tipoIva, base: 0, cuotaIva: 0, tipoRecargo, cuotaRecargo: 0 }
      }
      const entry = desgloseMap[key]
      entry.base += base
      entry.cuotaIva += base * tipoIva / 100
      entry.cuotaRecargo += base * tipoRecargo / 100
    }

    const desglose = Object.values(desgloseMap).filter(d => d.base > 0)
    const totalIva = desglose.reduce((s, d) => s + d.cuotaIva, 0)
    const totalRecargo = desglose.reduce((s, d) => s + d.cuotaRecargo, 0)

    const baseIrpf = subtotal
    const cuotaIrpf = invoice.value.aplicarIrpf ? baseIrpf * invoice.value.irpfPorcentaje / 100 : 0

    const total = subtotal + totalIva + totalRecargo - cuotaIrpf

    return { subtotal, desglose, totalIva, totalRecargo, baseIrpf, cuotaIrpf, total }
  })

  // === Logo ===
  const MAX_LOGO_KB = 512
  const logoError = ref('')

  function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_LOGO_KB * 1024) {
      logoError.value = `El logo no puede superar ${MAX_LOGO_KB} KB (actual: ${Math.round(file.size / 1024)} KB)`
      setTimeout(() => logoError.value = '', 4000)
      return
    }
    logoError.value = ''
    const reader = new FileReader()
    reader.onload = () => { invoice.value.emisor.logo = reader.result }
    reader.readAsDataURL(file)
  }

  function removeLogo() {
    invoice.value.emisor.logo = null
  }

  // === Reset ===
  function resetInvoice() {
    const emisor = { ...invoice.value.emisor }
    Object.assign(invoice.value, createEmptyInvoice())
    invoice.value.emisor = emisor
  }

  // === Demo Data ===
  function fillDemo() {
    invoice.value.emisor = {
      nombre: 'Desarrollo Web Martínez S.L.',
      nif: 'B12345678',
      direccion: 'Calle Gran Vía 42, 3ºA',
      ciudad: 'Madrid',
      cp: '28013',
      telefono: '+34 612 345 678',
      email: 'contacto@dwmartinez.es',
      registroProfesional: '',
      logo: null
    }
    invoice.value.cliente = {
      nombre: 'Soluciones Digitales García S.A.',
      nif: 'A87654321',
      direccion: 'Avda. Diagonal 211, Planta 5',
      ciudad: 'Barcelona',
      cp: '08018'
    }
    invoice.value.numero = 'FAC-2026-003'
    invoice.value.fecha = '2026-01-22'
    invoice.value.conVencimiento = true
    invoice.value.fechaVencimiento = '2026-02-22'
    invoice.value.conFechaOperacion = false
    invoice.value.fechaOperacion = ''
    invoice.value.moneda = 'EUR'
    invoice.value.desglosarIva = true
    invoice.value.aplicarRecargo = false
    invoice.value.mencionEspecial = 'ninguna'
    invoice.value.formaPago = 'Transferencia'
    invoice.value.datosBancarios = 'ES91 2100 0418 4502 0005 1332'
    invoice.value.lineas = [
      { concepto: 'Diseño y desarrollo web corporativa', cantidad: 1, precioUnitario: 2500, descuento: 0, iva: 21 },
      { concepto: 'Hosting anual (servidor dedicado)', cantidad: 12, precioUnitario: 29.90, descuento: 10, iva: 21 },
      { concepto: 'Mantenimiento mensual', cantidad: 3, precioUnitario: 150, descuento: 0, iva: 21 },
      { concepto: 'Licencia plugin premium', cantidad: 1, precioUnitario: 89, descuento: 0, iva: 10 }
    ]
    invoice.value.aplicarIrpf = true
    invoice.value.irpfPorcentaje = 15
    invoice.value.notas = 'Pago a 30 días fecha factura. Penalización por demora: interés legal del dinero vigente.'
  }

  // === PDF Generation ===
  async function generatePDF() {
    const inv = invoice.value
    const tots = totales.value
    const doc = await PDFDocument.create()
    const page = doc.addPage([595.28, 841.89])
    const { width, height } = page.getSize()

    const fontR = await doc.embedFont(StandardFonts.Helvetica)
    const fontB = await doc.embedFont(StandardFonts.HelveticaBold)

    const margin = 50
    let y = height - margin

    // Helper
    const drawText = (text, x, yPos, opts = {}) => {
      page.drawText(text || '', {
        x, y: yPos,
        size: opts.size || 9,
        font: opts.bold ? fontB : fontR,
        color: opts.color || rgb(0.15, 0.15, 0.15)
      })
    }

    const drawLine = (x1, y1, x2, y2, thickness = 0.5) => {
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color: rgb(0.8, 0.8, 0.8) })
    }

    // === HEADER: Emisor (left) + FACTURA title (right) ===
    let yLeft = y
    let yRight = y

    // Logo (top-left, above emisor text)
    if (inv.emisor.logo) {
      try {
        const logoBytes = await fetch(inv.emisor.logo).then(r => r.arrayBuffer())
        let logoImage
        if (inv.emisor.logo.includes('image/png')) {
          logoImage = await doc.embedPng(logoBytes)
        } else {
          logoImage = await doc.embedJpg(logoBytes)
        }
        const logoDims = logoImage.scale(1)
        const maxH = 50
        const maxW = 100
        const scale = Math.min(maxW / logoDims.width, maxH / logoDims.height, 1)
        const w = logoDims.width * scale
        const h = logoDims.height * scale
        page.drawImage(logoImage, { x: margin, y: yLeft - h, width: w, height: h })
        yLeft -= h + 10
      } catch { /* skip logo on error */ }
    }

    // Emisor info (left column)
    drawText(inv.emisor.nombre, margin, yLeft, { size: 12, bold: true })
    yLeft -= 15
    if (inv.emisor.nif) { drawText(`NIF: ${inv.emisor.nif}`, margin, yLeft); yLeft -= 12 }
    if (inv.emisor.direccion) { drawText(inv.emisor.direccion, margin, yLeft); yLeft -= 12 }
    if (inv.emisor.ciudad || inv.emisor.cp) { drawText(`${inv.emisor.cp} ${inv.emisor.ciudad}`.trim(), margin, yLeft); yLeft -= 12 }
    if (inv.emisor.telefono) { drawText(`Tel: ${inv.emisor.telefono}`, margin, yLeft); yLeft -= 12 }
    if (inv.emisor.email) { drawText(inv.emisor.email, margin, yLeft); yLeft -= 12 }
    if (inv.emisor.registroProfesional) { drawText(inv.emisor.registroProfesional, margin, yLeft, { size: 8, color: rgb(0.4, 0.4, 0.4) }); yLeft -= 12 }

    // FACTURA title + info (right column)
    const rightX = width - margin - 150
    drawText('FACTURA', rightX, yRight, { size: 18, bold: true })
    yRight -= 20
    drawText(`N.º: ${inv.numero}`, rightX, yRight, { size: 10 })
    yRight -= 14
    drawText(`Fecha: ${formatDate(inv.fecha)}`, rightX, yRight)
    if (inv.conVencimiento && inv.fechaVencimiento) { yRight -= 12; drawText(`Vencimiento: ${formatDate(inv.fechaVencimiento)}`, rightX, yRight) }
    if (inv.conFechaOperacion && inv.fechaOperacion) { yRight -= 12; drawText(`F. operación: ${formatDate(inv.fechaOperacion)}`, rightX, yRight) }

    y = Math.min(yLeft, yRight) - 20

    // === SEPARATOR ===
    drawLine(margin, y, width - margin, y)
    y -= 20

    // === CLIENTE (with border box) ===
    drawText('Facturar a:', margin, y, { size: 9, color: rgb(0.4, 0.4, 0.4) })
    y -= 16

    // Calculate client block height
    let clientLines = 1 // nombre
    if (inv.cliente.nif) clientLines++
    if (inv.cliente.direccion) clientLines++
    if (inv.cliente.ciudad || inv.cliente.cp) clientLines++
    const boxPadding = 10
    const boxHeight = clientLines * 13 + boxPadding * 2
    const boxWidth = 260

    // Draw box background and border
    page.drawRectangle({
      x: margin,
      y: y - boxHeight + 4,
      width: boxWidth,
      height: boxHeight,
      color: rgb(0.96, 0.96, 0.96),
      borderColor: rgb(0.82, 0.82, 0.82),
      borderWidth: 0.5
    })

    // Client text inside box
    let cy = y - boxPadding + 2
    drawText(inv.cliente.nombre, margin + boxPadding, cy, { size: 10, bold: true })
    cy -= 13
    if (inv.cliente.nif) { drawText(`NIF: ${inv.cliente.nif}`, margin + boxPadding, cy); cy -= 13 }
    if (inv.cliente.direccion) { drawText(inv.cliente.direccion, margin + boxPadding, cy); cy -= 13 }
    if (inv.cliente.ciudad || inv.cliente.cp) { drawText(`${inv.cliente.cp} ${inv.cliente.ciudad}`.trim(), margin + boxPadding, cy); cy -= 13 }

    y = y - boxHeight - 16

    // === TABLE HEADER ===
    const moneda = inv.moneda || 'EUR'
    const hayDescuento = inv.lineas.some(l => (l.descuento || 0) > 0)
    const fuerzaSinIva = ['inversionSP', 'noSujeta'].includes(inv.mencionEspecial)

    let colX, colLabels
    if (inv.aplicarRecargo && hayDescuento) {
      colX = [margin, margin + 170, margin + 220, margin + 270, margin + 320, margin + 370, margin + 420]
      colLabels = ['Concepto', 'Cant.', 'Precio', 'Dto%', 'IVA%', 'RE%', 'Importe']
    } else if (inv.aplicarRecargo) {
      colX = [margin, margin + 200, margin + 260, margin + 310, margin + 360, margin + 420]
      colLabels = ['Concepto', 'Cant.', 'Precio', 'IVA%', 'RE%', 'Importe']
    } else if (hayDescuento) {
      colX = [margin, margin + 190, margin + 240, margin + 290, margin + 350, margin + 420]
      colLabels = ['Concepto', 'Cant.', 'Precio', 'Dto%', 'IVA%', 'Importe']
    } else {
      colX = [margin, margin + 220, margin + 280, margin + 350, margin + 420]
      colLabels = ['Concepto', 'Cant.', 'Precio', 'IVA%', 'Importe']
    }

    drawLine(margin, y, width - margin, y)
    y -= 14
    colLabels.forEach((label, i) => {
      drawText(label, colX[i], y, { size: 8, bold: true, color: rgb(0.35, 0.35, 0.35) })
    })
    y -= 8
    drawLine(margin, y, width - margin, y)
    y -= 14

    // === TABLE ROWS ===
    const maxConceptW = colX[1] - colX[0] - 10
    for (const linea of inv.lineas) {
      if (!linea.concepto && linea.precioUnitario === 0) continue
      const dto = linea.descuento || 0
      const importe = linea.cantidad * linea.precioUnitario * (1 - dto / 100)
      const tipoIva = fuerzaSinIva ? 0 : (linea.iva || 0)
      const recargoVal = inv.aplicarRecargo ? (RECARGO_MAP[tipoIva] || 0) : 0

      let concepto = linea.concepto || ''
      if (fontR.widthOfTextAtSize(concepto, 9) > maxConceptW) {
        while (fontR.widthOfTextAtSize(concepto + '...', 9) > maxConceptW && concepto.length > 0) {
          concepto = concepto.slice(0, -1)
        }
        concepto += '...'
      }

      let col = 0
      drawText(concepto, colX[col++], y)
      drawText(String(linea.cantidad), colX[col++], y)
      drawText(formatNum(linea.precioUnitario), colX[col++], y)
      if (hayDescuento) drawText(dto > 0 ? `${dto}%` : '-', colX[col++], y)
      drawText(`${tipoIva}%`, colX[col++], y)
      if (inv.aplicarRecargo) drawText(`${recargoVal}%`, colX[col++], y)
      drawText(formatNum(importe), colX[col], y)
      y -= 16

      if (y < 150) break
    }

    y -= 10
    drawLine(margin, y, width - margin, y)
    y -= 20

    // === TOTALS ===
    const totX = width - margin - 180
    const valX = width - margin - 60

    drawText('Subtotal:', totX, y, { size: 9 })
    drawText(formatNum(tots.subtotal) + ' ' + moneda, valX, y, { size: 9 })
    y -= 14

    if (inv.desglosarIva) {
      for (const d of tots.desglose) {
        if (d.cuotaIva > 0) {
          drawText(`IVA ${d.tipoIva}% (base ${formatNum(d.base)}):`, totX, y, { size: 9 })
          drawText(formatNum(d.cuotaIva) + ' ' + moneda, valX, y, { size: 9 })
          y -= 14
        }
        if (d.cuotaRecargo > 0) {
          drawText(`R.E. ${d.tipoRecargo}% (base ${formatNum(d.base)}):`, totX, y, { size: 9 })
          drawText(formatNum(d.cuotaRecargo) + ' ' + moneda, valX, y, { size: 9 })
          y -= 14
        }
      }
    } else {
      if (tots.totalIva > 0) {
        drawText('IVA:', totX, y, { size: 9 })
        drawText(formatNum(tots.totalIva) + ' ' + moneda, valX, y, { size: 9 })
        y -= 14
      }
      if (tots.totalRecargo > 0) {
        drawText('Recargo equiv.:', totX, y, { size: 9 })
        drawText(formatNum(tots.totalRecargo) + ' ' + moneda, valX, y, { size: 9 })
        y -= 14
      }
    }

    if (inv.aplicarIrpf && tots.cuotaIrpf > 0) {
      drawText(`IRPF -${inv.irpfPorcentaje}%:`, totX, y, { size: 9 })
      drawText('-' + formatNum(tots.cuotaIrpf) + ' ' + moneda, valX, y, { size: 9 })
      y -= 14
    }

    y -= 4
    drawLine(totX, y, width - margin, y, 1)
    y -= 16
    drawText('TOTAL:', totX, y, { size: 11, bold: true })
    drawText(formatNum(tots.total) + ' ' + moneda, valX, y, { size: 11, bold: true })
    y -= 30

    // === FOOTER ===
    if (inv.formaPago) {
      drawText(`Forma de pago: ${inv.formaPago}`, margin, y, { size: 9 })
      y -= 13
    }
    if (inv.datosBancarios) {
      drawText(`Datos bancarios: ${inv.datosBancarios}`, margin, y, { size: 9 })
      y -= 13
    }
    // Mención legal
    const mencionTexto = MENCIONES_ESPECIALES[inv.mencionEspecial]
    if (mencionTexto) {
      y -= 6
      drawText(mencionTexto, margin, y, { size: 8, bold: true, color: rgb(0.3, 0.3, 0.3) })
      y -= 14
    }
    if (inv.notas) {
      y -= 6
      drawText('Notas:', margin, y, { size: 8, color: rgb(0.4, 0.4, 0.4) })
      y -= 12
      // Split notes into lines
      const words = inv.notas.split(' ')
      let line = ''
      for (const word of words) {
        const test = line ? line + ' ' + word : word
        if (fontR.widthOfTextAtSize(test, 8) > width - 2 * margin) {
          drawText(line, margin, y, { size: 8, color: rgb(0.3, 0.3, 0.3) })
          y -= 11
          line = word
        } else {
          line = test
        }
      }
      if (line) drawText(line, margin, y, { size: 8, color: rgb(0.3, 0.3, 0.3) })
    }

    // Download
    const pdfBytes = await doc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${inv.numero || 'factura'}.pdf`
    a.click()
    URL.revokeObjectURL(url)

    // Prompt to save config if emisor has data and crypto is unlocked
    if ((inv.emisor.nombre || inv.emisor.nif) && !appCrypto.isLocked.value) {
      promptSaveConfig()
    }
  }

  function formatNum(n) {
    return Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  function formatDate(d) {
    if (!d) return ''
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }

  return {
    invoice,
    totales,
    emisorSaved,
    logoError,
    addLinea,
    removeLinea,
    handleLogoUpload,
    removeLogo,
    // Config persistence
    showConfigModal,
    configName,
    configError,
    savedConfigs,
    selectedConfigId,
    promptSaveConfig,
    confirmSave,
    selectConfig,
    dismissConfigModal,
    deleteConfigById,
    vault,
    // Actions
    resetInvoice,
    fillDemo,
    generatePDF,
    RECARGO_MAP,
    MONEDAS,
    MONEDA_SIMBOLO,
    MENCIONES_ESPECIALES
  }
}

<script setup>
import { ref } from 'vue'
import { useInvoiceGenerator } from '../../composables/useInvoiceGenerator.js'

const {
  invoice, totales, emisorSaved, logoError,
  addLinea, removeLinea, handleLogoUpload, removeLogo,
  showConfigModal, configName,
  configError, savedConfigs,
  promptSaveConfig, confirmSave, selectConfig,
  dismissConfigModal, deleteConfigById,
  vault,
  resetInvoice, fillDemo, generatePDF,
  RECARGO_MAP, MONEDAS, MONEDA_SIMBOLO, MENCIONES_ESPECIALES
} = useInvoiceGenerator()

const sections = ref({ emisor: true, cliente: false, factura: false, lineas: false, fiscal: false })
const logoInput = ref(null)
const editingLinea = ref(null)

function toggleSection(key) {
  sections.value[key] = !sections.value[key]
}

const ivaOptions = [
  { value: 21, label: '21% (General)' },
  { value: 10, label: '10% (Reducido)' },
  { value: 4, label: '4% (Superreducido)' },
  { value: 0, label: '0% (Exento)' }
]

const formasPago = ['Transferencia', 'Efectivo', 'Tarjeta', 'PayPal', 'Otro']

function openLineaEditor(index) {
  editingLinea.value = index
}

function closeLineaEditor() {
  editingLinea.value = null
}

function getLineaTotal(linea) {
  return (linea.cantidad * linea.precioUnitario * (1 - (linea.descuento || 0) / 100)).toFixed(2)
}
</script>

<template>
  <div class="h-full flex flex-col app-bg">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/50 shrink-0">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <span class="text-sm font-medium text-white">Factura</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="fillDemo"
          class="p-2 text-amber-400 active:text-amber-300"
          style="touch-action: manipulation;"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </button>
        <button
          @click="resetInvoice"
          class="p-2 text-neutral-400 active:text-neutral-300"
          style="touch-action: manipulation;"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Form -->
    <div class="flex-1 overflow-y-auto pb-36">
      <!-- LEGAL COMPLIANCE -->
      <section class="px-4 pt-4">
        <div class="rounded-xl border border-neutral-800/50 p-4 bg-neutral-900/30">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            <div class="space-y-1">
              <p class="text-xs text-neutral-300 font-medium">Conforme a la normativa AEAT</p>
              <p class="text-[11px] text-neutral-500 leading-relaxed">
                Art. 6 del RD 1619/2012 (Reglamento de Obligaciones de Facturacion).
                Incluye todos los campos obligatorios.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- EMISOR -->
      <section class="border-b border-neutral-800">
        <button
          @click="toggleSection('emisor')"
          class="w-full flex items-center justify-between px-4 py-4 active:bg-neutral-800/50"
          style="touch-action: manipulation;"
        >
          <span class="text-sm font-medium text-white">Datos del Emisor</span>
          <svg class="w-5 h-5 text-neutral-500 transition-transform" :class="{ 'rotate-180': sections.emisor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div v-if="sections.emisor" class="px-4 pb-4 space-y-4">
          <!-- Logo -->
          <div class="flex items-center gap-4">
            <div
              v-if="invoice.emisor.logo"
              class="w-16 h-16 rounded-lg border border-neutral-700 overflow-hidden bg-neutral-800 flex items-center justify-center"
            >
              <img :src="invoice.emisor.logo" class="max-w-full max-h-full object-contain" />
            </div>
            <div class="flex flex-col gap-2">
              <button
                @click="logoInput?.click()"
                class="px-4 py-2 text-sm bg-neutral-800 active:bg-neutral-700 text-neutral-300 rounded-lg"
                style="touch-action: manipulation;"
              >
                {{ invoice.emisor.logo ? 'Cambiar logo' : 'Incluir logo' }}
              </button>
              <button
                v-if="invoice.emisor.logo"
                @click="removeLogo"
                class="px-4 py-2 text-sm text-red-400 active:text-red-300"
                style="touch-action: manipulation;"
              >
                Quitar logo
              </button>
              <input ref="logoInput" type="file" accept="image/png,image/jpeg" class="hidden" @change="handleLogoUpload" />
            </div>
            <p v-if="logoError" class="text-xs text-red-400">{{ logoError }}</p>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs text-neutral-500 mb-1.5">Nombre / Razon social</label>
              <input v-model="invoice.emisor.nombre" class="mobile-input" placeholder="Mi Empresa S.L." />
            </div>
            <div>
              <label class="block text-xs text-neutral-500 mb-1.5">NIF / CIF</label>
              <input v-model="invoice.emisor.nif" class="mobile-input" placeholder="B12345678" />
            </div>
            <div>
              <label class="block text-xs text-neutral-500 mb-1.5">Direccion</label>
              <input v-model="invoice.emisor.direccion" class="mobile-input" placeholder="Calle Ejemplo 123" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-neutral-500 mb-1.5">Ciudad</label>
                <input v-model="invoice.emisor.ciudad" class="mobile-input" placeholder="Madrid" />
              </div>
              <div>
                <label class="block text-xs text-neutral-500 mb-1.5">CP</label>
                <input v-model="invoice.emisor.cp" class="mobile-input" placeholder="28001" />
              </div>
            </div>
            <div>
              <label class="block text-xs text-neutral-500 mb-1.5">Telefono</label>
              <input v-model="invoice.emisor.telefono" class="mobile-input" type="tel" placeholder="+34 600 000 000" />
            </div>
            <div>
              <label class="block text-xs text-neutral-500 mb-1.5">Email</label>
              <input v-model="invoice.emisor.email" class="mobile-input" type="email" placeholder="info@empresa.com" />
            </div>
            <div>
              <label class="block text-xs text-neutral-500 mb-1.5">N.o Colegiado (opcional)</label>
              <input v-model="invoice.emisor.registroProfesional" class="mobile-input" placeholder="Col. 12345 ICAM" />
            </div>
          </div>

          <!-- Config save/load -->
          <div class="pt-4 border-t border-neutral-800 space-y-3">
            <div v-if="savedConfigs.length > 0">
              <label class="block text-xs text-neutral-500 mb-1.5">Cargar configuracion</label>
              <select
                class="mobile-input"
                :disabled="vault.isLocked.value"
                @change="(e) => { if (e.target.value) selectConfig(e.target.value); e.target.value = '' }"
              >
                <option value="">{{ vault.isLocked.value ? 'Desbloquear para cargar' : 'Seleccionar...' }}</option>
                <option v-for="cfg in savedConfigs" :key="cfg.id" :value="cfg.id">{{ cfg.name }}</option>
              </select>
            </div>
            <button
              @click="promptSaveConfig"
              :disabled="vault.isLocked.value"
              class="w-full py-3 text-sm rounded-lg transition-colors"
              :class="vault.isLocked.value
                ? 'bg-neutral-800/50 text-neutral-500'
                : 'bg-emerald-600/20 text-emerald-400 active:bg-emerald-600/30'"
              style="touch-action: manipulation;"
            >
              Guardar configuracion
            </button>
            <span v-if="emisorSaved" class="text-xs text-emerald-400">Guardado</span>
          </div>
        </div>
      </section>

      <!-- CLIENTE -->
      <section class="border-b border-neutral-800">
        <button
          @click="toggleSection('cliente')"
          class="w-full flex items-center justify-between px-4 py-4 active:bg-neutral-800/50"
          style="touch-action: manipulation;"
        >
          <span class="text-sm font-medium text-white">Datos del Cliente</span>
          <svg class="w-5 h-5 text-neutral-500 transition-transform" :class="{ 'rotate-180': sections.cliente }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div v-if="sections.cliente" class="px-4 pb-4 space-y-3">
          <div>
            <label class="block text-xs text-neutral-500 mb-1.5">Nombre / Razon social</label>
            <input v-model="invoice.cliente.nombre" class="mobile-input" placeholder="Cliente S.A." />
          </div>
          <div>
            <label class="block text-xs text-neutral-500 mb-1.5">NIF / CIF</label>
            <input v-model="invoice.cliente.nif" class="mobile-input" placeholder="A87654321" />
          </div>
          <div>
            <label class="block text-xs text-neutral-500 mb-1.5">Direccion</label>
            <input v-model="invoice.cliente.direccion" class="mobile-input" placeholder="Avda. Principal 45" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-neutral-500 mb-1.5">Ciudad</label>
              <input v-model="invoice.cliente.ciudad" class="mobile-input" placeholder="Barcelona" />
            </div>
            <div>
              <label class="block text-xs text-neutral-500 mb-1.5">CP</label>
              <input v-model="invoice.cliente.cp" class="mobile-input" placeholder="08001" />
            </div>
          </div>
        </div>
      </section>

      <!-- FACTURA -->
      <section class="border-b border-neutral-800">
        <button
          @click="toggleSection('factura')"
          class="w-full flex items-center justify-between px-4 py-4 active:bg-neutral-800/50"
          style="touch-action: manipulation;"
        >
          <span class="text-sm font-medium text-white">Datos de la Factura</span>
          <svg class="w-5 h-5 text-neutral-500 transition-transform" :class="{ 'rotate-180': sections.factura }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div v-if="sections.factura" class="px-4 pb-4 space-y-3">
          <div>
            <label class="block text-xs text-neutral-500 mb-1.5">Numero de factura</label>
            <input v-model="invoice.numero" class="mobile-input" placeholder="FAC-2026-001" />
          </div>
          <div>
            <label class="block text-xs text-neutral-500 mb-1.5">Fecha</label>
            <input v-model="invoice.fecha" type="date" class="mobile-input" />
          </div>
          <label class="flex items-center gap-3 py-2">
            <input type="checkbox" v-model="invoice.conVencimiento" class="w-5 h-5 accent-emerald-500" />
            <span class="text-sm text-neutral-300">Fecha de vencimiento</span>
          </label>
          <input v-if="invoice.conVencimiento" v-model="invoice.fechaVencimiento" type="date" class="mobile-input" />

          <label class="flex items-center gap-3 py-2">
            <input type="checkbox" v-model="invoice.conFechaOperacion" class="w-5 h-5 accent-emerald-500" />
            <span class="text-sm text-neutral-300">Fecha de operacion</span>
          </label>
          <input v-if="invoice.conFechaOperacion" v-model="invoice.fechaOperacion" type="date" class="mobile-input" />

          <div>
            <label class="block text-xs text-neutral-500 mb-1.5">Moneda</label>
            <select v-model="invoice.moneda" class="mobile-input">
              <option v-for="m in MONEDAS" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-neutral-500 mb-1.5">Forma de pago</label>
            <select v-model="invoice.formaPago" class="mobile-input">
              <option v-for="fp in formasPago" :key="fp" :value="fp">{{ fp }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-neutral-500 mb-1.5">IBAN</label>
            <input v-model="invoice.datosBancarios" class="mobile-input" placeholder="ES00 0000 0000 0000 0000 0000" />
          </div>
        </div>
      </section>

      <!-- LINEAS / CONCEPTOS -->
      <section class="border-b border-neutral-800">
        <button
          @click="toggleSection('lineas')"
          class="w-full flex items-center justify-between px-4 py-4 active:bg-neutral-800/50"
          style="touch-action: manipulation;"
        >
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-white">Conceptos</span>
            <span class="px-2 py-0.5 text-xs bg-neutral-800 text-neutral-400 rounded-full">{{ invoice.lineas.length }}</span>
          </div>
          <svg class="w-5 h-5 text-neutral-500 transition-transform" :class="{ 'rotate-180': sections.lineas }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div v-if="sections.lineas" class="px-4 pb-4 space-y-3">
          <!-- Linea cards -->
          <div
            v-for="(linea, i) in invoice.lineas"
            :key="i"
            class="p-4 bg-neutral-800/50 rounded-xl space-y-3"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0 pr-3">
                <input
                  v-model="linea.concepto"
                  class="w-full bg-transparent text-white text-sm font-medium placeholder-neutral-500 outline-none"
                  placeholder="Descripcion del concepto..."
                />
              </div>
              <button
                @click="removeLinea(i)"
                :disabled="invoice.lineas.length <= 1"
                class="p-2 text-neutral-500 active:text-red-400 disabled:opacity-30"
                style="touch-action: manipulation;"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-[10px] text-neutral-500 mb-1">Cantidad</label>
                <input v-model.number="linea.cantidad" type="number" min="1" class="mobile-input text-center" />
              </div>
              <div>
                <label class="block text-[10px] text-neutral-500 mb-1">Precio</label>
                <input v-model.number="linea.precioUnitario" type="number" min="0" step="0.01" class="mobile-input text-right" />
              </div>
              <div>
                <label class="block text-[10px] text-neutral-500 mb-1">Dto %</label>
                <input v-model.number="linea.descuento" type="number" min="0" max="100" class="mobile-input text-center" placeholder="0" />
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <label class="block text-[10px] text-neutral-500 mb-1">IVA</label>
                <select v-model.number="linea.iva" class="mobile-input w-32 text-sm">
                  <option v-for="opt in ivaOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
              <div class="text-right">
                <span class="text-[10px] text-neutral-500 block">Importe</span>
                <span class="text-lg font-semibold text-white">{{ getLineaTotal(linea) }} {{ invoice.moneda }}</span>
              </div>
            </div>

            <div v-if="invoice.aplicarRecargo" class="text-xs text-neutral-500">
              R.E.: {{ RECARGO_MAP[linea.iva] || 0 }}%
            </div>
          </div>

          <button
            @click="addLinea"
            class="w-full py-3 text-sm text-emerald-400 border border-emerald-600/30 rounded-xl active:bg-emerald-600/10"
            style="touch-action: manipulation;"
          >
            + Anadir concepto
          </button>
        </div>
      </section>

      <!-- FISCAL -->
      <section class="border-b border-neutral-800">
        <button
          @click="toggleSection('fiscal')"
          class="w-full flex items-center justify-between px-4 py-4 active:bg-neutral-800/50"
          style="touch-action: manipulation;"
        >
          <span class="text-sm font-medium text-white">Configuracion Fiscal</span>
          <svg class="w-5 h-5 text-neutral-500 transition-transform" :class="{ 'rotate-180': sections.fiscal }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div v-if="sections.fiscal" class="px-4 pb-4 space-y-4">
          <label class="flex items-center gap-3 py-2">
            <input type="checkbox" v-model="invoice.desglosarIva" class="w-5 h-5 accent-emerald-500" />
            <span class="text-sm text-neutral-300">Desglosar IVA</span>
          </label>
          <label class="flex items-center gap-3 py-2">
            <input type="checkbox" v-model="invoice.aplicarRecargo" class="w-5 h-5 accent-emerald-500" />
            <span class="text-sm text-neutral-300">Recargo de equivalencia</span>
          </label>
          <label class="flex items-center gap-3 py-2">
            <input type="checkbox" v-model="invoice.aplicarIrpf" class="w-5 h-5 accent-emerald-500" />
            <span class="text-sm text-neutral-300">Aplicar retencion IRPF</span>
          </label>
          <div v-if="invoice.aplicarIrpf" class="pl-8 flex items-center gap-4">
            <label class="flex items-center gap-2">
              <input type="radio" v-model.number="invoice.irpfPorcentaje" :value="15" class="accent-emerald-500" />
              <span class="text-sm text-neutral-400">15%</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="radio" v-model.number="invoice.irpfPorcentaje" :value="7" class="accent-emerald-500" />
              <span class="text-sm text-neutral-400">7%</span>
            </label>
          </div>

          <div>
            <label class="block text-xs text-neutral-500 mb-1.5">Mencion especial</label>
            <select v-model="invoice.mencionEspecial" class="mobile-input">
              <option value="ninguna">Ninguna</option>
              <option value="exenta">Exenta de IVA</option>
              <option value="noSujeta">No sujeta</option>
              <option value="inversionSP">Inversion sujeto pasivo</option>
              <option value="criterioCaja">Criterio de caja</option>
            </select>
          </div>

          <div>
            <label class="block text-xs text-neutral-500 mb-1.5">Notas</label>
            <textarea v-model="invoice.notas" rows="3" class="mobile-input resize-none" placeholder="Condiciones, observaciones..."></textarea>
          </div>
        </div>
      </section>

      <!-- TOTALS -->
      <section class="p-4">
        <div class="bg-neutral-800/50 rounded-xl p-4 space-y-2">
          <div class="flex justify-between text-sm text-neutral-300">
            <span>Subtotal</span>
            <span>{{ totales.subtotal.toFixed(2) }} {{ invoice.moneda }}</span>
          </div>
          <template v-if="invoice.desglosarIva">
            <template v-for="d in totales.desglose" :key="d.tipoIva + '-' + d.tipoRecargo">
              <div v-if="d.cuotaIva > 0" class="flex justify-between text-sm text-neutral-400">
                <span>IVA {{ d.tipoIva }}%</span>
                <span>{{ d.cuotaIva.toFixed(2) }} {{ invoice.moneda }}</span>
              </div>
              <div v-if="d.cuotaRecargo > 0" class="flex justify-between text-sm text-neutral-400">
                <span>R.E. {{ d.tipoRecargo }}%</span>
                <span>{{ d.cuotaRecargo.toFixed(2) }} {{ invoice.moneda }}</span>
              </div>
            </template>
          </template>
          <template v-else>
            <div v-if="totales.totalIva > 0" class="flex justify-between text-sm text-neutral-400">
              <span>IVA</span>
              <span>{{ totales.totalIva.toFixed(2) }} {{ invoice.moneda }}</span>
            </div>
            <div v-if="totales.totalRecargo > 0" class="flex justify-between text-sm text-neutral-400">
              <span>R.E.</span>
              <span>{{ totales.totalRecargo.toFixed(2) }} {{ invoice.moneda }}</span>
            </div>
          </template>
          <div v-if="invoice.aplicarIrpf && totales.cuotaIrpf > 0" class="flex justify-between text-sm text-red-400">
            <span>IRPF -{{ invoice.irpfPorcentaje }}%</span>
            <span>-{{ totales.cuotaIrpf.toFixed(2) }} {{ invoice.moneda }}</span>
          </div>
          <div class="border-t border-neutral-700 pt-3 mt-3 flex justify-between">
            <span class="text-base font-semibold text-white">TOTAL</span>
            <span class="text-xl font-bold text-emerald-400">{{ totales.total.toFixed(2) }} {{ invoice.moneda }}</span>
          </div>
        </div>
      </section>
    </div>

    <!-- Bottom action bar -->
    <div class="fixed bottom-16 left-0 right-0 p-4 bg-neutral-900/95 backdrop-blur-sm border-t border-neutral-800">
      <button
        @click="generatePDF"
        class="w-full py-4 bg-emerald-600 active:bg-emerald-500 text-white font-medium rounded-xl flex items-center justify-center gap-2"
        style="touch-action: manipulation;"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        Generar PDF
      </button>
    </div>

    <!-- Config Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showConfigModal" class="fixed inset-0 z-[9999]">
          <div class="absolute inset-0 bg-black/60" @click="dismissConfigModal"></div>
          <div class="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl border-t border-neutral-800 p-6 pb-8">
            <div class="w-12 h-1 bg-neutral-700 rounded-full mx-auto mb-4"></div>
            <h3 class="text-lg font-medium text-white mb-2">Guardar configuracion</h3>
            <p class="text-sm text-neutral-400 mb-4">Los datos se guardaran cifrados en tu navegador.</p>
            <div class="space-y-4">
              <div>
                <label class="block text-xs text-neutral-500 mb-1.5">Nombre</label>
                <input
                  v-model="configName"
                  type="text"
                  class="mobile-input"
                  placeholder="Ej: Mi empresa, Freelance..."
                  @keyup.enter="confirmSave"
                />
              </div>
              <p v-if="configError" class="text-sm text-red-400">{{ configError }}</p>
              <div class="flex gap-3">
                <button
                  @click="dismissConfigModal"
                  class="flex-1 py-3 text-sm text-neutral-400 bg-neutral-800 rounded-xl active:bg-neutral-700"
                  style="touch-action: manipulation;"
                >
                  Cancelar
                </button>
                <button
                  @click="confirmSave"
                  class="flex-1 py-3 text-sm bg-emerald-600 text-white rounded-xl active:bg-emerald-500"
                  style="touch-action: manipulation;"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.mobile-input {
  width: 100%;
  background: rgba(38, 38, 38, 0.8);
  border: 1px solid #404040;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  color: white;
  outline: none;
  transition: border-color 0.15s;
  -webkit-appearance: none;
}

.mobile-input:focus {
  border-color: rgba(16, 185, 129, 0.5);
}

.mobile-input::placeholder {
  color: #525252;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: translateY(100%);
}
</style>

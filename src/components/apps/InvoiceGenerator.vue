<script setup>
import { ref } from 'vue'
import { useInvoiceGenerator } from '../../composables/useInvoiceGenerator.js'
import CryptoLockButton from '../common/CryptoLockButton.vue'

const {
  invoice, totales, emisorSaved, logoError,
  addLinea, removeLinea, handleLogoUpload, removeLogo,
  showConfigModal, configName,
  configError, savedConfigs, selectedConfigId,
  promptSaveConfig, confirmSave, selectConfig,
  dismissConfigModal, deleteConfigById,
  vault,
  resetInvoice, fillDemo, generatePDF,
  RECARGO_MAP, MONEDAS, MONEDA_SIMBOLO, MENCIONES_ESPECIALES
} = useInvoiceGenerator()

const sections = ref({ emisor: true, cliente: true, factura: true, lineas: true, fiscal: true })
const logoInput = ref(null)

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
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-900/50 shrink-0">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <span class="text-sm font-medium text-white">Generador de Facturas</span>
      </div>
      <div class="flex items-center gap-2">
        <CryptoLockButton />
        <button
          @click="fillDemo"
          class="px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded border border-neutral-700 transition-colors"
        >
          Ejemplo
        </button>
        <button
          @click="resetInvoice"
          class="px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 transition-colors"
        >
          Limpiar
        </button>
        <button
          @click="generatePDF"
          class="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors flex items-center gap-1.5"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Generar PDF
        </button>
      </div>
    </div>

    <!-- Form -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- EMISOR -->
      <section class="bg-neutral-900/50 rounded-lg border border-neutral-800">
        <button @click="toggleSection('emisor')" class="w-full flex items-center justify-between px-4 py-2.5 text-left">
          <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Datos del Emisor</span>
          <svg class="w-4 h-4 text-neutral-500 transition-transform" :class="{ 'rotate-180': sections.emisor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div v-if="sections.emisor" class="px-4 pb-4 space-y-3">
          <!-- Logo -->
          <div class="flex items-center gap-3">
            <div
              v-if="invoice.emisor.logo"
              class="w-16 h-16 rounded border border-neutral-700 overflow-hidden bg-neutral-800 flex items-center justify-center"
            >
              <img :src="invoice.emisor.logo" class="max-w-full max-h-full object-contain" />
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="logoInput?.click()"
                class="px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 transition-colors"
              >
                {{ invoice.emisor.logo ? 'Cambiar logo' : 'Incluir logo' }}
              </button>
              <button
                v-if="invoice.emisor.logo"
                @click="removeLogo"
                class="px-2.5 py-1 text-[11px] text-red-400 hover:text-red-300 transition-colors"
              >
                Quitar
              </button>
              <input ref="logoInput" type="file" accept="image/png,image/jpeg" class="hidden" @change="handleLogoUpload" />
            </div>
            <p v-if="logoError" class="text-[10px] text-red-400">{{ logoError }}</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] text-neutral-500 mb-1">Nombre / Razón social</label>
              <input v-model="invoice.emisor.nombre" class="invoice-input" placeholder="Mi Empresa S.L." />
            </div>
            <div>
              <label class="block text-[10px] text-neutral-500 mb-1">NIF / CIF</label>
              <input v-model="invoice.emisor.nif" class="invoice-input" placeholder="B12345678" />
            </div>
          </div>
          <div>
            <label class="block text-[10px] text-neutral-500 mb-1">Dirección</label>
            <input v-model="invoice.emisor.direccion" class="invoice-input" placeholder="Calle Ejemplo 123" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] text-neutral-500 mb-1">Ciudad</label>
              <input v-model="invoice.emisor.ciudad" class="invoice-input" placeholder="Madrid" />
            </div>
            <div>
              <label class="block text-[10px] text-neutral-500 mb-1">Código Postal</label>
              <input v-model="invoice.emisor.cp" class="invoice-input" placeholder="28001" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] text-neutral-500 mb-1">Teléfono</label>
              <input v-model="invoice.emisor.telefono" class="invoice-input" placeholder="+34 600 000 000" />
            </div>
            <div>
              <label class="block text-[10px] text-neutral-500 mb-1">Email</label>
              <input v-model="invoice.emisor.email" class="invoice-input" placeholder="info@empresa.com" />
            </div>
          </div>
          <div>
            <label class="block text-[10px] text-neutral-500 mb-1">N.º Colegiado / Reg. profesional <span class="text-neutral-600">(opcional)</span></label>
            <input v-model="invoice.emisor.registroProfesional" class="invoice-input w-64" placeholder="Col. 12345 ICAM" />
          </div>
          <!-- Config selector + save -->
          <div class="flex items-center gap-2 pt-2 border-t border-neutral-800 mt-2">
            <div v-if="savedConfigs.length > 0" class="flex items-center gap-1.5">
              <select
                class="invoice-input w-40 text-[11px]"
                :disabled="vault.isLocked.value"
                @change="(e) => { if (e.target.value) selectConfig(e.target.value); e.target.value = '' }"
              >
                <option value="">{{ vault.isLocked.value ? 'Desbloquear para cargar' : 'Cargar config...' }}</option>
                <option v-for="cfg in savedConfigs" :key="cfg.id" :value="cfg.id" :disabled="vault.isLocked.value">{{ cfg.name }}</option>
              </select>
              <button
                v-if="savedConfigs.length > 0"
                @click="deleteConfigById(savedConfigs[savedConfigs.length - 1]?.id)"
                class="p-1 text-neutral-600 hover:text-red-400 transition-colors"
                title="Eliminar última config"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
            <button
              @click="promptSaveConfig"
              :disabled="vault.isLocked.value"
              class="px-3 py-1.5 text-[11px] border rounded transition-colors"
              :class="vault.isLocked.value
                ? 'bg-neutral-800/50 text-neutral-500 border-neutral-700 cursor-not-allowed'
                : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-600/30'"
            >
              Guardar configuración
            </button>
            <span v-if="emisorSaved" class="text-[10px] text-emerald-400">Guardado</span>
            <span v-if="configError" class="text-[10px] text-red-400">{{ configError }}</span>
          </div>
        </div>
      </section>

      <!-- CLIENTE -->
      <section class="bg-neutral-900/50 rounded-lg border border-neutral-800">
        <button @click="toggleSection('cliente')" class="w-full flex items-center justify-between px-4 py-2.5 text-left">
          <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Datos del Cliente</span>
          <svg class="w-4 h-4 text-neutral-500 transition-transform" :class="{ 'rotate-180': sections.cliente }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div v-if="sections.cliente" class="px-4 pb-4 space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] text-neutral-500 mb-1">Nombre / Razón social</label>
              <input v-model="invoice.cliente.nombre" class="invoice-input" placeholder="Cliente S.A." />
            </div>
            <div>
              <label class="block text-[10px] text-neutral-500 mb-1">NIF / CIF</label>
              <input v-model="invoice.cliente.nif" class="invoice-input" placeholder="A87654321" />
            </div>
          </div>
          <div>
            <label class="block text-[10px] text-neutral-500 mb-1">Dirección</label>
            <input v-model="invoice.cliente.direccion" class="invoice-input" placeholder="Avda. Principal 45" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] text-neutral-500 mb-1">Ciudad</label>
              <input v-model="invoice.cliente.ciudad" class="invoice-input" placeholder="Barcelona" />
            </div>
            <div>
              <label class="block text-[10px] text-neutral-500 mb-1">Código Postal</label>
              <input v-model="invoice.cliente.cp" class="invoice-input" placeholder="08001" />
            </div>
          </div>
        </div>
      </section>

      <!-- FACTURA -->
      <section class="bg-neutral-900/50 rounded-lg border border-neutral-800">
        <button @click="toggleSection('factura')" class="w-full flex items-center justify-between px-4 py-2.5 text-left">
          <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Datos de la Factura</span>
          <svg class="w-4 h-4 text-neutral-500 transition-transform" :class="{ 'rotate-180': sections.factura }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div v-if="sections.factura" class="px-4 pb-4 space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] text-neutral-500 mb-1">Número de factura</label>
              <input v-model="invoice.numero" class="invoice-input" placeholder="FAC-2026-001" />
            </div>
            <div>
              <label class="block text-[10px] text-neutral-500 mb-1">Fecha</label>
              <input v-model="invoice.fecha" type="date" class="invoice-input" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="flex items-center gap-2 mb-2">
                <input type="checkbox" v-model="invoice.conVencimiento" class="w-3.5 h-3.5 accent-emerald-500" />
                <span class="text-xs text-neutral-300">Fecha de vencimiento</span>
              </label>
              <input v-if="invoice.conVencimiento" v-model="invoice.fechaVencimiento" type="date" class="invoice-input" />
            </div>
            <div>
              <label class="flex items-center gap-2 mb-2">
                <input type="checkbox" v-model="invoice.conFechaOperacion" class="w-3.5 h-3.5 accent-emerald-500" />
                <span class="text-xs text-neutral-300">Fecha de operación</span>
              </label>
              <input v-if="invoice.conFechaOperacion" v-model="invoice.fechaOperacion" type="date" class="invoice-input" />
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-[10px] text-neutral-500 mb-1">Moneda</label>
              <select v-model="invoice.moneda" class="invoice-input">
                <option v-for="m in MONEDAS" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] text-neutral-500 mb-1">Forma de pago</label>
              <select v-model="invoice.formaPago" class="invoice-input">
                <option v-for="fp in formasPago" :key="fp" :value="fp">{{ fp }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] text-neutral-500 mb-1">Datos bancarios (IBAN)</label>
              <input v-model="invoice.datosBancarios" class="invoice-input" placeholder="ES00 0000 0000 0000 0000 0000" />
            </div>
          </div>
        </div>
      </section>

      <!-- LINEAS / CONCEPTOS -->
      <section class="bg-neutral-900/50 rounded-lg border border-neutral-800">
        <button @click="toggleSection('lineas')" class="w-full flex items-center justify-between px-4 py-2.5 text-left">
          <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Conceptos</span>
          <svg class="w-4 h-4 text-neutral-500 transition-transform" :class="{ 'rotate-180': sections.lineas }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div v-if="sections.lineas" class="px-4 pb-4">
          <!-- Table header -->
          <div
            class="grid gap-2 mb-2 text-[10px] text-neutral-500 font-medium"
            :class="invoice.aplicarRecargo ? 'grid-cols-[1fr_50px_70px_50px_80px_50px_70px_30px]' : 'grid-cols-[1fr_60px_80px_50px_90px_80px_30px]'"
          >
            <span>Concepto</span>
            <span>Cant.</span>
            <span>Precio</span>
            <span>Dto%</span>
            <span>IVA</span>
            <span v-if="invoice.aplicarRecargo">R.E.</span>
            <span>Importe</span>
            <span></span>
          </div>

          <!-- Rows -->
          <div
            v-for="(linea, i) in invoice.lineas"
            :key="i"
            class="grid gap-2 mb-2 items-center"
            :class="invoice.aplicarRecargo ? 'grid-cols-[1fr_50px_70px_50px_80px_50px_70px_30px]' : 'grid-cols-[1fr_60px_80px_50px_90px_80px_30px]'"
          >
            <input v-model="linea.concepto" class="invoice-input text-[11px]" placeholder="Descripción..." />
            <input v-model.number="linea.cantidad" type="number" min="1" class="invoice-input text-[11px] text-center" />
            <input v-model.number="linea.precioUnitario" type="number" min="0" step="0.01" class="invoice-input text-[11px] text-right" />
            <input v-model.number="linea.descuento" type="number" min="0" max="100" step="1" class="invoice-input text-[11px] text-center" placeholder="0" />
            <select v-model.number="linea.iva" class="invoice-input text-[11px]">
              <option v-for="opt in ivaOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <span v-if="invoice.aplicarRecargo" class="text-[10px] text-neutral-400 text-center">
              {{ RECARGO_MAP[linea.iva] || 0 }}%
            </span>
            <span class="text-[11px] text-neutral-300 text-right pr-1">
              {{ (linea.cantidad * linea.precioUnitario * (1 - (linea.descuento || 0) / 100)).toFixed(2) }}
            </span>
            <button
              @click="removeLinea(i)"
              class="p-0.5 text-neutral-600 hover:text-red-400 transition-colors"
              :disabled="invoice.lineas.length <= 1"
              :class="{ 'opacity-30 cursor-not-allowed': invoice.lineas.length <= 1 }"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <button
            @click="addLinea"
            class="mt-2 px-3 py-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 border border-emerald-600/30 hover:border-emerald-600/50 rounded transition-colors"
          >
            + Añadir línea
          </button>
        </div>
      </section>

      <!-- FISCAL CONFIG -->
      <section class="bg-neutral-900/50 rounded-lg border border-neutral-800">
        <button @click="toggleSection('fiscal')" class="w-full flex items-center justify-between px-4 py-2.5 text-left">
          <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Configuración Fiscal</span>
          <svg class="w-4 h-4 text-neutral-500 transition-transform" :class="{ 'rotate-180': sections.fiscal }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div v-if="sections.fiscal" class="px-4 pb-4 space-y-3">
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="invoice.desglosarIva" class="w-3.5 h-3.5 accent-emerald-500" />
            <span class="text-xs text-neutral-300">Desglosar IVA</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="invoice.aplicarRecargo" class="w-3.5 h-3.5 accent-emerald-500" />
            <span class="text-xs text-neutral-300">Recargo de equivalencia</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="invoice.aplicarIrpf" class="w-3.5 h-3.5 accent-emerald-500" />
            <span class="text-xs text-neutral-300">Aplicar retención IRPF</span>
          </label>
          <div v-if="invoice.aplicarIrpf" class="flex items-center gap-3 pl-5">
            <label class="flex items-center gap-1.5">
              <input type="radio" v-model.number="invoice.irpfPorcentaje" :value="15" class="accent-emerald-500" />
              <span class="text-xs text-neutral-400">15%</span>
            </label>
            <label class="flex items-center gap-1.5">
              <input type="radio" v-model.number="invoice.irpfPorcentaje" :value="7" class="accent-emerald-500" />
              <span class="text-xs text-neutral-400">7% (nuevo autónomo)</span>
            </label>
          </div>

          <div>
            <label class="block text-[10px] text-neutral-500 mb-1">Mención especial</label>
            <select v-model="invoice.mencionEspecial" class="invoice-input w-72">
              <option value="ninguna">Ninguna (factura estándar)</option>
              <option value="exenta">Exenta de IVA (art. 20 LIVA)</option>
              <option value="noSujeta">No sujeta (arts. 69-70 LIVA)</option>
              <option value="inversionSP">Inversión sujeto pasivo (art. 84 LIVA)</option>
              <option value="criterioCaja">Criterio de caja</option>
            </select>
            <p v-if="['inversionSP', 'noSujeta'].includes(invoice.mencionEspecial)" class="mt-1.5 text-[10px] text-amber-400">
              El IVA se aplicará al 0% en todas las líneas
            </p>
          </div>

          <div>
            <label class="block text-[10px] text-neutral-500 mb-1">Notas (aparecen al pie de la factura)</label>
            <textarea v-model="invoice.notas" rows="2" class="invoice-input resize-none" placeholder="Condiciones, observaciones..."></textarea>
          </div>
        </div>
      </section>

      <!-- TOTALS SUMMARY -->
      <section class="bg-neutral-900/80 rounded-lg border border-neutral-700 p-4">
        <h3 class="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Resumen</h3>
        <div class="space-y-1.5">
          <div class="flex justify-between text-xs text-neutral-300">
            <span>Subtotal</span>
            <span>{{ totales.subtotal.toFixed(2) }} {{ invoice.moneda }}</span>
          </div>
          <template v-if="invoice.desglosarIva">
            <template v-for="d in totales.desglose" :key="d.tipoIva + '-' + d.tipoRecargo">
              <div v-if="d.cuotaIva > 0" class="flex justify-between text-xs text-neutral-400">
                <span>IVA {{ d.tipoIva }}% (base {{ d.base.toFixed(2) }})</span>
                <span>{{ d.cuotaIva.toFixed(2) }} {{ invoice.moneda }}</span>
              </div>
              <div v-if="d.cuotaRecargo > 0" class="flex justify-between text-xs text-neutral-400">
                <span>R.E. {{ d.tipoRecargo }}% (base {{ d.base.toFixed(2) }})</span>
                <span>{{ d.cuotaRecargo.toFixed(2) }} {{ invoice.moneda }}</span>
              </div>
            </template>
          </template>
          <template v-else>
            <div v-if="totales.totalIva > 0" class="flex justify-between text-xs text-neutral-400">
              <span>IVA</span>
              <span>{{ totales.totalIva.toFixed(2) }} {{ invoice.moneda }}</span>
            </div>
            <div v-if="totales.totalRecargo > 0" class="flex justify-between text-xs text-neutral-400">
              <span>Recargo equiv.</span>
              <span>{{ totales.totalRecargo.toFixed(2) }} {{ invoice.moneda }}</span>
            </div>
          </template>
          <div v-if="invoice.aplicarIrpf && totales.cuotaIrpf > 0" class="flex justify-between text-xs text-red-400/80">
            <span>IRPF -{{ invoice.irpfPorcentaje }}%</span>
            <span>-{{ totales.cuotaIrpf.toFixed(2) }} {{ invoice.moneda }}</span>
          </div>
          <div class="border-t border-neutral-700 pt-2 mt-2 flex justify-between text-sm font-semibold text-white">
            <span>TOTAL</span>
            <span>{{ totales.total.toFixed(2) }} {{ invoice.moneda }}</span>
          </div>
        </div>
      </section>

      <!-- LEGAL COMPLIANCE -->
      <section class="rounded-lg border border-neutral-800/50 p-3 bg-neutral-900/30">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <div class="space-y-1">
            <p class="text-[11px] text-neutral-300 font-medium">Conforme a la normativa AEAT</p>
            <p class="text-[10px] text-neutral-500 leading-relaxed">
              Art. 6 del <a href="https://www.boe.es/buscar/act.php?id=BOE-A-2012-14696" target="_blank" class="text-emerald-500/80 hover:text-emerald-400 underline">RD 1619/2012</a>
              (Reglamento de Obligaciones de Facturación).
              Incluye todos los campos obligatorios: identificación emisor/receptor, NIF, numeración correlativa,
              fecha, descripción, base imponible, tipo impositivo y cuota tributaria.
            </p>
          </div>
        </div>
      </section>
    </div>

    <!-- CONFIG MODAL (save name) -->
    <div v-if="showConfigModal" class="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div class="bg-neutral-900 border border-neutral-700 rounded-lg p-5 w-80 space-y-4 shadow-xl">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
          </svg>
          <h3 class="text-sm font-medium text-white">Guardar configuración</h3>
        </div>
        <p class="text-[11px] text-neutral-400">Los datos se guardarán cifrados en tu navegador.</p>
        <div class="space-y-3">
          <div>
            <label class="block text-[10px] text-neutral-500 mb-1">Nombre</label>
            <input
              v-model="configName"
              type="text"
              class="invoice-input"
              placeholder="Ej: Mi empresa, Freelance..."
              @keyup.enter="confirmSave"
            />
          </div>
          <p v-if="configError" class="text-[10px] text-red-400">{{ configError }}</p>
        </div>
        <div class="flex items-center justify-end gap-2">
          <button
            @click="dismissConfigModal"
            class="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="confirmSave"
            class="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.invoice-input {
  width: 100%;
  background: rgba(38, 38, 38, 0.8);
  border: 1px solid #404040;
  border-radius: 0.25rem;
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
  color: white;
  outline: none;
  transition: border-color 0.15s;
}
.invoice-input:focus {
  border-color: rgba(16, 185, 129, 0.5);
}
.invoice-input::placeholder {
  color: #525252;
}
</style>

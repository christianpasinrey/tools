<script setup>
import Icon from '../icons/Icon.vue'
const POINTS = [
  { icon: 'shield', title: 'Todo en tu navegador', text: 'Tus archivos se procesan en tu equipo. No se suben a ningún servidor.' },
  { icon: 'gift', title: 'Gratis y sin registro', text: 'Abre una herramienta y úsala. Sin cuentas, sin límites, sin anuncios.' },
  { icon: 'code', title: 'Código abierto', text: 'Puedes leer cada línea en GitHub y comprobar lo que hace.' },
  { icon: 'cloud-lock', title: 'Sincronización cifrada', text: 'Opcional: guarda tu trabajo cifrado de extremo a extremo entre dispositivos.' }
]
</script>

<template>
  <section class="max-w-6xl mx-auto px-4 sm:px-6 py-20" aria-labelledby="tb-trust-title">
    <div class="tb-trust rounded-[28px] border border-tb-line bg-tb-surface p-6 sm:p-10">
      <h2 id="tb-trust-title" class="font-display font-extrabold tracking-tight text-3xl sm:text-4xl max-w-2xl">Hecho para que no tengas que fiarte de nadie.</h2>
      <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="(p, i) in POINTS" :key="p.title" class="tb-trust-item" :style="{ '--i': i }">
          <span class="grid place-items-center w-11 h-11 rounded-xl bg-tb-surface-2 text-tb-accent"><Icon :name="p.icon" :size="22" /></span>
          <h3 class="mt-3 font-semibold">{{ p.title }}</h3>
          <p class="mt-1 text-sm text-tb-muted">{{ p.text }}</p>
        </div>
      </div>
      <router-link to="/acerca" class="mt-8 inline-flex items-center gap-2 font-medium text-tb-ink underline decoration-tb-accent decoration-2 underline-offset-4 hover:gap-3 transition-all">
        Cómo protegemos tus datos <Icon name="arrow-right" :size="16" />
      </router-link>
    </div>
  </section>
</template>

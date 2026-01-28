<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useMapEditor } from '../composables/useMapEditor'
import VaultSaveLoad from '../components/common/VaultSaveLoad.vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const mapEditor = useMapEditor()

const mapContainer = ref(null)
const fileInput = ref(null)
const showLayersPanel = ref(false)
const showToolsPanel = ref(false)

// Route detail panel
const selectedRoute = ref(null)
const showRouteDetail = ref(false)

// GPS Position (always on)
const userPosition = ref(null)
const userMarker = ref(null)
const userAccuracyCircle = ref(null)
const gpsWatchId = ref(null)
const gpsError = ref(null)
const isLocating = ref(false)

// Navigation mode (following a route)
const isNavigating = ref(false)

// Toast notifications
const toast = ref({ show: false, message: '', type: 'success' })
let toastTimeout = null

function showToast(message, type = 'success') {
  clearTimeout(toastTimeout)
  toast.value = { show: true, message, type }
  toastTimeout = setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

// Watch for new routes/markers to show feedback
const prevRoutesCount = ref(0)
const prevMarkersCount = ref(0)

watch(() => mapEditor.routes.value.length, (newCount) => {
  if (newCount > prevRoutesCount.value) {
    showToast(`Ruta creada (${mapEditor.formatDistance(mapEditor.routes.value[newCount - 1]?.distance || 0)})`, 'success')
    // Auto-open layers panel to show the new route
    showLayersPanel.value = true
  }
  prevRoutesCount.value = newCount
})

watch(() => mapEditor.markers.value.length, (newCount) => {
  if (newCount > prevMarkersCount.value) {
    showToast('Lugar agregado', 'success')
  }
  prevMarkersCount.value = newCount
})

// Item counts
const totalItems = computed(() => mapEditor.markers.value.length + mapEditor.routes.value.length)

// Search functionality
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const showResults = ref(false)
let searchTimeout = null

const getMapData = () => ({
  currentTile: mapEditor.currentTile.value,
  geojson: mapEditor.exportGeoJSON()
})

const loadMapData = (data) => {
  while (mapEditor.markers.value.length > 0) {
    mapEditor.removeMarker(mapEditor.markers.value[0].id)
  }
  while (mapEditor.routes.value.length > 0) {
    mapEditor.removeRoute(mapEditor.routes.value[0].id)
  }
  if (data.currentTile) mapEditor.setTileLayer(data.currentTile)
  if (data.geojson) mapEditor.importGeoJSON(data.geojson)
  showToast('Mapa cargado', 'success')
}

async function searchLocation(query) {
  if (!query || query.length < 3) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
      { headers: { 'Accept-Language': 'es,en' } }
    )
    const data = await response.json()
    searchResults.value = data.map(item => ({
      id: item.place_id,
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      icon: getPlaceIcon(item.type, item.class)
    }))
    showResults.value = true
  } catch (err) {
    console.error('Search error:', err)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

function getPlaceIcon(type, placeClass) {
  if (placeClass === 'place' || type === 'city' || type === 'town' || type === 'village') {
    return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
  }
  if (placeClass === 'highway' || type === 'road' || type === 'street') {
    return 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
  }
  if (placeClass === 'amenity') {
    return 'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z'
  }
  return 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z'
}

function selectResult(result) {
  mapEditor.map.value.flyTo([result.lat, result.lng], 15, {
    duration: 1.5,
    easeLinearity: 0.25
  })
  searchQuery.value = ''
  searchResults.value = []
  showResults.value = false
}

function handleSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchLocation(searchQuery.value)
  }, 300)
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  showResults.value = false
}

function handleFileImport(e) {
  const file = e.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const geojson = JSON.parse(event.target.result)
      mapEditor.importGeoJSON(geojson)
      showToast('GeoJSON importado', 'success')
    } catch (err) {
      console.error('Error parsing GeoJSON:', err)
      showToast('Error al importar', 'error')
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

function selectTool(toolId) {
  mapEditor.setTool(toolId)
  showToolsPanel.value = false
}

function handleFinishRoute() {
  if (mapEditor.routeWaypoints.value.length < 2) {
    showToast('Necesitas al menos 2 puntos', 'error')
    return
  }
  mapEditor.finishRoute()
}

function handleCancelRoute() {
  mapEditor.cancelRoute()
  showToast('Ruta cancelada', 'info')
}

// Start GPS tracking (always on)
function initGpsTracking() {
  if (!navigator.geolocation) {
    console.warn('Geolocation not supported')
    return
  }

  gpsWatchId.value = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords
      userPosition.value = { lat: latitude, lng: longitude, accuracy }
      isLocating.value = false
      updateUserMarker()
      gpsError.value = null
    },
    (error) => {
      console.warn('GPS error:', error.message)
      gpsError.value = error.message
      isLocating.value = false
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000
    }
  )
}

function updateUserMarker() {
  if (!userPosition.value || !mapEditor.map.value) return

  const { lat, lng, accuracy } = userPosition.value

  // Update or create accuracy circle
  if (userAccuracyCircle.value) {
    userAccuracyCircle.value.setLatLng([lat, lng])
    userAccuracyCircle.value.setRadius(accuracy)
  } else {
    userAccuracyCircle.value = L.circle([lat, lng], {
      radius: accuracy,
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      color: '#3b82f6',
      weight: 1,
      opacity: 0.3
    }).addTo(mapEditor.map.value)
  }

  // Update or create user marker
  if (userMarker.value) {
    userMarker.value.setLatLng([lat, lng])
  } else {
    // Create custom user marker (blue dot with white border and pulse)
    userMarker.value = L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: '#3b82f6',
      color: '#ffffff',
      weight: 3,
      opacity: 1,
      fillOpacity: 1
    }).addTo(mapEditor.map.value)

    // Bring to front
    userMarker.value.bringToFront()
  }
}

function goToMyLocation() {
  if (userPosition.value && mapEditor.map.value) {
    mapEditor.map.value.flyTo([userPosition.value.lat, userPosition.value.lng], 16, {
      duration: 1
    })
  } else {
    isLocating.value = true
    showToast('Obteniendo ubicación...', 'info')

    // Try to get a fresh position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        userPosition.value = { lat: latitude, lng: longitude, accuracy }
        updateUserMarker()
        mapEditor.map.value.flyTo([latitude, longitude], 16, { duration: 1 })
        isLocating.value = false
      },
      (error) => {
        showToast('No se pudo obtener ubicación', 'error')
        isLocating.value = false
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }
}

// Open route detail
function openRouteDetail(route) {
  selectedRoute.value = route
  showRouteDetail.value = true
  showLayersPanel.value = false
}

// Close route detail
function closeRouteDetail() {
  showRouteDetail.value = false
  selectedRoute.value = null
}

// Focus route from detail
function focusRouteFromDetail() {
  if (selectedRoute.value) {
    mapEditor.focusRoute(selectedRoute.value.id)
    showRouteDetail.value = false
  }
}

// Start route navigation
function startNavigation() {
  if (!selectedRoute.value) return

  if (!navigator.geolocation) {
    showToast('Tu navegador no soporta GPS', 'error')
    return
  }

  isNavigating.value = true
  showRouteDetail.value = false

  // Focus on route
  mapEditor.focusRoute(selectedRoute.value.id)

  showToast('Navegación iniciada', 'success')
}

function stopNavigation() {
  isNavigating.value = false
  showToast('Navegación detenida', 'info')
}

onMounted(() => {
  if (mapContainer.value) {
    mapEditor.initMap(mapContainer.value)
  }
  prevRoutesCount.value = mapEditor.routes.value.length
  prevMarkersCount.value = mapEditor.markers.value.length

  // Start GPS tracking
  initGpsTracking()
})

onUnmounted(() => {
  // Stop GPS tracking
  if (gpsWatchId.value !== null) {
    navigator.geolocation.clearWatch(gpsWatchId.value)
    gpsWatchId.value = null
  }

  if (userMarker.value && mapEditor.map.value) {
    mapEditor.map.value.removeLayer(userMarker.value)
  }
  if (userAccuracyCircle.value && mapEditor.map.value) {
    mapEditor.map.value.removeLayer(userAccuracyCircle.value)
  }

  mapEditor.destroyMap()
  clearTimeout(searchTimeout)
  clearTimeout(toastTimeout)
})

const tools = [
  { id: 'marker', name: 'Lugar', description: 'Toca el mapa para agregar', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'route', name: 'Ruta', description: 'Toca puntos y confirma', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 2m0 13V2m0 0L9 5' }
]

const currentTool = computed(() => tools.find(t => t.id === mapEditor.activeTool.value))
</script>

<template>
  <div class="h-full w-full flex relative overflow-hidden app-bg" style="touch-action: pan-x pan-y;">
    <!-- Map Container -->
    <div ref="mapContainer" class="absolute inset-0 z-0"></div>

    <!-- Loading Overlay (route calculation) -->
    <Transition name="fade">
      <div
        v-if="mapEditor.isCalculatingRoute.value"
        class="absolute inset-0 z-50 bg-black/60 flex items-center justify-center"
      >
        <div class="bg-neutral-900 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-xl border border-neutral-800">
          <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div class="text-white font-medium">Calculando ruta...</div>
          <div class="text-neutral-400 text-sm">Esto puede tardar unos segundos</div>
        </div>
      </div>
    </Transition>

    <!-- Toast Notification -->
    <Transition name="toast">
      <div
        v-if="toast.show"
        class="absolute top-16 left-4 right-4 z-50 flex justify-center pointer-events-none"
      >
        <div
          class="px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 pointer-events-auto"
          :class="{
            'bg-green-900/90 border border-green-700': toast.type === 'success',
            'bg-red-900/90 border border-red-700': toast.type === 'error',
            'bg-blue-900/90 border border-blue-700': toast.type === 'info'
          }"
        >
          <svg v-if="toast.type === 'success'" class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else-if="toast.type === 'error'" class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <svg v-else class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-white text-sm font-medium">{{ toast.message }}</span>
        </div>
      </div>
    </Transition>

    <!-- Search Bar -->
    <div class="absolute top-3 left-3 right-3 z-20">
      <div class="relative">
        <div class="flex items-center bg-neutral-900/95 backdrop-blur-sm rounded-xl border border-neutral-700 shadow-lg">
          <svg class="w-5 h-5 text-neutral-400 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            @input="handleSearchInput"
            @focus="showResults = searchResults.length > 0"
            type="text"
            placeholder="Buscar ubicacion..."
            class="flex-1 bg-transparent px-3 py-3 text-sm text-white placeholder-neutral-500 outline-none"
          />
          <div v-if="isSearching" class="mr-3">
            <svg class="w-5 h-5 text-neutral-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <button
            v-else-if="searchQuery"
            @click="clearSearch"
            class="mr-3 p-1 text-neutral-400 active:text-white"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Search Results -->
        <div
          v-if="showResults && searchResults.length > 0"
          class="absolute top-full left-0 right-0 mt-2 bg-neutral-900/95 backdrop-blur-sm rounded-xl border border-neutral-700 shadow-xl overflow-hidden max-h-64 overflow-y-auto"
        >
          <button
            v-for="result in searchResults"
            :key="result.id"
            @click="selectResult(result)"
            class="w-full flex items-start gap-3 px-4 py-3 active:bg-neutral-800/80 text-left border-b border-neutral-800 last:border-0"
          >
            <svg class="w-5 h-5 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="result.icon" />
            </svg>
            <div class="min-w-0 flex-1">
              <div class="text-sm text-white truncate">{{ result.name.split(',')[0] }}</div>
              <div class="text-xs text-neutral-500 truncate">{{ result.name.split(',').slice(1).join(',').trim() }}</div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Current Mode Indicator (floating pill) -->
    <div
      v-if="currentTool && !mapEditor.isRoutingMode.value"
      class="absolute top-16 left-1/2 -translate-x-1/2 z-10"
    >
      <div class="px-4 py-2 bg-neutral-900/90 backdrop-blur-sm rounded-full border border-neutral-700 flex items-center gap-2">
        <div
          class="w-3 h-3 rounded-full"
          :style="{ backgroundColor: currentTool.id === 'marker' ? mapEditor.selectedMarkerColor.value : mapEditor.selectedRouteColor.value }"
        ></div>
        <span class="text-sm text-white">{{ currentTool.description }}</span>
      </div>
    </div>

    <!-- Route Building Status Bar -->
    <div
      v-if="mapEditor.isRoutingMode.value"
      class="absolute top-16 left-3 right-3 z-10"
    >
      <div class="bg-blue-900/90 backdrop-blur-sm rounded-xl border border-blue-700 p-3">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <span class="text-sm font-medium text-white">Creando ruta</span>
          </div>
          <span class="text-xs text-blue-300">{{ mapEditor.routeWaypoints.value.length }} puntos</span>
        </div>
        <div class="flex gap-2">
          <button
            @click="handleFinishRoute"
            :disabled="mapEditor.routeWaypoints.value.length < 2"
            class="flex-1 py-2.5 bg-green-600 active:bg-green-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2"
            style="touch-action: manipulation;"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Crear ruta
          </button>
          <button
            @click="mapEditor.removeLastWaypoint()"
            :disabled="mapEditor.routeWaypoints.value.length === 0"
            class="px-4 py-2.5 bg-yellow-600 active:bg-yellow-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded-lg"
            style="touch-action: manipulation;"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            @click="handleCancelRoute"
            class="px-4 py-2.5 bg-red-600 active:bg-red-500 text-white rounded-lg"
            style="touch-action: manipulation;"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <!-- Waypoints preview -->
        <div v-if="mapEditor.routeWaypoints.value.length > 0" class="mt-3 pt-3 border-t border-blue-700/50">
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(wp, idx) in mapEditor.routeWaypoints.value"
              :key="idx"
              class="px-2 py-1 bg-blue-800/50 rounded text-xs text-blue-200 flex items-center gap-1"
            >
              <span class="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">{{ idx + 1 }}</span>
              <span class="truncate max-w-[100px]">{{ wp.address.split(',')[0] }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- My Location Button (floating) -->
    <button
      @click="goToMyLocation"
      class="absolute bottom-36 right-3 z-10 h-12 w-12 rounded-xl bg-neutral-900/95 backdrop-blur-sm border border-neutral-700 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      :class="{ 'border-blue-500': userPosition }"
      style="touch-action: manipulation;"
    >
      <svg v-if="!isLocating" class="w-6 h-6" :class="userPosition ? 'text-blue-400' : 'text-neutral-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <svg v-else class="w-5 h-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </button>

    <!-- Bottom Action Bar -->
    <div class="absolute bottom-20 left-3 right-3 z-10">
      <div class="flex items-center justify-between gap-3">
        <!-- Layers Button with Badge -->
        <button
          @click="showLayersPanel = true"
          class="relative h-14 px-5 rounded-2xl bg-neutral-900/95 backdrop-blur-sm border border-neutral-700 shadow-lg flex items-center gap-3 active:scale-95 transition-transform"
          style="touch-action: manipulation;"
        >
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span class="text-white text-sm font-medium">Mis elementos</span>
          <span
            v-if="totalItems > 0"
            class="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {{ totalItems }}
          </span>
        </button>

        <!-- Tools Button -->
        <button
          @click="showToolsPanel = true"
          class="h-14 w-14 rounded-2xl shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          :class="mapEditor.activeTool.value ? 'bg-blue-600' : 'bg-neutral-900/95 backdrop-blur-sm border border-neutral-700'"
          style="touch-action: manipulation;"
        >
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Tools Panel (Bottom Sheet) -->
    <Teleport to="body">
      <Transition name="sheet">
        <div
          v-if="showToolsPanel"
          class="fixed inset-0 z-[9999]"
        >
          <div class="absolute inset-0 bg-black/50" @click="showToolsPanel = false"></div>
          <div class="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl border-t border-neutral-800 pb-8">
            <div class="w-12 h-1 bg-neutral-700 rounded-full mx-auto my-3"></div>

            <div class="px-4 pb-4">
              <h3 class="text-lg font-semibold text-white mb-1">Agregar al mapa</h3>
              <p class="text-sm text-neutral-400 mb-4">Selecciona que quieres crear</p>

              <!-- Tool Selection -->
              <div class="space-y-3 mb-6">
                <button
                  v-for="tool in tools"
                  :key="tool.id"
                  @click="selectTool(tool.id)"
                  class="w-full flex items-center gap-4 p-4 rounded-xl transition-all"
                  :class="mapEditor.activeTool.value === tool.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-800 text-neutral-300 active:bg-neutral-700'"
                  style="touch-action: manipulation;"
                >
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center" :class="mapEditor.activeTool.value === tool.id ? 'bg-blue-500' : 'bg-neutral-700'">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="tool.icon" />
                    </svg>
                  </div>
                  <div class="flex-1 text-left">
                    <div class="font-medium text-base">{{ tool.name }}</div>
                    <div class="text-sm opacity-70">{{ tool.description }}</div>
                  </div>
                  <svg v-if="mapEditor.activeTool.value === tool.id" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>

              <!-- Color Picker -->
              <div v-if="mapEditor.activeTool.value" class="mb-4">
                <p class="text-sm text-neutral-400 mb-3">Color del elemento</p>
                <div class="flex gap-3 flex-wrap">
                  <button
                    v-for="color in mapEditor.MARKER_COLORS"
                    :key="color"
                    @click="mapEditor.activeTool.value === 'marker'
                      ? mapEditor.selectedMarkerColor.value = color
                      : mapEditor.selectedRouteColor.value = color"
                    class="w-12 h-12 rounded-xl border-2 transition-all"
                    :class="(mapEditor.activeTool.value === 'marker'
                      ? mapEditor.selectedMarkerColor.value === color
                      : mapEditor.selectedRouteColor.value === color)
                        ? 'border-white scale-110'
                        : 'border-transparent'"
                    :style="{ backgroundColor: color }"
                    style="touch-action: manipulation;"
                  />
                </div>
              </div>

              <!-- Clear tool button -->
              <button
                v-if="mapEditor.activeTool.value"
                @click="mapEditor.setTool(null); showToolsPanel = false"
                class="w-full py-3 text-neutral-400 text-sm"
                style="touch-action: manipulation;"
              >
                Desactivar herramienta
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Layers Panel (Bottom Sheet) -->
    <Teleport to="body">
      <Transition name="sheet">
        <div
          v-if="showLayersPanel"
          class="fixed inset-0 z-[9999]"
        >
          <div class="absolute inset-0 bg-black/50" @click="showLayersPanel = false"></div>
          <div class="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl border-t border-neutral-800 flex flex-col" style="max-height: 75dvh;">
            <div class="w-12 h-1 bg-neutral-700 rounded-full mx-auto my-3 shrink-0"></div>

            <div class="flex items-center justify-between px-4 pb-3 shrink-0">
              <div>
                <h3 class="text-lg font-semibold text-white">Mis elementos</h3>
                <p class="text-sm text-neutral-400">{{ totalItems }} elemento{{ totalItems !== 1 ? 's' : '' }} en el mapa</p>
              </div>
              <button @click="showLayersPanel = false" class="p-2 text-neutral-400 active:text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto px-4 pb-8">
              <!-- Tile Layers -->
              <div class="mb-6">
                <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Estilo del mapa</p>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    v-for="(tile, key) in mapEditor.TILE_LAYERS"
                    :key="key"
                    @click="mapEditor.setTileLayer(key)"
                    class="px-4 py-3 text-sm rounded-xl transition-all"
                    :class="mapEditor.currentTile.value === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-800 text-neutral-300 active:bg-neutral-700'"
                    style="touch-action: manipulation;"
                  >
                    {{ tile.name }}
                  </button>
                </div>
              </div>

              <!-- Routes List -->
              <div v-if="mapEditor.routes.value.length > 0" class="mb-6">
                <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                  Rutas ({{ mapEditor.routes.value.length }})
                </p>
                <div class="space-y-2">
                  <div
                    v-for="route in mapEditor.routes.value"
                    :key="route.id"
                    class="p-4 rounded-xl bg-neutral-800/50 active:bg-neutral-800"
                    @click="openRouteDetail(route)"
                  >
                    <div class="flex items-center gap-3 mb-2">
                      <div class="w-4 h-4 rounded" :style="{ backgroundColor: route.color }"></div>
                      <div class="flex-1">
                        <div class="text-white font-medium">
                          {{ mapEditor.formatDistance(route.distance) }}
                        </div>
                        <div class="text-xs text-neutral-400">
                          {{ mapEditor.formatDuration(route.duration) }}
                        </div>
                      </div>
                      <button
                        @click.stop="mapEditor.removeRoute(route.id)"
                        class="p-2 text-red-400 active:text-red-300"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <!-- Route stops -->
                    <div class="ml-7 pl-3 border-l-2 border-neutral-700 space-y-1">
                      <div
                        v-for="(city, idx) in route.cities.slice(0, 4)"
                        :key="idx"
                        class="flex items-center gap-2"
                      >
                        <div
                          class="w-2 h-2 rounded-full"
                          :style="{ backgroundColor: idx === 0 || idx === route.cities.length - 1 ? route.color : '#525252' }"
                        ></div>
                        <span class="text-xs text-neutral-400">{{ city }}</span>
                      </div>
                      <div v-if="route.cities.length > 4" class="text-xs text-neutral-500 pl-4">
                        +{{ route.cities.length - 4 }} mas...
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Places List -->
              <div v-if="mapEditor.markers.value.length > 0" class="mb-6">
                <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                  Lugares ({{ mapEditor.markers.value.length }})
                </p>
                <div class="space-y-2">
                  <div
                    v-for="marker in mapEditor.markers.value"
                    :key="marker.id"
                    class="flex items-center gap-3 p-4 rounded-xl bg-neutral-800/50 active:bg-neutral-800"
                    @click="mapEditor.focusMarker(marker.id); showLayersPanel = false"
                  >
                    <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: marker.color }"></div>
                    <div class="flex-1 min-w-0">
                      <div class="text-white font-medium truncate">{{ marker.title }}</div>
                      <div class="text-xs text-neutral-400 truncate">{{ marker.shortAddress }}</div>
                    </div>
                    <button
                      @click.stop="mapEditor.removeMarker(marker.id)"
                      class="p-2 text-red-400 active:text-red-300"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="totalItems === 0" class="py-12 text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-800 flex items-center justify-center">
                  <svg class="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div class="text-neutral-400 font-medium mb-1">Sin elementos</div>
                <div class="text-neutral-500 text-sm">Usa el boton + para agregar lugares y rutas</div>
              </div>

              <!-- Export/Import -->
              <div v-if="totalItems > 0" class="pt-4 border-t border-neutral-800 space-y-3">
                <div class="flex gap-2">
                  <button
                    @click="mapEditor.downloadGeoJSON(); showToast('GeoJSON descargado', 'success')"
                    class="flex-1 px-4 py-3 text-sm bg-blue-600 active:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2"
                    style="touch-action: manipulation;"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Exportar
                  </button>
                  <button
                    @click="fileInput.click()"
                    class="flex-1 px-4 py-3 text-sm bg-neutral-800 active:bg-neutral-700 text-neutral-300 rounded-xl flex items-center justify-center gap-2"
                    style="touch-action: manipulation;"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Importar
                  </button>
                  <input
                    ref="fileInput"
                    type="file"
                    accept=".geojson,.json"
                    class="hidden"
                    @change="handleFileImport"
                  />
                </div>
                <VaultSaveLoad storeName="map-projects" :getData="getMapData" label="mapa" @load="loadMapData" />
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Route Detail Panel (Full Screen) -->
    <Teleport to="body">
      <Transition name="sheet">
        <div
          v-if="showRouteDetail && selectedRoute"
          class="fixed inset-0 z-[9999]"
        >
          <div class="absolute inset-0 bg-black/50" @click="closeRouteDetail"></div>
          <div class="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl border-t border-neutral-800 flex flex-col" style="max-height: 85dvh;">
            <div class="w-12 h-1 bg-neutral-700 rounded-full mx-auto my-3 shrink-0"></div>

            <!-- Header -->
            <div class="flex items-center justify-between px-4 pb-3 shrink-0 border-b border-neutral-800">
              <div class="flex items-center gap-3">
                <div class="w-4 h-4 rounded" :style="{ backgroundColor: selectedRoute.color }"></div>
                <div>
                  <div class="text-lg font-semibold text-white">{{ mapEditor.formatDistance(selectedRoute.distance) }}</div>
                  <div class="text-sm text-neutral-400">{{ mapEditor.formatDuration(selectedRoute.duration) }}</div>
                </div>
              </div>
              <button @click="closeRouteDetail" class="p-2 text-neutral-400 active:text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Route Cities (scrollable) -->
            <div class="flex-1 overflow-y-auto px-4 py-4">
              <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                Ciudades en la ruta ({{ selectedRoute.cities.length }})
              </p>
              <div class="relative pl-6">
                <!-- Vertical line -->
                <div class="absolute left-[7px] top-2 bottom-2 w-0.5 bg-neutral-700"></div>

                <div class="space-y-4">
                  <div
                    v-for="(city, idx) in selectedRoute.cities"
                    :key="idx"
                    class="relative flex items-center gap-3"
                  >
                    <!-- Dot -->
                    <div
                      class="absolute -left-6 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                      :class="idx === 0 || idx === selectedRoute.cities.length - 1
                        ? 'border-white bg-neutral-900'
                        : 'border-neutral-600 bg-neutral-800'"
                      :style="idx === 0 || idx === selectedRoute.cities.length - 1
                        ? { borderColor: selectedRoute.color }
                        : {}"
                    >
                      <div
                        v-if="idx === 0 || idx === selectedRoute.cities.length - 1"
                        class="w-2 h-2 rounded-full"
                        :style="{ backgroundColor: selectedRoute.color }"
                      ></div>
                    </div>

                    <!-- City name -->
                    <div class="flex-1 py-2">
                      <span
                        class="text-sm"
                        :class="idx === 0 || idx === selectedRoute.cities.length - 1
                          ? 'text-white font-medium'
                          : 'text-neutral-400'"
                      >
                        {{ city }}
                      </span>
                      <span v-if="idx === 0" class="ml-2 text-xs text-green-400">(inicio)</span>
                      <span v-if="idx === selectedRoute.cities.length - 1 && idx !== 0" class="ml-2 text-xs text-red-400">(destino)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="p-4 border-t border-neutral-800 space-y-3 shrink-0 pb-8">
              <button
                @click="focusRouteFromDetail"
                class="w-full py-3.5 bg-neutral-800 active:bg-neutral-700 text-white rounded-xl flex items-center justify-center gap-2"
                style="touch-action: manipulation;"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver en el mapa
              </button>

              <button
                @click="startNavigation"
                class="w-full py-3.5 bg-blue-600 active:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2 font-medium"
                style="touch-action: manipulation;"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Comenzar ruta
              </button>

              <button
                @click="mapEditor.removeRoute(selectedRoute.id); closeRouteDetail()"
                class="w-full py-3 text-red-400 text-sm"
                style="touch-action: manipulation;"
              >
                Eliminar ruta
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- GPS Navigation Bar (floating) -->
    <Transition name="slide-up">
      <div
        v-if="isNavigating && selectedRoute"
        class="absolute bottom-36 left-3 right-16 z-20"
      >
        <div class="bg-blue-900/95 backdrop-blur-sm rounded-2xl border border-blue-700 p-3 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div class="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0"></div>
              <div class="min-w-0">
                <div class="text-white text-sm font-medium truncate">
                  {{ selectedRoute.cities[0] }} → {{ selectedRoute.cities[selectedRoute.cities.length - 1] }}
                </div>
                <div class="text-xs text-blue-300">
                  {{ mapEditor.formatDistance(selectedRoute.distance) }} · {{ mapEditor.formatDuration(selectedRoute.duration) }}
                </div>
              </div>
            </div>
            <button
              @click="stopNavigation"
              class="ml-2 p-2 bg-red-600/80 active:bg-red-500 text-white rounded-lg shrink-0"
              style="touch-action: manipulation;"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
/* Hide zoom controls on mobile - pinch to zoom works natively */
.leaflet-control-zoom {
  display: none !important;
}

/* Leaflet styles for mobile */
.custom-marker-icon {
  background: none !important;
  border: none !important;
}

.leaflet-popup-content-wrapper {
  background: rgba(23, 23, 23, 0.95) !important;
  border: 1px solid rgba(64, 64, 64, 0.5) !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
}

.leaflet-popup-content {
  margin: 12px !important;
  color: #e5e5e5 !important;
}

.leaflet-popup-tip {
  background: rgba(23, 23, 23, 0.95) !important;
  border: 1px solid rgba(64, 64, 64, 0.5) !important;
  box-shadow: none !important;
}

.leaflet-popup-close-button {
  color: #737373 !important;
  font-size: 20px !important;
  padding: 8px !important;
}

.marker-popup {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.popup-title {
  background: rgba(38, 38, 38, 0.8);
  border: 1px solid rgba(64, 64, 64, 0.5);
  border-radius: 8px;
  padding: 10px 14px;
  color: #e5e5e5;
  font-size: 15px;
  font-weight: 500;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.popup-description {
  background: rgba(38, 38, 38, 0.8);
  border: 1px solid rgba(64, 64, 64, 0.5);
  border-radius: 8px;
  padding: 10px 14px;
  color: #a3a3a3;
  font-size: 14px;
  outline: none;
  resize: vertical;
  min-height: 70px;
  width: 100%;
  box-sizing: border-box;
}

.popup-address,
.popup-coords {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 0;
}

.popup-icon {
  width: 16px;
  height: 16px;
  color: #737373;
  flex-shrink: 0;
  margin-top: 1px;
}

.popup-address-text {
  font-size: 13px;
  color: #a3a3a3;
  line-height: 1.4;
  word-break: break-word;
}

.popup-coords-text {
  font-size: 12px;
  color: #737373;
  font-family: ui-monospace, monospace;
  padding: 4px 8px;
  background: rgba(38, 38, 38, 0.6);
  border-radius: 6px;
}

.route-tooltip {
  background: rgba(23, 23, 23, 0.95) !important;
  border: 1px solid rgba(64, 64, 64, 0.5) !important;
  border-radius: 8px !important;
  color: #e5e5e5 !important;
  font-size: 13px !important;
  padding: 8px 12px !important;
}

.leaflet-bar {
  border: 1px solid rgba(64, 64, 64, 0.5) !important;
  border-radius: 12px !important;
  overflow: hidden;
}

.leaflet-bar a {
  background: rgba(23, 23, 23, 0.95) !important;
  color: #a3a3a3 !important;
  border-bottom-color: rgba(64, 64, 64, 0.5) !important;
  width: 36px !important;
  height: 36px !important;
  line-height: 36px !important;
}

.leaflet-control-scale-line {
  background: rgba(23, 23, 23, 0.8) !important;
  border-color: rgba(64, 64, 64, 0.5) !important;
  color: #a3a3a3 !important;
}

.leaflet-control-attribution {
  background: rgba(23, 23, 23, 0.8) !important;
  color: #737373 !important;
  font-size: 10px !important;
}

.leaflet-control-attribution a {
  color: #a3a3a3 !important;
}
</style>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: all 0.3s ease;
}

.sheet-enter-active > div:last-child,
.sheet-leave-active > div:last-child {
  transition: transform 0.3s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from > div:last-child,
.sheet-leave-to > div:last-child {
  transform: translateY(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>

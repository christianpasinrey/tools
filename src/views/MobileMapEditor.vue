<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useMapEditor } from '../composables/useMapEditor'
import VaultSaveLoad from '../components/common/VaultSaveLoad.vue'
import 'leaflet/dist/leaflet.css'

const mapEditor = useMapEditor()

const mapContainer = ref(null)
const fileInput = ref(null)
const showLayersPanel = ref(false)
const showToolsPanel = ref(false)

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
    } catch (err) {
      console.error('Error parsing GeoJSON:', err)
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

function selectTool(toolId) {
  mapEditor.setTool(toolId)
  showToolsPanel.value = false
}

onMounted(() => {
  if (mapContainer.value) {
    mapEditor.initMap(mapContainer.value)
  }
})

onUnmounted(() => {
  mapEditor.destroyMap()
  clearTimeout(searchTimeout)
})

const tools = [
  { id: 'marker', name: 'Lugar', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'route', name: 'Ruta', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 2m0 13V2m0 0L9 5' }
]
</script>

<template>
  <div class="h-full w-full flex relative overflow-hidden bg-neutral-950" style="touch-action: pan-x pan-y;">
    <!-- Map Container -->
    <div ref="mapContainer" class="absolute inset-0 z-0"></div>

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

    <!-- FAB Tools Button -->
    <button
      v-if="!showToolsPanel && !showLayersPanel"
      @click="showToolsPanel = true"
      class="absolute bottom-24 right-4 z-10 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
      :class="mapEditor.activeTool.value ? 'bg-blue-600' : 'bg-neutral-800'"
      style="touch-action: manipulation;"
    >
      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>

    <!-- FAB Layers Button -->
    <button
      v-if="!showToolsPanel && !showLayersPanel"
      @click="showLayersPanel = true"
      class="absolute bottom-24 left-4 z-10 w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center shadow-lg"
      style="touch-action: manipulation;"
    >
      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    </button>

    <!-- Route Controls (when routing) -->
    <div
      v-if="mapEditor.isRoutingMode.value"
      class="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex gap-2"
    >
      <button
        @click="mapEditor.finishRoute()"
        :disabled="mapEditor.routeWaypoints.value.length < 2"
        class="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center shadow-lg disabled:opacity-50"
        style="touch-action: manipulation;"
      >
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </button>
      <button
        @click="mapEditor.removeLastWaypoint()"
        :disabled="mapEditor.routeWaypoints.value.length === 0"
        class="w-12 h-12 rounded-full bg-yellow-600 flex items-center justify-center shadow-lg disabled:opacity-50"
        style="touch-action: manipulation;"
      >
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>
      <button
        @click="mapEditor.cancelRoute()"
        class="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg"
        style="touch-action: manipulation;"
      >
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Tools Panel (Bottom Sheet) -->
    <Teleport to="body">
      <Transition name="sheet">
        <div
          v-if="showToolsPanel"
          class="fixed inset-0 z-[9999]"
          @click.self="showToolsPanel = false"
        >
          <div class="absolute inset-0 bg-black/50" @click="showToolsPanel = false"></div>
          <div class="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl border-t border-neutral-800 pb-6">
            <div class="w-12 h-1 bg-neutral-700 rounded-full mx-auto my-3"></div>

            <div class="px-4 pb-4">
              <h3 class="text-white font-medium mb-4">Herramientas</h3>

              <!-- Tool Selection -->
              <div class="grid grid-cols-2 gap-3 mb-4">
                <button
                  v-for="tool in tools"
                  :key="tool.id"
                  @click="selectTool(tool.id)"
                  class="flex items-center gap-3 p-4 rounded-xl transition-all"
                  :class="mapEditor.activeTool.value === tool.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-800 text-neutral-300 active:bg-neutral-700'"
                  style="touch-action: manipulation;"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="tool.icon" />
                  </svg>
                  <span class="font-medium">{{ tool.name }}</span>
                </button>
              </div>

              <!-- Color Picker -->
              <div v-if="mapEditor.activeTool.value" class="mb-4">
                <p class="text-sm text-neutral-400 mb-2">Color</p>
                <div class="flex gap-2 flex-wrap">
                  <button
                    v-for="color in mapEditor.MARKER_COLORS"
                    :key="color"
                    @click="mapEditor.activeTool.value === 'marker'
                      ? mapEditor.selectedMarkerColor.value = color
                      : mapEditor.selectedRouteColor.value = color"
                    class="w-10 h-10 rounded-full border-2 transition-all"
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

              <!-- Instruction -->
              <p class="text-sm text-neutral-500 text-center">
                <template v-if="mapEditor.activeTool.value === 'marker'">Toca el mapa para agregar un lugar</template>
                <template v-else-if="mapEditor.activeTool.value === 'route'">Toca el mapa para agregar puntos de ruta</template>
                <template v-else>Selecciona una herramienta</template>
              </p>
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
          <div class="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl border-t border-neutral-800 flex flex-col" style="max-height: 70dvh;">
            <div class="w-12 h-1 bg-neutral-700 rounded-full mx-auto my-3 shrink-0"></div>

            <div class="flex items-center justify-between px-4 pb-3 shrink-0">
              <h3 class="text-white font-medium">Capas</h3>
              <button @click="showLayersPanel = false" class="p-2 text-neutral-400 active:text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto px-4 pb-6">
              <!-- Tile Layers -->
              <div class="mb-4">
                <p class="text-sm text-neutral-400 mb-2">Mapa base</p>
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

              <!-- Places List -->
              <div v-if="mapEditor.markers.value.length > 0" class="mb-4">
                <p class="text-sm text-neutral-400 mb-2">Lugares ({{ mapEditor.markers.value.length }})</p>
                <div class="space-y-2">
                  <div
                    v-for="marker in mapEditor.markers.value"
                    :key="marker.id"
                    class="flex items-center gap-3 p-3 rounded-xl bg-neutral-800/50 active:bg-neutral-800"
                    @click="mapEditor.focusMarker(marker.id); showLayersPanel = false"
                  >
                    <div class="w-4 h-4 rounded-full shrink-0" :style="{ backgroundColor: marker.color }"></div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm text-white truncate">{{ marker.title }}</div>
                      <div class="text-xs text-neutral-500 truncate">{{ marker.shortAddress }}</div>
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

              <!-- Routes List -->
              <div v-if="mapEditor.routes.value.length > 0" class="mb-4">
                <p class="text-sm text-neutral-400 mb-2">Rutas ({{ mapEditor.routes.value.length }})</p>
                <div class="space-y-2">
                  <div
                    v-for="route in mapEditor.routes.value"
                    :key="route.id"
                    class="p-3 rounded-xl bg-neutral-800/50 active:bg-neutral-800"
                    @click="mapEditor.focusRoute(route.id); showLayersPanel = false"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-4 h-4 rounded shrink-0" :style="{ backgroundColor: route.color }"></div>
                      <div class="flex-1">
                        <span class="text-sm text-white">Ruta</span>
                        <span class="text-xs text-neutral-500 ml-2">
                          {{ mapEditor.formatDistance(route.distance) }} · {{ mapEditor.formatDuration(route.duration) }}
                        </span>
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
                    <div class="mt-2 ml-7 pl-2 border-l-2 border-neutral-700">
                      <div
                        v-for="(city, idx) in route.cities"
                        :key="idx"
                        class="flex items-center gap-2 py-0.5"
                      >
                        <div
                          class="shrink-0 rounded-full"
                          :class="idx === 0 || idx === route.cities.length - 1 ? 'w-2 h-2' : 'w-1.5 h-1.5'"
                          :style="{ backgroundColor: idx === 0 || idx === route.cities.length - 1 ? route.color : '#525252' }"
                        ></div>
                        <span class="text-xs text-neutral-500">{{ city }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="mapEditor.markers.value.length === 0 && mapEditor.routes.value.length === 0" class="py-6 text-center">
                <div class="text-neutral-500 text-sm">Sin elementos</div>
                <div class="text-neutral-600 text-xs mt-1">Usa las herramientas para agregar lugares y rutas</div>
              </div>

              <!-- Export/Import -->
              <div class="pt-4 border-t border-neutral-800 space-y-3">
                <div class="flex gap-2">
                  <button
                    @click="mapEditor.downloadGeoJSON()"
                    class="flex-1 px-4 py-3 text-sm bg-blue-600 active:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2"
                    :disabled="mapEditor.markers.value.length === 0 && mapEditor.routes.value.length === 0"
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
</style>

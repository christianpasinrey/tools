<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useMapEditor } from '../composables/useMapEditor'
import VaultSaveLoad from '../components/common/VaultSaveLoad.vue'
import 'leaflet/dist/leaflet.css'

const mapEditor = useMapEditor()

const getMapData = () => ({
  currentTile: mapEditor.currentTile.value,
  geojson: mapEditor.exportGeoJSON()
})

const loadMapData = (data) => {
  // Clear existing markers and routes
  while (mapEditor.markers.value.length > 0) {
    mapEditor.removeMarker(mapEditor.markers.value[0].id)
  }
  while (mapEditor.routes.value.length > 0) {
    mapEditor.removeRoute(mapEditor.routes.value[0].id)
  }
  // Restore tile layer
  if (data.currentTile) mapEditor.setTileLayer(data.currentTile)
  // Import GeoJSON data
  if (data.geojson) mapEditor.importGeoJSON(data.geojson)
}
const mapContainer = ref(null)
const fileInput = ref(null)

// Search functionality
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const showResults = ref(false)
const searchInput = ref(null)
let searchTimeout = null

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

function handleClickOutside(e) {
  if (searchInput.value && !searchInput.value.contains(e.target)) {
    showResults.value = false
  }
}

onMounted(() => {
  if (mapContainer.value) {
    mapEditor.initMap(mapContainer.value)
  }
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  mapEditor.destroyMap()
  document.removeEventListener('click', handleClickOutside)
  clearTimeout(searchTimeout)
})

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

const tools = [
  { id: 'marker', name: 'Place', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'route', name: 'Route', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-.553-.894L15 2m0 13V2m0 0L9 5' }
]
</script>

<template>
  <div class="h-full w-full flex relative overflow-hidden bg-neutral-950">
    <!-- Map Container -->
    <div ref="mapContainer" class="absolute inset-0 z-0"></div>

    <!-- Search Bar -->
    <div ref="searchInput" class="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-80">
      <div class="relative">
        <div class="flex items-center bg-neutral-900/95 backdrop-blur-sm rounded-lg border border-neutral-700 shadow-lg">
          <svg class="w-5 h-5 text-neutral-400 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            @input="handleSearchInput"
            @focus="showResults = searchResults.length > 0"
            type="text"
            placeholder="Buscar ubicación..."
            class="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none"
          />
          <div v-if="isSearching" class="mr-3">
            <svg class="w-4 h-4 text-neutral-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <button
            v-else-if="searchQuery"
            @click="clearSearch"
            class="mr-3 text-neutral-400 hover:text-white transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Search Results Dropdown -->
        <div
          v-if="showResults && searchResults.length > 0"
          class="absolute top-full left-0 right-0 mt-2 bg-neutral-900/95 backdrop-blur-sm rounded-lg border border-neutral-700 shadow-xl overflow-hidden"
        >
          <div class="max-h-72 overflow-y-auto">
            <button
              v-for="result in searchResults"
              :key="result.id"
              @click="selectResult(result)"
              class="w-full flex items-start gap-3 px-4 py-3 hover:bg-neutral-800/80 transition-colors text-left border-b border-neutral-800 last:border-0"
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

        <!-- No Results -->
        <div
          v-else-if="showResults && searchQuery.length >= 3 && !isSearching && searchResults.length === 0"
          class="absolute top-full left-0 right-0 mt-2 bg-neutral-900/95 backdrop-blur-sm rounded-lg border border-neutral-700 shadow-xl p-4 text-center"
        >
          <div class="text-sm text-neutral-400">No se encontraron resultados</div>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="absolute top-4 left-4 flex flex-col gap-2 z-10">
      <!-- Drawing Tools -->
      <div class="bg-neutral-900/90 backdrop-blur-sm rounded-lg border border-neutral-800 p-1.5 flex flex-col gap-1">
        <button
          v-for="tool in tools"
          :key="tool.id"
          @click="mapEditor.setTool(tool.id)"
          class="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
          :class="mapEditor.activeTool.value === tool.id
            ? 'bg-blue-600 text-white'
            : 'text-neutral-400 hover:text-white hover:bg-neutral-800'"
          :title="tool.name"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="tool.icon" />
          </svg>
        </button>
      </div>

      <!-- Route Building Controls -->
      <div v-if="mapEditor.isRoutingMode.value"
           class="bg-neutral-900/90 backdrop-blur-sm rounded-lg border border-neutral-800 p-1.5 flex flex-col gap-1">
        <button
          @click="mapEditor.finishRoute()"
          class="w-9 h-9 rounded-lg flex items-center justify-center text-green-400 hover:text-green-300 hover:bg-neutral-800 transition-all"
          title="Finish Route (Enter)"
          :disabled="mapEditor.routeWaypoints.value.length < 2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button
          @click="mapEditor.removeLastWaypoint()"
          class="w-9 h-9 rounded-lg flex items-center justify-center text-yellow-400 hover:text-yellow-300 hover:bg-neutral-800 transition-all"
          title="Undo Last Point"
          :disabled="mapEditor.routeWaypoints.value.length === 0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          @click="mapEditor.cancelRoute()"
          class="w-9 h-9 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-neutral-800 transition-all"
          title="Cancel Route (Esc)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Color Picker for Place -->
      <div v-if="mapEditor.activeTool.value === 'marker'"
           class="bg-neutral-900/90 backdrop-blur-sm rounded-lg border border-neutral-800 p-2">
        <div class="grid grid-cols-4 gap-1">
          <button
            v-for="color in mapEditor.MARKER_COLORS"
            :key="color"
            @click="mapEditor.selectedMarkerColor.value = color"
            class="w-5 h-5 rounded-full border-2 transition-all"
            :class="mapEditor.selectedMarkerColor.value === color ? 'border-white scale-110' : 'border-transparent'"
            :style="{ backgroundColor: color }"
          />
        </div>
      </div>

      <!-- Color Picker for Route -->
      <div v-if="mapEditor.activeTool.value === 'route'"
           class="bg-neutral-900/90 backdrop-blur-sm rounded-lg border border-neutral-800 p-2">
        <div class="grid grid-cols-4 gap-1">
          <button
            v-for="color in mapEditor.MARKER_COLORS"
            :key="color"
            @click="mapEditor.selectedRouteColor.value = color"
            class="w-5 h-5 rounded-full border-2 transition-all"
            :class="mapEditor.selectedRouteColor.value === color ? 'border-white scale-110' : 'border-transparent'"
            :style="{ backgroundColor: color }"
          />
        </div>
      </div>

      <!-- Route Waypoints Preview -->
      <div v-if="mapEditor.isRoutingMode.value && mapEditor.routeWaypoints.value.length > 0"
           class="bg-neutral-900/90 backdrop-blur-sm rounded-lg border border-neutral-800 p-3 max-w-48">
        <div class="text-xs text-neutral-400 mb-2">Route waypoints</div>
        <div class="space-y-1">
          <div
            v-for="(wp, idx) in mapEditor.routeWaypoints.value"
            :key="idx"
            class="flex items-center gap-2"
          >
            <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: mapEditor.selectedRouteColor.value }"></div>
            <span class="text-xs text-neutral-300 truncate">{{ wp.address }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tile Selector -->
    <div class="absolute top-4 right-4 z-10" v-if="!mapEditor.layerPanelOpen.value">
      <button
        @click="mapEditor.layerPanelOpen.value = true"
        class="bg-neutral-900/90 backdrop-blur-sm rounded-lg border border-neutral-800 p-2 text-neutral-400 hover:text-white transition-colors"
        title="Open Layers"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </button>
    </div>

    <!-- Layer Panel -->
    <div
      v-if="mapEditor.layerPanelOpen.value"
      class="absolute top-4 right-4 bottom-20 w-72 bg-neutral-900/95 backdrop-blur-sm rounded-lg border border-neutral-800 z-10 flex flex-col overflow-hidden"
    >
      <!-- Panel Header -->
      <div class="flex items-center justify-between p-3 border-b border-neutral-800">
        <span class="text-sm font-medium text-white">Layers</span>
        <button
          @click="mapEditor.layerPanelOpen.value = false"
          class="text-neutral-400 hover:text-white transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Tile Layers -->
      <div class="p-3 border-b border-neutral-800">
        <div class="text-xs text-neutral-400 mb-2">Base Map</div>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="(tile, key) in mapEditor.TILE_LAYERS"
            :key="key"
            @click="mapEditor.setTileLayer(key)"
            class="px-3 py-1.5 text-xs rounded-md transition-all"
            :class="mapEditor.currentTile.value === key
              ? 'bg-blue-600 text-white'
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'"
          >
            {{ tile.name }}
          </button>
        </div>
      </div>

      <!-- Places & Routes List -->
      <div class="flex-1 overflow-y-auto">
        <!-- Places -->
        <div v-if="mapEditor.markers.value.length > 0" class="p-3 border-b border-neutral-800">
          <div class="text-xs text-neutral-400 mb-2">Places ({{ mapEditor.markers.value.length }})</div>
          <div class="space-y-1.5">
            <div
              v-for="marker in mapEditor.markers.value"
              :key="marker.id"
              class="flex items-start gap-2 p-2 rounded-md bg-neutral-800/50 hover:bg-neutral-800 cursor-pointer group"
              @click="mapEditor.focusMarker(marker.id)"
            >
              <div class="w-3 h-3 rounded-full mt-1 shrink-0" :style="{ backgroundColor: marker.color }"></div>
              <div class="flex-1 min-w-0">
                <div class="text-sm text-neutral-300 truncate">{{ marker.title }}</div>
                <div class="text-xs text-neutral-500 truncate mt-0.5" :title="marker.shortAddress">
                  {{ marker.shortAddress }}
                </div>
                <div class="text-xs text-neutral-600 font-mono mt-0.5">
                  {{ marker.lat.toFixed(5) }}, {{ marker.lng.toFixed(5) }}
                </div>
              </div>
              <button
                @click.stop="mapEditor.removeMarker(marker.id)"
                class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity mt-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Routes -->
        <div v-if="mapEditor.routes.value.length > 0" class="p-3">
          <div class="text-xs text-neutral-400 mb-2">Routes ({{ mapEditor.routes.value.length }})</div>
          <div class="space-y-1.5">
            <div
              v-for="route in mapEditor.routes.value"
              :key="route.id"
              class="p-2 rounded-md bg-neutral-800/50 hover:bg-neutral-800 cursor-pointer group"
              @click="mapEditor.focusRoute(route.id)"
            >
              <div class="flex items-start gap-2">
                <div class="w-3 h-3 rounded mt-1 shrink-0" :style="{ backgroundColor: route.color }"></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-neutral-300">Route</span>
                    <span class="text-xs text-neutral-500">
                      {{ mapEditor.formatDistance(route.distance) }} · {{ mapEditor.formatDuration(route.duration) }}
                    </span>
                  </div>
                </div>
                <button
                  @click.stop="mapEditor.removeRoute(route.id)"
                  class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <!-- Route cities - vertical list -->
              <div class="mt-2 ml-5 pl-2 border-l-2 border-neutral-700">
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
        <div v-if="mapEditor.markers.value.length === 0 && mapEditor.routes.value.length === 0" class="p-6 text-center">
          <div class="text-neutral-500 text-sm">No elements yet</div>
          <div class="text-neutral-600 text-xs mt-1">Use the tools to add places and routes</div>
        </div>
      </div>

      <!-- Export/Import -->
      <div class="p-3 border-t border-neutral-800 flex flex-col gap-2">
        <div class="flex gap-2">
          <button
            @click="mapEditor.downloadGeoJSON()"
            class="flex-1 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center justify-center gap-1"
            :disabled="mapEditor.markers.value.length === 0 && mapEditor.routes.value.length === 0"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <button
            @click="fileInput.click()"
            class="flex-1 px-3 py-2 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md transition-colors flex items-center justify-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
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

    <!-- Coordinates Display -->
    <div class="absolute bottom-4 left-4 bg-neutral-900/90 backdrop-blur-sm rounded-lg border border-neutral-800 px-3 py-2 z-10 flex items-center gap-3">
      <div class="text-xs">
        <span class="text-neutral-500">Lat:</span>
        <span class="text-neutral-300 ml-1 font-mono">{{ mapEditor.cursorCoords.value.lat }}</span>
      </div>
      <div class="text-xs">
        <span class="text-neutral-500">Lng:</span>
        <span class="text-neutral-300 ml-1 font-mono">{{ mapEditor.cursorCoords.value.lng }}</span>
      </div>
      <button
        @click="mapEditor.copyCoordinates()"
        class="text-neutral-400 hover:text-white transition-colors"
        title="Copy coordinates"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
    </div>

    <!-- Instructions -->
    <div v-if="mapEditor.activeTool.value && !mapEditor.isRoutingMode.value"
         class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-neutral-900/90 backdrop-blur-sm rounded-lg border border-neutral-800 px-4 py-2 z-10">
      <div class="text-xs text-neutral-400">
        <template v-if="mapEditor.activeTool.value === 'marker'">Click to add a place</template>
        <template v-else-if="mapEditor.activeTool.value === 'route'">Click to add route waypoints</template>
      </div>
    </div>

    <div v-if="mapEditor.isRoutingMode.value"
         class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-neutral-900/90 backdrop-blur-sm rounded-lg border border-neutral-800 px-4 py-2 z-10">
      <div class="text-xs text-neutral-400">
        Click to add waypoints · <span class="text-neutral-500">Enter</span> to finish · <span class="text-neutral-500">Esc</span> to cancel
      </div>
    </div>
  </div>
</template>

<style>
/* Custom marker icon styles */
.custom-marker-icon {
  background: none !important;
  border: none !important;
}

/* Leaflet popup customization */
.leaflet-popup-content-wrapper {
  background: rgba(23, 23, 23, 0.95) !important;
  border: 1px solid rgba(64, 64, 64, 0.5) !important;
  border-radius: 8px !important;
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
}

.leaflet-popup-close-button:hover {
  color: #e5e5e5 !important;
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
  border-radius: 4px;
  padding: 8px 12px;
  color: #e5e5e5;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.popup-title:focus {
  border-color: #2563eb;
}

.popup-description {
  background: rgba(38, 38, 38, 0.8);
  border: 1px solid rgba(64, 64, 64, 0.5);
  border-radius: 4px;
  padding: 8px 12px;
  color: #a3a3a3;
  font-size: 13px;
  outline: none;
  resize: vertical;
  min-height: 70px;
  width: 100%;
  box-sizing: border-box;
}

.popup-description:focus {
  border-color: #2563eb;
}

.popup-address,
.popup-coords {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 0;
}

.popup-icon {
  width: 14px;
  height: 14px;
  color: #737373;
  flex-shrink: 0;
  margin-top: 1px;
}

.popup-address-text {
  font-size: 12px;
  color: #a3a3a3;
  line-height: 1.4;
  word-break: break-word;
}

.popup-coords-text {
  font-size: 11px;
  color: #737373;
  font-family: ui-monospace, monospace;
  cursor: pointer;
  padding: 2px 6px;
  background: rgba(38, 38, 38, 0.6);
  border-radius: 4px;
  transition: all 0.15s;
}

.popup-coords-text:hover {
  background: rgba(38, 38, 38, 0.9);
  color: #a3a3a3;
}

/* Route tooltip */
.route-tooltip {
  background: rgba(23, 23, 23, 0.95) !important;
  border: 1px solid rgba(64, 64, 64, 0.5) !important;
  border-radius: 6px !important;
  color: #e5e5e5 !important;
  font-size: 12px !important;
  padding: 6px 10px !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3) !important;
}

.route-tooltip::before {
  border-top-color: rgba(23, 23, 23, 0.95) !important;
}

/* Leaflet controls dark theme */
.leaflet-bar {
  border: 1px solid rgba(64, 64, 64, 0.5) !important;
  border-radius: 8px !important;
  overflow: hidden;
}

.leaflet-bar a {
  background: rgba(23, 23, 23, 0.95) !important;
  color: #a3a3a3 !important;
  border-bottom-color: rgba(64, 64, 64, 0.5) !important;
}

.leaflet-bar a:hover {
  background: rgba(38, 38, 38, 0.95) !important;
  color: #e5e5e5 !important;
}

.leaflet-control-scale-line {
  background: rgba(23, 23, 23, 0.8) !important;
  border-color: rgba(64, 64, 64, 0.5) !important;
  color: #a3a3a3 !important;
}

.leaflet-control-attribution {
  background: rgba(23, 23, 23, 0.8) !important;
  color: #737373 !important;
}

.leaflet-control-attribution a {
  color: #a3a3a3 !important;
}
</style>

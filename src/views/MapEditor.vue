<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useMapEditor } from '../composables/useMapEditor'
import 'leaflet/dist/leaflet.css'

const mapEditor = useMapEditor()
const mapContainer = ref(null)
const fileInput = ref(null)

onMounted(() => {
  if (mapContainer.value) {
    mapEditor.initMap(mapContainer.value)
  }
})

onUnmounted(() => {
  mapEditor.destroyMap()
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
  { id: 'marker', name: 'Marker', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'polyline', name: 'Line', icon: 'M4 20h4L20 8 16 4 4 16v4zm14-12l-4-4' },
  { id: 'polygon', name: 'Polygon', icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z' },
  { id: 'circle', name: 'Circle', icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z' },
  { id: 'rectangle', name: 'Rectangle', icon: 'M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z' },
  { id: 'measure', name: 'Measure', icon: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3.41 6h17.18M12 10v12' }
]
</script>

<template>
  <div class="h-full w-full flex relative overflow-hidden bg-neutral-950">
    <!-- Map Container -->
    <div ref="mapContainer" class="absolute inset-0 z-0"></div>

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

      <!-- Finish/Cancel Drawing -->
      <div v-if="mapEditor.isDrawing.value && ['polygon', 'polyline'].includes(mapEditor.activeTool.value)"
           class="bg-neutral-900/90 backdrop-blur-sm rounded-lg border border-neutral-800 p-1.5 flex flex-col gap-1">
        <button
          @click="mapEditor.finishDrawing()"
          class="w-9 h-9 rounded-lg flex items-center justify-center text-green-400 hover:text-green-300 hover:bg-neutral-800 transition-all"
          title="Finish"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button
          @click="mapEditor.cancelDrawing()"
          class="w-9 h-9 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-neutral-800 transition-all"
          title="Cancel"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Color Picker for Marker -->
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

      <!-- Color Picker for Shapes -->
      <div v-if="['polygon', 'polyline', 'circle', 'rectangle'].includes(mapEditor.activeTool.value)"
           class="bg-neutral-900/90 backdrop-blur-sm rounded-lg border border-neutral-800 p-2">
        <div class="grid grid-cols-4 gap-1">
          <button
            v-for="color in mapEditor.MARKER_COLORS"
            :key="color"
            @click="mapEditor.selectedShapeColor.value = color"
            class="w-5 h-5 rounded-full border-2 transition-all"
            :class="mapEditor.selectedShapeColor.value === color ? 'border-white scale-110' : 'border-transparent'"
            :style="{ backgroundColor: color }"
          />
        </div>
      </div>

      <!-- Measure Results -->
      <div v-if="mapEditor.activeTool.value === 'measure' && mapEditor.measurePoints.value.length > 0"
           class="bg-neutral-900/90 backdrop-blur-sm rounded-lg border border-neutral-800 p-3">
        <div class="text-xs text-neutral-400 mb-1">Distance</div>
        <div class="text-lg font-medium text-white">
          {{ mapEditor.formatDistance(mapEditor.measureDistance.value) }}
        </div>
        <button
          @click="mapEditor.clearMeasurement()"
          class="mt-2 text-xs text-red-400 hover:text-red-300"
        >
          Clear
        </button>
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

      <!-- Markers & Shapes List -->
      <div class="flex-1 overflow-y-auto">
        <!-- Markers -->
        <div v-if="mapEditor.markers.value.length > 0" class="p-3 border-b border-neutral-800">
          <div class="text-xs text-neutral-400 mb-2">Markers ({{ mapEditor.markers.value.length }})</div>
          <div class="space-y-1">
            <div
              v-for="marker in mapEditor.markers.value"
              :key="marker.id"
              class="flex items-center gap-2 p-2 rounded-md bg-neutral-800/50 hover:bg-neutral-800 cursor-pointer group"
              @click="mapEditor.focusMarker(marker.id)"
            >
              <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: marker.color }"></div>
              <span class="flex-1 text-sm text-neutral-300 truncate">{{ marker.title }}</span>
              <button
                @click.stop="mapEditor.removeMarker(marker.id)"
                class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Shapes -->
        <div v-if="mapEditor.shapes.value.length > 0" class="p-3">
          <div class="text-xs text-neutral-400 mb-2">Shapes ({{ mapEditor.shapes.value.length }})</div>
          <div class="space-y-1">
            <div
              v-for="shape in mapEditor.shapes.value"
              :key="shape.id"
              class="flex items-center gap-2 p-2 rounded-md bg-neutral-800/50 hover:bg-neutral-800 cursor-pointer group"
              @click="mapEditor.focusShape(shape.id)"
            >
              <div class="w-3 h-3 rounded" :style="{ backgroundColor: shape.color }"></div>
              <div class="flex-1 min-w-0">
                <div class="text-sm text-neutral-300 capitalize">{{ shape.type }}</div>
                <div class="text-xs text-neutral-500">
                  <template v-if="shape.area">{{ mapEditor.formatArea(shape.area) }}</template>
                  <template v-else-if="shape.length">{{ mapEditor.formatDistance(shape.length) }}</template>
                  <template v-else-if="shape.radius">r: {{ mapEditor.formatDistance(shape.radius) }}</template>
                </div>
              </div>
              <button
                @click.stop="mapEditor.removeShape(shape.id)"
                class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="mapEditor.markers.value.length === 0 && mapEditor.shapes.value.length === 0" class="p-6 text-center">
          <div class="text-neutral-500 text-sm">No elements yet</div>
          <div class="text-neutral-600 text-xs mt-1">Use the tools to add markers and shapes</div>
        </div>
      </div>

      <!-- Export/Import -->
      <div class="p-3 border-t border-neutral-800 flex gap-2">
        <button
          @click="mapEditor.downloadGeoJSON()"
          class="flex-1 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center justify-center gap-1"
          :disabled="mapEditor.markers.value.length === 0 && mapEditor.shapes.value.length === 0"
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

    <!-- Drawing Instructions -->
    <div v-if="mapEditor.activeTool.value && !mapEditor.isDrawing.value"
         class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-neutral-900/90 backdrop-blur-sm rounded-lg border border-neutral-800 px-4 py-2 z-10">
      <div class="text-xs text-neutral-400">
        <template v-if="mapEditor.activeTool.value === 'marker'">Click to place a marker</template>
        <template v-else-if="mapEditor.activeTool.value === 'polyline'">Click to add points, then click Finish</template>
        <template v-else-if="mapEditor.activeTool.value === 'polygon'">Click to add points, then click Finish</template>
        <template v-else-if="mapEditor.activeTool.value === 'circle'">Click center, then click to set radius</template>
        <template v-else-if="mapEditor.activeTool.value === 'rectangle'">Click to start, click again to finish</template>
        <template v-else-if="mapEditor.activeTool.value === 'measure'">Click to add measurement points</template>
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
}

.popup-title {
  background: rgba(38, 38, 38, 0.8);
  border: 1px solid rgba(64, 64, 64, 0.5);
  border-radius: 4px;
  padding: 6px 10px;
  color: #e5e5e5;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  width: 100%;
}

.popup-title:focus {
  border-color: #2563eb;
}

.popup-description {
  background: rgba(38, 38, 38, 0.8);
  border: 1px solid rgba(64, 64, 64, 0.5);
  border-radius: 4px;
  padding: 6px 10px;
  color: #a3a3a3;
  font-size: 12px;
  outline: none;
  resize: none;
  min-height: 60px;
  width: 100%;
}

.popup-description:focus {
  border-color: #2563eb;
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

import { ref, shallowRef, computed, onUnmounted } from 'vue'
import L from 'leaflet'

// Fix default marker icon paths for Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

// Tile layer configurations
const TILE_LAYERS = {
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  topo: {
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap contributors'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri'
  },
  dark: {
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB'
  }
}

// Marker color options
const MARKER_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#0891b2', '#ea580c', '#be185d']

// Generate custom marker icon with color
function createColoredIcon(color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <path fill="${color}" stroke="#fff" stroke-width="1" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5" fill="#fff"/>
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: 'custom-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
}

export function useMapEditor() {
  // Map instance
  const map = shallowRef(null)
  const mapContainer = ref(null)

  // State
  const currentTile = ref('osm')
  const currentTileLayer = shallowRef(null)
  const activeTool = ref(null) // 'marker', 'polygon', 'polyline', 'circle', 'rectangle', 'measure'
  const markers = ref([])
  const shapes = ref([])
  const measurePoints = ref([])
  const measureLine = shallowRef(null)
  const measureLabels = ref([])
  const cursorCoords = ref({ lat: 0, lng: 0 })
  const selectedMarkerColor = ref(MARKER_COLORS[0])
  const selectedShapeColor = ref('#2563eb')
  const layerPanelOpen = ref(true)

  // Drawing state
  const isDrawing = ref(false)
  const currentDrawingPoints = ref([])
  const tempDrawingLayer = shallowRef(null)

  // Edit mode
  const editingItem = ref(null)

  // Counter for IDs
  let idCounter = 0
  const generateId = () => ++idCounter

  // Initialize map
  function initMap(container, options = {}) {
    if (map.value) return

    const defaultOptions = {
      center: [40.4168, -3.7038], // Madrid
      zoom: 6,
      zoomControl: false
    }

    map.value = L.map(container, { ...defaultOptions, ...options })
    mapContainer.value = container

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map.value)

    // Add scale control
    L.control.scale({ position: 'bottomright', imperial: false }).addTo(map.value)

    // Set initial tile layer
    setTileLayer(currentTile.value)

    // Track mouse position
    map.value.on('mousemove', (e) => {
      cursorCoords.value = {
        lat: e.latlng.lat.toFixed(6),
        lng: e.latlng.lng.toFixed(6)
      }
    })

    // Handle map clicks
    map.value.on('click', handleMapClick)

    // Handle drawing
    map.value.on('mousemove', handleDrawingMove)
  }

  // Destroy map
  function destroyMap() {
    if (map.value) {
      map.value.remove()
      map.value = null
    }
  }

  // Set tile layer
  function setTileLayer(tileKey) {
    if (!map.value || !TILE_LAYERS[tileKey]) return

    if (currentTileLayer.value) {
      map.value.removeLayer(currentTileLayer.value)
    }

    const tileConfig = TILE_LAYERS[tileKey]
    currentTileLayer.value = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution
    }).addTo(map.value)

    currentTile.value = tileKey
  }

  // Handle map click based on active tool
  function handleMapClick(e) {
    if (!activeTool.value) return

    const { lat, lng } = e.latlng

    switch (activeTool.value) {
      case 'marker':
        addMarker(lat, lng)
        break
      case 'polygon':
      case 'polyline':
        handleDrawingClick(e)
        break
      case 'circle':
        if (!isDrawing.value) {
          startCircleDrawing(e)
        } else {
          finishCircleDrawing(e)
        }
        break
      case 'rectangle':
        if (!isDrawing.value) {
          startRectangleDrawing(e)
        } else {
          finishRectangleDrawing(e)
        }
        break
      case 'measure':
        addMeasurePoint(e)
        break
    }
  }

  // Add marker
  function addMarker(lat, lng, options = {}) {
    const id = generateId()
    const marker = {
      id,
      lat,
      lng,
      title: options.title || `Marker ${id}`,
      description: options.description || '',
      color: options.color || selectedMarkerColor.value,
      layer: null
    }

    const leafletMarker = L.marker([lat, lng], {
      icon: createColoredIcon(marker.color),
      draggable: true
    }).addTo(map.value)

    // Bind popup
    updateMarkerPopup(leafletMarker, marker)

    // Handle drag
    leafletMarker.on('dragend', (e) => {
      const pos = e.target.getLatLng()
      marker.lat = pos.lat
      marker.lng = pos.lng
    })

    marker.layer = leafletMarker
    markers.value.push(marker)

    return marker
  }

  // Update marker popup content
  function updateMarkerPopup(leafletMarker, marker) {
    const popupContent = `
      <div class="marker-popup">
        <input type="text" value="${marker.title}" class="popup-title" placeholder="Title" />
        <textarea class="popup-description" placeholder="Description">${marker.description}</textarea>
      </div>
    `
    leafletMarker.bindPopup(popupContent, { minWidth: 220, maxWidth: 300 })

    leafletMarker.on('popupopen', () => {
      const popup = leafletMarker.getPopup()
      const container = popup.getElement()

      const titleInput = container.querySelector('.popup-title')
      const descInput = container.querySelector('.popup-description')

      titleInput?.addEventListener('input', (e) => {
        marker.title = e.target.value
      })

      descInput?.addEventListener('input', (e) => {
        marker.description = e.target.value
      })
    })
  }

  // Remove marker
  function removeMarker(id) {
    const index = markers.value.findIndex(m => m.id === id)
    if (index === -1) return

    const marker = markers.value[index]
    if (marker.layer) {
      map.value.removeLayer(marker.layer)
    }
    markers.value.splice(index, 1)
  }

  // Update marker color
  function updateMarkerColor(id, color) {
    const marker = markers.value.find(m => m.id === id)
    if (!marker) return

    marker.color = color
    if (marker.layer) {
      marker.layer.setIcon(createColoredIcon(color))
    }
  }

  // Focus on marker
  function focusMarker(id) {
    const marker = markers.value.find(m => m.id === id)
    if (!marker) return

    map.value.setView([marker.lat, marker.lng], 15)
    marker.layer?.openPopup()
  }

  // Drawing - Polygon/Polyline
  function handleDrawingClick(e) {
    const { lat, lng } = e.latlng
    currentDrawingPoints.value.push([lat, lng])

    if (!isDrawing.value) {
      isDrawing.value = true
    }

    updateTempDrawingLayer()
  }

  function handleDrawingMove(e) {
    if (!isDrawing.value || !['polygon', 'polyline'].includes(activeTool.value)) return

    const points = [...currentDrawingPoints.value, [e.latlng.lat, e.latlng.lng]]

    if (tempDrawingLayer.value) {
      map.value.removeLayer(tempDrawingLayer.value)
    }

    if (activeTool.value === 'polygon') {
      tempDrawingLayer.value = L.polygon(points, {
        color: selectedShapeColor.value,
        fillOpacity: 0.3,
        dashArray: '5, 5'
      }).addTo(map.value)
    } else {
      tempDrawingLayer.value = L.polyline(points, {
        color: selectedShapeColor.value,
        dashArray: '5, 5'
      }).addTo(map.value)
    }
  }

  function updateTempDrawingLayer() {
    if (tempDrawingLayer.value) {
      map.value.removeLayer(tempDrawingLayer.value)
    }

    if (currentDrawingPoints.value.length < 2) return

    if (activeTool.value === 'polygon') {
      tempDrawingLayer.value = L.polygon(currentDrawingPoints.value, {
        color: selectedShapeColor.value,
        fillOpacity: 0.3,
        dashArray: '5, 5'
      }).addTo(map.value)
    } else {
      tempDrawingLayer.value = L.polyline(currentDrawingPoints.value, {
        color: selectedShapeColor.value,
        dashArray: '5, 5'
      }).addTo(map.value)
    }
  }

  function finishDrawing() {
    if (currentDrawingPoints.value.length < 2) {
      cancelDrawing()
      return
    }

    const id = generateId()
    const shape = {
      id,
      type: activeTool.value,
      points: [...currentDrawingPoints.value],
      color: selectedShapeColor.value,
      layer: null
    }

    if (tempDrawingLayer.value) {
      map.value.removeLayer(tempDrawingLayer.value)
      tempDrawingLayer.value = null
    }

    let layer
    if (activeTool.value === 'polygon') {
      layer = L.polygon(shape.points, {
        color: shape.color,
        fillOpacity: 0.3
      }).addTo(map.value)

      // Calculate area
      shape.area = calculatePolygonArea(shape.points)
    } else {
      layer = L.polyline(shape.points, {
        color: shape.color
      }).addTo(map.value)

      // Calculate length
      shape.length = calculatePolylineLength(shape.points)
    }

    shape.layer = layer
    shapes.value.push(shape)

    // Reset drawing state
    isDrawing.value = false
    currentDrawingPoints.value = []
  }

  function cancelDrawing() {
    if (tempDrawingLayer.value) {
      map.value.removeLayer(tempDrawingLayer.value)
      tempDrawingLayer.value = null
    }
    isDrawing.value = false
    currentDrawingPoints.value = []
  }

  // Circle drawing
  let circleCenter = null

  function startCircleDrawing(e) {
    circleCenter = e.latlng
    isDrawing.value = true

    tempDrawingLayer.value = L.circle(circleCenter, {
      radius: 1,
      color: selectedShapeColor.value,
      fillOpacity: 0.3,
      dashArray: '5, 5'
    }).addTo(map.value)

    map.value.on('mousemove', updateCircleRadius)
  }

  function updateCircleRadius(e) {
    if (!isDrawing.value || !circleCenter) return

    const radius = circleCenter.distanceTo(e.latlng)
    tempDrawingLayer.value?.setRadius(radius)
  }

  function finishCircleDrawing(e) {
    map.value.off('mousemove', updateCircleRadius)

    const radius = circleCenter.distanceTo(e.latlng)

    if (radius < 10) {
      cancelDrawing()
      circleCenter = null
      return
    }

    if (tempDrawingLayer.value) {
      map.value.removeLayer(tempDrawingLayer.value)
      tempDrawingLayer.value = null
    }

    const id = generateId()
    const shape = {
      id,
      type: 'circle',
      center: { lat: circleCenter.lat, lng: circleCenter.lng },
      radius,
      color: selectedShapeColor.value,
      layer: null
    }

    const layer = L.circle([shape.center.lat, shape.center.lng], {
      radius: shape.radius,
      color: shape.color,
      fillOpacity: 0.3
    }).addTo(map.value)

    shape.layer = layer
    shapes.value.push(shape)

    isDrawing.value = false
    circleCenter = null
  }

  // Rectangle drawing
  let rectangleStart = null

  function startRectangleDrawing(e) {
    rectangleStart = e.latlng
    isDrawing.value = true

    map.value.on('mousemove', updateRectangle)
  }

  function updateRectangle(e) {
    if (!isDrawing.value || !rectangleStart) return

    const bounds = L.latLngBounds(rectangleStart, e.latlng)

    if (tempDrawingLayer.value) {
      map.value.removeLayer(tempDrawingLayer.value)
    }

    tempDrawingLayer.value = L.rectangle(bounds, {
      color: selectedShapeColor.value,
      fillOpacity: 0.3,
      dashArray: '5, 5'
    }).addTo(map.value)
  }

  function finishRectangleDrawing(e) {
    map.value.off('mousemove', updateRectangle)

    const bounds = L.latLngBounds(rectangleStart, e.latlng)

    if (tempDrawingLayer.value) {
      map.value.removeLayer(tempDrawingLayer.value)
      tempDrawingLayer.value = null
    }

    const id = generateId()
    const shape = {
      id,
      type: 'rectangle',
      bounds: {
        southWest: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
        northEast: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng }
      },
      color: selectedShapeColor.value,
      layer: null
    }

    const layer = L.rectangle(bounds, {
      color: shape.color,
      fillOpacity: 0.3
    }).addTo(map.value)

    // Calculate area
    const area = (bounds.getNorth() - bounds.getSouth()) * 111320 *
                 (bounds.getEast() - bounds.getWest()) * 111320 *
                 Math.cos(bounds.getCenter().lat * Math.PI / 180)
    shape.area = Math.abs(area)

    shape.layer = layer
    shapes.value.push(shape)

    isDrawing.value = false
    rectangleStart = null
  }

  // Remove shape
  function removeShape(id) {
    const index = shapes.value.findIndex(s => s.id === id)
    if (index === -1) return

    const shape = shapes.value[index]
    if (shape.layer) {
      map.value.removeLayer(shape.layer)
    }
    shapes.value.splice(index, 1)
  }

  // Focus on shape
  function focusShape(id) {
    const shape = shapes.value.find(s => s.id === id)
    if (!shape || !shape.layer) return

    map.value.fitBounds(shape.layer.getBounds(), { padding: [50, 50] })
  }

  // Measurement tool
  function addMeasurePoint(e) {
    const { lat, lng } = e.latlng
    measurePoints.value.push({ lat, lng })

    // Add marker at point
    const marker = L.circleMarker([lat, lng], {
      radius: 5,
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 1
    }).addTo(map.value)

    measureLabels.value.push(marker)

    if (measurePoints.value.length > 1) {
      updateMeasureLine()
    }
  }

  function updateMeasureLine() {
    if (measureLine.value) {
      map.value.removeLayer(measureLine.value)
    }

    const points = measurePoints.value.map(p => [p.lat, p.lng])
    measureLine.value = L.polyline(points, {
      color: '#ef4444',
      weight: 2,
      dashArray: '10, 5'
    }).addTo(map.value)
  }

  function clearMeasurement() {
    measurePoints.value = []

    if (measureLine.value) {
      map.value.removeLayer(measureLine.value)
      measureLine.value = null
    }

    measureLabels.value.forEach(marker => {
      map.value.removeLayer(marker)
    })
    measureLabels.value = []
  }

  // Calculate total measurement distance
  const measureDistance = computed(() => {
    if (measurePoints.value.length < 2) return 0

    let total = 0
    for (let i = 1; i < measurePoints.value.length; i++) {
      const p1 = L.latLng(measurePoints.value[i - 1].lat, measurePoints.value[i - 1].lng)
      const p2 = L.latLng(measurePoints.value[i].lat, measurePoints.value[i].lng)
      total += p1.distanceTo(p2)
    }
    return total
  })

  // Helper functions
  function calculatePolylineLength(points) {
    let total = 0
    for (let i = 1; i < points.length; i++) {
      const p1 = L.latLng(points[i - 1][0], points[i - 1][1])
      const p2 = L.latLng(points[i][0], points[i][1])
      total += p1.distanceTo(p2)
    }
    return total
  }

  function calculatePolygonArea(points) {
    // Shoelace formula approximation
    if (points.length < 3) return 0

    let area = 0
    const n = points.length

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      area += points[i][1] * points[j][0]
      area -= points[j][1] * points[i][0]
    }

    area = Math.abs(area) / 2
    // Convert to square meters (rough approximation)
    const avgLat = points.reduce((sum, p) => sum + p[0], 0) / n
    const metersPerDegree = 111320 * Math.cos(avgLat * Math.PI / 180)
    return area * metersPerDegree * metersPerDegree
  }

  function formatDistance(meters) {
    if (meters < 1000) {
      return `${meters.toFixed(1)} m`
    }
    return `${(meters / 1000).toFixed(2)} km`
  }

  function formatArea(sqMeters) {
    if (sqMeters < 10000) {
      return `${sqMeters.toFixed(1)} m²`
    }
    if (sqMeters < 1000000) {
      return `${(sqMeters / 10000).toFixed(2)} ha`
    }
    return `${(sqMeters / 1000000).toFixed(2)} km²`
  }

  // Set active tool
  function setTool(tool) {
    // Cancel any ongoing drawing
    if (isDrawing.value) {
      cancelDrawing()
    }

    // Clear measurement if switching away from measure
    if (activeTool.value === 'measure' && tool !== 'measure') {
      clearMeasurement()
    }

    activeTool.value = activeTool.value === tool ? null : tool
  }

  // Export to GeoJSON
  function exportGeoJSON() {
    const features = []

    // Export markers
    markers.value.forEach(marker => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [marker.lng, marker.lat]
        },
        properties: {
          title: marker.title,
          description: marker.description,
          color: marker.color,
          markerType: 'marker'
        }
      })
    })

    // Export shapes
    shapes.value.forEach(shape => {
      let geometry

      switch (shape.type) {
        case 'polygon':
          geometry = {
            type: 'Polygon',
            coordinates: [[...shape.points.map(p => [p[1], p[0]]), [shape.points[0][1], shape.points[0][0]]]]
          }
          break
        case 'polyline':
          geometry = {
            type: 'LineString',
            coordinates: shape.points.map(p => [p[1], p[0]])
          }
          break
        case 'circle':
          // GeoJSON doesn't support circles natively, export as Point with radius
          geometry = {
            type: 'Point',
            coordinates: [shape.center.lng, shape.center.lat]
          }
          break
        case 'rectangle':
          geometry = {
            type: 'Polygon',
            coordinates: [[
              [shape.bounds.southWest.lng, shape.bounds.southWest.lat],
              [shape.bounds.northEast.lng, shape.bounds.southWest.lat],
              [shape.bounds.northEast.lng, shape.bounds.northEast.lat],
              [shape.bounds.southWest.lng, shape.bounds.northEast.lat],
              [shape.bounds.southWest.lng, shape.bounds.southWest.lat]
            ]]
          }
          break
      }

      features.push({
        type: 'Feature',
        geometry,
        properties: {
          shapeType: shape.type,
          color: shape.color,
          ...(shape.radius && { radius: shape.radius }),
          ...(shape.area && { area: shape.area }),
          ...(shape.length && { length: shape.length })
        }
      })
    })

    return {
      type: 'FeatureCollection',
      features
    }
  }

  // Import GeoJSON
  function importGeoJSON(geojson) {
    if (!geojson || !geojson.features) return

    geojson.features.forEach(feature => {
      const { geometry, properties } = feature

      if (geometry.type === 'Point' && properties?.markerType === 'marker') {
        addMarker(geometry.coordinates[1], geometry.coordinates[0], {
          title: properties.title || 'Imported Marker',
          description: properties.description || '',
          color: properties.color || selectedMarkerColor.value
        })
      } else if (geometry.type === 'Polygon') {
        const points = geometry.coordinates[0].slice(0, -1).map(c => [c[1], c[0]])
        const id = generateId()
        const shape = {
          id,
          type: properties?.shapeType === 'rectangle' ? 'rectangle' : 'polygon',
          points,
          color: properties?.color || selectedShapeColor.value,
          layer: null
        }

        const layer = L.polygon(points, {
          color: shape.color,
          fillOpacity: 0.3
        }).addTo(map.value)

        shape.layer = layer
        shape.area = calculatePolygonArea(points)
        shapes.value.push(shape)
      } else if (geometry.type === 'LineString') {
        const points = geometry.coordinates.map(c => [c[1], c[0]])
        const id = generateId()
        const shape = {
          id,
          type: 'polyline',
          points,
          color: properties?.color || selectedShapeColor.value,
          layer: null
        }

        const layer = L.polyline(points, {
          color: shape.color
        }).addTo(map.value)

        shape.layer = layer
        shape.length = calculatePolylineLength(points)
        shapes.value.push(shape)
      }
    })
  }

  // Download GeoJSON file
  function downloadGeoJSON() {
    const geojson = exportGeoJSON()
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'map-export.geojson'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Copy coordinates to clipboard
  function copyCoordinates() {
    const text = `${cursorCoords.value.lat}, ${cursorCoords.value.lng}`
    navigator.clipboard.writeText(text)
  }

  // Cleanup
  onUnmounted(() => {
    destroyMap()
  })

  return {
    // Map
    map,
    initMap,
    destroyMap,
    cursorCoords,
    copyCoordinates,

    // Tiles
    TILE_LAYERS,
    currentTile,
    setTileLayer,

    // Tools
    activeTool,
    setTool,
    isDrawing,
    finishDrawing,
    cancelDrawing,

    // Markers
    markers,
    MARKER_COLORS,
    selectedMarkerColor,
    addMarker,
    removeMarker,
    updateMarkerColor,
    focusMarker,

    // Shapes
    shapes,
    selectedShapeColor,
    removeShape,
    focusShape,

    // Measurement
    measurePoints,
    measureDistance,
    clearMeasurement,

    // Formatting
    formatDistance,
    formatArea,

    // GeoJSON
    exportGeoJSON,
    importGeoJSON,
    downloadGeoJSON,

    // UI
    layerPanelOpen
  }
}

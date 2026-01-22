import { ref, shallowRef, onUnmounted } from 'vue'
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

// Reverse geocoding function to get address from coordinates
async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'Accept-Language': 'es,en' } }
    )
    const data = await response.json()
    if (data && data.display_name) {
      return {
        fullAddress: data.display_name,
        shortAddress: formatShortAddress(data.address),
        address: data.address
      }
    }
    return null
  } catch (err) {
    console.error('Reverse geocoding error:', err)
    return null
  }
}

// Format a short address from address components
function formatShortAddress(address) {
  if (!address) return ''
  const parts = []

  if (address.road) {
    parts.push(address.road + (address.house_number ? ` ${address.house_number}` : ''))
  }

  const city = address.city || address.town || address.village || address.municipality
  if (city) parts.push(city)

  if (parts.length === 0 && address.country) {
    parts.push(address.country)
  }

  return parts.join(', ') || 'Ubicación desconocida'
}

// Get city name from address components
function getCityFromAddress(address) {
  if (!address) return null
  // Try multiple fields to get the most relevant location name
  return address.city || address.town || address.village || address.municipality ||
         address.hamlet || address.suburb || address.county || address.state_district || null
}

// Delay helper for rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Generate custom marker icon with color (for places only)
function createColoredIcon(color) {
  return L.icon({
    iconUrl: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41"><path fill="${color}" stroke="%23fff" stroke-width="1.5" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 10.9 12.5 28.5 12.5 28.5S25 23.4 25 12.5C25 5.6 19.4 0 12.5 0z"/><circle cx="12.5" cy="12.5" r="5" fill="%23fff"/></svg>`)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41]
  })
}

// Create a circle marker for route endpoints (doesn't desync with zoom)
function createRouteMarker(latlng, color, isEndpoint = true) {
  return L.circleMarker(latlng, {
    radius: isEndpoint ? 8 : 5,
    fillColor: color,
    color: '#fff',
    weight: 2,
    opacity: 1,
    fillOpacity: 1
  })
}

// OSRM routing API
async function getRoute(waypoints) {
  if (waypoints.length < 2) return null

  const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      const route = data.routes[0]
      return {
        geometry: route.geometry,
        distance: route.distance, // in meters
        duration: route.duration, // in seconds
        steps: route.legs.flatMap(leg => leg.steps)
      }
    }
    return null
  } catch (err) {
    console.error('Routing error:', err)
    return null
  }
}

// Get cities along the route geometry
async function getRouteCities(geometry) {
  if (!geometry || !geometry.coordinates || geometry.coordinates.length < 2) return []

  const coords = geometry.coordinates
  const totalPoints = coords.length

  // Calculate total route distance approximately
  let totalDistanceKm = 0
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1]
    const [lng2, lat2] = coords[i]
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    totalDistanceKm += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  // Sample every ~40km, max 20 points to respect Nominatim rate limits
  const numSamples = Math.min(20, Math.max(6, Math.ceil(totalDistanceKm / 40)))
  const step = Math.max(1, Math.floor(totalPoints / numSamples))

  const sampleIndices = [0] // start
  for (let i = step; i < totalPoints - step/2; i += step) {
    sampleIndices.push(Math.min(i, totalPoints - 1))
  }
  if (sampleIndices[sampleIndices.length - 1] !== totalPoints - 1) {
    sampleIndices.push(totalPoints - 1) // end
  }

  // Fetch cities for sample points WITH delays to avoid rate limiting
  const cities = []
  for (let i = 0; i < sampleIndices.length; i++) {
    const idx = sampleIndices[i]
    const [lng, lat] = coords[idx]

    // Add delay between requests (Nominatim allows 1 req/sec)
    if (i > 0) {
      await delay(150) // 150ms delay between requests
    }

    try {
      const geoData = await reverseGeocode(lat, lng)
      const city = geoData ? getCityFromAddress(geoData.address) : null
      if (city && !cities.includes(city)) {
        cities.push(city)
      }
    } catch (e) {
      console.warn('Failed to geocode point', idx, e)
    }
  }

  return cities
}

export function useMapEditor() {
  // Map instance
  const map = shallowRef(null)
  const mapContainer = ref(null)

  // State
  const currentTile = ref('osm')
  const currentTileLayer = shallowRef(null)
  const activeTool = ref(null) // 'marker', 'route'
  const markers = ref([])
  const routes = ref([])
  const cursorCoords = ref({ lat: 0, lng: 0 })
  const selectedMarkerColor = ref(MARKER_COLORS[0])
  const selectedRouteColor = ref('#2563eb')
  const layerPanelOpen = ref(true)

  // Route building state
  const isRoutingMode = ref(false)
  const routeWaypoints = ref([])
  const tempRouteMarkers = ref([])
  const tempRouteLine = shallowRef(null)

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

    L.control.zoom({ position: 'topright' }).addTo(map.value)
    L.control.scale({ position: 'bottomright', imperial: false }).addTo(map.value)

    setTileLayer(currentTile.value)

    map.value.on('mousemove', (e) => {
      cursorCoords.value = {
        lat: e.latlng.lat.toFixed(6),
        lng: e.latlng.lng.toFixed(6)
      }
    })

    map.value.on('click', handleMapClick)

    document.addEventListener('keydown', handleKeyDown)
  }

  // Handle keyboard shortcuts
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      if (isRoutingMode.value) {
        cancelRoute()
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (isRoutingMode.value && routeWaypoints.value.length >= 2) {
        finishRoute()
      }
    }
  }

  // Destroy map
  function destroyMap() {
    document.removeEventListener('keydown', handleKeyDown)
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
      case 'route':
        addRouteWaypoint(lat, lng)
        break
    }
  }

  // Add marker
  async function addMarker(lat, lng, options = {}) {
    const id = generateId()
    const marker = {
      id,
      lat,
      lng,
      title: options.title || `Place ${id}`,
      description: options.description || '',
      color: options.color || selectedMarkerColor.value,
      address: options.address || '',
      shortAddress: options.shortAddress || 'Cargando dirección...',
      layer: null
    }

    const leafletMarker = L.marker([lat, lng], {
      icon: createColoredIcon(marker.color),
      draggable: true
    }).addTo(map.value)

    updateMarkerPopup(leafletMarker, marker)

    leafletMarker.on('dragend', async (e) => {
      const pos = e.target.getLatLng()
      marker.lat = pos.lat
      marker.lng = pos.lng

      const geoData = await reverseGeocode(pos.lat, pos.lng)
      if (geoData) {
        marker.address = geoData.fullAddress
        marker.shortAddress = geoData.shortAddress
      }
      updateMarkerPopup(leafletMarker, marker)
      markers.value = [...markers.value]
    })

    marker.layer = leafletMarker
    markers.value.push(marker)

    if (!options.address) {
      reverseGeocode(lat, lng).then(geoData => {
        if (geoData) {
          marker.address = geoData.fullAddress
          marker.shortAddress = geoData.shortAddress
          updateMarkerPopup(leafletMarker, marker)
          markers.value = [...markers.value]
        } else {
          marker.shortAddress = 'Dirección no disponible'
          markers.value = [...markers.value]
        }
      })
    }

    return marker
  }

  // Update marker popup content
  function updateMarkerPopup(leafletMarker, marker) {
    const coordsFormatted = `${marker.lat.toFixed(6)}, ${marker.lng.toFixed(6)}`
    const popupContent = `
      <div class="marker-popup">
        <input type="text" value="${marker.title}" class="popup-title" placeholder="Título" />
        <div class="popup-address">
          <svg class="popup-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="popup-address-text">${marker.shortAddress || 'Cargando...'}</span>
        </div>
        <div class="popup-coords">
          <svg class="popup-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-.553-.894L15 2m0 13V2m0 0L9 5" />
          </svg>
          <span class="popup-coords-text" title="Click para copiar">${coordsFormatted}</span>
        </div>
        <textarea class="popup-description" placeholder="Descripción">${marker.description}</textarea>
      </div>
    `
    leafletMarker.bindPopup(popupContent, { minWidth: 250, maxWidth: 320 })

    leafletMarker.off('popupopen')
    leafletMarker.on('popupopen', () => {
      const popup = leafletMarker.getPopup()
      const container = popup.getElement()

      const titleInput = container.querySelector('.popup-title')
      const descInput = container.querySelector('.popup-description')
      const coordsText = container.querySelector('.popup-coords-text')

      titleInput?.addEventListener('input', (e) => {
        marker.title = e.target.value
        markers.value = [...markers.value]
      })

      descInput?.addEventListener('input', (e) => {
        marker.description = e.target.value
      })

      coordsText?.addEventListener('click', () => {
        navigator.clipboard.writeText(`${marker.lat.toFixed(6)}, ${marker.lng.toFixed(6)}`)
        coordsText.textContent = '¡Copiado!'
        setTimeout(() => {
          coordsText.textContent = coordsFormatted
        }, 1500)
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

  // Focus on marker
  function focusMarker(id) {
    const marker = markers.value.find(m => m.id === id)
    if (!marker) return

    map.value.setView([marker.lat, marker.lng], 15)
    marker.layer?.openPopup()
  }

  // ==================== ROUTING ====================

  // Add waypoint for route building
  async function addRouteWaypoint(lat, lng) {
    isRoutingMode.value = true

    const waypoint = { lat, lng, address: 'Cargando...' }
    routeWaypoints.value.push(waypoint)

    // Add temporary marker (circle that doesn't desync with zoom)
    const tempMarker = createRouteMarker([lat, lng], selectedRouteColor.value, true).addTo(map.value)

    tempRouteMarkers.value.push(tempMarker)

    // Get address
    reverseGeocode(lat, lng).then(geoData => {
      if (geoData) {
        waypoint.address = getCityFromAddress(geoData.address) || geoData.shortAddress
      } else {
        waypoint.address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      }
      routeWaypoints.value = [...routeWaypoints.value]
    })

    // Update route preview
    if (routeWaypoints.value.length >= 2) {
      updateRoutePreview()
    }
  }

  // Update route preview line
  async function updateRoutePreview() {
    if (tempRouteLine.value) {
      map.value.removeLayer(tempRouteLine.value)
      tempRouteLine.value = null
    }

    const routeData = await getRoute(routeWaypoints.value)
    if (routeData && routeData.geometry) {
      const coords = routeData.geometry.coordinates.map(c => [c[1], c[0]])
      tempRouteLine.value = L.polyline(coords, {
        color: selectedRouteColor.value,
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
      }).addTo(map.value)
    }
  }

  // Finish and save route
  async function finishRoute() {
    if (routeWaypoints.value.length < 2) {
      cancelRoute()
      return
    }

    const routeData = await getRoute(routeWaypoints.value)
    if (!routeData) {
      console.error('Could not calculate route')
      cancelRoute()
      return
    }

    const id = generateId()
    const route = {
      id,
      waypoints: [...routeWaypoints.value],
      color: selectedRouteColor.value,
      distance: routeData.distance,
      duration: routeData.duration,
      geometry: routeData.geometry,
      layer: null,
      waypointLayers: [],
      cities: ['Calculando ruta...'] // Will be updated async
    }

    // Clear temp markers
    tempRouteMarkers.value.forEach(m => map.value.removeLayer(m))
    tempRouteMarkers.value = []

    if (tempRouteLine.value) {
      map.value.removeLayer(tempRouteLine.value)
      tempRouteLine.value = null
    }

    // Create permanent route line
    const coords = routeData.geometry.coordinates.map(c => [c[1], c[0]])
    route.layer = L.polyline(coords, {
      color: route.color,
      weight: 5,
      opacity: 0.8
    }).addTo(map.value)

    // Create permanent waypoint markers (only start and end)
    const startWp = routeWaypoints.value[0]
    const endWp = routeWaypoints.value[routeWaypoints.value.length - 1]

    const startMarker = createRouteMarker([startWp.lat, startWp.lng], route.color, true).addTo(map.value)
    startMarker.bindTooltip(startWp.address, {
      permanent: false,
      direction: 'top',
      className: 'route-tooltip'
    })
    route.waypointLayers.push(startMarker)

    if (routeWaypoints.value.length > 1) {
      const endMarker = createRouteMarker([endWp.lat, endWp.lng], route.color, true).addTo(map.value)
      endMarker.bindTooltip(endWp.address, {
        permanent: false,
        direction: 'top',
        className: 'route-tooltip'
      })
      route.waypointLayers.push(endMarker)
    }

    routes.value.push(route)

    // Fetch cities along the route asynchronously
    getRouteCities(routeData.geometry).then(cities => {
      route.cities = cities.length > 0 ? cities : ['Ruta sin ciudades identificadas']
      routes.value = [...routes.value]
    })

    // Reset routing state
    isRoutingMode.value = false
    routeWaypoints.value = []
  }

  // Cancel route building
  function cancelRoute() {
    tempRouteMarkers.value.forEach(m => map.value.removeLayer(m))
    tempRouteMarkers.value = []

    if (tempRouteLine.value) {
      map.value.removeLayer(tempRouteLine.value)
      tempRouteLine.value = null
    }

    isRoutingMode.value = false
    routeWaypoints.value = []
  }

  // Remove route
  function removeRoute(id) {
    const index = routes.value.findIndex(r => r.id === id)
    if (index === -1) return

    const route = routes.value[index]
    if (route.layer) {
      map.value.removeLayer(route.layer)
    }
    route.waypointLayers?.forEach(m => map.value.removeLayer(m))

    routes.value.splice(index, 1)
  }

  // Focus on route
  function focusRoute(id) {
    const route = routes.value.find(r => r.id === id)
    if (!route || !route.layer) return

    map.value.fitBounds(route.layer.getBounds(), { padding: [50, 50] })
  }

  // Remove last waypoint
  function removeLastWaypoint() {
    if (routeWaypoints.value.length === 0) return

    routeWaypoints.value.pop()

    const lastMarker = tempRouteMarkers.value.pop()
    if (lastMarker) {
      map.value.removeLayer(lastMarker)
    }

    if (routeWaypoints.value.length >= 2) {
      updateRoutePreview()
    } else if (tempRouteLine.value) {
      map.value.removeLayer(tempRouteLine.value)
      tempRouteLine.value = null
    }

    if (routeWaypoints.value.length === 0) {
      isRoutingMode.value = false
    }
  }

  // Helper functions
  function formatDistance(meters) {
    if (meters < 1000) {
      return `${meters.toFixed(0)} m`
    }
    return `${(meters / 1000).toFixed(1)} km`
  }

  function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes} min`
  }

  // Set active tool
  function setTool(tool) {
    if (isRoutingMode.value) {
      cancelRoute()
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
          address: marker.address,
          shortAddress: marker.shortAddress,
          markerType: 'place'
        }
      })
    })

    // Export routes
    routes.value.forEach(route => {
      features.push({
        type: 'Feature',
        geometry: route.geometry,
        properties: {
          routeType: 'route',
          color: route.color,
          distance: route.distance,
          duration: route.duration,
          waypoints: route.waypoints,
          cities: route.cities
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

      if (geometry.type === 'Point' && properties?.markerType === 'place') {
        addMarker(geometry.coordinates[1], geometry.coordinates[0], {
          title: properties.title || 'Imported Place',
          description: properties.description || '',
          color: properties.color || selectedMarkerColor.value,
          address: properties.address || '',
          shortAddress: properties.shortAddress || ''
        })
      } else if (geometry.type === 'LineString' && properties?.routeType === 'route') {
        // Recreate route from imported data
        const id = generateId()
        const waypoints = properties.waypoints || []
        const route = {
          id,
          waypoints,
          color: properties.color || selectedRouteColor.value,
          distance: properties.distance || 0,
          duration: properties.duration || 0,
          geometry: geometry,
          layer: null,
          waypointLayers: [],
          cities: properties.cities || []
        }

        const coords = geometry.coordinates.map(c => [c[1], c[0]])
        route.layer = L.polyline(coords, {
          color: route.color,
          weight: 5,
          opacity: 0.8
        }).addTo(map.value)

        // Add start and end markers
        if (waypoints.length >= 1) {
          const startMarker = createRouteMarker([waypoints[0].lat, waypoints[0].lng], route.color, true).addTo(map.value)
          startMarker.bindTooltip(waypoints[0].address || '', {
            permanent: false,
            direction: 'top',
            className: 'route-tooltip'
          })
          route.waypointLayers.push(startMarker)
        }

        if (waypoints.length >= 2) {
          const lastWp = waypoints[waypoints.length - 1]
          const endMarker = createRouteMarker([lastWp.lat, lastWp.lng], route.color, true).addTo(map.value)
          endMarker.bindTooltip(lastWp.address || '', {
            permanent: false,
            direction: 'top',
            className: 'route-tooltip'
          })
          route.waypointLayers.push(endMarker)
        }

        routes.value.push(route)

        // Fetch cities if not provided
        if (!properties.cities || properties.cities.length === 0) {
          getRouteCities(geometry).then(cities => {
            route.cities = cities.length > 0 ? cities : ['Ruta sin ciudades identificadas']
            routes.value = [...routes.value]
          })
        }
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

    // Markers
    markers,
    MARKER_COLORS,
    selectedMarkerColor,
    addMarker,
    removeMarker,
    focusMarker,

    // Routes
    routes,
    selectedRouteColor,
    isRoutingMode,
    routeWaypoints,
    addRouteWaypoint,
    finishRoute,
    cancelRoute,
    removeRoute,
    focusRoute,
    removeLastWaypoint,

    // Formatting
    formatDistance,
    formatDuration,

    // GeoJSON
    exportGeoJSON,
    importGeoJSON,
    downloadGeoJSON,

    // UI
    layerPanelOpen
  }
}

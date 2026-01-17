import { ref, shallowRef } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export function useThreeCore() {
  // Core Three.js objects (shallow refs to avoid deep reactivity)
  const scene = shallowRef(null)
  const camera = shallowRef(null)
  const renderer = shallowRef(null)
  const orbitControls = shallowRef(null)

  let containerEl = null
  let animationId = null
  const animationCallbacks = []

  // State
  const isInitialized = ref(false)

  // Initialize Three.js
  const init = (container) => {
    if (isInitialized.value || !container) return
    containerEl = container

    // Scene
    scene.value = new THREE.Scene()
    scene.value.background = new THREE.Color(0x0a0a0a)

    // Camera
    const aspect = container.clientWidth / container.clientHeight
    camera.value = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    camera.value.position.set(5, 5, 5)

    // Renderer
    renderer.value = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true // Needed for screenshots
    })
    renderer.value.setSize(container.clientWidth, container.clientHeight)
    renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.value.shadowMap.enabled = true
    renderer.value.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.value.toneMapping = THREE.ACESFilmicToneMapping
    renderer.value.toneMappingExposure = 1
    container.appendChild(renderer.value.domElement)

    // Orbit Controls
    orbitControls.value = new OrbitControls(camera.value, renderer.value.domElement)
    orbitControls.value.enableDamping = true
    orbitControls.value.dampingFactor = 0.05
    orbitControls.value.minDistance = 2
    orbitControls.value.maxDistance = 50

    // Default lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    ambientLight.name = 'ambientLight'
    scene.value.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.name = 'directionalLight'
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.value.add(directionalLight)

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9,
      metalness: 0.1
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.name = 'floor'
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.01
    floor.receiveShadow = true
    scene.value.add(floor)

    // Grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x333333, 0x222222)
    gridHelper.name = 'grid'
    scene.value.add(gridHelper)

    // Handle resize
    window.addEventListener('resize', handleResize)

    isInitialized.value = true
    animate()
  }

  let skipDefaultRender = false

  // Animation loop
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    // Run all animation callbacks
    animationCallbacks.forEach(cb => cb())

    if (orbitControls.value) orbitControls.value.update()

    // Only render if no callback is handling rendering
    if (!skipDefaultRender && renderer.value && scene.value && camera.value) {
      renderer.value.render(scene.value, camera.value)
    }
  }

  // Set skip default render flag
  const setSkipDefaultRender = (skip) => {
    skipDefaultRender = skip
  }

  // Register animation callback
  const onAnimate = (callback) => {
    animationCallbacks.push(callback)
    return () => {
      const index = animationCallbacks.indexOf(callback)
      if (index > -1) animationCallbacks.splice(index, 1)
    }
  }

  // Handle window resize
  const handleResize = () => {
    if (!containerEl || !camera.value || !renderer.value) return

    const width = containerEl.clientWidth
    const height = containerEl.clientHeight

    camera.value.aspect = width / height
    camera.value.updateProjectionMatrix()
    renderer.value.setSize(width, height)
  }

  // Reset camera
  const resetCamera = () => {
    if (!camera.value || !orbitControls.value) return
    camera.value.position.set(5, 5, 5)
    orbitControls.value.target.set(0, 0, 0)
    orbitControls.value.update()
  }

  // Get DOM element
  const getDomElement = () => renderer.value?.domElement

  // Cleanup
  const destroy = () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }

    window.removeEventListener('resize', handleResize)
    animationCallbacks.length = 0

    if (renderer.value && containerEl) {
      containerEl.removeChild(renderer.value.domElement)
      renderer.value.dispose()
    }

    scene.value = null
    camera.value = null
    renderer.value = null
    orbitControls.value = null
    isInitialized.value = false
  }

  return {
    // State
    scene,
    camera,
    renderer,
    orbitControls,
    isInitialized,

    // Methods
    init,
    destroy,
    resetCamera,
    getDomElement,
    onAnimate,
    handleResize,
    setSkipDefaultRender
  }
}

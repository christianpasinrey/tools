import { ref, shallowRef, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export function useThreePlayground() {
  // State
  const container = shallowRef(null)
  const scene = shallowRef(null)
  const camera = shallowRef(null)
  const renderer = shallowRef(null)
  const controls = shallowRef(null)
  const objects = ref([])
  const selectedObject = shallowRef(null)
  const isInitialized = ref(false)
  const themeColor = ref('#22c55e')
  const animationId = ref(null)

  // Presets
  const presets = [
    { id: 'empty', name: 'Vacío' },
    { id: 'cube', name: 'Cubo' },
    { id: 'spheres', name: 'Esferas' },
    { id: 'particles', name: 'Partículas' },
    { id: 'waves', name: 'Ondas' }
  ]

  // Initialize Three.js
  const init = (containerEl) => {
    if (isInitialized.value) return
    container.value = containerEl

    // Scene
    scene.value = new THREE.Scene()
    scene.value.background = new THREE.Color(0x0a0a0a)

    // Camera
    const aspect = containerEl.clientWidth / containerEl.clientHeight
    camera.value = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    camera.value.position.set(5, 5, 5)

    // Renderer
    renderer.value = new THREE.WebGLRenderer({ antialias: true })
    renderer.value.setSize(containerEl.clientWidth, containerEl.clientHeight)
    renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.value.shadowMap.enabled = true
    containerEl.appendChild(renderer.value.domElement)

    // Controls
    controls.value = new OrbitControls(camera.value, renderer.value.domElement)
    controls.value.enableDamping = true
    controls.value.dampingFactor = 0.05

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.value.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = true
    scene.value.add(directionalLight)

    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x333333, 0x222222)
    scene.value.add(gridHelper)

    // Handle resize
    window.addEventListener('resize', handleResize)

    isInitialized.value = true
    animate()
  }

  // Animation loop
  const animate = () => {
    animationId.value = requestAnimationFrame(animate)

    // Update objects with animation
    objects.value.forEach(obj => {
      if (obj.userData.animate) {
        obj.userData.animate(obj)
      }
    })

    controls.value?.update()
    renderer.value?.render(scene.value, camera.value)
  }

  // Handle window resize
  const handleResize = () => {
    if (!container.value || !camera.value || !renderer.value) return

    const width = container.value.clientWidth
    const height = container.value.clientHeight

    camera.value.aspect = width / height
    camera.value.updateProjectionMatrix()
    renderer.value.setSize(width, height)
  }

  // Add shape
  const addShape = (type) => {
    if (!scene.value) return

    let geometry, material, mesh
    const color = new THREE.Color(themeColor.value)

    switch (type) {
      case 'cube':
        geometry = new THREE.BoxGeometry(1, 1, 1)
        break
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 32, 32)
        break
      case 'torus':
        geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100)
        break
      case 'cone':
        geometry = new THREE.ConeGeometry(0.5, 1, 32)
        break
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32)
        break
      case 'tetrahedron':
        geometry = new THREE.TetrahedronGeometry(0.7)
        break
      case 'octahedron':
        geometry = new THREE.OctahedronGeometry(0.6)
        break
      case 'dodecahedron':
        geometry = new THREE.DodecahedronGeometry(0.5)
        break
      case 'torusKnot':
        geometry = new THREE.TorusKnotGeometry(0.4, 0.15, 100, 16)
        break
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1)
    }

    material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.4
    })

    mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(
      (Math.random() - 0.5) * 4,
      0.5 + Math.random() * 2,
      (Math.random() - 0.5) * 4
    )
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.type = type
    mesh.userData.id = Date.now()

    scene.value.add(mesh)
    objects.value.push(mesh)
    selectedObject.value = mesh

    return mesh
  }

  // Load preset scene
  const loadPreset = (presetId) => {
    clearScene()

    switch (presetId) {
      case 'cube':
        const cube = addShape('cube')
        cube.position.set(0, 0.5, 0)
        cube.userData.animate = (obj) => {
          obj.rotation.x += 0.01
          obj.rotation.y += 0.01
        }
        break

      case 'spheres':
        for (let i = 0; i < 20; i++) {
          const sphere = addShape('sphere')
          const angle = (i / 20) * Math.PI * 2
          const radius = 3 + Math.random() * 2
          sphere.position.set(
            Math.cos(angle) * radius,
            0.5 + Math.random() * 3,
            Math.sin(angle) * radius
          )
          sphere.userData.angle = angle
          sphere.userData.radius = radius
          sphere.userData.speed = 0.005 + Math.random() * 0.01
          sphere.userData.animate = (obj) => {
            obj.userData.angle += obj.userData.speed
            obj.position.x = Math.cos(obj.userData.angle) * obj.userData.radius
            obj.position.z = Math.sin(obj.userData.angle) * obj.userData.radius
          }
        }
        break

      case 'particles':
        createParticles()
        break

      case 'waves':
        createWaves()
        break
    }
  }

  // Create particle system
  const createParticles = () => {
    const particleCount = 5000
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const color = new THREE.Color(themeColor.value)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 20
      positions[i3 + 1] = Math.random() * 10
      positions[i3 + 2] = (Math.random() - 0.5) * 20

      const mixedColor = color.clone()
      mixedColor.offsetHSL(Math.random() * 0.1, 0, Math.random() * 0.2 - 0.1)
      colors[i3] = mixedColor.r
      colors[i3 + 1] = mixedColor.g
      colors[i3 + 2] = mixedColor.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    })

    const particles = new THREE.Points(geometry, material)
    particles.userData.type = 'particles'
    particles.userData.id = Date.now()
    particles.userData.animate = (obj) => {
      obj.rotation.y += 0.001
      const positions = obj.geometry.attributes.position.array
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.002
      }
      obj.geometry.attributes.position.needsUpdate = true
    }

    scene.value.add(particles)
    objects.value.push(particles)
  }

  // Create wave plane
  const createWaves = () => {
    const geometry = new THREE.PlaneGeometry(15, 15, 50, 50)
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(themeColor.value),
      wireframe: true,
      side: THREE.DoubleSide
    })

    const plane = new THREE.Mesh(geometry, material)
    plane.rotation.x = -Math.PI / 2
    plane.position.y = 0.1
    plane.userData.type = 'waves'
    plane.userData.id = Date.now()
    plane.userData.animate = (obj) => {
      const positions = obj.geometry.attributes.position.array
      const time = Date.now() * 0.001
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i]
        const z = positions[i + 1]
        positions[i + 2] = Math.sin(x * 0.5 + time) * Math.cos(z * 0.5 + time) * 0.5
      }
      obj.geometry.attributes.position.needsUpdate = true
    }

    scene.value.add(plane)
    objects.value.push(plane)
  }

  // Clear all objects
  const clearScene = () => {
    objects.value.forEach(obj => {
      scene.value.remove(obj)
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })
    objects.value = []
    selectedObject.value = null
  }

  // Delete selected object
  const deleteSelected = () => {
    if (!selectedObject.value) return

    scene.value.remove(selectedObject.value)
    if (selectedObject.value.geometry) selectedObject.value.geometry.dispose()
    if (selectedObject.value.material) selectedObject.value.material.dispose()

    objects.value = objects.value.filter(o => o !== selectedObject.value)
    selectedObject.value = null
  }

  // Set theme color
  const setThemeColor = (color) => {
    themeColor.value = color
  }

  // Reset camera
  const resetCamera = () => {
    if (!camera.value || !controls.value) return
    camera.value.position.set(5, 5, 5)
    controls.value.target.set(0, 0, 0)
    controls.value.update()
  }

  // Toggle wireframe
  const toggleWireframe = () => {
    objects.value.forEach(obj => {
      if (obj.material && 'wireframe' in obj.material) {
        obj.material.wireframe = !obj.material.wireframe
      }
    })
  }

  // Cleanup
  const destroy = () => {
    if (animationId.value) {
      cancelAnimationFrame(animationId.value)
    }
    window.removeEventListener('resize', handleResize)

    clearScene()

    if (renderer.value) {
      renderer.value.dispose()
      container.value?.removeChild(renderer.value.domElement)
    }

    isInitialized.value = false
  }

  onUnmounted(destroy)

  return {
    // State
    isInitialized,
    objects,
    selectedObject,
    themeColor,
    presets,

    // Methods
    init,
    addShape,
    loadPreset,
    clearScene,
    deleteSelected,
    setThemeColor,
    resetCamera,
    toggleWireframe,
    destroy
  }
}

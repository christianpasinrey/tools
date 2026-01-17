import { ref } from 'vue'
import * as THREE from 'three'

export function useThreeObjects(core) {
  const objects = ref([])
  const selectedObject = ref(null)
  const transformMode = ref('translate')
  const themeColor = ref('#22c55e')

  // Raycaster for selection
  let raycaster = null
  let mouse = null

  // Drag state
  let isDragging = false
  let dragPlane = null
  let dragOffset = new THREE.Vector3()
  let initialRotation = new THREE.Euler()
  let initialScale = new THREE.Vector3()
  let dragStart = new THREE.Vector2()

  // Keys state
  const keysPressed = ref({
    w: false, a: false, s: false, d: false,
    q: false, e: false
  })
  const moveSpeed = 0.1

  // Initialize
  const init = () => {
    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()
    dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

    const domElement = core.getDomElement()
    if (domElement) {
      domElement.addEventListener('mousedown', handleMouseDown)
      domElement.addEventListener('mousemove', handleMouseMove)
      domElement.addEventListener('mouseup', handleMouseUp)
      domElement.addEventListener('dblclick', handleDoubleClick)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Register animation callback for keyboard movement
    core.onAnimate(updateKeyboardMovement)
  }

  // Keyboard handlers
  const handleKeyDown = (e) => {
    const key = e.key.toLowerCase()
    if (key in keysPressed.value) {
      keysPressed.value[key] = true
    }
  }

  const handleKeyUp = (e) => {
    const key = e.key.toLowerCase()
    if (key in keysPressed.value) {
      keysPressed.value[key] = false
    }
  }

  // Update movement from keyboard
  const updateKeyboardMovement = () => {
    if (!selectedObject.value || !core.camera.value) return

    const keys = keysPressed.value
    if (keys.w || keys.a || keys.s || keys.d || keys.q || keys.e) {
      const cameraDir = new THREE.Vector3()
      core.camera.value.getWorldDirection(cameraDir)
      cameraDir.y = 0
      cameraDir.normalize()

      const right = new THREE.Vector3()
      right.crossVectors(cameraDir, new THREE.Vector3(0, 1, 0))

      if (keys.w) selectedObject.value.position.y += moveSpeed
      if (keys.s) selectedObject.value.position.y -= moveSpeed
      if (keys.d) selectedObject.value.position.addScaledVector(right, moveSpeed)
      if (keys.a) selectedObject.value.position.addScaledVector(right, -moveSpeed)
      if (keys.e) selectedObject.value.position.addScaledVector(cameraDir, moveSpeed)
      if (keys.q) selectedObject.value.position.addScaledVector(cameraDir, -moveSpeed)

      syncLightPosition(selectedObject.value)
    }
  }

  // Mouse handlers
  const getMouseNDC = (event) => {
    const domElement = core.getDomElement()
    if (!domElement) return null
    const rect = domElement.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((event.clientY - rect.top) / rect.height) * 2 + 1
    }
  }

  const handleMouseDown = (event) => {
    if (!core.camera.value || !raycaster) return
    if (event.button !== 0) return

    const ndc = getMouseNDC(event)
    if (!ndc) return

    mouse.set(ndc.x, ndc.y)
    raycaster.setFromCamera(mouse, core.camera.value)

    if (selectedObject.value) {
      const intersects = raycaster.intersectObject(selectedObject.value, false)
      if (intersects.length > 0) {
        isDragging = true
        core.orbitControls.value.enabled = false
        dragStart.set(event.clientX, event.clientY)

        if (transformMode.value === 'translate') {
          const cameraDir = new THREE.Vector3()
          core.camera.value.getWorldDirection(cameraDir)
          dragPlane.setFromNormalAndCoplanarPoint(
            cameraDir.negate(),
            selectedObject.value.position
          )
          const intersection = new THREE.Vector3()
          raycaster.ray.intersectPlane(dragPlane, intersection)
          if (intersection) {
            dragOffset.subVectors(selectedObject.value.position, intersection)
          }
        } else if (transformMode.value === 'rotate') {
          initialRotation.copy(selectedObject.value.rotation)
        } else if (transformMode.value === 'scale') {
          initialScale.copy(selectedObject.value.scale)
        }
        return
      }
    }

    const selectableObjects = objects.value.filter(obj => obj.userData && obj.userData.id)
    const intersects = raycaster.intersectObjects(selectableObjects, false)

    if (intersects.length > 0) {
      selectObject(intersects[0].object)
    }
  }

  const handleMouseMove = (event) => {
    if (!isDragging || !selectedObject.value) return

    const ndc = getMouseNDC(event)
    if (!ndc) return

    mouse.set(ndc.x, ndc.y)
    raycaster.setFromCamera(mouse, core.camera.value)

    if (transformMode.value === 'translate') {
      if (event.shiftKey) {
        const deltaY = (dragStart.y - event.clientY) * 0.02
        selectedObject.value.position.y += deltaY
        dragStart.set(event.clientX, event.clientY)
      } else {
        const intersection = new THREE.Vector3()
        if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
          selectedObject.value.position.copy(intersection.add(dragOffset))
        }
      }
      syncLightPosition(selectedObject.value)
    } else if (transformMode.value === 'rotate') {
      const deltaX = (event.clientX - dragStart.x) * 0.01
      const deltaY = (event.clientY - dragStart.y) * 0.01
      selectedObject.value.rotation.y = initialRotation.y + deltaX
      selectedObject.value.rotation.x = initialRotation.x + deltaY
    } else if (transformMode.value === 'scale') {
      const delta = (event.clientX - dragStart.x) * 0.01
      const scaleFactor = Math.max(0.1, 1 + delta)
      selectedObject.value.scale.set(
        initialScale.x * scaleFactor,
        initialScale.y * scaleFactor,
        initialScale.z * scaleFactor
      )
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      isDragging = false
      core.orbitControls.value.enabled = true
    }
  }

  const handleDoubleClick = () => {
    deselectObject()
  }

  // Selection
  const selectObject = (obj) => {
    if (!core.scene.value) return

    if (selectedObject.value && selectedObject.value !== obj) {
      if (selectedObject.value.material?.emissive) {
        selectedObject.value.material.emissive.setHex(0x000000)
      }
    }

    selectedObject.value = obj

    if (obj.material?.emissive) {
      obj.material.emissive.setHex(0x333333)
    }
  }

  const deselectObject = () => {
    if (selectedObject.value?.material?.emissive) {
      selectedObject.value.material.emissive.setHex(0x000000)
    }
    selectedObject.value = null
  }

  // Sync light position
  const syncLightPosition = (obj) => {
    if (!obj?.userData) return
    const { light, helper } = obj.userData
    if (light) {
      light.position.copy(obj.position)
      helper?.update()
    }
  }

  // Add shape
  const addShape = (type, options = {}) => {
    if (!core.scene.value) return null

    let geometry
    const color = new THREE.Color(options.color || themeColor.value)

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
      case 'plane':
        geometry = new THREE.PlaneGeometry(2, 2)
        break
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1)
    }

    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.4
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(
      (Math.random() - 0.5) * 4,
      0.5 + Math.random() * 2,
      (Math.random() - 0.5) * 4
    )
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData = { type, id: Date.now(), isUserObject: true }

    core.scene.value.add(mesh)
    objects.value = [...objects.value, mesh]

    return mesh
  }

  // Duplicate selected
  const duplicateSelected = () => {
    if (!selectedObject.value || !core.scene.value) return null

    const original = selectedObject.value
    let clone

    if (original.userData?.light) {
      // Can't easily clone lights, skip for now
      return null
    }

    clone = original.clone()
    clone.position.x += 1
    clone.position.z += 1
    clone.userData = {
      ...original.userData,
      id: Date.now()
    }

    // Clone material to make it independent
    if (clone.material) {
      clone.material = original.material.clone()
    }

    core.scene.value.add(clone)
    objects.value = [...objects.value, clone]

    deselectObject()
    selectObject(clone)

    return clone
  }

  // Delete selected
  const deleteSelected = () => {
    if (!selectedObject.value || !core.scene.value) return

    const obj = selectedObject.value
    deselectObject()

    // Clean up light if it's a light object
    if (obj.userData) {
      const { light, helper, target } = obj.userData
      if (light) core.scene.value.remove(light)
      if (helper) {
        core.scene.value.remove(helper)
        helper.dispose()
      }
      if (target) core.scene.value.remove(target)
    }

    core.scene.value.remove(obj)
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) obj.material.dispose()

    objects.value = objects.value.filter(o => o !== obj)
  }

  // Clear scene
  const clearScene = () => {
    if (!core.scene.value) return

    deselectObject()

    const toRemove = [...objects.value]
    toRemove.forEach(obj => {
      if (obj.userData) {
        const { light, helper, target } = obj.userData
        if (light) core.scene.value.remove(light)
        if (helper) {
          core.scene.value.remove(helper)
          helper.dispose()
        }
        if (target) core.scene.value.remove(target)
      }

      core.scene.value.remove(obj)
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
  }

  // Toggle wireframe
  const toggleWireframe = () => {
    objects.value.forEach(obj => {
      if (obj.material && 'wireframe' in obj.material) {
        obj.material.wireframe = !obj.material.wireframe
      }
    })
  }

  // Set transform mode
  const setTransformMode = (mode) => {
    transformMode.value = mode
  }

  // Set theme color
  const setThemeColor = (color) => {
    themeColor.value = color
  }

  // Cleanup
  const destroy = () => {
    const domElement = core.getDomElement()
    if (domElement) {
      domElement.removeEventListener('mousedown', handleMouseDown)
      domElement.removeEventListener('mousemove', handleMouseMove)
      domElement.removeEventListener('mouseup', handleMouseUp)
      domElement.removeEventListener('dblclick', handleDoubleClick)
    }

    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)

    clearScene()
  }

  return {
    // State
    objects,
    selectedObject,
    transformMode,
    themeColor,
    keysPressed,

    // Methods
    init,
    destroy,
    addShape,
    deleteSelected,
    duplicateSelected,
    selectObject,
    deselectObject,
    clearScene,
    toggleWireframe,
    setTransformMode,
    setThemeColor,
    syncLightPosition
  }
}

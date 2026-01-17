import { ref } from 'vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

export function useThreePostProcessing(core) {
  let composer = null
  let bloomPass = null
  let renderPass = null

  const bloomEnabled = ref(false)
  const bloomStrength = ref(0.5)
  const bloomRadius = ref(0.4)
  const bloomThreshold = ref(0.85)

  // Initialize post-processing
  const init = () => {
    if (!core.renderer.value || !core.scene.value || !core.camera.value) return false

    const renderer = core.renderer.value
    const scene = core.scene.value
    const camera = core.camera.value

    // Create composer
    composer = new EffectComposer(renderer)

    // Render pass
    renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    // Bloom pass
    const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight)
    bloomPass = new UnrealBloomPass(resolution, bloomStrength.value, bloomRadius.value, bloomThreshold.value)
    bloomPass.enabled = bloomEnabled.value
    composer.addPass(bloomPass)

    // Output pass (for correct color space)
    const outputPass = new OutputPass()
    composer.addPass(outputPass)

    return true
  }

  // Enable/disable bloom
  const setBloomEnabled = (enabled) => {
    bloomEnabled.value = enabled
    if (bloomPass) {
      bloomPass.enabled = enabled
    }
  }

  // Set bloom strength
  const setBloomStrength = (strength) => {
    bloomStrength.value = strength
    if (bloomPass) {
      bloomPass.strength = strength
    }
  }

  // Set bloom radius
  const setBloomRadius = (radius) => {
    bloomRadius.value = radius
    if (bloomPass) {
      bloomPass.radius = radius
    }
  }

  // Set bloom threshold
  const setBloomThreshold = (threshold) => {
    bloomThreshold.value = threshold
    if (bloomPass) {
      bloomPass.threshold = threshold
    }
  }

  // Render with post-processing
  const render = () => {
    if (composer && bloomEnabled.value) {
      composer.render()
      return true
    }
    return false
  }

  // Handle resize
  const handleResize = (width, height) => {
    if (composer) {
      composer.setSize(width, height)
    }
  }

  // Get composer for custom render loop
  const getComposer = () => composer

  // Cleanup
  const destroy = () => {
    if (composer) {
      composer.dispose()
      composer = null
    }
    bloomPass = null
    renderPass = null
  }

  return {
    // State
    bloomEnabled,
    bloomStrength,
    bloomRadius,
    bloomThreshold,

    // Methods
    init,
    render,
    handleResize,
    getComposer,
    setBloomEnabled,
    setBloomStrength,
    setBloomRadius,
    setBloomThreshold,
    destroy
  }
}

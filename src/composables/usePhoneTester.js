import { ref, computed } from 'vue'

export function usePhoneTester() {
  // Configuration state
  const config = ref({
    websocketUrl: '',
    sipUri: '',
    password: '',
    registrarServer: '',
    displayName: '',
    authorizationUser: '',
  })

  // Framework selection
  const selectedFramework = ref('vue')

  // Copy feedback
  const copied = ref(false)

  // Validation
  const isConfigValid = computed(() => {
    return (
      config.value.websocketUrl.trim() !== '' &&
      config.value.sipUri.trim() !== '' &&
      config.value.password.trim() !== '' &&
      config.value.registrarServer.trim() !== '' &&
      config.value.displayName.trim() !== '' &&
      config.value.authorizationUser.trim() !== ''
    )
  })

  // Generate React code
  const reactCode = computed(() => {
    const c = config.value
    return `import { Phone } from "@tbisoftware/phone";

const config = {
  websocketUrl: "${c.websocketUrl}",
  sipUri: "${c.sipUri}",
  password: "${c.password}",
  registrarServer: "${c.registrarServer}",
  displayName: "${c.displayName}",
  authorizationUser: "${c.authorizationUser}",
};

function App() {
  return (
    <Phone
      config={config}
      onCallStart={(number) => console.log('Calling:', number)}
      onCallEnd={(number, duration, status) => {
        console.log(\`Call to \${number} \${status}. Duration: \${duration}s\`);
      }}
    />
  );
}

export default App;`
  })

  // Generate Vue code
  const vueCode = computed(() => {
    const c = config.value
    return `<script setup>
import { Phone } from "@tbisoftware/phone/vue";

const config = {
  websocketUrl: "${c.websocketUrl}",
  sipUri: "${c.sipUri}",
  password: "${c.password}",
  registrarServer: "${c.registrarServer}",
  displayName: "${c.displayName}",
  authorizationUser: "${c.authorizationUser}",
};

function handleCallStart(number) {
  console.log('Calling:', number);
}

function handleCallEnd(number, duration, status) {
  console.log(\`Call to \${number} \${status}. Duration: \${duration}s\`);
}
</script>

<template>
  <Phone
    :config="config"
    @call-start="handleCallStart"
    @call-end="handleCallEnd"
  />
</template>`
  })

  // Current code based on selected framework
  const generatedCode = computed(() => {
    return selectedFramework.value === 'react' ? reactCode.value : vueCode.value
  })

  // Copy to clipboard
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode.value)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Reset config
  const resetConfig = () => {
    config.value = {
      websocketUrl: '',
      sipUri: '',
      password: '',
      registrarServer: '',
      displayName: '',
      authorizationUser: '',
    }
  }

  // Load example config
  const loadExample = () => {
    config.value = {
      websocketUrl: 'wss://sip-server.example.com:8089/ws',
      sipUri: 'sip:1000@sip-server.example.com',
      password: 'your-password',
      registrarServer: 'sip:sip-server.example.com',
      displayName: 'Usuario de Prueba',
      authorizationUser: '1000',
    }
  }

  return {
    config,
    selectedFramework,
    isConfigValid,
    generatedCode,
    reactCode,
    vueCode,
    copied,
    copyCode,
    resetConfig,
    loadExample,
  }
}

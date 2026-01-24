import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuth } from './composables/useAuth'
import { useCloudSync } from './composables/useCloudSync'
import { useVault, STORES } from './composables/useVault'

const app = createApp(App).use(router)

// Initialize sync with vault access
const sync = useCloudSync()
const vault = useVault()
sync.setVaultAccess({
  getRawEntry: vault.getRawEntry,
  saveRawEntry: vault.saveRawEntry,
  list: vault.list,
  remove: vault.remove,
  stores: STORES
})
sync.loadPendingQueue()

// Initialize auth (async — restores session from HttpOnly cookie)
const auth = useAuth()
auth.init().then(() => {
  if (auth.isAuthenticated.value) {
    sync.fullSync()
  }
})

// Flush queue when coming back online
window.addEventListener('online', () => {
  if (auth.isAuthenticated.value) {
    sync.fullSync()
  }
})

app.mount('#app')

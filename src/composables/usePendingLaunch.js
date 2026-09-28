import { onMounted, onUnmounted } from 'vue'
import { takePendingLaunch, LAUNCH_EVENT } from '@/lib/pendingLaunch'

export function usePendingLaunch(prefix, handler) {
  const check = () => {
    const launch = takePendingLaunch(prefix)
    if (launch) handler(launch)
  }
  onMounted(() => {
    check()
    window.addEventListener(LAUNCH_EVENT, check)
  })
  onUnmounted(() => window.removeEventListener(LAUNCH_EVENT, check))
}

export const LAUNCH_EVENT = 'tb:launch'
export const PENDING_TTL_MS = 10000

let pending = null

export function setPendingLaunch(target, file = null, now = Date.now()) {
  pending = { target, file, at: now }
}

export function takePendingLaunch(prefix, now = Date.now()) {
  if (!pending) return null
  if (now - pending.at > PENDING_TTL_MS) { pending = null; return null }
  if (!pending.target.startsWith(prefix)) return null
  const { target, file } = pending
  pending = null
  return { target, file }
}

export function clearPendingLaunch() {
  pending = null
}

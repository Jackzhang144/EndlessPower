import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import './app.css'
import App from './App'

function shouldForceReset() {
  try {
    const url = new URL(window.location.href)
    return url.searchParams.get('reset') === '1' || url.searchParams.get('ep_reset') === '1'
  } catch {
    return false
  }
}

async function resetServiceWorkerAndCaches() {
  if (!('serviceWorker' in navigator)) return

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((r) => r.unregister()))
  } catch {
    // ignore
  }

  try {
    if ('caches' in window) {
      const cacheKeys = await caches.keys()
      await Promise.all(cacheKeys.map((k) => caches.delete(k)))
    }
  } catch {
    // ignore
  }
}

async function resetServiceWorkerIfNeeded() {
  if (typeof window === 'undefined') return
  const forceReset = shouldForceReset()
  const shouldResetDev = import.meta.env.DEV && import.meta.env.VITE_PWA_DEV !== '1'
  if (!forceReset && !shouldResetDev) return

  if (!('serviceWorker' in navigator)) return
  // Dev 模式：只有被 SW 控制时才重置，避免无限刷新；手动 reset=1 则强制执行。
  if (!forceReset && !navigator.serviceWorker.controller) return

  try {
    const key = forceReset ? 'ep-force-sw-reset' : 'ep-dev-sw-reset'
    if (!forceReset && sessionStorage.getItem(key) === '1') return
    if (!forceReset) sessionStorage.setItem(key, '1')

    await resetServiceWorkerAndCaches()
  } finally {
    if (forceReset) {
      const url = new URL(window.location.href)
      url.searchParams.delete('reset')
      url.searchParams.delete('ep_reset')
      window.location.replace(url.toString())
    } else {
      window.location.reload()
    }
  }
}

async function bootstrap() {
  await resetServiceWorkerIfNeeded()
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

void bootstrap()

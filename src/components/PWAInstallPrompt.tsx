import { useEffect, useState } from 'react'
import { Button, Card } from '@heroui/react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandaloneMode() {
  // iOS Safari: navigator.standalone
  const isIOSStandalone = typeof navigator !== 'undefined' && Boolean((navigator as any).standalone)
  // Other modern browsers
  const isDisplayModeStandalone =
    typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)')?.matches
  return Boolean(isIOSStandalone || isDisplayModeStandalone)
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('pwa-install-dismissed') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    setInstalled(isStandaloneMode())

    const onBeforeInstallPrompt = (event: Event) => {
      if (dismissed) return
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setShow(true)
    }

    const onInstalled = () => {
      setInstalled(true)
      setShow(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [dismissed])

  if (installed || dismissed || !show || !deferredPrompt) return null

  const close = (persistDismiss = false) => {
    if (persistDismiss) {
      try {
        localStorage.setItem('pwa-install-dismissed', 'true')
        setDismissed(true)
      } catch {
        // ignore
      }
    }
    setShow(false)
  }

  const handleInstall = async () => {
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setShow(false)
        setDeferredPrompt(null)
      } else {
        setShow(false)
      }
    } catch {
      // ignore
      setShow(false)
    }
  }

  return (
    <div className="toast is-bottom" role="status" aria-live="polite">
      <Card className="toast-card is-info">
        <Card.Content className="toast-content">
          <div className="toast-text">
            <div className="toast-title">安装到桌面</div>
            <div className="toast-sub">离线可用，更快打开。</div>
          </div>
          <div className="toast-actions">
            <Button variant="primary" onPress={handleInstall}>
              安装
            </Button>
            <Button variant="secondary" onPress={() => close(true)}>
              不再提示
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}

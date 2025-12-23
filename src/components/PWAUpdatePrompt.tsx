import { useEffect, useState } from 'react'
import { Button, Card } from '@heroui/react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PWAUpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      if (import.meta.env.DEV) console.log('SW Registered:', r)
    },
    onRegisterError(error: unknown) {
      if (import.meta.env.DEV) console.log('SW registration error', error)
    }
  })

  useEffect(() => {
    if (needRefresh) setShowUpdatePrompt(true)
  }, [needRefresh])

  if (offlineReady) {
    return (
      <div className="toast" role="status" aria-live="polite">
        <Card className="toast-card is-success">
          <Card.Content className="toast-content">
            <div className="toast-text">
              <div className="toast-title">应用已准备好离线使用</div>
              <div className="toast-sub">你可以在无网络时继续打开此页面。</div>
            </div>
            <Button variant="secondary" onPress={() => setOfflineReady(false)}>
              关闭
            </Button>
          </Card.Content>
        </Card>
      </div>
    )
  }

  if (!showUpdatePrompt) return null

  return (
    <div className="toast" role="status" aria-live="polite">
      <Card className="toast-card is-info">
        <Card.Content className="toast-content">
          <div className="toast-text">
            <div className="toast-title">发现新版本</div>
            <div className="toast-sub">更新以获取最新功能和修复。</div>
          </div>
          <div className="toast-actions">
            <Button
              variant="primary"
              onPress={() => {
                updateServiceWorker(true)
                setShowUpdatePrompt(false)
              }}
            >
              立即更新
            </Button>
            <Button
              variant="secondary"
              onPress={() => {
                setShowUpdatePrompt(false)
                setNeedRefresh(false)
              }}
            >
              稍后
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}

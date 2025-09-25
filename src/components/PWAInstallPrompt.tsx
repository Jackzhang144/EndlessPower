import React, { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // 检查是否已经安装
    if (window.matchMedia('(display-mode: standalone)').matches || 
        'standalone' in window.navigator ||
        document.referrer.includes('android-app://')) {
      setIsInstalled(true)
      return
    }

    // 监听安装事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
        setShowInstallPrompt(false)
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
    } catch (error) {
      console.error('Error during installation:', error)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // 不要再次显示，除非页面刷新
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // 如果已安装或用户已拒绝，不显示提示
  if (isInstalled || 
      !showInstallPrompt || 
      !deferredPrompt ||
      localStorage.getItem('pwa-install-dismissed') === 'true') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[2000] max-w-sm mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-4 backdrop-blur-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" 
                />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              安装 EndlessPower
            </p>
            <p className="text-xs text-gray-500 mt-1">
              添加到主屏幕，随时查看充电桩信息
            </p>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        </div>
        
        <div className="mt-3 flex space-x-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-primary text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            安装
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            稍后
          </button>
        </div>
      </div>
    </div>
  )
}

export default PWAInstallPrompt

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeState {
  theme: Theme
  isDark: boolean
  
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  applyTheme: () => void
  initializeTheme: () => void
}

// 全局变量来存储媒体查询监听器，避免重复添加
let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null
let mediaQuery: MediaQueryList | null = null

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'auto',
      isDark: false,
      
      setTheme: (theme: Theme) => {
        set({ theme })
        get().applyTheme()
      },
      
      toggleTheme: () => {
        const { theme } = get()
        let newTheme: Theme
        
        // 循环顺序：auto -> light -> dark -> auto
        switch (theme) {
          case 'auto':
            newTheme = 'light'
            break
          case 'light':
            newTheme = 'dark'
            break
          case 'dark':
            newTheme = 'auto'
            break
          default:
            newTheme = 'auto'
        }
        
        get().setTheme(newTheme)
      },
      
      applyTheme: () => {
        const { theme } = get()
        const root = document.documentElement
        
        let shouldBeDark = false
        
        if (theme === 'auto') {
          // 检查系统偏好
          shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        } else {
          shouldBeDark = theme === 'dark'
        }
        
        if (shouldBeDark) {
          root.classList.add('dark')
          root.dataset.theme = 'dark'
          set({ isDark: true })
        } else {
          root.classList.remove('dark')
          root.dataset.theme = 'light'
          set({ isDark: false })
        }
      },

      initializeTheme: () => {
        // 立即应用主题
        get().applyTheme()
        
        // 移除之前的监听器（如果存在）
        if (mediaQuery && mediaQueryListener) {
          mediaQuery.removeEventListener('change', mediaQueryListener)
        }
        
        // 创建新的媒体查询监听器
        mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        mediaQueryListener = (_e: MediaQueryListEvent) => {
          const { theme } = get()
          // 只有在自动模式下才响应系统主题变化
          if (theme === 'auto') {
            get().applyTheme()
          }
        }
        
        // 添加监听器
        mediaQuery.addEventListener('change', mediaQueryListener)
      }
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ theme: state.theme })
    }
  )
)

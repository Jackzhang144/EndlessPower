import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BaseMapStyle =
  | 'auto'
  | 'positron'
  | 'voyager'
  | 'positron-nolabels'
  | 'voyager-nolabels'
  | 'dark-matter'
  | 'dark-matter-nolabels'

interface SettingsState {
  // 基础设置
  autoRefresh: boolean
  showUnavailableStations: boolean
  chinaCoordFix: boolean
  
  // 数据设置
  refreshInterval: number // 秒
  // 地图底图（CARTO）
  baseMapStyle: BaseMapStyle

  // Actions
  setAutoRefresh: (enabled: boolean) => void
  setShowUnavailableStations: (enabled: boolean) => void
  setChinaCoordFix: (enabled: boolean) => void
  setRefreshInterval: (interval: number) => void
  setBaseMapStyle: (style: BaseMapStyle) => void
  resetSettings: () => void
}

const defaultSettings = {
  autoRefresh: true,
  showUnavailableStations: false,
  chinaCoordFix: true,
  refreshInterval: 5, // 默认5秒刷新一次，提高数据同步性
  baseMapStyle: 'auto' as BaseMapStyle
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, _get) => ({
      ...defaultSettings,

      setAutoRefresh: (enabled: boolean) => set({ autoRefresh: enabled }),
      setShowUnavailableStations: (enabled: boolean) => set({ showUnavailableStations: enabled }),
      setChinaCoordFix: (enabled: boolean) => set({ chinaCoordFix: enabled }),
      setRefreshInterval: (interval: number) => {
        // 确保刷新间隔不少于3秒，防止过于频繁的请求
        const validInterval = Math.max(3, interval)
        set({ refreshInterval: validInterval })
      },
      setBaseMapStyle: (style: BaseMapStyle) => set({ baseMapStyle: style }),
      
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'app-settings',
      // 迁移逻辑：为现有用户优化刷新间隔
      migrate: (persistedState: unknown, _version: number) => {
        const state = (persistedState || {}) as Partial<SettingsState>
        if (state.refreshInterval != null && state.refreshInterval >= 30) {
          // 如果现有用户的刷新间隔 >= 30秒，建议改为5秒以提高数据准确性
          state.refreshInterval = 5
        }
        if (!state.baseMapStyle) state.baseMapStyle = defaultSettings.baseMapStyle
        return state
      },
      version: 1
    }
  )
)

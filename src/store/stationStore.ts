import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Station } from '../types/station'
import { applyJitter, fetchNearStations } from '../utils/api'
import { useErrorStore } from './errorStore'
import { useSettingsStore } from './settingsStore'

// 默认位置（WGS84）：由旧版高德(GCJ-02)中心点换算得到
const MAP_CENTER: [number, number] = [30.757064, 103.933993]
const BOOT_REVALIDATE_COOLDOWN = 10_000
let hasBoundApiEvents = false

type RefreshOptions = {
  force?: boolean
  showLoading?: boolean
}

interface StationState {
  stations: Station[]
  isLoading: boolean
  isRefreshing: boolean
  lastRefresh: number
  userLocation: [number, number] | null
  searchKeyword: string
  isUsingSimulatedData: boolean
  
  // Actions
  setStations: (stations: Station[]) => void
  setLoading: (loading: boolean) => void
  setUserLocation: (location: [number, number] | null) => void
  setSearchKeyword: (keyword: string) => void
  setSimulatedData: (isSimulated: boolean) => void
  initializeStations: () => Promise<void>
  refreshStations: (lat?: number, lng?: number, options?: RefreshOptions) => Promise<void>
  canRefresh: () => boolean
  getFilteredStations: () => Station[]
}

function getRefreshCooldownMs() {
  const intervalSeconds = useSettingsStore.getState().refreshInterval ?? 5
  return Math.max(3000, intervalSeconds * 1000)
}

function getCurrentPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

export const useStationStore = create<StationState>()(
  persist(
    (set, get) => {
      if (typeof window !== 'undefined' && !hasBoundApiEvents) {
        hasBoundApiEvents = true
        window.addEventListener('api-fallback-to-simulation', () => set({ isUsingSimulatedData: true }))
        window.addEventListener('api-using-real-data', () => set({ isUsingSimulatedData: false }))
      }

      return {
        stations: [],
        isLoading: false,
        isRefreshing: false,
        lastRefresh: 0,
        userLocation: null,
        searchKeyword: '',
        isUsingSimulatedData: false,

        setStations: (stations: Station[]) => set({ stations }),
        setLoading: (loading: boolean) => set({ isLoading: loading }),
        setUserLocation: (location: [number, number] | null) => set({ userLocation: location }),
        setSearchKeyword: (keyword: string) => set({ searchKeyword: keyword }),
        setSimulatedData: (isSimulated: boolean) => set({ isUsingSimulatedData: isSimulated }),

        // 初始化：有缓存则先展示缓存，再在后台拉取最新；无缓存则显示加载态。
        initializeStations: async () => {
          const { stations, lastRefresh } = get()
          const hasCachedStations = stations.length > 0
          const now = Date.now()

          // 避免用户短时间内刷新/重进导致重复请求
          if (hasCachedStations && now - lastRefresh < BOOT_REVALIDATE_COOLDOWN) return

          let location: [number, number] | null = null
          try {
            const pos = await getCurrentPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 })
            location = [pos.coords.latitude, pos.coords.longitude]
            set({ userLocation: location })
          } catch {
            // ignore
          }

          const [lat, lng] = location ?? get().userLocation ?? MAP_CENTER
          await get().refreshStations(lat, lng, { force: true, showLoading: !hasCachedStations })
        },

        refreshStations: async (lat?: number, lng?: number, options: RefreshOptions = {}) => {
          const { userLocation, stations, isLoading, isRefreshing } = get()
          const force = Boolean(options.force)
          const showLoading = options.showLoading ?? true

          if (!force && !get().canRefresh()) return
          if (isLoading || isRefreshing) return

          set(showLoading ? { isLoading: true, isRefreshing: true } : { isRefreshing: true })

          try {
            const [targetLat, targetLng] =
              lat != null && lng != null ? [lat, lng] : userLocation ?? MAP_CENTER

            const { chinaCoordFix } = useSettingsStore.getState()
            const nearStations = await fetchNearStations(targetLat, targetLng, { coordFix: chinaCoordFix })

            if (nearStations?.length > 0) {
              set({
                stations: applyJitter(nearStations),
                lastRefresh: Date.now()
              })
            }
          } catch (error) {
            if (import.meta.env.DEV) console.error('Failed to refresh stations:', error)

            // 后台刷新失败不打断用户；主动/首次加载失败再提示
            if (showLoading) {
              const message = stations.length === 0 ? '无法加载充电站数据' : '刷新失败，请稍后重试'
              useErrorStore.getState().showError(message)
            } else if (stations.length === 0) {
              useErrorStore.getState().showError('无法加载充电站数据')
            }
          } finally {
            set({ isLoading: false, isRefreshing: false })
          }
        },

        canRefresh: () => {
          const { lastRefresh } = get()
          return Date.now() - lastRefresh >= getRefreshCooldownMs()
        },

        getFilteredStations: () => {
          const { stations, searchKeyword } = get()
          const keyword = searchKeyword.trim().toLowerCase()
          if (!keyword) return stations

          return stations.filter((station) => {
            const name = station.stationName?.toLowerCase?.() ?? ''
            const address = station.address?.toLowerCase?.() ?? ''
            return name.includes(keyword) || address.includes(keyword)
          })
        }
      }
    },
    {
      name: 'station-data',
      partialize: (state) => ({ 
        stations: state.stations,
        lastRefresh: state.lastRefresh
      }),
    }
  )
)

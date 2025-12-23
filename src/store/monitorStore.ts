import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Outlet } from '../types/station'

export interface MonitorData {
  timestamp: number
  power: number // 充电功率 (W)
  fee: number // 累计费用
  duration: number // 充电时长(分钟)
}

export interface MonitorTarget {
  stationId: number
  stationName: string
  outlet: Outlet
  outletName: string
}

interface MonitorState {
  // 当前监视的插座
  currentTarget: MonitorTarget | null
  
  // 历史数据
  monitorHistory: MonitorData[]
  
  // 轮询设置
  pollInterval: number // 轮询间隔(秒)
  isMonitoring: boolean
  lastPollTime: number
  
  // Actions
  setMonitorTarget: (target: MonitorTarget | null) => void
  addMonitorData: (data: MonitorData) => void
  clearHistory: () => void
  setPollInterval: (interval: number) => void
  setMonitoring: (isMonitoring: boolean) => void
  setLastPollTime: (time: number) => void
}

export const useMonitorStore = create<MonitorState>()(
  persist(
    (set) => ({
      currentTarget: null,
      monitorHistory: [],
      pollInterval: 600, // 默认10分钟(600秒)
      isMonitoring: false,
      lastPollTime: 0,
      
      setMonitorTarget: (target) => set({ 
        currentTarget: target,
        // 切换监视对象时清空历史
        monitorHistory: target ? [] : []
      }),
      
      addMonitorData: (data) => set((state) => ({
        monitorHistory: [...state.monitorHistory, data],
        lastPollTime: Date.now()
      })),
      
      clearHistory: () => set({ monitorHistory: [] }),
      
      setPollInterval: (interval) => set({ pollInterval: interval }),
      
      setMonitoring: (isMonitoring) => set({ isMonitoring }),
      
      setLastPollTime: (time) => set({ lastPollTime: time })
    }),
    {
      name: 'outlet-monitor',
      partialize: (state) => ({
        pollInterval: state.pollInterval,
        // 不持久化监视状态和历史数据，每次重新开始
      })
    }
  )
)

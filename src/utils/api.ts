import { 
  Station, 
  Outlet, 
  OutletStatus, 
  ApiResponse, 
  NearStationsRequest,
  NearStationsResponse 
} from '../types/station'
import { 
  mergeStationsLocations, 
  extractMergedStations, 
  debugLocationMerge 
} from './locationMerger'
import { ENABLE_DEBUG } from '../config/environment'
import { gcj02ToWgs84, isInChina, wgs84ToGcj02 } from './coords'

const JITTER_AMOUNT = 0.0004

// CORS代理列表（按优先级排序）
const CORS_PROXIES = [
  { 
    url: 'https://api.codetabs.com/v1/proxy?quest=',
    type: 'direct'
  },
  { 
    url: 'https://cors-anywhere.herokuapp.com/',
    type: 'direct'
  },
  { 
    url: 'https://api.allorigins.win/get?url=',
    type: 'allorigins'
  },
  { 
    url: 'https://cors.bridged.cc/',
    type: 'direct'
  },
  { 
    url: 'https://proxy.cors.sh/',
    type: 'direct'
  }
]

// CORS代理和基础API函数
async function fetchAPI<T>(url: string, options: RequestInit = {}): Promise<T | null> {
  
  // 首先尝试直接请求（可能在某些环境下可行）
  try {
    if (ENABLE_DEBUG) console.log(`🔄 尝试直接请求: ${url}`)
    const response = await fetch(url, {
      ...options,
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    
    if (response.ok) {
      const data: ApiResponse<T> = await response.json()
      if (data.code === "1") {
        if (ENABLE_DEBUG) console.log(`✅ 直接请求成功`)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('api-using-real-data'))
        }
        return data.data
      }
    }
  } catch (error) {
    if (ENABLE_DEBUG) console.warn(`❌ 直接请求失败，尝试代理服务`, error)
  }

  // 相对路径无法通过第三方代理转发
  if (url.startsWith('/')) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-fallback-to-simulation'))
    }
    return getSimulatedData<T>(url)
  }
  
  // 尝试每个代理服务
  for (const proxy of CORS_PROXIES) {
    try {
      if (ENABLE_DEBUG) console.log(`🔄 尝试代理: ${proxy.url}`)
      let response: Response
      
      if (proxy.type === 'allorigins') {
        // AllOrigins 需要特殊处理
        const proxyUrl = `${proxy.url}${encodeURIComponent(url)}`
        response = await fetch(proxyUrl, { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`)
        }
        
        const result = (await response.json()) as any
        if (result.status?.http_code !== 200) {
          throw new Error(`Proxy error: ${result.status?.http_code}`)
        }
        
        // 尝试解析内容
        let contents = result.contents
        if (typeof contents === 'string') {
          try {
            contents = JSON.parse(contents)
        } catch {
          throw new Error('JSON 解析失败')
        }
        }
        
        const data: ApiResponse<T> = contents
        if (data.code !== "1") {
          throw new Error(data.msg || 'API error')
        }
        
        if (ENABLE_DEBUG) console.log(`✅ 代理成功: ${proxy.url}`)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('api-using-real-data'))
        }
        return data.data
      } else {
        // 其他代理服务的标准处理
        const proxyUrl = `${proxy.url}${url}`
        response = await fetch(proxyUrl, {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...options.headers
          },
          body: options.body
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`)
        }
        
        const data: ApiResponse<T> = await response.json()
        if (data.code !== "1") {
          throw new Error(data.msg || 'API error')
        }
        
        if (ENABLE_DEBUG) console.log(`✅ 代理成功: ${proxy.url}`)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('api-using-real-data'))
        }
        return data.data
      }
    } catch (error) {
      if (ENABLE_DEBUG) console.warn(`❌ 代理失败: ${proxy.url}`, error)
      continue
    }
  }
  
  // 所有代理都失败了，返回模拟数据
  console.error(`💥 所有CORS代理都失败了，返回模拟数据`)
  
  // 通知 store 使用了模拟数据
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api-fallback-to-simulation'))
  }
  
  return getSimulatedData<T>(url)
}

// 模拟数据生成器
function getSimulatedData<T>(url: string): T | null {
  // 为充电桩接口返回模拟数据
  if (url.includes('/near/station')) {
    return {
      elecStationData: [
        {
          stationId: 1,
          stationName: '清水河校区充电站（模拟）',
          address: '四川省成都市高新西区西源大道2006号',
          latitude: 30.754736739439924,
          longitude: 103.92946279311207,
          freeNum: 2
        },
        {
          stationId: 2,
          stationName: '电子科大充电站（模拟）',
          address: '四川省成都市成华区建设北路二段',
          latitude: 30.765,
          longitude: 103.935,
          freeNum: 1
        }
      ]
    } as T
  }
  
  // 为插座状态接口返回模拟数据
  if (url.includes('/station/outlet')) {
    return [
      {
        outletId: 1,
        outletNo: '01',
        outletSerialNo: 1,
        vOutletName: '插座01',
        iCurrentChargingRecordId: 0
      },
      {
        outletId: 2,
        outletNo: '02',
        outletSerialNo: 2,
        vOutletName: '插座02',
        iCurrentChargingRecordId: 123
      }
    ] as T
  }
  
  return null
}

// 获取附近充电站
export async function fetchNearStations(
  // 默认位置（WGS84）：由旧版模拟/默认点(GCJ-02)换算得到
  lat = 30.757444430112365,
  lng = 103.9273601548557,
  options: { coordFix?: boolean } = {}
): Promise<Station[]> {
  if (ENABLE_DEBUG) console.log('🔍 开始获取附近充电站...', { lat, lng })
  
  const url = '/api/device/v1/near/station'

  const coordFix = options.coordFix ?? true
  const requestCoord = coordFix && isInChina(lat, lng) ? wgs84ToGcj02(lat, lng) : { lat, lng }
  
  const body: NearStationsRequest = {
    page: 1,
    pageSize: 200,
    scale: 3,
    latitude: requestCoord.lat,
    longitude: requestCoord.lng,
    userLatitude: requestCoord.lat,
    userLongitude: requestCoord.lng
  }
  
  const data = await fetchAPI<NearStationsResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(body)
  })
  
  const apiStations = data?.elecStationData || []
  if (ENABLE_DEBUG) console.log(`📡 API返回 ${apiStations.length} 个充电站`)
  
  // 合并硬编码位置信息
  const mergeResults = mergeStationsLocations(apiStations)
  const mergedStations = extractMergedStations(mergeResults)
  
  // 打印位置合并统计信息
  const stats = debugLocationMerge(mergeResults, false)
  if (ENABLE_DEBUG) console.log(`🗺️ 位置合并完成: ${stats.hardcoded}/${stats.total} 使用硬编码位置`)
  
  if (!coordFix) return mergedStations

  return mergedStations.map((s) => {
    if (!isInChina(s.latitude, s.longitude)) return s
    const fixed = gcj02ToWgs84(s.latitude, s.longitude)
    return { ...s, latitude: fixed.lat, longitude: fixed.lng }
  })
}

// 获取充电站插座信息
export async function fetchStationOutlets(stationId: number): Promise<Outlet[]> {
  const url = `/api/charge/v1/outlet/station/outlets/${stationId}`
  const data = await fetchAPI<Outlet[]>(url)
  return data || []
}

// 获取插座状态
export async function fetchOutletStatus(outletNo: string): Promise<OutletStatus | null> {
  const url = `/api/charge/v1/charging/outlet/${outletNo}`
  return await fetchAPI<OutletStatus>(url)
}

// 应用坐标抖动以避免重叠
export function applyJitter(stations: Station[]): Station[] {
  // 保持抖动稳定：避免每次刷新 marker “抖来抖去”
  const mulberry32 = (seed: number) => {
    let t = seed >>> 0
    return () => {
      t += 0x6d2b79f5
      let r = Math.imul(t ^ (t >>> 15), 1 | t)
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296
    }
  }

  const distanceSq = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) =>
    (p1.lat - p2.lat) ** 2 + (p1.lng - p2.lng) ** 2

  const minDistanceSq = 0.0003 ** 2
  const occupied: Array<{ lat: number; lng: number }> = []

  return [...stations]
    .sort((a, b) => (a.stationId ?? 0) - (b.stationId ?? 0))
    .map((station) => {
      let newLat = station.latitude
      let newLng = station.longitude
      const rand = mulberry32((station.stationId ?? 0) + 0x9e3779b9)

      for (let attempts = 0; attempts < 100; attempts++) {
        const collides = occupied.some((p) => distanceSq({ lat: newLat, lng: newLng }, p) < minDistanceSq)
        if (!collides) break
        newLat += (rand() - 0.5) * JITTER_AMOUNT
        newLng += (rand() - 0.5) * JITTER_AMOUNT
      }

      occupied.push({ lat: newLat, lng: newLng })
      return { ...station, latitude: newLat, longitude: newLng }
    })
}

// 根据可用性获取颜色
export function getColorForAvailability(ratio: number): string {
  if (ratio < 0 || isNaN(ratio)) return '#9ca3af' // gray
  if (ratio === 0) return '#b91c1c' // red
  
  const hue = ratio * 120
  const lightness = 45 + (ratio * 15)
  const saturation = 75 + (ratio * 20)
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

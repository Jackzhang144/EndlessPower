import { useMemo, useState } from 'react'
import { Button } from '@heroui/react'
import { useFavoritesStore } from '../store/favoritesStore'
import { useStationStore } from '../store/stationStore'
import type { Station } from '../types/station'
import FavoriteStationCard from './FavoriteStationCard'
import { HeartIcon, MapIcon, RefreshIcon } from './icons'

type FavoritesViewProps = {
  onOpenMap?: () => void
}

const REFRESH_COOLDOWN = 15_000

export default function FavoritesView({ onOpenMap }: FavoritesViewProps) {
  const [lastRefresh, setLastRefresh] = useState(0)
  const { favoriteIds, isPinned } = useFavoritesStore()
  const { stations } = useStationStore()

  const favoriteStations = useMemo(() => {
    const found = favoriteIds
      .map((id) => stations.find((s) => s.stationId === id))
      .filter(Boolean) as Station[]

    return found.sort((a, b) => {
      const aPinned = isPinned(a.stationId)
      const bPinned = isPinned(b.stationId)
      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1
      return 0
    })
  }, [favoriteIds, isPinned, stations])

  const canRefresh = Date.now() - lastRefresh >= REFRESH_COOLDOWN

  return (
    <div className="favorites-view" data-testid="favorites-view">
      <div className="page-inner">
        <div className="favorites-header">
          <div className="favorites-title">
            <div className="favorites-title-main">我的收藏</div>
            <div className="favorites-title-sub">{favoriteStations.length > 0 ? `${favoriteStations.length} 个充电站` : '还没有收藏'}</div>
          </div>
          <div className="favorites-header-actions">
            {onOpenMap && (
              <Button variant="secondary" onPress={onOpenMap} aria-label="去地图">
                <MapIcon size={18} />
                <span className="button-text">地图</span>
              </Button>
            )}
            <Button
              variant="primary"
              onPress={() => canRefresh && setLastRefresh(Date.now())}
              isDisabled={!canRefresh}
              aria-label="刷新"
            >
              <RefreshIcon size={18} />
              <span className="button-text">刷新</span>
            </Button>
          </div>
        </div>

        {favoriteStations.length === 0 ? (
          <div className="favorites-empty">
            <div className="favorites-empty-icon" aria-hidden="true">
              <HeartIcon size={28} />
            </div>
            <div className="favorites-empty-title">还没有收藏的充电桩</div>
            <div className="favorites-empty-sub">在地图上点选充电桩，然后点击"收藏"按钮即可添加到这里。</div>
            {onOpenMap && (
              <Button variant="primary" onPress={onOpenMap} style={{ marginTop: 8 }}>
                去地图查看
              </Button>
            )}
          </div>
        ) : (
          <div className="favorites-grid">
            {favoriteStations.map((station) => (
              <FavoriteStationCard key={station.stationId} station={station} refreshTrigger={lastRefresh} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import { Tabs } from '@heroui/react'
import { HeartIcon, MapIcon, SettingsIcon } from './icons'

export type HudView = 'map' | 'favorites' | 'monitor'

type HudProps = {
  currentView: HudView
  onViewChange: (view: HudView) => void
  onOpenSettings: () => void
  isHidden?: boolean
  children?: ReactNode
}

export default function Hud({ currentView, onViewChange, onOpenSettings, isHidden, children }: HudProps) {
  const hidden = Boolean(isHidden)
  return (
    <>
      <div className={`hud-layer ${hidden ? 'is-hidden' : ''}`} aria-hidden={hidden ? 'true' : undefined}>
        {children}
      </div>

      <nav className={`bottom-nav ${hidden ? 'is-hidden' : ''}`} aria-label="主导航" aria-hidden={hidden ? 'true' : undefined}>
        <Tabs
          selectedKey={currentView}
          onSelectionChange={(key) => {
            const next = String(key)
            if (next === 'settings') {
              onOpenSettings()
              return
            }
            onViewChange(next as HudView)
          }}
          hideSeparator
          aria-label="主导航"
          className="bottom-nav-tabs"
        >
          <Tabs.List className="bottom-nav-tabs-list">
            <Tabs.Tab id="map" className="bottom-nav-tab">
              <Tabs.Indicator />
              <span className="bottom-nav-icon" aria-hidden="true">
                <MapIcon size={24} />
              </span>
              <span className="bottom-nav-label">地图</span>
            </Tabs.Tab>

            <Tabs.Tab id="favorites" className="bottom-nav-tab">
              <Tabs.Indicator />
              <span className="bottom-nav-icon" aria-hidden="true">
                <HeartIcon size={24} />
              </span>
              <span className="bottom-nav-label">收藏</span>
            </Tabs.Tab>

            <Tabs.Tab id="settings" className="bottom-nav-tab">
              <Tabs.Indicator />
              <span className="bottom-nav-icon" aria-hidden="true">
                <SettingsIcon size={24} />
              </span>
              <span className="bottom-nav-label">设置</span>
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </nav>
    </>
  )
}

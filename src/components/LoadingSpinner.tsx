import { memo } from 'react'

type LoadingSpinnerProps = {
  label?: string
}

function LoadingSpinner({ label = '加载中…' }: LoadingSpinnerProps) {
  return (
    <div className="loading-pill" role="status" aria-live="polite" aria-label={label}>
      <span className="loading-dot" aria-hidden="true" />
      <span className="loading-text">{label}</span>
    </div>
  )
}

export default memo(LoadingSpinner)

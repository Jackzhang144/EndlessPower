import { Button, Card } from '@heroui/react'
import { useContributors } from '../hooks/useContributors'
import LoadingSpinner from './LoadingSpinner'

export default function ContributorsSection() {
  const { contributors, repoStats, stats, isLoading, error, lastUpdated, refresh } = useContributors()

  return (
    <div className="contrib">
      <div className="contrib-header">
        <div className="contrib-title">项目贡献者</div>
        <Button variant="secondary" onPress={refresh} isDisabled={isLoading}>
          {isLoading ? '加载中…' : '刷新'}
        </Button>
      </div>

      {error && <div className="contrib-error">{error}</div>}

      {repoStats && (
        <div className="contrib-stats">
          <Card className="contrib-stat">
            <Card.Content>
              <div className="contrib-number is-warning">{repoStats.stars}</div>
              <div className="contrib-label">Stars</div>
            </Card.Content>
          </Card>
          <Card className="contrib-stat">
            <Card.Content>
              <div className="contrib-number is-success">{stats.totalContributors}</div>
              <div className="contrib-label">贡献者</div>
            </Card.Content>
          </Card>
          <Card className="contrib-stat">
            <Card.Content>
              <div className="contrib-number">{repoStats.forks}</div>
              <div className="contrib-label">Forks</div>
            </Card.Content>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="contrib-loading">
          <LoadingSpinner label="加载贡献者…" />
        </div>
      ) : (
        <>
          <div className="contrib-grid">
            {contributors.slice(0, 12).map((c) => (
              <button
                key={c.id}
                type="button"
                className="contrib-avatar"
                aria-label={`查看 ${c.login} 的 GitHub 主页`}
                onClick={() => window.open(c.html_url, '_blank', 'noopener,noreferrer')}
              >
                <img
                  src={c.avatar_url}
                  alt={c.login}
                  loading="lazy"
                  onError={(event) => {
                    const img = event.currentTarget
                    img.onerror = null
                    img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.login)}&background=6B7280&color=fff&size=80`
                  }}
                />
              </button>
            ))}
          </div>

          {contributors.length > 12 && (
            <div className="contrib-more">还有 {contributors.length - 12} 位贡献者</div>
          )}

          {lastUpdated && <div className="contrib-updated">最后更新：{lastUpdated.toLocaleString()}</div>}
        </>
      )}
    </div>
  )
}

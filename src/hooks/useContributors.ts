import { useState, useEffect } from 'react'
import { fetchContributors, fetchRepoStats, GitHubContributor } from '../utils/github'

export interface RepoStats {
  stars: number
  forks: number
  issues: number
  lastUpdated: string
  language: string
  license: string
}

export const useContributors = () => {
  const [contributors, setContributors] = useState<GitHubContributor[]>([])
  const [repoStats, setRepoStats] = useState<RepoStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadContributors = async (force = false) => {
    // 防重复请求，除非强制刷新
    if (!force && (isLoading || (contributors.length > 0 && lastUpdated && Date.now() - lastUpdated.getTime() < 5 * 60 * 1000))) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 并行获取贡献者和仓库统计信息
      const [contributorsData, statsData] = await Promise.all([
        fetchContributors(),
        fetchRepoStats()
      ])

      setContributors(contributorsData)
      setRepoStats(statsData)
      setLastUpdated(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取贡献者信息失败'
      setError(errorMessage)
      console.error('Failed to load contributors:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // 组件挂载时自动加载
  useEffect(() => {
    loadContributors()
  }, [])

  // 计算统计信息
  const stats = {
    totalContributors: contributors.length,
    totalContributions: contributors.reduce((sum, contributor) => sum + contributor.contributions, 0),
    topContributor: contributors.length > 0 ? contributors[0] : null
  }

  return {
    contributors,
    repoStats,
    stats,
    isLoading,
    error,
    lastUpdated,
    loadContributors,
    refresh: () => loadContributors(true)
  }
}

/**
 * 应用版本信息管理
 * 从构建时注入的环境变量或package.json获取版本信息
 */

// 获取应用版本号
export const getAppVersion = (): string => {
  // 优先使用构建时注入的版本号
  try {
    return __APP_VERSION__ || '2.0.0'
  } catch {
    return import.meta.env.VITE_APP_VERSION || '2.0.0'
  }
}

// 获取构建时间
export const getBuildTime = (): string => {
  try {
    return __BUILD_TIME__ || new Date().toISOString()
  } catch {
    return import.meta.env.VITE_BUILD_TIME || new Date().toISOString()
  }
}

// 获取Git提交信息
export const getGitCommit = (): string => {
  try {
    return __GIT_COMMIT__ || 'unknown'
  } catch {
    return import.meta.env.VITE_GIT_COMMIT || 'unknown'
  }
}

// 获取构建环境
export const getBuildEnv = (): string => {
  return import.meta.env.MODE || 'development'
}

// 获取完整版本信息
export const getVersionInfo = () => {
  return {
    version: getAppVersion(),
    buildTime: getBuildTime(),
    gitCommit: getGitCommit(),
    environment: getBuildEnv(),
    isProduction: import.meta.env.PROD,
    isDevelopment: import.meta.env.DEV
  }
}

// 格式化版本显示
export const formatVersionDisplay = (): string => {
  const version = getAppVersion()
  const env = getBuildEnv()
  
  if (env === 'development') {
    return `${version}-dev`
  }
  
  return version
}

// 获取短版本的Git提交哈希
export const getShortGitCommit = (): string => {
  const fullCommit = getGitCommit()
  return fullCommit.length > 7 ? fullCommit.substring(0, 7) : fullCommit
}

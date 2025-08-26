import { useEffect, useCallback, useMemo } from 'react'

import { useExtensionContext } from '@/components/extension/ExtensionProvider'

export interface ProcessedUserInfo {
  displayName: string
  email?: string
  isLoggedIn: boolean
  roles?: string[]
  raw?: any
}

export function useUserProfile() {
  const { extension, auth } = useExtensionContext()

  // Automatically load user info when authenticated and extension is ready
  useEffect(() => {
    if (auth.isAuthenticated && extension.client && !auth.userInfo) {
      auth.refreshUserInfo().catch(error => {
        console.error('Failed to auto-load user info:', error)
      })
    }
  }, [auth.isAuthenticated, extension.client, auth.userInfo, auth.refreshUserInfo])

  // Manual refresh with error handling
  const refresh = useCallback(async () => {
    if (!extension.client) return

    try {
      await auth.refreshUserInfo()
    } catch (error) {
      console.error('Failed to refresh user info:', error)
    }
  }, [extension.client, auth.refreshUserInfo])

  // Process user data consistently with memoization
  const processedUserInfo: ProcessedUserInfo | null = useMemo(() => {
    if (!auth.userInfo) return null

    const userInfo = auth.userInfo?.body || auth.userInfo

    return {
      displayName: userInfo?.username || userInfo?.name || userInfo?.full_name || 'User',
      email: userInfo?.email,
      isLoggedIn: userInfo?.logged_in !== undefined ? userInfo.logged_in : true,
      roles: userInfo?.roles && Array.isArray(userInfo.roles) ? userInfo.roles : undefined,
      raw: userInfo,
    }
  }, [auth.userInfo])

  return useMemo(
    () => ({
      userInfo: processedUserInfo,
      isLoading: !auth.userInfo && auth.isAuthenticated,
      error: auth.error,
      refresh,
      isAuthenticated: auth.isAuthenticated,
    }),
    [processedUserInfo, auth.userInfo, auth.isAuthenticated, auth.error, refresh]
  )
}

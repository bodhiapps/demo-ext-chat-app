import { useState, useEffect, useCallback, useMemo } from 'react'

import { useAuthServer } from './useAuthServer'
import { useExtensionApi } from './useExtensionApi'

import { STORAGE_KEYS } from '@/lib/extension-constants'
import { ExtensionClient } from '@/lib/libbodhiext'
import { buildAuthUrl } from '@/lib/oauth-utils'

export type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'error'

export interface AuthState {
  status: AuthStatus
  isAuthenticated: boolean
  userInfo: any | null
  error: Error | null
}

export interface UseAuthReturn extends AuthState {
  login: () => Promise<void>
  logout: () => void
  refreshUserInfo: () => Promise<void>
  processCallback: (code: string, state: string) => Promise<void>
}

export function useAuth(extensionClient: ExtensionClient | null): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    status: 'idle',
    isAuthenticated: false,
    userInfo: null,
    error: null,
  })

  const authServer = useAuthServer()
  const extensionApi = useExtensionApi(extensionClient)

  // Check authentication status on mount and when localStorage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const isAuthenticated = authServer.isAuthenticated()
      setState(prev => ({
        ...prev,
        status: isAuthenticated ? 'authenticated' : 'idle',
        isAuthenticated,
        // Clear user info if not authenticated
        userInfo: isAuthenticated ? prev.userInfo : null,
        error: isAuthenticated ? prev.error : null,
      }))
    }

    // Check on mount
    checkAuthStatus()

    // Listen for storage changes (token clearing)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.ACCESS_TOKEN || e.key === null) {
        // Token was removed or localStorage was cleared
        checkAuthStatus()
      }
    }

    // Listen for custom auth events (for same-tab changes)
    const handleAuthChange = () => {
      checkAuthStatus()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('authStateChanged', handleAuthChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authStateChanged', handleAuthChange)
    }
  }, [authServer])

  const login = useCallback(async (): Promise<void> => {
    if (!extensionClient) {
      throw new Error('Extension client not available')
    }

    setState(prev => ({
      ...prev,
      status: 'authenticating',
      error: null,
    }))

    try {
      // Step 1: Request resource access using extensionApi (no auth headers)
      await extensionApi.requestResourceAccess()

      // Step 2: Build auth URL and redirect
      const authUrl = await buildAuthUrl()

      // Redirect to OAuth server
      window.location.href = authUrl
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      }))
      throw error
    }
  }, [extensionClient, extensionApi])

  const logout = useCallback((): void => {
    authServer.clearTokensAndRedirect()
  }, [authServer])

  const refreshUserInfo = useCallback(async (): Promise<void> => {
    if (!authServer.isAuthenticated()) {
      throw new Error('User not authenticated')
    }

    console.log('🔄 Refreshing user info...')

    try {
      const response = await extensionApi.sendApiRequest('GET', '/bodhi/v1/user')
      const userInfo = response?.body || response

      console.log('📋 User info response received:', {
        logged_in: userInfo?.logged_in,
        hasTokens: authServer.isAuthenticated(),
      })

      // Check if user is logged out on server but we have tokens
      if (userInfo?.logged_in === false && authServer.isAuthenticated()) {
        console.log('⚠️ User appears logged out on server but we have tokens - attempting token refresh...')

        try {
          // Try to refresh the access token
          const newToken = await authServer.refreshAccessToken()

          if (newToken) {
            console.log('✅ Token refreshed successfully, retrying user info...')
            // Retry the user info call with refreshed token
            const retryResponse = await extensionApi.sendApiRequest('GET', '/bodhi/v1/user')
            const retryUserInfo = retryResponse?.body || retryResponse

            console.log('📋 Retry user info response:', { logged_in: retryUserInfo?.logged_in })

            // If still logged out after refresh, tokens are invalid
            if (retryUserInfo?.logged_in === false) {
              console.error('❌ User still logged out after token refresh - clearing tokens and logging out')
              // Update local state immediately before redirect
              setState(prev => ({
                ...prev,
                status: 'idle',
                isAuthenticated: false,
                userInfo: null,
                error: null,
              }))
              authServer.clearTokensAndRedirect()
              return
            }

            // Use the retry response
            setState(prev => ({
              ...prev,
              userInfo: retryResponse,
              error: null,
            }))
            return
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError)
          // Update local state immediately before redirect
          setState(prev => ({
            ...prev,
            status: 'idle',
            isAuthenticated: false,
            userInfo: null,
            error: null,
          }))
          // If refresh fails, clear tokens and logout
          authServer.clearTokensAndRedirect()
          return
        }
      }

      setState(prev => ({
        ...prev,
        userInfo: response,
        error: null,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
      }))
      throw error
    }
  }, [authServer, extensionApi])

  const processCallback = useCallback(
    async (code: string, state: string): Promise<void> => {
      if (!extensionClient) {
        throw new Error('Extension client not available')
      }

      setState(prev => ({
        ...prev,
        status: 'authenticating',
        error: null,
      }))

      try {
        // Exchange code for tokens using authServer
        await authServer.exchangeCodeForTokens(code, state)

        // Get user info using extensionApi which will handle token refresh if needed
        const response = await extensionApi.sendApiRequest('GET', '/bodhi/v1/user')

        setState({
          status: 'authenticated',
          isAuthenticated: true,
          userInfo: response,
          error: null,
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          status: 'error',
          isAuthenticated: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }))
        throw error
      }
    },
    [extensionClient, authServer, extensionApi]
  )

  return useMemo(
    () => ({
      ...state,
      login,
      logout,
      refreshUserInfo,
      processCallback,
    }),
    [state, login, logout, refreshUserInfo, processCallback]
  )
}

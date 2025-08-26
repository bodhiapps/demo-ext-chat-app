import { useCallback, useRef, useMemo } from 'react'

import { STORAGE_KEYS, BODHI_AUTH_URL, AUTH_REALM, APP_CLIENT_ID } from '@/lib/extension-constants'

export interface UseAuthServerReturn {
  exchangeCodeForTokens: (code: string, state: string) => Promise<void>
  refreshAccessToken: () => Promise<string | null>
  clearTokensAndRedirect: () => void
  isAuthenticated: () => boolean
  getAccessToken: () => string | null
  buildAuthHeaders: (additionalHeaders?: Record<string, string>) => Record<string, string>
}

/**
 * Hook for direct OAuth server communication (no extension required)
 * Handles token exchange, refresh, and storage management
 */
export function useAuthServer(): UseAuthServerReturn {
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null)

  const exchangeCodeForTokens = useCallback(async (code: string, state: string): Promise<void> => {
    console.log('🔄 Starting OAuth token exchange...')

    // Validate state parameter
    const storedState = localStorage.getItem(STORAGE_KEYS.STATE)
    if (state !== storedState) {
      console.error('❌ State validation failed - possible CSRF attack')
      throw new Error('Invalid state parameter. Possible CSRF attack.')
    }
    console.log('✅ State validation passed')

    // Get code verifier for PKCE
    const codeVerifier = localStorage.getItem(STORAGE_KEYS.CODE_VERIFIER)
    if (!codeVerifier) {
      console.error('❌ Code verifier not found')
      throw new Error('Code verifier not found. Please restart the OAuth flow.')
    }

    const tokenUrl = `${BODHI_AUTH_URL}/realms/${AUTH_REALM}/protocol/openid-connect/token`
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: APP_CLIENT_ID,
      code: code,
      redirect_uri: `${window.location.origin}/callback`,
      code_verifier: codeVerifier,
    })

    try {
      console.log('🚀 Making direct fetch request to OAuth server...')

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams.toString(),
      })

      console.log('📡 Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Token exchange failed:', response.status, errorText)
        throw new Error(`Token exchange failed: ${response.status} ${errorText}`)
      }

      const tokenData = await response.json()
      console.log('✅ Access token received:', tokenData.access_token ? 'yes' : 'no')
      console.log('🔄 Refresh token received:', tokenData.refresh_token ? 'yes' : 'no')

      if (!tokenData.access_token) {
        console.error('❌ No access token in response')
        throw new Error('No access token received')
      }

      // Store tokens
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.access_token)
      console.log('💾 Access token stored')

      if (tokenData.refresh_token) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refresh_token)
        console.log('💾 Refresh token stored')
      }

      // Clean up PKCE parameters
      localStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER)
      localStorage.removeItem(STORAGE_KEYS.STATE)
      localStorage.removeItem(STORAGE_KEYS.RESOURCE_SCOPE)
      console.log('🧹 Cleaned up temporary OAuth parameters')

      console.log('✅ OAuth token exchange completed successfully')
    } catch (error) {
      console.error('❌ Token exchange failed:', error)
      throw new Error(`Token exchange failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [])

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    // Prevent multiple concurrent refresh attempts
    if (refreshPromiseRef.current) {
      return await refreshPromiseRef.current
    }

    const performTokenRefresh = async (): Promise<string | null> => {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

      if (!refreshToken) {
        console.error('❌ No refresh token available')
        return null
      }

      console.log('🔄 Refreshing access token...')

      const tokenUrl = `${BODHI_AUTH_URL}/realms/${AUTH_REALM}/protocol/openid-connect/token`
      const tokenParams = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: APP_CLIENT_ID,
        refresh_token: refreshToken,
      })

      try {
        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: tokenParams.toString(),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Token refresh failed:', response.status, errorText)

          if (response.status === 401 || response.status === 400) {
            // Refresh token is invalid/expired
            console.log('🔄 Refresh token expired')
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
            // Emit custom event to notify auth state change
            window.dispatchEvent(new CustomEvent('authStateChanged'))
          }

          return null
        }

        const tokenData = await response.json()
        console.log('✅ Token refreshed successfully')

        if (!tokenData.access_token) {
          console.error('❌ No access token in refresh response')
          return null
        }

        // Store new tokens
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.access_token)

        if (tokenData.refresh_token) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refresh_token)
        }

        return tokenData.access_token
      } catch (error) {
        console.error('❌ Token refresh error:', error)
        return null
      }
    }

    refreshPromiseRef.current = performTokenRefresh()

    try {
      const result = await refreshPromiseRef.current
      return result
    } finally {
      refreshPromiseRef.current = null
    }
  }, [])

  const clearTokensAndRedirect = useCallback(() => {
    console.log('🔄 Clearing tokens and redirecting to landing page')

    // Clear all auth-related storage
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.RESOURCE_SCOPE)
    localStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER)
    localStorage.removeItem(STORAGE_KEYS.STATE)

    // Emit custom event to notify auth state change immediately (same tab)
    window.dispatchEvent(new CustomEvent('authStateChanged'))

    // Navigate to landing page (clear query params and force refresh)
    window.location.href = window.location.origin
  }, [])

  const buildAuthHeaders = useCallback((additionalHeaders?: Record<string, string>): Record<string, string> => {
    const headers: Record<string, string> = { ...additionalHeaders }

    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }

    return headers
  }, [])

  const isAuthenticated = useCallback((): boolean => {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  }, [])

  const getAccessToken = useCallback((): string | null => {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  }, [])

  return useMemo(
    () => ({
      exchangeCodeForTokens,
      refreshAccessToken,
      clearTokensAndRedirect,
      isAuthenticated,
      getAccessToken,
      buildAuthHeaders,
    }),
    [
      exchangeCodeForTokens,
      refreshAccessToken,
      clearTokensAndRedirect,
      isAuthenticated,
      getAccessToken,
      buildAuthHeaders,
    ]
  )
}

import { useCallback, useMemo } from 'react'

import { useAuthServer } from './useAuthServer'

import { ExtensionClient, type ApiResponse, type StreamChunk } from '@/lib/libbodhiext'

export interface UseExtensionApiReturn {
  sendApiRequest: (
    method: string,
    endpoint: string,
    body?: any,
    additionalHeaders?: Record<string, string>
  ) => Promise<ApiResponse>
  sendStreamRequest: (
    method: string,
    endpoint: string,
    body?: any,
    additionalHeaders?: Record<string, string>
  ) => Promise<AsyncIterable<StreamChunk>>
  requestResourceAccess: () => Promise<string>
}

/**
 * Hook for authenticated API calls through the browser extension
 * Handles token refresh on 401 errors and provides clean API interface
 */
export function useExtensionApi(extensionClient: ExtensionClient | null): UseExtensionApiReturn {
  const { refreshAccessToken, clearTokensAndRedirect, buildAuthHeaders } = useAuthServer()

  const is401Error = useCallback((error: any): boolean => {
    if (error && typeof error === 'object') {
      // Direct status check
      if (error.status === 401) return true

      // Response object with status
      if (error.response && error.response.status === 401) return true

      // ApiResponse format
      if ('body' in error && 'status' in error && error.status === 401) return true

      // Error message containing 401
      if (error.message && error.message.includes('401')) return true
    }

    return false
  }, [])

  const sendApiRequest = useCallback(
    async (
      method: string,
      endpoint: string,
      body?: any,
      additionalHeaders?: Record<string, string>
    ): Promise<ApiResponse> => {
      if (!extensionClient) {
        throw new Error('Extension client not available')
      }

      const headers = buildAuthHeaders(additionalHeaders)

      try {
        const response = await extensionClient.sendApiRequest(method, endpoint, body, headers)
        return response
      } catch (error) {
        if (is401Error(error)) {
          console.log('🔄 Got 401 response, attempting token refresh...')

          const newToken = await refreshAccessToken()
          if (newToken) {
            const newHeaders = buildAuthHeaders(additionalHeaders)
            console.log('🔄 Retrying request with refreshed token...')

            try {
              return await extensionClient.sendApiRequest(method, endpoint, body, newHeaders)
            } catch (retryError) {
              if (is401Error(retryError)) {
                console.error('❌ Still getting 401 after token refresh, tokens invalid')
                clearTokensAndRedirect()
              }
              throw retryError
            }
          } else {
            console.error('❌ Token refresh failed, clearing tokens')
            clearTokensAndRedirect()
          }
        }
        throw error
      }
    },
    [extensionClient, buildAuthHeaders, is401Error, refreshAccessToken, clearTokensAndRedirect]
  )

  const sendStreamRequest = useCallback(
    async (
      method: string,
      endpoint: string,
      body?: any,
      additionalHeaders?: Record<string, string>
    ): Promise<AsyncIterable<StreamChunk>> => {
      if (!extensionClient) {
        throw new Error('Extension client not available')
      }

      const headers = buildAuthHeaders(additionalHeaders)

      try {
        return await extensionClient.sendStreamRequest(method, endpoint, body, headers)
      } catch (error) {
        if (is401Error(error)) {
          console.log('🔄 Got 401 response, attempting token refresh...')

          const newToken = await refreshAccessToken()
          if (newToken) {
            const newHeaders = buildAuthHeaders(additionalHeaders)
            console.log('🔄 Retrying stream request with refreshed token...')

            try {
              return await extensionClient.sendStreamRequest(method, endpoint, body, newHeaders)
            } catch (retryError) {
              if (is401Error(retryError)) {
                console.error('❌ Still getting 401 after token refresh, tokens invalid')
                clearTokensAndRedirect()
              }
              throw retryError
            }
          } else {
            console.error('❌ Token refresh failed, clearing tokens')
            clearTokensAndRedirect()
          }
        }
        throw error
      }
    },
    [extensionClient, buildAuthHeaders, is401Error, refreshAccessToken, clearTokensAndRedirect]
  )

  const requestResourceAccess = useCallback(async (): Promise<string> => {
    if (!extensionClient) {
      throw new Error('Extension client not available')
    }

    console.log('🔑 Requesting resource access from BodhiApp...')

    try {
      // Make request-access call WITHOUT auth headers (pre-authentication)
      const response = await extensionClient.sendApiRequest('POST', '/bodhi/v1/auth/request-access', {
        app_client_id: 'app-a05c53c5-3fc4-409d-833d-f4acc90e1611',
      })

      if (!response.body.scope) {
        throw new Error('No scope returned from request-access')
      }

      console.log('✅ Resource scope received:', response.body.scope)

      // Store the resource scope for building auth URL
      localStorage.setItem('bodhi_resource_scope', response.body.scope)

      return response.body.scope
    } catch (error) {
      console.error('❌ Request resource access failed:', error)
      throw new Error(`Failed to request resource access: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [extensionClient])

  return useMemo(
    () => ({
      sendApiRequest,
      sendStreamRequest,
      requestResourceAccess,
    }),
    [sendApiRequest, sendStreamRequest, requestResourceAccess]
  )
}

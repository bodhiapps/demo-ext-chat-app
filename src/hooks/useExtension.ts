import { useState, useEffect, useCallback, useMemo } from 'react'

import { EXTENSION_CONFIG } from '@/lib/extension-constants'
import { loadExtensionClient, ExtensionClient, ExtensionNotFoundError, ExtensionTimeoutError } from '@/lib/libbodhiext'
import type { ServerStateInfo } from '@/lib/libbodhiext'

export type ExtensionStatus = 'idle' | 'detecting' | 'ready' | 'not-found' | 'error'

export interface ExtensionState {
  status: ExtensionStatus
  client: ExtensionClient | null
  extensionId: string | null
  error: Error | null
  serverState: ServerStateInfo | null
}

export interface UseExtensionReturn extends ExtensionState {
  detect: () => Promise<void>
  retry: () => Promise<void>
  refreshServerState: () => Promise<void>
  isReady: boolean
  isDetecting: boolean
}

export function useExtension(): UseExtensionReturn {
  const [state, setState] = useState<ExtensionState>({
    status: 'idle',
    client: null,
    extensionId: null,
    error: null,
    serverState: null,
  })

  const detect = useCallback(async (): Promise<void> => {
    setState(prev => ({
      ...prev,
      status: 'detecting',
      error: null,
    }))

    try {
      const client = await loadExtensionClient({
        timeout: EXTENSION_CONFIG.DETECTION_TIMEOUT,
      })

      const extensionId = client.getExtensionId()

      setState(prev => ({
        ...prev,
        status: 'ready',
        client,
        extensionId,
        error: null,
      }))

      // Auto-load server state when extension is ready
      try {
        const serverState = await client.serverState()
        setState(prev => ({
          ...prev,
          serverState,
        }))
      } catch (serverError) {
        // Don't fail the entire detection if server state fails
        console.warn('Failed to load server state:', serverError)
      }
    } catch (error) {
      let status: ExtensionStatus = 'error'

      if (error instanceof ExtensionNotFoundError) {
        status = 'not-found'
      } else if (error instanceof ExtensionTimeoutError) {
        status = 'error'
      }

      setState(prev => ({
        ...prev,
        status,
        client: null,
        extensionId: null,
        error: error instanceof Error ? error : new Error(String(error)),
        serverState: null,
      }))
    }
  }, [])

  const retry = useCallback(async (): Promise<void> => {
    await detect()
  }, [detect])

  const refreshServerState = useCallback(async (): Promise<void> => {
    if (!state.client) {
      throw new Error('Extension client not available')
    }

    try {
      const serverState = await state.client.serverState()
      setState(prev => ({
        ...prev,
        serverState,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
      }))
      throw error
    }
  }, [state.client])

  // Auto-detect on mount
  useEffect(() => {
    detect()
  }, [detect])

  const isReady = useMemo(() => state.status === 'ready', [state.status])
  const isDetecting = useMemo(() => state.status === 'detecting', [state.status])

  return useMemo(
    () => ({
      ...state,
      detect,
      retry,
      refreshServerState,
      isReady,
      isDetecting,
    }),
    [state, detect, retry, refreshServerState, isReady, isDetecting]
  )
}

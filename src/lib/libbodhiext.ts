/**
 * Independent library for interacting with window.bodhiext
 *
 * This library provides a clean, typed interface for the Bodhi browser extension
 * and is designed to be extracted as an independent package.
 *
 * No dependencies on other project files.
 */

// Type definitions
export interface ApiResponse {
  body: any
  headers: Record<string, string>
  status: number
}

export interface StreamChunk {
  body: any
  headers?: Record<string, string>
  status?: number
}

export interface BodhiExtConfig {
  timeout?: number
}

// Error classes for extension detection
export class ExtensionNotFoundError extends Error {
  constructor(timeout: number) {
    super(`Bodhi extension not detected within ${timeout}ms. Please ensure the extension is installed and enabled.`)
    this.name = 'ExtensionNotFoundError'
  }
}

export class ExtensionTimeoutError extends Error {
  constructor(timeout: number) {
    super(`Timeout fetching extension ID within ${timeout}ms. Extension found but not ready.`)
    this.name = 'ExtensionTimeoutError'
  }
}

// Server state information interface
export interface ServerStateInfo {
  status: 'setup' | 'ready' | 'resource-admin' | 'error' | 'unreachable'
  version?: string
  url?: string
  error?: {
    message: string
    type?: string
    code?: string
    param?: string
  }
}

// Internal interface for window.bodhiext
interface WindowBodhiExt {
  getExtensionId(): Promise<string>
  sendApiRequest(method: string, endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse>
  sendStreamRequest(
    method: string,
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<AsyncIterable<StreamChunk>>
  ping(): Promise<{ message: string }>
  serverState(): Promise<ServerStateInfo>
}

declare global {
  interface Window {
    bodhiext?: WindowBodhiExt
  }
}

/**
 * Main ExtensionClient class providing typed access to window.bodhiext
 */
export class ExtensionClient {
  private extensionId: string

  constructor(extensionId: string) {
    this.extensionId = extensionId
  }

  /**
   * Get extension ID (cached)
   */
  getExtensionId(): string {
    return this.extensionId
  }

  /**
   * Send standard API request
   */
  async sendApiRequest(
    method: string,
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse> {
    this.ensureExtensionAvailable()
    return window.bodhiext!.sendApiRequest(method, endpoint, body, headers)
  }

  /**
   * Send streaming API request
   */
  async sendStreamRequest(
    method: string,
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<AsyncIterable<StreamChunk>> {
    this.ensureExtensionAvailable()
    return window.bodhiext!.sendStreamRequest(method, endpoint, body, headers)
  }

  /**
   * Ping the extension
   */
  async ping(): Promise<{ message: string }> {
    this.ensureExtensionAvailable()
    return window.bodhiext!.ping()
  }

  /**
   * Get server state information
   */
  async serverState(): Promise<ServerStateInfo> {
    this.ensureExtensionAvailable()
    return window.bodhiext!.serverState()
  }

  // Private methods

  private ensureExtensionAvailable(): void {
    if (typeof window.bodhiext === 'undefined') {
      throw new Error('Bodhi extension not available. Extension must be loaded before creating ExtensionClient.')
    }
  }
}

/**
 * Load ExtensionClient by detecting extension and fetching extension ID
 * @param config Configuration object with optional timeout (default: 10000ms)
 * @returns Promise that resolves to ExtensionClient instance
 * @throws ExtensionNotFoundError if extension is not detected within timeout
 * @throws ExtensionTimeoutError if extension ID cannot be fetched within timeout
 */
export async function loadExtensionClient(config: BodhiExtConfig = { timeout: 10000 }): Promise<ExtensionClient> {
  const timeout = config.timeout ?? 10000

  // Step 1: Poll for window.bodhiext availability
  const extensionDetected = await new Promise<boolean>(resolve => {
    const startTime = Date.now()

    const checkExtension = () => {
      if (typeof window.bodhiext !== 'undefined') {
        resolve(true)
        return
      }

      if (Date.now() - startTime >= timeout) {
        resolve(false)
        return
      }

      setTimeout(checkExtension, 100)
    }

    checkExtension()
  })

  if (!extensionDetected) {
    throw new ExtensionNotFoundError(timeout)
  }

  // Step 2: Fetch extension ID with timeout
  try {
    const extensionIdPromise = window.bodhiext!.getExtensionId()
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new ExtensionTimeoutError(timeout)), timeout)
    })

    const extensionId = await Promise.race([extensionIdPromise, timeoutPromise])

    // Step 3: Return new ExtensionClient instance with cached extension ID
    return new ExtensionClient(extensionId)
  } catch (error) {
    if (error instanceof ExtensionTimeoutError) {
      throw error
    }
    // Re-throw as ExtensionTimeoutError for any other errors during ID fetch
    throw new ExtensionTimeoutError(timeout)
  }
}
